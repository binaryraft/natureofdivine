/**
 * Envia API Cache Layer
 * Implements in-memory caching with TTL to reduce API calls and improve performance
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class EnviaCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private pendingRequests: Map<string, Promise<any>> = new Map();

    // Cache TTL in milliseconds
    private readonly COUNTRY_TTL = 24 * 60 * 60 * 1000; // 24 hours
    private readonly STATE_TTL = 12 * 60 * 60 * 1000;   // 12 hours
    private readonly RATE_TTL = 5 * 60 * 1000;          // 5 minutes

    /**
     * Get data from cache or execute fetcher if not cached/expired
     */
    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number
    ): Promise<T> {
        // Check if we have a valid cached entry
        const cached = this.cache.get(key);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data as T;
        }

        // Check if there's already a pending request for this key (request deduplication)
        const pending = this.pendingRequests.get(key);
        if (pending) {
            return pending as Promise<T>;
        }

        // Create new request
        const request = fetcher()
            .then((data) => {
                // Cache the result
                this.cache.set(key, {
                    data,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + ttl,
                });
                // Remove from pending
                this.pendingRequests.delete(key);
                return data;
            })
            .catch((error) => {
                // Remove from pending on error
                this.pendingRequests.delete(key);
                throw error;
            });

        // Store pending request
        this.pendingRequests.set(key, request);
        return request;
    }

    /**
     * Get countries with caching
     */
    async getCountries<T>(fetcher: () => Promise<T>): Promise<T> {
        return this.get('countries', fetcher, this.COUNTRY_TTL);
    }

    /**
     * Get states for a country with caching
     */
    async getStates<T>(countryCode: string, fetcher: () => Promise<T>): Promise<T> {
        return this.get(`states:${countryCode}`, fetcher, this.STATE_TTL);
    }

    /**
     * Get shipping rates with short-term caching
     * Cache key includes relevant order details to ensure accuracy
     */
    async getRates<T>(
        cacheKey: string,
        fetcher: () => Promise<T>
    ): Promise<T> {
        return this.get(`rates:${cacheKey}`, fetcher, this.RATE_TTL);
    }

    /**
     * Clear all cache (useful for testing or forced refresh)
     */
    clearAll(): void {
        this.cache.clear();
        this.pendingRequests.clear();
    }

    /**
     * Clear specific cache entry
     */
    clear(key: string): void {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            pendingRequests: this.pendingRequests.size,
            entries: Array.from(this.cache.keys()),
        };
    }
}

// Singleton instance
export const enviaCache = new EnviaCache();

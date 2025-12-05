
'use server';

import axios from 'axios';
import { addLog } from './log-store';
import { Order } from './definitions';
import { enviaCache } from './envia-cache';

// Use test or production URL based on environment
const getApiBaseUrl = () => {
    const isTest = process.env.ENVIA_IS_TEST === 'true';
    return isTest ? 'https://api-test.envia.com' : 'https://api.envia.com';
};

const QUERIES_BASE_URL = 'https://queries.envia.com';


interface EnviaCountry {
    country_code: string;
    country_name: string;
    currency?: string;
}

interface EnviaState {
    name: string;
    code: string;
}


interface RatePayload {
    origin: {
        name: string;
        company: string;
        email: string;
        phone: string;
        street: string;
        number: string;
        district: string;
        city: string;
        state: string;
        country: string;
        postal_code: string;
        reference?: string;
    };
    destination: {
        name: string;
        company: string;
        email: string;
        phone: string;
        street: string;
        number: string;
        district: string;
        city: string;
        state: string;
        country: string;
        postal_code: string;
        reference?: string;
    };
    packages: {
        content: string;
        amount: number;
        type: 'box';
        weight: number;
        insurance: number;
        declared_value: number;
        weight_unit: 'KG';
        dimension_unit: 'CM';
        dimensions: {
            length: number;
            width: number;
            height: number;
        };
    }[];
    shipment?: {
        carrier?: string;
        type: number; // 0 for document, 1 for package
    };
    settings?: {
        currency: string;
        print_format: 'PDF';
        print_size: 'STOCK_4X6';
    };
}


const getEnviaToken = () => {
    const isTest = process.env.ENVIA_IS_TEST === 'true';
    const token = isTest ? process.env.ENVIA_TEST_API_KEY : process.env.ENVIA_API_KEY;

    // Debug logging
    console.log('[ENVIA DEBUG]', {
        isTest,
        hasTestKey: !!process.env.ENVIA_TEST_API_KEY,
        hasProdKey: !!process.env.ENVIA_API_KEY,
        testKeyLength: process.env.ENVIA_TEST_API_KEY?.length || 0,
        prodKeyLength: process.env.ENVIA_API_KEY?.length || 0,
        selectedKeyLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'EMPTY'
    });

    return token;
};

const getHeaders = (isQuery: boolean = false) => {
    const headers: any = {
        'Content-Type': 'application/json',
    };

    if (!isQuery) {
        headers['Authorization'] = `Bearer ${getEnviaToken()}`;
    }

    return headers;
};



/**
 * Get serviceable countries from Envia API with caching
 * Uses 24-hour cache to minimize API calls
 */
export async function getServiceableCountries(): Promise<EnviaCountry[]> {
    return enviaCache.getCountries(async () => {
        try {
            const token = getEnviaToken();
            if (!token) {
                console.warn('Envia API Key is missing. Returning default countries.');
                return [
                    { country_code: 'IN', country_name: 'India', currency: 'INR' },
                    { country_code: 'US', country_name: 'United States', currency: 'USD' },
                    { country_code: 'GB', country_name: 'United Kingdom', currency: 'GBP' },
                    { country_code: 'CA', country_name: 'Canada', currency: 'CAD' },
                    { country_code: 'AU', country_name: 'Australia', currency: 'AUD' },
                ];
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced to 5s

            const response = await axios.get(`${QUERIES_BASE_URL}/country`, {
                headers: getHeaders(true),
                timeout: 5000,
            } as any);

            clearTimeout(timeoutId);

            const countries = (response.data as any).data;
            if (!Array.isArray(countries)) {
                throw new Error('Invalid response format from Envia countries API');
            }

            return countries.map((c: any) => ({
                country_code: c.code,
                country_name: c.name,
                currency: c.currency
            }));
        } catch (error: any) {
            addLog('error', 'Envia: Failed to get serviceable countries', {
                error: error.message,
                code: error.code
            });

            // Return fallback countries for critical markets
            return [
                { country_code: 'IN', country_name: 'India', currency: 'INR' },
                { country_code: 'US', country_name: 'United States', currency: 'USD' },
                { country_code: 'GB', country_name: 'United Kingdom', currency: 'GBP' },
                { country_code: 'CA', country_name: 'Canada', currency: 'CAD' },
                { country_code: 'AU', country_name: 'Australia', currency: 'AUD' },
            ];
        }
    });
}

/**
 * Get states for a country from Envia API with caching
 * Uses 12-hour cache per country
 */
export async function getStatesForCountry(countryCode: string): Promise<EnviaState[]> {
    if (!countryCode) {
        return [];
    }

    return enviaCache.getStates(countryCode, async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await axios.get(
                `${QUERIES_BASE_URL}/state?country_code=${countryCode}`,
                {
                    headers: getHeaders(true),
                    timeout: 8000,
                } as any
            );

            clearTimeout(timeoutId);

            const states = (response.data as any).data;
            if (!Array.isArray(states)) {
                throw new Error('Invalid response format from Envia states API');
            }

            return states.map((s: any) => ({
                name: s.name,
                code: s.code_2_digits || s.code_3_digits || s.name
            }));
        } catch (error: any) {
            addLog('error', 'Envia: Failed to get states for country', {
                countryCode,
                error: error.message,
                code: error.code
            });

            // Return empty array - let the form handle it gracefully
            return [];
        }
    });
}


/**
 * Get serviceable carriers for a country
 */
export async function getServiceableCarriers(countryCode: string): Promise<string[]> {
    return enviaCache.get(`carriers:${countryCode}`, async () => {
        try {
            const response = await axios.get(`${QUERIES_BASE_URL}/carrier?country_code=${countryCode}`, {
                headers: getHeaders(true),
                timeout: 5000,
            } as any);

            const carriers = (response.data as any).data;
            if (!Array.isArray(carriers)) return [];
            return carriers.map((c: any) => c.name);
        } catch (error: any) {
            addLog('error', 'Envia: Failed to get carriers', { error: error.message });
            return [];
        }
    }, 24 * 60 * 60 * 1000); // 24 hour cache
}

export async function getShippingRates(order: Order) {
    // Create cache key based on destination details
    const cacheKey = `${order.country}-${order.state}-${order.pinCode}-${order.variant}`;

    return enviaCache.getRates(cacheKey, async () => {
        try {
            const token = getEnviaToken();
            if (!token) {
                throw new Error('Envia API Key is missing. Please configure ENVIA_API_KEY in .env');
            }

            // 1. Get available carriers for the destination country
            const carriers = await getServiceableCarriers(order.country);
            if (carriers.length === 0) {
                // Fallback if no carriers found (shouldn't happen for major countries)
                addLog('warn', 'Envia: No carriers found for country', { country: order.country });
            }

            // 2. Prepare addresses
            const originAddress = {
                name: "Alfas B",
                company: "Nature of the Divine",
                email: "natureofthedivine@gmail.com",
                phone: "8606281125",
                street: "Myplamootil",
                number: "1",
                district: "Kottayam",
                city: "Kottayam",
                state: "KL",
                country: "IN",
                postalCode: "686001", // CamelCase for specific carrier request
            };

            // Try to map full state name to code if provided
            let destinationState = order.state;
            if (destinationState && destinationState.length > 3) {
                try {
                    const states = await getStatesForCountry(order.country);
                    const match = states.find(s => s.name.toLowerCase() === destinationState.toLowerCase());
                    if (match) {
                        destinationState = match.code;
                    }
                } catch (e) { }
            }

            const destinationAddress = {
                name: order.name,
                company: '',
                email: order.email,
                phone: order.phone,
                street: order.address,
                number: '1',
                district: order.street || order.city,
                city: order.city,
                state: destinationState,
                country: order.country,
                postalCode: order.pinCode, // CamelCase
                reference: order.street || '',
            };

            const createPackage = (weight: number, length: number, width: number, height: number) => ({
                content: "Book",
                amount: 1,
                type: "box" as "box",
                weight: weight,
                insurance: 0,
                declaredValue: order.originalPrice, // CamelCase
                weightUnit: "KG" as "KG", // CamelCase
                dimensionUnit: "CM" as "CM", // CamelCase
                dimensions: {
                    length: length,
                    width: width,
                    height: height
                }
            });

            const paperbackPackage = createPackage(0.3, 22, 15, 2);
            const hardcoverPackage = createPackage(0.5, 23, 16, 3);
            const packageData = order.variant === 'paperback' ? paperbackPackage : hardcoverPackage;

            // 3. Fetch rates for each carrier individually (to avoid 500 error on bulk fetch)
            const ratePromises = carriers.map(async (carrier) => {
                const payload = {
                    origin: originAddress,
                    destination: destinationAddress,
                    packages: [packageData],
                    shipment: {
                        carrier: carrier,
                        type: 1
                    },
                    settings: {
                        currency: "INR"
                    }
                };

                try {
                    const response = await axios.post(`${getApiBaseUrl()}/ship/rate/`, payload, {
                        headers: getHeaders(false),
                        timeout: 8000, // Short timeout per carrier
                    } as any);

                    const data = (response.data as any).data;
                    return Array.isArray(data) ? data : [];
                } catch (error: any) {
                    // Log but don't fail the whole request
                    // console.error(`Failed to get rate for ${carrier}:`, error.message);
                    return [];
                }
            });

            const results = await Promise.all(ratePromises);
            const allRates = results.flat();

            addLog('info', 'Envia: Received shipping rates', { count: allRates.length, carriersChecked: carriers.length });

            const rates = allRates.map((rate: any) => {
                // Add 15% margin to the shipping rate
                const originalPrice = rate.total_price || rate.totalPrice;
                const priceWithMargin = originalPrice * 1.15;

                return {
                    carrier: rate.carrier,
                    service: rate.service,
                    totalPrice: Math.ceil(priceWithMargin), // Round up to nearest integer
                    currency: rate.currency,
                    deliveryDate: rate.delivery_date || rate.deliveryDate,
                };
            });

            return { success: true, rates };

        } catch (error: any) {
            const errorMessage = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
                ? 'Shipping service timed out. Please try again.'
                : error.response?.data?.meta?.message || error.response?.data?.message || error.message || 'Could not fetch shipping rates.';

            addLog('error', 'Envia: Failed to get shipping rates', {
                error: error.message,
                code: error.code,
                response: error.response?.data,
            });

            return { success: false, message: errorMessage };
        }
    });
}

export async function generateLabel(order: Order, carrier: string, service: string) {
    try {
        const token = getEnviaToken();
        if (!token) {
            throw new Error('Envia API Key is missing.');
        }

        const originAddress = {
            name: "Alfas B",
            company: "Nature of the Divine",
            email: "natureofthedivine@gmail.com",
            phone: "8606281125",
            street: "Myplamootil",
            number: "1",
            district: "Kottayam",
            city: "Kottayam",
            state: "KL",
            country: "IN",
            postalCode: "686001",
            reference: ""
        };


        // Try to map full state name to code if provided
        let destinationState = order.state;
        if (destinationState && destinationState.length > 3) {
            try {
                const states = await getStatesForCountry(order.country);
                const match = states.find(s => s.name.toLowerCase() === destinationState.toLowerCase());
                if (match) {
                    addLog('info', 'Envia: Mapped full state name to code in generateLabel', { original: destinationState, code: match.code });
                    destinationState = match.code;
                }
            } catch (e) {
                // Ignore mapping errors
            }
        }

        const destinationAddress = {
            name: order.name,
            company: '',
            email: order.email,
            phone: order.phone,
            street: order.address,
            number: '1', // Envia requires a number
            district: order.street || order.city,
            city: order.city,
            state: destinationState,
            country: order.country,
            postalCode: order.pinCode,
            reference: order.street || ''
        };

        const createPackage = (weight: number, length: number, width: number, height: number) => ({
            content: "Book",
            amount: 1,
            type: "box" as "box",
            weight: weight,
            insurance: 0,
            declaredValue: order.originalPrice,
            weightUnit: "KG" as "KG",
            dimensionUnit: "CM" as "CM",
            dimensions: {
                length: length,
                width: width,
                height: height
            }
        });

        const paperbackPackage = createPackage(0.3, 22, 15, 2);
        const hardcoverPackage = createPackage(0.5, 23, 16, 3);

        const payload = {
            origin: originAddress,
            destination: destinationAddress,
            packages: [order.variant === 'paperback' ? paperbackPackage : hardcoverPackage],
            shipment: { carrier, service, type: 1 },
            settings: { print_format: "PDF", print_size: "STOCK_4X6", comments: `Order ID: ${order.id}` }
        };

        addLog('info', 'Envia: Generating shipping label', { payload });
        const response = await axios.post(`${getApiBaseUrl()}/ship/generate/`, payload, { headers: getHeaders(false) });
        addLog('info', 'Envia: Label generated successfully', { response: (response.data as any).data });

        return { success: true, data: (response.data as any).data };

    } catch (error: any) {
        addLog('error', 'Envia: Failed to generate label', {
            error: error.response ? error.response.data : error.message
        });
        return { success: false, message: error.response?.data?.meta?.message || error.response?.data?.message || 'Could not generate shipping label.' };
    }
}

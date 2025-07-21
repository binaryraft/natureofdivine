
'use server';

export interface PriceData {
    paperback: number;
    hardcover: number;
    symbol: string;
    country: string;
}

const basePrices = {
    paperback: 299, // INR
    hardcover: 499, // INR
};

const exchangeRates = {
    USD: 0.012,
    EUR: 0.011,
};

const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
};

// This function can be called from a client component to get the price.
// It runs on the server and can safely use APIs.
export async function fetchLocationAndPrice(): Promise<PriceData> {
    try {
        // No API key needed for ip-api.com
        const response = await fetch('http://ip-api.com/json', {
            // Revalidate every hour
            next: { revalidate: 3600 } 
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch location from IP');
        }

        const location = await response.json();
        const countryCode = location.countryCode;

        let currency = 'INR';
        if (countryCode === 'US') {
            currency = 'USD';
        } else if (location.currency && ['EUR'].includes(location.currency)) {
            // ip-api provides currency for EU countries
            currency = 'EUR';
        }
        
        if (currency !== 'INR' && (currency === 'USD' || currency === 'EUR')) {
            const rate = exchangeRates[currency];
            return {
                paperback: Math.ceil(basePrices.paperback * rate),
                hardcover: Math.ceil(basePrices.hardcover * rate),
                symbol: currencySymbols[currency],
                country: countryCode,
            };
        }

    } catch (error) {
        console.error("Geolocation/price fetch error:", error);
        // Fallback to INR on any error
    }

    // Default to INR
    return {
        paperback: basePrices.paperback,
        hardcover: basePrices.hardcover,
        symbol: currencySymbols.INR,
        country: 'IN',
    };
}

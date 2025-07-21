
'use server';

import { headers } from 'next/headers';
import { countries } from './countries';

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

const exchangeRates: Record<string, number> = {
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    AUD: 0.018,
    CAD: 0.016,
};

// This function runs on the server and can safely use APIs.
export async function fetchLocationAndPrice(): Promise<PriceData> {
    let countryCode = '';
    try {
        // Use Next.js headers to get the user's country from the request
        const headersList = headers();
        const vercelCountry = headersList.get('x-vercel-ip-country');
        
        if (vercelCountry) {
            countryCode = vercelCountry;
        } else {
             // Fallback to IP API if not on Vercel or header is not present
            const response = await fetch('http://ip-api.com/json/?fields=countryCode', {
                cache: 'no-store' // Ensure no caching
            });
            if (!response.ok) {
                throw new Error('Failed to fetch location from IP');
            }
            const location = await response.json();
            countryCode = location.countryCode;
        }
       
        // Force INR for India
        if (countryCode === 'IN') {
             return {
                paperback: basePrices.paperback,
                hardcover: basePrices.hardcover,
                symbol: '₹',
                country: 'IN',
            };
        }

        const countryInfo = countries.find(c => c.iso2 === countryCode);

        if (countryInfo && exchangeRates[countryInfo.currency_code]) {
            const rate = exchangeRates[countryInfo.currency_code];
            return {
                paperback: Math.ceil(basePrices.paperback * rate),
                hardcover: Math.ceil(basePrices.hardcover * rate),
                symbol: countryInfo.currency_symbol,
                country: countryCode,
            };
        }
    } catch (error) {
        console.error("Geolocation/price fetch error:", error);
    }

    // Default to USD if location is not India and not in the exchange rate list, or if an error occurred.
    const rate = exchangeRates['USD'];
    const countryInfo = countries.find(c => c.iso2 === 'US');
    return {
        paperback: Math.ceil(basePrices.paperback * rate),
        hardcover: Math.ceil(basePrices.hardcover * rate),
        symbol: countryInfo?.currency_symbol || '$',
        country: 'US', // Default country for display
    };
}

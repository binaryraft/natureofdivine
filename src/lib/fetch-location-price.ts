
'use server';

import { headers } from 'next/headers';
import { countries } from './countries';

export interface PriceData {
    paperback: number;
    hardcover: number;
    symbol: string;
    country: string;
    currencyCode: string;
}

const basePrices = {
    paperback: 299, // INR
    hardcover: 499, // INR
};

const exchangeRates: Record<string, number> = {
    USD: 0.012,
    EUR: 0.011,
};

// This function runs on the server and can safely use APIs.
export async function fetchLocationAndPrice(): Promise<PriceData> {
  const headersList = await headers();
  // Use a different header for more reliable geo-IP lookup in Vercel
  const countryHeader = headersList.get('x-vercel-ip-country') || headersList.get('x-country');
  
  const countryCode = countryHeader || 'IN'; // Default to India
  
  if (countryCode === 'IN') {
     return {
        paperback: basePrices.paperback,
        hardcover: basePrices.hardcover,
        symbol: '₹',
        country: 'IN',
        currencyCode: 'INR',
    };
  }

  const countryData = countries.find(c => c.iso2 === countryCode);

  if (countryData && exchangeRates[countryData.currency_code]) {
    const rate = exchangeRates[countryData.currency_code];
    return {
        paperback: Math.ceil(basePrices.paperback * rate),
        hardcover: Math.ceil(basePrices.hardcover * rate),
        symbol: countryData.currency_symbol,
        country: countryData.iso2,
        currencyCode: countryData.currency_code,
    };
  }

  // Fallback to USD for unsupported countries
  const usdRate = exchangeRates['USD'];
  const usData = countries.find(c => c.iso2 === 'US')!;
  return {
    paperback: Math.ceil(basePrices.paperback * usdRate),
    hardcover: Math.ceil(basePrices.hardcover * usdRate),
    symbol: usData.currency_symbol,
    country: usData.iso2,
    currencyCode: usData.currency_code,
  };
}

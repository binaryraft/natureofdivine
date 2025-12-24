
'use server';

import { headers } from 'next/headers';
import { countries } from './countries';
import { getPriceForCountry } from './pricing-store';

export interface PriceData {
    paperback: number;
    hardcover: number;
    symbol: string;
    country: string;
    currencyCode: string;
}

const exchangeRates: Record<string, number> = {
    USD: 0.012, // 1 INR = 0.012 USD (approx)
    EUR: 0.011, // 1 INR = 0.011 EUR (approx)
    GBP: 0.0095, // 1 INR = 0.0095 GBP
    AED: 0.044, // 1 INR = 0.044 AED
};

// This function runs on the server and can safely use APIs.
export async function fetchLocationAndPrice(): Promise<PriceData> {
  const headersList = await headers();
  // Use a different header for more reliable geo-IP lookup in Vercel
  const countryHeader = headersList.get('x-vercel-ip-country') || headersList.get('x-country');
  
  const countryCode = countryHeader || 'IN'; // Default to India
  
  // Fetch the configured price for this country (in INR)
  const basePriceINR = await getPriceForCountry(countryCode);
  
  // Hardcover is typically higher; we can apply a multiplier or fixed offset if not explicitly managed.
  // For now, let's assume the pricing store manages the "Base" (Paperback) price.
  // We'll add a fixed markup for Hardcover or percentage.
  // Existing logic had 299 vs 499 (approx 1.6x).
  const hardcoverPriceINR = Math.ceil(basePriceINR * 1.66);

  if (countryCode === 'IN') {
     return {
        paperback: basePriceINR,
        hardcover: hardcoverPriceINR,
        symbol: '₹',
        country: 'IN',
        currencyCode: 'INR',
    };
  }

  const countryData = countries.find(c => c.iso2 === countryCode);

  if (countryData && exchangeRates[countryData.currency_code]) {
    const rate = exchangeRates[countryData.currency_code];
    return {
        paperback: Math.ceil(basePriceINR * rate),
        hardcover: Math.ceil(hardcoverPriceINR * rate),
        symbol: countryData.currency_symbol,
        country: countryData.iso2,
        currencyCode: countryData.currency_code,
    };
  }

  // Fallback to USD for unsupported currencies
  const usdRate = exchangeRates['USD'];
  const usData = countries.find(c => c.iso2 === 'US')!;
  return {
    paperback: Math.ceil(basePriceINR * usdRate),
    hardcover: Math.ceil(hardcoverPriceINR * usdRate),
    symbol: usData.currency_symbol,
    country: usData.iso2, // Keep the user's country code for logic, even if currency is USD? 
    // No, if we fallback to USD, we might want to show it's USD.
    // But keeping original country allows for correct shipping logic if we relied on this.
    // However, logic now relies on getPriceForCountry(countryCode) which is accurate.
    currencyCode: 'USD',
  };
}

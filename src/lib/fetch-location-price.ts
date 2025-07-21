
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

// This function runs on the server and can safely use APIs.
export async function fetchLocationAndPrice(): Promise<PriceData> {
    // Always return Indian prices
    return {
        paperback: basePrices.paperback,
        hardcover: basePrices.hardcover,
        symbol: '₹',
        country: 'IN',
        currencyCode: 'INR',
    };
}

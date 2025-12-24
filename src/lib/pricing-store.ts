
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { addLog } from './log-store';

const CONFIG_DOC_ID = 'global-config';
const COLLECTION_NAME = 'pricing';

export interface PricingConfig {
    defaultInternationalPrice: number;
    countryPrices: Record<string, number>; // ISO 2-letter code -> Price in INR
}

const DEFAULT_CONFIG: PricingConfig = {
    defaultInternationalPrice: 10000,
    countryPrices: {
        'IN': 299
    }
};

export async function getPricingConfig(): Promise<PricingConfig> {
    try {
        const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as PricingConfig;
        } else {
            // Initialize if not exists
            await setDoc(docRef, DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
    } catch (error: any) {
        await addLog('error', 'getPricingConfig failed', { error: error.message });
        return DEFAULT_CONFIG;
    }
}

export async function updateCountryPrice(countryCode: string, price: number): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC_ID);
        // We use dot notation to update a specific key in the map
        await updateDoc(docRef, {
            [`countryPrices.${countryCode.toUpperCase()}`]: price
        });
        await addLog('info', 'Updated country price', { country: countryCode, price });
    } catch (error: any) {
        await addLog('error', 'updateCountryPrice failed', { error: error.message });
        throw new Error('Failed to update price');
    }
}

export async function updateDefaultInternationalPrice(price: number): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC_ID);
        await updateDoc(docRef, {
            defaultInternationalPrice: price
        });
        await addLog('info', 'Updated default international price', { price });
    } catch (error: any) {
        await addLog('error', 'updateDefaultInternationalPrice failed', { error: error.message });
        throw new Error('Failed to update default price');
    }
}

export async function getPriceForCountry(countryCode: string): Promise<number> {
    const config = await getPricingConfig();
    const code = countryCode.toUpperCase();
    if (config.countryPrices[code]) {
        return config.countryPrices[code];
    }
    return config.defaultInternationalPrice;
}

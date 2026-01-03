'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SiteSettings } from './definitions';
import { revalidatePath } from 'next/cache';
import { addLog } from './log-store';

const settingsDocRef = doc(db, 'settings', 'global');

const defaultSettings: SiteSettings = {
    codEnabled: true,
    codEnabledInternational: false,
    footerLinks: [
        { label: 'Terms and Conditions', url: '/terms' },
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Shipping Policy', url: '/shipping' },
        { label: 'Return Policy', url: '/returns' },
    ],
    socialLinks: [
        { platform: 'Twitter', url: '#' },
        { platform: 'Facebook', url: '#' },
        { platform: 'Instagram', url: '#' },
        { platform: 'Email', url: 'mailto:contact@natureofthedivine.com' },
    ]
};

export async function getSettings(): Promise<SiteSettings> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            return { ...defaultSettings, ...docSnap.data() } as SiteSettings;
        } else {
            // Initialize if missing
            await setDoc(settingsDocRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error: any) {
        console.error("Error getting settings:", error);
        return defaultSettings;
    }
}

export async function updateSettings(newSettings: Partial<SiteSettings>): Promise<void> {
    try {
        await setDoc(settingsDocRef, newSettings, { merge: true });
        revalidatePath('/');
        revalidatePath('/checkout');
        revalidatePath('/admin');
        await addLog('info', 'Settings updated', { newSettings });
    } catch (error: any) {
        await addLog('error', 'Failed to update settings', { error: error.message });
        throw new Error('Failed to update settings.');
    }
}

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const STATS_DOC_ID = 'community_stats_doc';
const STATS_COLLECTION = 'community_metadata';

export async function getTotalDonations(): Promise<number> {
    try {
        const docRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data().totalDonations || 0) : 0;
    } catch (error) {
        console.error('Error fetching donations:', error);
        return 0;
    }
}

export async function addDonation(amount: number) {
    try {
        const docRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
        // Use set with merge to create if not exists, but updateDoc + increment needs document to exist.
        // Safer to use setDoc with merge if we are not sure.
        // However, increment doesn't work well with setDoc merge on undefined fields sometimes.
        // Let's check existence first or use setDoc logic.

        await setDoc(docRef, {
            totalDonations: increment(amount),
            lastUpdated: Date.now()
        }, { merge: true });

        revalidatePath('/community');
        return { success: true };
    } catch (error) {
        console.error('Error adding donation:', error);
        return { success: false };
    }
}

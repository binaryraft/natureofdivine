'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const STATS_DOC_ID = 'community_stats_doc';
const STATS_COLLECTION = 'community_metadata';
const DONATIONS_COLLECTION = 'community_donations';

export type DonationStatus = 'PENDING' | 'SUCCESS' | 'FAILURE';

export interface LeaderboardEntry {
    userId: string;
    name: string;
    totalDonated: number;
}

export interface DonationRecord {
    id: string;
    userId: string;
    userName?: string;
    amount: number;
    currency: string;
    status: DonationStatus;
    merchantTransactionId?: string;
    createdAt: number;
    paymentDetails?: any;
}

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

// Previously named addDonation, now strictly backend usage for confirmed payments
export async function incrementTotalDonations(amount: number) {
    try {
        const docRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
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

// For backward compatibility if needed, but we should switch to the flow below
export async function addDonation(amount: number) {
    return incrementTotalDonations(amount);
}

export async function createDonationRecord(userId: string, amount: number, currency: string = 'INR', userName?: string): Promise<DonationRecord | null> {
    try {
        const newDoc: Omit<DonationRecord, 'id'> = {
            userId,
            amount,
            currency,
            status: 'PENDING',
            createdAt: Date.now(),
            ...(userName && { userName })
        };
        const docRef = await addDoc(collection(db, DONATIONS_COLLECTION), newDoc);
        return { id: docRef.id, ...newDoc };
    } catch (error) {
        console.error("Error creating donation record", error);
        return null;
    }
}

export async function updateDonationPaymentStatus(donationId: string, status: DonationStatus, details: any = {}) {
    try {
        const docRef = doc(db, DONATIONS_COLLECTION, donationId);

        // If becoming success for the first time, increment total & leaderboard
        if (status === 'SUCCESS') {
            const snap = await getDoc(docRef);
            if (snap.exists() && snap.data().status !== 'SUCCESS') {
                const data = snap.data();
                const amount = data.amount;
                const userId = data.userId;
                const userName = data.userName || 'Anonymous Soul';

                // 1. Increment Global Total
                await incrementTotalDonations(amount);

                // 2. Update Leaderboard
                const leaderboardRef = doc(db, 'community_leaderboard', userId);
                await setDoc(leaderboardRef, {
                    userId,
                    name: userName, // Update name to latest used if they changed it? Or keep first? Let's overwrite.
                    totalDonated: increment(amount),
                    lastDonationAt: Date.now()
                }, { merge: true });
            }
        }

        await updateDoc(docRef, {
            status,
            paymentDetails: details,
            ...(details.merchantTransactionId ? { merchantTransactionId: details.merchantTransactionId } : {})
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating donation status", error);
        return { success: false };
    }
}

export async function getTopDonors(limitCount: number = 10): Promise<LeaderboardEntry[]> {
    try {
        const q = query(
            collection(db, 'community_leaderboard'),
            orderBy('totalDonated', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data() as LeaderboardEntry);
    } catch (error) {
        console.error("Error fetching top donors", error);
        return [];
    }
}

export async function getDonationByTransactionId(merchantTransactionId: string): Promise<DonationRecord | null> {
    try {
        const q = query(collection(db, DONATIONS_COLLECTION), where('merchantTransactionId', '==', merchantTransactionId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const d = snapshot.docs[0];
            return { id: d.id, ...d.data() } as DonationRecord;
        }
        return null;
    } catch (error) {
        console.error("Error fetching donation by tx id", error);
        return null;
    }
}

export async function getDonationById(id: string): Promise<DonationRecord | null> {
    try {
        const docRef = doc(db, DONATIONS_COLLECTION, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as DonationRecord;
        }
        return null;
    } catch (error) {
        return null;
    }
}


'use server';

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, Timestamp, orderBy, query, increment, writeBatch, updateDoc } from 'firebase/firestore';
import type { Discount } from './definitions';

const discountsCollection = collection(db, 'discounts');

const docToDiscount = (doc: any): Discount => {
    const data = doc.data();
    const createdAtMillis = data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());
    
    return {
        id: doc.id,
        percent: data.percent || 0,
        usageCount: data.usageCount || 0,
        createdAt: createdAtMillis,
    };
}

export const addDiscount = async (code: string, percent: number): Promise<{success: boolean, message: string}> => {
    if (!code || !percent) {
        return { success: false, message: 'Code and percent are required.' };
    }
    if (percent <= 0 || percent > 100) {
        return { success: false, message: 'Percent must be between 1 and 100.' };
    }
    
    try {
        const discountRef = doc(db, 'discounts', code.toUpperCase());
        const docSnap = await getDoc(discountRef);
        
        if (docSnap.exists()) {
            return { success: false, message: 'This discount code already exists.' };
        }

        await setDoc(discountRef, {
            percent: percent,
            usageCount: 0,
            createdAt: Timestamp.now()
        });
        
        return { success: true, message: 'Discount created successfully.' };

    } catch (error: any) {
        console.error("Error adding discount:", error);
        return { success: false, message: error.message || 'Failed to add discount.' };
    }
}

export const getDiscount = async (code: string): Promise<Discount | null> => {
    if (!code) return null;
    try {
        const docRef = doc(db, 'discounts', code.toUpperCase());
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docToDiscount(docSnap) : null;
    } catch (error) {
        console.error("Error getting discount:", error);
        return null;
    }
};

export const getAllDiscounts = async (): Promise<Discount[]> => {
    try {
        const q = query(discountsCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docToDiscount);
    } catch(error) {
        console.error("Error fetching all discounts:", error);
        return [];
    }
}

export const incrementDiscountUsage = async (code: string) => {
    if (!code) return;
    try {
        const discountRef = doc(db, 'discounts', code.toUpperCase());
        await updateDoc(discountRef, {
            usageCount: increment(1)
        });
    } catch (error) {
        // Log error but don't block the main process if this fails
        console.error(`Failed to increment usage for discount code ${code}`, error);
    }
}

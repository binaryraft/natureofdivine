
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import type { Stock, BookVariant } from './definitions';

const stockDocRef = doc(db, 'stock', 'levels');

export const getStock = async (): Promise<Stock> => {
    const docSnap = await getDoc(stockDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as Stock;
    } else {
        // If stock document doesn't exist, create it with 0 stock
        const initialStock: Stock = { paperback: 0, hardcover: 0 };
        await setDoc(stockDocRef, initialStock);
        return initialStock;
    }
};

export const updateStock = async (newStock: Stock): Promise<void> => {
    await setDoc(stockDocRef, newStock, { merge: true });
};

export const decreaseStock = async (variant: BookVariant, quantity: number): Promise<void> => {
    if (quantity <= 0) return;

    try {
        await runTransaction(db, async (transaction) => {
            const stockDoc = await transaction.get(stockDocRef);
            if (!stockDoc.exists()) {
                throw new Error("Stock document does not exist!");
            }
            
            const currentStock = stockDoc.data() as Stock;
            const newQuantity = currentStock[variant] - quantity;
            
            if (newQuantity < 0) {
                throw new Error(`Not enough stock for ${variant}.`);
            }
            
            transaction.update(stockDocRef, { [variant]: newQuantity });
        });
    } catch (e: any) {
        console.error("Stock update transaction failed: ", e.message);
        throw e; // re-throw the error to be caught by the calling action
    }
};

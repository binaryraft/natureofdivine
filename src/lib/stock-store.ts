
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import type { Stock, BookVariant } from './definitions';

const stockDocRef = doc(db, 'stock', 'levels');

export const getStock = async (): Promise<Stock> => {
    const docSnap = await getDoc(stockDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        const stockData = {
            paperback: data.paperback || 100,
            hardcover: data.hardcover || 100,
            ebook: data.ebook || 99999,
        };
        // If the values were missing, let's update the document to prevent future issues.
        if (!data.paperback || !data.hardcover) {
            await setDoc(stockDocRef, stockData, { merge: true });
        }
        return stockData as Stock;
    } else {
        // If stock document doesn't exist, create it with initial stock
        const initialStock: Stock = { paperback: 100, hardcover: 100, ebook: 99999 };
        await setDoc(stockDocRef, initialStock);
        return initialStock;
    }
};

export const updateStock = async (newStock: Stock): Promise<void> => {
    // Ensure ebook remains high
    const stockToSet = { ...newStock, ebook: 99999 };
    await setDoc(stockDocRef, stockToSet, { merge: true });
};

export const decreaseStock = async (variant: BookVariant, quantity: number): Promise<void> => {
    if (quantity <= 0) return;
    // E-books have "infinite" stock, so we don't decrease it.
    if (variant === 'ebook') return;

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

    

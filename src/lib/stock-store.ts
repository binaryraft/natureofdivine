
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Stock, BookVariant } from './definitions';
import { addLog } from './log-store';

const stockDocRef = doc(db, 'stock', 'levels');

export const getStock = async (): Promise<Stock> => {
    try {
        const docSnap = await getDoc(stockDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const stockData = {
                paperback: data.paperback || 0,
                hardcover: data.hardcover || 0,
                ebook: data.ebook || 99999,
            };
            return stockData as Stock;
        } else {
            const initialStock: Stock = { paperback: 100, hardcover: 100, ebook: 99999 };
            await setDoc(stockDocRef, initialStock);
            await addLog('info', 'Initialized stock levels in Firestore.');
            return initialStock;
        }
    } catch (error: any) {
        await addLog('error', 'getStock failed', { error: { message: error.message } });
        console.error("Error getting stock:", error);
        // Return a default safe value in case of read failure
        return { paperback: 0, hardcover: 0, ebook: 99999 };
    }
};

export const updateStock = async (newStock: Stock): Promise<void> => {
    try {
        const stockToSet = { ...newStock, ebook: 99999 };
        await setDoc(stockDocRef, stockToSet, { merge: true });
        await addLog('info', 'Stock levels updated via admin panel.', { newStock });
        // Revalidate paths to ensure fresh data is fetched on the client
        revalidatePath('/admin');
        revalidatePath('/checkout');
    } catch (error: any) {
        await addLog('error', 'updateStock failed', { error: { message: error.message } });
        console.error("Error updating stock:", error);
        throw new Error('Failed to update stock levels.');
    }
};

export const checkStock = async (variant: BookVariant, quantity: number): Promise<boolean> => {
    if (variant === 'ebook') return true;
    try {
        const stock = await getStock();
        return stock[variant] >= quantity;
    } catch(e) {
        return false;
    }
}

export const decreaseStock = async (variant: BookVariant, quantity: number): Promise<void> => {
    if (quantity <= 0 || variant === 'ebook') return;

    try {
        await runTransaction(db, async (transaction) => {
            const stockDoc = await transaction.get(stockDocRef);
            if (!stockDoc.exists()) {
                throw new Error("Stock document does not exist! Cannot decrease stock.");
            }
            
            const currentStock = stockDoc.data()[variant as Exclude<BookVariant, 'ebook'>];
            
            if (currentStock < quantity) {
                await addLog('warn', 'Stock decrease blocked by transaction', {
                    message: 'Not enough stock.',
                    variant,
                    available: currentStock,
                    required: quantity,
                });
                throw new Error(`Not enough stock for ${variant}.`);
            }
            
            const newQuantity = currentStock - quantity;
            transaction.update(stockDocRef, { [variant]: newQuantity });
        });
        await addLog('info', 'Stock decreased successfully via transaction', { variant, quantity });
    } catch (e: any) {
        if (!e.message.includes('Not enough stock')) {
            await addLog('error', 'Stock decrease transaction failed', { error: { message: e.message }, variant, quantity });
        }
        console.error("Stock update transaction failed: ", e.message);
        throw e; // Re-throw the error to be handled by the calling function
    }
};
    

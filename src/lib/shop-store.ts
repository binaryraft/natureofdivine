import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, query, orderBy, Timestamp, writeBatch, deleteDoc, setDoc, where, limit, getDoc } from 'firebase/firestore';
import type { Product, ShopOrder } from './definitions';
import { addLog } from './log-store';
import { v4 as uuidv4 } from 'uuid';

const productsCollection = collection(db, 'products');
const shopOrdersCollection = collection(db, 'shop-orders');

// --- Products ---

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> {
    try {
        const id = uuidv4();
        const product: Product = {
            id,
            ...productData,
            createdAt: Date.now(),
        };
        await setDoc(doc(productsCollection, id), product);
        return { success: true, message: 'Product added successfully.' };
    } catch (error: any) {
        await addLog('error', 'addProduct failed', { error: error.message });
        return { success: false, message: error.message };
    }
}

export async function updateProduct(product: Product): Promise<{ success: boolean; message: string }> {
    try {
        await updateDoc(doc(productsCollection, product.id), product);
        return { success: true, message: 'Product updated successfully.' };
    } catch (error: any) {
        await addLog('error', 'updateProduct failed', { error: error.message });
        return { success: false, message: error.message };
    }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    try {
        await deleteDoc(doc(productsCollection, id));
        return { success: true, message: 'Product deleted successfully.' };
    } catch (error: any) {
        await addLog('error', 'deleteProduct failed', { error: error.message });
        return { success: false, message: error.message };
    }
}

export async function getProducts(activeOnly = false): Promise<Product[]> {
    try {
        let q = query(productsCollection, orderBy('createdAt', 'desc'));
        if (activeOnly) {
            q = query(productsCollection, where('isActive', '==', true), orderBy('createdAt', 'desc'));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Product);
    } catch (error: any) {
        console.error("Error getting products:", error);
        if (error.code === 'failed-precondition') {
            await addLog('error', 'Missing Firestore Index for Products', { message: error.message });
        } else {
            await addLog('error', 'getProducts failed', { message: error.message, code: error.code });
        }
        return [];
    }
}

export async function getProductById(id: string): Promise<Product | null> {
    try {
        const snapshot = await getDocs(query(productsCollection, where('id', '==', id)));
        if (!snapshot.empty) return snapshot.docs[0].data() as Product;
        return null;
    } catch (error) {
        return null;
    }
}


// --- Shop Orders ---

export async function createShopOrder(orderData: Omit<ShopOrder, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; message: string; orderId?: string }> {
    try {
        const id = uuidv4();
        const order: ShopOrder = {
            id,
            ...orderData,
            status: orderData.paymentMethod === 'cod' ? 'new' : 'pending',
            createdAt: Date.now(),
        };
        await setDoc(doc(shopOrdersCollection, id), order);

        // Decrease stock immediately
        const product = await getProductById(order.productId);
        if (product) {
            const newStock = Math.max(0, product.stock - order.quantity);
            await updateDoc(doc(productsCollection, product.id), { stock: newStock });
        }

        await addLog('info', 'Shop Order Created', { orderId: id, product: order.productName });
        return { success: true, message: 'Order placed successfully!', orderId: id };
    } catch (error: any) {
        await addLog('error', 'createShopOrder failed', { error: error.message });
        return { success: false, message: error.message };
    }
}

export async function getShopOrderByTransactionId(transactionId: string): Promise<ShopOrder | null> {
    try {
        const q = query(shopOrdersCollection, where('transactionId', '==', transactionId), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as ShopOrder;
    } catch (error: any) {
        await addLog('error', 'getShopOrderByTransactionId failed', { error: error.message });
        return null;
    }
}

export async function updateShopOrderPaymentStatus(orderId: string, paymentStatus: 'SUCCESS' | 'FAILURE' | 'PENDING', paymentData: any): Promise<void> {
    try {
        const orderRef = doc(shopOrdersCollection, orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) return;

        const order = orderSnap.data() as ShopOrder;
        let newStatus: ShopOrder['status'] = order.status;

        if (paymentStatus === 'SUCCESS') {
            newStatus = 'new';
        } else if (paymentStatus === 'FAILURE') {
            newStatus = 'cancelled';
            // RESTOCK if cancelled due to payment failure
            const product = await getProductById(order.productId);
            if (product) {
                await updateDoc(doc(productsCollection, product.id), { stock: product.stock + order.quantity });
            }
        }

        const updateData: any = {
            status: newStatus,
            paymentDetails: paymentData
        };

        // If we have a merchantTransactionId in paymentData, store it as the top-level transactionId
        if (paymentData?.merchantTransactionId) {
            updateData.transactionId = paymentData.merchantTransactionId;
        }

        await updateDoc(orderRef, updateData);

    } catch (error: any) {
        await addLog('error', 'updateShopOrderPaymentStatus failed', { error: error.message });
    }
}

export async function getShopOrders(): Promise<ShopOrder[]> {
    try {
        const q = query(shopOrdersCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as ShopOrder);
    } catch (error: any) {
        console.error("Error getting shop orders:", error);
        return [];
    }
}

export async function updateShopOrderStatus(id: string, status: ShopOrder['status']): Promise<{ success: boolean; message: string }> {
    try {
        await updateDoc(doc(shopOrdersCollection, id), { status });
        return { success: true, message: 'Order status updated.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
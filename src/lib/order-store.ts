
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, query, orderBy, Timestamp, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import type { Order, OrderStatus } from './definitions';
import { addLog } from './log-store';
import { decreaseStock, checkStock } from './stock-store';
import { incrementDiscountUsage } from './discount-store';
import { addEvent } from './analytics-store';


const allOrdersCollection = collection(db, 'all-orders');

const docToOrder = (doc: any): Order => {
  const data = doc.data();
  const createdAtMillis = data.createdAt instanceof Timestamp 
    ? data.createdAt.toMillis() 
    : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());

  return {
    id: doc.id,
    userId: data.userId || null,
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    street: data.street || '',
    city: data.city || '',
    country: data.country || '',
    state: data.state || '',
    pinCode: data.pinCode || '',
    paymentMethod: data.paymentMethod || 'cod',
    variant: data.variant || 'paperback',
    price: data.price || 0,
    originalPrice: data.originalPrice,
    discountCode: data.discountCode,
    discountAmount: data.discountAmount,
    status: data.status || 'new',
    createdAt: createdAtMillis,
    hasReview: data.hasReview || false,
    paymentDetails: data.paymentDetails || null
  };
};

type NewOrderData = Omit<Order, 'id' | 'status' | 'createdAt' | 'hasReview' | 'paymentDetails'>;


export async function addOrder(orderData: NewOrderData): Promise<Order> {
    const { userId } = orderData;
    if (!userId) {
        const err = new Error("User ID is required to add an order.");
        await addLog('error', 'addOrder failed: Missing userId', { error: err });
        throw err;
    }

    try {
        const batch = writeBatch(db);

        // Use the auto-generated ID for both documents.
        const newOrderRef = doc(allOrdersCollection);
        const newOrderId = newOrderRef.id;

        const userOrderRef = doc(db, 'users', userId, 'orders', newOrderId);

        const newOrderDocumentData: Omit<Order, 'createdAt'> & { createdAt: Timestamp } = {
            id: newOrderId,
            userId: orderData.userId,
            name: orderData.name,
            phone: orderData.phone,
            email: orderData.email,
            address: orderData.address,
            street: orderData.street,
            city: orderData.city,
            country: orderData.country,
            state: orderData.state,
            pinCode: orderData.pinCode,
            paymentMethod: orderData.paymentMethod,
            variant: orderData.variant,
            price: orderData.price,
            originalPrice: orderData.originalPrice,
            discountCode: orderData.discountCode,
            discountAmount: orderData.discountAmount,
            status: 'pending', // Default to pending. Will be updated by the caller.
            createdAt: Timestamp.now(),
            hasReview: false,
            paymentDetails: null
        };

        batch.set(newOrderRef, newOrderDocumentData);
        batch.set(userOrderRef, newOrderDocumentData);

        await batch.commit();
        
        await addLog('info', 'addOrder created pending order', { orderId: newOrderId, userId: userId });

        const finalOrder: Order = {
            ...newOrderDocumentData,
            createdAt: newOrderDocumentData.createdAt.toMillis(),
        };

        return finalOrder;

    } catch(error: any) {
        await addLog('error', 'addOrder database operation failed', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            userId: userId,
        });
        console.error(`Error adding new order for user ${userId}:`, error);
        throw error;
    }
};

export async function getOrders(): Promise<Order[]> {
  try {
    const ordersQuery = query(allOrdersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(ordersQuery);
    return snapshot.docs.map(docToOrder);
  } catch (error: any) {
    await addLog('error', 'getOrders failed', { message: error.message, code: error.code });
    console.error("Error fetching all orders:", error);
    if (error.code === 'failed-precondition') {
      throw new Error(
        `Firestore index required. The query requires an index. You can create it here: ${error.message.match(/https?:\/\/[^\s]+/)?.[0]}`
      );
    }
    throw error;
  }
};

export async function getOrderById(userId: string, orderId: string): Promise<Order | null> {
    if (!userId || !orderId) return null;
    try {
        const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
        const docSnap = await getDoc(userOrderRef);
        return docSnap.exists() ? docToOrder(docSnap) : null;
    } catch(e) {
        console.error(e);
        return null;
    }
}


export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  if (!userId) {
      throw new Error("User ID is required to fetch user orders.");
  }
  try {
    const userOrdersCollection = collection(db, 'users', userId, 'orders');
    const q = query(userOrdersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToOrder);
  } catch (error) {
    await addLog('error', 'getOrdersByUserId failed', { userId, error: { message: (error as Error).message } });
    console.error(`Error fetching orders for user ${userId}:`, error);
    throw new Error("Could not fetch user orders.");
  }
};

export async function updateOrderStatus(userId: string, orderId: string, status: OrderStatus, hasReview?: boolean): Promise<void> {
    if (!userId || !orderId) {
        throw new Error("User ID and Order ID are required to update status.");
    }
    try {
        const batch = writeBatch(db);

        const updateData: any = { status };
        if (typeof hasReview === 'boolean') {
            updateData.hasReview = hasReview;
        }

        const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
        batch.update(userOrderRef, updateData);

        const allOrdersRef = doc(allOrdersCollection, orderId);
        batch.update(allOrdersRef, updateData);

        await batch.commit();
        await addLog('info', 'updateOrderStatus success', { userId, orderId, status });

    } catch (error) {
        await addLog('error', 'updateOrderStatus failed', { userId, orderId, status, error: { message: (error as Error).message } });
        console.error(`Error updating status for order ${orderId}:`, error);
        throw new Error("Could not update the order status.");
    }
};

export async function updateOrderPaymentStatus(orderId: string, paymentStatus: 'SUCCESS' | 'FAILURE' | 'PENDING', paymentData: any): Promise<void> {
    if (!orderId) {
        throw new Error("Order ID is required to update payment status.");
    }
    try {
        const allOrdersRef = doc(allOrdersCollection, orderId);
        const orderSnap = await getDoc(allOrdersRef);
        
        if (!orderSnap.exists()) {
            await addLog('error', 'updateOrderPaymentStatus failed: Order not found in all-orders', { orderId });
            return;
        }

        const order = docToOrder(orderSnap);
        
        if(order.status === 'new' || order.status === 'dispatched' || order.status === 'delivered') {
            await addLog('warn', 'updateOrderPaymentStatus ignored for already processed order', { orderId, currentStatus: order.status });
            return;
        }
        
        const userId = order.userId;

        if (!userId) {
            await addLog('error', 'updateOrderPaymentStatus failed: User ID missing from order', { orderId });
            return;
        }

        const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
        
        let newStatus: OrderStatus = order.status;
        
        if (paymentStatus === 'SUCCESS') {
            newStatus = 'new';
            await decreaseStock(order.variant, 1);
            if (order.discountCode) {
                 await incrementDiscountUsage(order.discountCode);
            }
            await addEvent('order_placed_prepaid_success');
        } else if(paymentStatus === 'FAILURE') {
            newStatus = 'cancelled';
        } else {
            newStatus = 'pending';
        }

        const updateData = {
            status: newStatus,
            paymentDetails: paymentData
        };

        const batch = writeBatch(db);
        batch.update(allOrdersRef, updateData as any);
        batch.update(userOrderRef, updateData as any);
        await batch.commit();

        await addLog('info', 'Order payment status updated successfully', { orderId, newStatus });

    } catch(error) {
        await addLog('error', 'updateOrderPaymentStatus failed', { orderId, paymentStatus, error: { message: (error as Error).message } });
        console.error(`Error updating payment status for order ${orderId}:`, error);
        throw new Error("Could not update the order's payment status.");
    }
}

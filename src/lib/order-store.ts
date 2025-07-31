
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, query, orderBy, Timestamp, writeBatch } from 'firebase/firestore';
import type { Order, OrderStatus } from './definitions';
import { addLog } from './log-store';

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
  };
};

type NewOrderData = Omit<Order, 'id' | 'status' | 'createdAt' | 'hasReview'>;


export async function addOrder(orderData: NewOrderData): Promise<Order> {
    const { userId } = orderData;
    if (!userId) {
        const err = new Error("User ID is required to add an order.");
        await addLog('error', 'addOrder failed: Missing userId', { error: err });
        throw err;
    }

    try {
        const batch = writeBatch(db);

        // 1. Generate a single, authoritative document reference for the new order IN THE MAIN COLLECTION
        const newOrderRef = doc(allOrdersCollection);
        const newOrderId = newOrderRef.id;

        // 2. Create the user-specific document reference using the SAME ID
        const userOrderRef = doc(db, 'users', userId, 'orders', newOrderId);

        // 3. Meticulously build the clean data object to be saved, including the new ID
        const newOrderDocumentData = {
            id: newOrderId,
            ...orderData,
            status: 'new' as OrderStatus,
            createdAt: Timestamp.now(),
            hasReview: false,
        };

        // 4. Set the same data in both locations within the atomic batch
        batch.set(newOrderRef, newOrderDocumentData);
        batch.set(userOrderRef, newOrderDocumentData);

        // 5. Commit the batch
        await batch.commit();

        // 6. Construct the final Order object to return
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
    await addLog('error', 'getOrdersByUserId failed', { userId, error });
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

        const updateData: { status: OrderStatus; hasReview?: boolean } = { status };
        if (typeof hasReview === 'boolean') {
            updateData.hasReview = hasReview;
        }

        const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
        batch.update(userOrderRef, updateData as any);

        const allOrdersRef = doc(allOrdersCollection, orderId);
        batch.update(allOrdersRef, updateData as any);

        await batch.commit();

    } catch (error) {
        await addLog('error', 'updateOrderStatus failed', { userId, orderId, status, error });
        console.error(`Error updating status for order ${orderId}:`, error);
        throw new Error("Could not update the order status.");
    }
};


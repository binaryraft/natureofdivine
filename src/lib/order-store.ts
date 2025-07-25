
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, orderBy, Timestamp, where } from 'firebase/firestore';
import type { Order, OrderStatus } from './definitions';

const ordersCollection = collection(db, 'orders');

export const getOrders = async (): Promise<Order[]> => {
  const q = query(ordersCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toMillis(),
    } as Order;
  });
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const q = query(ordersCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toMillis(),
    } as Order
  });
};

export const getOrder = async (id: string): Promise<Order | null> => {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toMillis(),
        } as Order;
    } else {
        return null;
    }
};

type NewOrderData = Omit<Order, 'id' | 'status' | 'createdAt'>;

export const addOrder = async (orderData: NewOrderData): Promise<Order> => {
    const newOrderData = {
        ...orderData,
        // Ensure optional fields are present for Firestore
        name: orderData.name || '',
        email: orderData.email || '',
        phone: orderData.phone || null,
        address: orderData.address || null,
        street: orderData.street || null,
        city: orderData.city || null,
        country: orderData.country || null,
        state: orderData.state || null,
        pinCode: orderData.pinCode || null,
        userId: orderData.userId || null,
        status: 'new' as OrderStatus,
        createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(ordersCollection, newOrderData);
    return {
        ...newOrderData,
        id: docRef.id,
        createdAt: newOrderData.createdAt.toMillis(),
    };
};

export const updateOrderStatus = async (id:string, status: OrderStatus): Promise<void> => {
    const orderDoc = doc(db, 'orders', id);
    await updateDoc(orderDoc, { status });
};

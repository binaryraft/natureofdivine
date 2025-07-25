
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, orderBy, Timestamp, where } from 'firebase/firestore';
import type { Order, OrderStatus } from './definitions';

const ordersCollection = collection(db, 'orders');

// Helper function to safely convert Firestore data to an Order object
const docToOrder = (doc: any): Order => {
  const data = doc.data();
  // Ensure createdAt is handled correctly, whether it's a Timestamp or already a number
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
    status: data.status || 'new',
    createdAt: createdAtMillis,
  } as Order;
};


export const getOrders = async (): Promise<Order[]> => {
  const q = query(ordersCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToOrder);
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const q = query(ordersCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToOrder);
};

export const getOrder = async (id: string): Promise<Order | null> => {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docToOrder(docSnap);
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
    
    // Construct the final order object for the return value
    const finalOrder: Order = {
        ...newOrderData,
        id: docRef.id,
        createdAt: newOrderData.createdAt.toMillis(),
        // Re-map fields to match Order type strictly
        paymentMethod: newOrderData.paymentMethod as 'cod' | 'prepaid',
        variant: newOrderData.variant as 'paperback' | 'hardcover' | 'ebook',
        price: newOrderData.price,
    };
    return finalOrder;
};

export const updateOrderStatus = async (id:string, status: OrderStatus): Promise<void> => {
    const orderDoc = doc(db, 'orders', id);
    await updateDoc(orderDoc, { status });
};

    
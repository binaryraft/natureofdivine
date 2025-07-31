
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, orderBy, Timestamp, where, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Order, OrderStatus } from './definitions';
import { addLog } from './log-store';

const allOrdersCollection = collection(db, 'all-orders');

const docToOrder = (doc: any): Order => {
  const data = doc.data();
  const createdAtMillis = data.createdAt instanceof Timestamp 
    ? data.createdAt.toMillis() 
    : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());

  const order: Order = {
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
  return order;
};

export const getOrders = async (): Promise<Order[]> => {
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


export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
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


export const getOrder = async (userId: string, orderId: string): Promise<Order | null> => {
    if (!userId || !orderId) {
        throw new Error("User ID and Order ID are required to fetch an order.");
    }
    try {
        const docRef = doc(db, 'users', userId, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        return docSnap.exists() ? docToOrder(docSnap) : null;
    } catch (error) {
        await addLog('error', 'getOrder failed', { userId, orderId, error });
        console.error(`Error fetching order ${orderId} for user ${userId}:`, error);
        throw new Error("Could not fetch the specified order.");
    }
};

type NewOrderData = Omit<Order, 'id' | 'status' | 'createdAt' | 'hasReview'>;

export const addOrder = async (orderData: NewOrderData): Promise<Order> => {
    const { userId } = orderData;
    if (!userId) {
        await addLog('error', 'addOrder failed: Missing userId');
        throw new Error("User ID is required to add an order.");
    }

    try {
        // 1. Create a reference in the main collection to generate a unique ID
        const newOrderRef = doc(allOrdersCollection);
        const newOrderId = newOrderRef.id;

        // 2. Create the full order document data, now including the generated ID
        const newOrderDocumentData = {
            ...orderData,
            id: newOrderId,
            status: 'new' as OrderStatus,
            createdAt: Timestamp.now(),
            hasReview: false,
        };
        
        // 3. Use a batch to write to both locations atomically
        const batch = writeBatch(db);
        
        // Write to the main collection
        batch.set(newOrderRef, newOrderDocumentData);
        
        // Write to the user-specific collection using the same ID
        const userOrderRef = doc(db, 'users', userId, 'orders', newOrderId);
        batch.set(userOrderRef, newOrderDocumentData);
        
        // 4. Commit the batch
        await batch.commit();

        const finalOrder: Order = {
            ...orderData,
            id: newOrderId,
            status: 'new',
            createdAt: newOrderDocumentData.createdAt.toMillis(),
            hasReview: false,
        };
        
        await addLog('info', 'Successfully created order in database', { orderId: newOrderId, userId });
        return finalOrder;

    } catch(error: any) {
        await addLog('error', 'addOrder database operation failed', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            userId: userId
        });
        console.error(`Error adding new order for user ${userId}:`, error);
        throw new Error("Could not create a new order in the database.");
    }
};

export const updateOrderStatus = async (userId: string, orderId: string, status: OrderStatus, hasReview?: boolean): Promise<void> => {
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

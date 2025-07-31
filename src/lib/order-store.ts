

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, orderBy, Timestamp, where, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Order, OrderStatus } from './definitions';

const allOrdersCollection = collection(db, 'all-orders');

// Helper function to safely convert a Firestore document to a validated Order object
const docToOrder = (doc: any): Order => {
  const data = doc.data();
  // Ensure createdAt is handled correctly, whether it's a Timestamp or already a number
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

/**
 * Fetches all orders from the denormalized 'all-orders' collection.
 * This is for the admin panel and avoids complex collection group queries.
 * @returns {Promise<Order[]>} A promise that resolves to an array of all orders.
 * @throws Will throw an error if fetching from Firestore fails.
 */
export const getOrders = async (): Promise<Order[]> => {
  try {
    const ordersQuery = query(allOrdersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(ordersQuery);
    return snapshot.docs.map(docToOrder);
  } catch (error: any) {
    console.error("Error fetching all orders:", error);
    // If the denormalized collection fails, fallback to collection group query
    // and provide a helpful error for the developer if an index is missing.
    if (error.code === 'failed-precondition') {
      throw new Error(
        `Firestore index required. The query requires an index. You can create it here: ${error.message.match(/https?:\/\/[^\s]+/)?.[0]}`
      );
    }
    throw error;
  }
};


/**
 * Fetches all orders for a specific user ID from Firestore.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Order[]>} A promise that resolves to an array of the user's orders.
 * @throws Will throw an error if the user ID is not provided or if fetching fails.
 */
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
    console.error(`Error fetching orders for user ${userId}:`, error);
    throw new Error("Could not fetch user orders.");
  }
};


/**
 * Fetches a single order by its ID for a specific user.
 * @param {string} userId - The ID of the user.
 * @param {string} orderId - The document ID of the order.
 * @returns {Promise<Order | null>} A promise that resolves to the order object or null if not found.
 * @throws Will throw an error if IDs are not provided or if fetching fails.
 */
export const getOrder = async (userId: string, orderId: string): Promise<Order | null> => {
    if (!userId || !orderId) {
        throw new Error("User ID and Order ID are required to fetch an order.");
    }
    try {
        const docRef = doc(db, 'users', userId, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        return docSnap.exists() ? docToOrder(docSnap) : null;
    } catch (error) {
        console.error(`Error fetching order ${orderId} for user ${userId}:`, error);
        throw new Error("Could not fetch the specified order.");
    }
};

// Define the type for the data needed to create a new order.
type NewOrderData = Omit<Order, 'id' | 'status' | 'createdAt' | 'hasReview'>;

/**
 * Adds a new order to the specified user's `orders` subcollection in Firestore
 * and also adds a denormalized copy to the top-level `all-orders` collection for admin queries.
 * @param {NewOrderData} orderData - The data for the new order.
 * @returns {Promise<Order>} A promise that resolves to the newly created order object.
 * @throws Will throw an error if creating the document fails.
 */
export const addOrder = async (orderData: NewOrderData): Promise<Order> => {
    const { userId } = orderData;
    if (!userId) {
        throw new Error("User ID is required to add an order.");
    }

    try {
        const batch = writeBatch(db);
        const userOrdersCol = collection(db, 'users', userId, 'orders');
        
        // Step 1: Create a document reference with a new, unique, auto-generated ID.
        const newDocRef = doc(userOrdersCol);
        
        // Step 2: Prepare the complete order data, including the new ID.
        const newOrderDocumentData = {
            ...orderData,
            id: newDocRef.id, // Explicitly include the ID in the document data.
            status: 'new' as OrderStatus,
            createdAt: Timestamp.now(),
            hasReview: false,
        };
        
        // Step 3: Add the set operations to the batch.
        const allOrdersDocRef = doc(allOrdersCollection, newDocRef.id);
        
        batch.set(newDocRef, newOrderDocumentData);
        batch.set(allOrdersDocRef, newOrderDocumentData);
        
        // Step 4: Commit the batch.
        await batch.commit();

        // Step 5: Return the final, complete Order object.
        const finalOrder: Order = {
            ...orderData,
            id: newDocRef.id,
            status: 'new',
            createdAt: newOrderDocumentData.createdAt.toMillis(),
            hasReview: false,
        };
        
        return finalOrder;

    } catch(error: any) {
        console.error(`Error adding new order for user ${userId}:`, error.message, error.stack);
        throw new Error("Could not create a new order in the database.");
    }
};

/**
 * Updates an existing order in Firestore in both the user's collection and the denormalized `all-orders` collection.
 * @param {string} userId - The ID of the user who owns the order.
 * @param {string} orderId - The document ID of the order to update.
 * @param {OrderStatus} status - The new status for the order.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 * @throws Will throw an error if IDs are not provided or if the update fails.
 */
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

        // 1. Update the document in the user's subcollection
        const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
        batch.update(userOrderRef, updateData as any);

        // 2. Update the document in the `all-orders` collection
        const allOrdersRef = doc(allOrdersCollection, orderId);
        batch.update(allOrdersRef, updateData as any);

        await batch.commit();

    } catch (error) {
        console.error(`Error updating status for order ${orderId}:`, error);
        throw new Error("Could not update the order status.");
    }
};

    


import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, orderBy, Timestamp, where } from 'firebase/firestore';
import type { Order, OrderStatus } from './definitions';

const ordersCollection = collection(db, 'orders');

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
    status: data.status || 'new',
    createdAt: createdAtMillis,
  };
  return order;
};

/**
 * Fetches all orders from Firestore, sorted by creation date.
 * @returns {Promise<Order[]>} A promise that resolves to an array of orders.
 * @throws Will throw an error if fetching from Firestore fails.
 */
export const getOrders = async (): Promise<Order[]> => {
  try {
    const q = query(ordersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToOrder);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    throw new Error("Could not fetch orders from the database.");
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
    const q = query(ordersCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToOrder);
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    throw new Error("Could not fetch user orders.");
  }
};


/**
 * Fetches a single order by its document ID from Firestore.
 * @param {string} id - The document ID of the order.
 * @returns {Promise<Order | null>} A promise that resolves to the order object or null if not found.
 * @throws Will throw an error if the ID is not provided or if fetching fails.
 */
export const getOrder = async (id: string): Promise<Order | null> => {
    if (!id) {
        throw new Error("Order ID is required to fetch an order.");
    }
    try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);

        return docSnap.exists() ? docToOrder(docSnap) : null;
    } catch (error) {
        console.error(`Error fetching order ${id}:`, error);
        throw new Error("Could not fetch the specified order.");
    }
};

// Define the type for the data needed to create a new order.
type NewOrderData = Omit<Order, 'id' | 'status' | 'createdAt'>;

/**
 * Adds a new order to the Firestore database.
 * @param {NewOrderData} orderData - The data for the new order.
 * @returns {Promise<Order>} A promise that resolves to the newly created order object.
 * @throws Will throw an error if creating the document fails.
 */
export const addOrder = async (orderData: NewOrderData): Promise<Order> => {
    try {
        const newOrderDocument = {
            ...orderData,
            status: 'new' as OrderStatus,
            createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(ordersCollection, newOrderDocument);
        
        // Return the complete order object, including the new ID and converted timestamp.
        return {
            ...orderData,
            id: docRef.id,
            status: 'new',
            createdAt: newOrderDocument.createdAt.toMillis(),
        };
    } catch(error) {
        console.error("Error adding new order:", error);
        throw new Error("Could not create a new order in the database.");
    }
};

/**
 * Updates the status of an existing order in Firestore.
 * @param {string} id - The document ID of the order to update.
 * @param {OrderStatus} status - The new status for the order.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 * @throws Will throw an error if the ID is not provided or if the update fails.
 */
export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
    if (!id) {
        throw new Error("Order ID is required to update status.");
    }
    try {
        const orderDoc = doc(db, 'orders', id);
        await updateDoc(orderDoc, { status });
    } catch (error) {
        console.error(`Error updating status for order ${id}:`, error);
        throw new Error("Could not update the order status.");
    }
};

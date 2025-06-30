// This is a simple in-memory store for demonstration purposes.
// In a real application, this would be replaced by a database.
import type { Order, OrderStatus } from './definitions';

let orders: Order[] = [];

// Seed with some initial data for demonstration
if (process.env.NODE_ENV === 'development' && orders.length === 0) {
  orders.push({
    id: 'ORD-12345',
    name: 'John Doe',
    phone: '123-456-7890',
    email: 'john.doe@example.com',
    address: '123 Main St',
    street: 'Apt 4B',
    pinCode: '10001',
    country: 'USA',
    status: 'new',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  });
  orders.push({
    id: 'ORD-67890',
    name: 'Jane Smith',
    phone: '098-765-4321',
    email: 'jane.smith@example.com',
    address: '456 Oak Ave',
    street: '',
    pinCode: '90210',
    country: 'USA',
    status: 'dispatched',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  });
}


export const getOrders = async (): Promise<Order[]> => {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getOrder = async (id: string): Promise<Order | undefined> => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return orders.find(order => order.id === id);
};

export const addOrder = async (orderData: Omit<Order, 'id' | 'status' | 'createdAt'>): Promise<Order> => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    const newOrder: Order = {
        ...orderData,
        id: `ORD-${Date.now()}`,
        status: 'new',
        createdAt: new Date(),
    };
    orders.unshift(newOrder);
    return newOrder;
};

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<Order | undefined> => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    const orderIndex = orders.findIndex(order => order.id === id);
    if (orderIndex !== -1) {
        orders[orderIndex].status = status;
        return orders[orderIndex];
    }
    return undefined;
};

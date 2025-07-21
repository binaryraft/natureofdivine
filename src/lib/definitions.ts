export type OrderStatus = 'new' | 'dispatched' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  street: string;
  country: string;
  state: string;
  pinCode:string;
  paymentMethod: 'cod' | 'prepaid';
  status: OrderStatus;
  createdAt: number; // Storing as timestamp for Firestore
};

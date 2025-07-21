

export type OrderStatus = 'new' | 'dispatched' | 'delivered' | 'cancelled';

export type BookVariant = 'paperback' | 'hardcover';

export type Order = {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string;
  address: string;
  street: string;
  city: string;
  country: string;
  state: string;
  pinCode:string;
  paymentMethod: 'cod' | 'prepaid';
  variant: BookVariant;
  price: number;
  status: OrderStatus;
  createdAt: number; // Storing as timestamp for Firestore
};

export type Stock = {
  paperback: number;
  hardcover: number;
};

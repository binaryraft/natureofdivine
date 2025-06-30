export type OrderStatus = 'new' | 'dispatched' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  street: string;
  pinCode: string;
  country: string;
  status: OrderStatus;
  createdAt: Date;
};

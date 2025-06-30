'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addOrder, getOrder, getOrders, updateOrderStatus } from './order-store';
import type { OrderStatus } from './definitions';

const orderSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  street: z.string().optional(),
  pinCode: z.string().min(4, { message: 'Please enter a valid PIN code.' }),
  country: z.string().min(2, { message: 'Please enter a valid country.' }),
});

export type State = {
  errors?: {
    name?: string[];
    phone?: string[];
    email?: string[];
    address?: string[];
    street?: string[];
    pinCode?: string[];
    country?: string[];
  };
  message?: string | null;
  orderId?: string | null;
};

export async function placeOrder(prevState: State, formData: FormData) {
  const validatedFields = orderSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    street: formData.get('street'),
    pinCode: formData.get('pinCode'),
    country: formData.get('country'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Order.',
    };
  }

  try {
    const newOrder = await addOrder(validatedFields.data);
    revalidatePath('/admin');
    return { message: 'Order created successfully!', orderId: newOrder.id };
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Order.',
    };
  }
}

export async function fetchOrders() {
    return await getOrders();
}

export async function fetchOrderStatus(id: string) {
    if (!id) return null;
    return await getOrder(id);
}

export async function changeOrderStatus(id: string, status: OrderStatus) {
    try {
        await updateOrderStatus(id, status);
        revalidatePath('/admin');
        return { success: true, message: `Order ${id} status updated to ${status}` };
    } catch (error) {
        return { success: false, message: 'Failed to update order status.' };
    }
}

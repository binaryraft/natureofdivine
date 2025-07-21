
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addOrder, getOrder, getOrders, updateOrderStatus } from './order-store';
import type { OrderStatus } from './definitions';

const addressSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  street: z.string().optional(),
  city: z.string().min(2, { message: 'Please enter a valid city.' }),
  country: z.string().min(2, { message: 'Please select a country.' }),
  state: z.string().min(2, { message: 'Please select a state.' }),
  pinCode: z.string().min(3, { message: 'Please enter a valid PIN code.' }),
});

const paymentSchema = z.object({
    paymentMethod: z.enum(['cod', 'prepaid']),
    formData: z.string(),
});

export type State = {
  errors?: {
    name?: string[];
    phone?: string[];
    email?: string[];
    address?: string[];
    street?: string[];
    city?: string[];
    country?: string[];
    state?: string[];
    pinCode?: string[];
    paymentMethod?: string[];
  };
  message?: string | null;
  orderId?: string | null;
  step: 'address' | 'payment' | 'success';
  formData?: string | null;
};

export async function placeOrder(prevState: State, formData: FormData): Promise<State> {
  // Step 1: Validate address and move to payment step
  if (prevState.step === 'address') {
    const validatedFields = addressSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Proceed.',
        step: 'address',
      };
    }
    
    return {
        step: 'payment',
        formData: JSON.stringify(validatedFields.data),
    };
  }

  // Step 2: Validate payment method and create order
  if (prevState.step === 'payment') {
     const validatedPayment = paymentSchema.safeParse(Object.fromEntries(formData.entries()));

     if (!validatedPayment.success || !validatedPayment.data.formData) {
        return {
            ...prevState,
            message: 'Invalid payment details.',
            step: 'payment'
        }
     }
     
     const orderData = JSON.parse(validatedPayment.data.formData);
     
     try {
        const newOrder = await addOrder({
            ...orderData,
            paymentMethod: validatedPayment.data.paymentMethod,
        });
        revalidatePath('/admin');
        return { 
            step: 'success', 
            message: 'Order created successfully!', 
            orderId: newOrder.id 
        };
      } catch (error) {
        return {
          message: 'Database Error: Failed to Create Order.',
          step: 'payment',
          formData: validatedPayment.data.formData,
        };
      }
  }

  // Fallback for invalid state
  return {
    step: 'address',
    message: 'An unexpected error occurred.',
  };
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

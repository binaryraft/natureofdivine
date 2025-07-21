
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addOrder, getOrders, getOrdersByUserId, updateOrderStatus } from './order-store';
import type { BookVariant, OrderStatus } from './definitions';
import { decreaseStock, getStock } from './stock-store';

const variantDetails: Record<BookVariant, { name: string; price: number; }> = {
    paperback: { name: 'Paperback', price: 299 },
    hardcover: { name: 'Hardcover', price: 499 },
};

const variantSchema = z.object({
    variant: z.enum(['paperback', 'hardcover'], { required_error: 'Please select a book type.' }),
});

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
  variantData: z.string(), // JSON string
});

const paymentSchema = z.object({
    paymentMethod: z.enum(['cod', 'prepaid']),
    addressData: z.string(), // JSON string
    userId: z.string().optional(),
    saveAddress: z.string().optional(),
});

export type State = {
  errors?: {
    variant?: string[];
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
  step: 'variant' | 'address' | 'payment' | 'success';
  variantData?: string | null;
  addressData?: string | null;
};

export async function placeOrder(prevState: State, formData: FormData): Promise<State> {
  const currentStep = prevState.step;
  
  if (currentStep === 'variant') {
    const validatedVariant = variantSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedVariant.success) {
      return {
        errors: validatedVariant.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Proceed.',
        step: 'variant',
      };
    }

    const stock = await getStock();
    if (stock[validatedVariant.data.variant] <= 0) {
        return {
             errors: { variant: ['This item is out of stock.'] },
             message: 'Selected variant is out of stock.',
             step: 'variant',
        }
    }

    return {
        step: 'address',
        variantData: JSON.stringify(validatedVariant.data),
    };
  }

  if (currentStep === 'address') {
    const validatedFields = addressSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        ...prevState,
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Proceed.',
        step: 'address',
      };
    }
    
    const variantData = JSON.parse(validatedFields.data.variantData);
    const fullData = { ...variantData, ...validatedFields.data };

    return {
        step: 'payment',
        addressData: JSON.stringify(fullData),
    };
  }

  if (currentStep === 'payment') {
     const validatedPayment = paymentSchema.safeParse(Object.fromEntries(formData.entries()));

     if (!validatedPayment.success || !validatedPayment.data.addressData) {
        return {
            ...prevState,
            message: 'Invalid payment details.',
            step: 'payment'
        }
     }
     
     const addressData = JSON.parse(validatedPayment.data.addressData);
     const { userId, saveAddress } = validatedPayment.data;
     const { variant } = addressData;
     
     try {
        await decreaseStock(variant, 1);
     
        const newOrder = await addOrder({
            ...addressData,
            price: variantDetails[variant].price,
            paymentMethod: validatedPayment.data.paymentMethod,
            userId: userId || null,
        });

        if (userId && saveAddress === 'true') {
            // TODO: Logic to save the address to user's profile in Firestore
        }

        revalidatePath('/admin');
        revalidatePath('/orders');
        revalidatePath('/checkout');
        return { 
            step: 'success', 
            message: 'Order created successfully!', 
            orderId: newOrder.id 
        };
      } catch (error: any) {
        return {
          message: error.message || 'Database Error: Failed to Create Order.',
          step: 'payment',
          addressData: validatedPayment.data.addressData,
        };
      }
  }

  // Fallback for invalid state
  return {
    step: 'variant',
    message: 'An unexpected error occurred.',
  };
}

export async function fetchOrders() {
    return await getOrders();
}

export async function fetchUserOrders(userId: string) {
    if (!userId) return [];
    return await getOrdersByUserId(userId);
}

export async function changeOrderStatus(id: string, status: OrderStatus) {
    try {
        await updateOrderStatus(id, status);
        revalidatePath('/admin');
        revalidatePath('/orders');
        return { success: true, message: `Order ${id} status updated to ${status}` };
    } catch (error) {
        return { success: false, message: 'Failed to update order status.' };
    }
}

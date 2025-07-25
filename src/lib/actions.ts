
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addOrder, getOrders, getOrdersByUserId, updateOrderStatus } from './order-store';
import type { OrderStatus } from './definitions';
import { decreaseStock } from './stock-store';
import { fetchLocationAndPrice } from './fetch-location-price';
import { processPayment } from '@/ai/flows/payment-flow';

const OrderSchema = z.object({
  variant: z.enum(['paperback', 'hardcover', 'ebook']),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().optional(),
  address: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  userId: z.string().optional(),
});

const CodOrderSchema = OrderSchema.extend({
    paymentMethod: z.literal('cod'),
});

export async function placeOrder(
  data: z.infer<typeof CodOrderSchema>
): Promise<{ success: boolean; message: string; orderId?: string }> {
  const validatedFields = CodOrderSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid data provided. Please check the form.',
    };
  }

  const { variant, ...orderDetails } = validatedFields.data;

  try {
    const prices = await fetchLocationAndPrice();
    const price = prices[variant];

    if (variant !== 'ebook') {
      await decreaseStock(variant, 1);
    }

    const newOrder = await addOrder({
      ...orderDetails,
      variant,
      price,
      paymentMethod: 'cod', // This action is only for COD
    });

    revalidatePath('/admin');
    revalidatePath('/orders');

    return {
      success: true,
      message: 'Order created successfully!',
      orderId: newOrder.id,
    };
  } catch (error: any) {
    console.error('Place order error:', error);
    return {
      success: false,
      message:
        error.message ||
        'An error occurred while placing your order. Please try again.',
    };
  }
}


export async function processPrepaidOrder(
  data: z.infer<typeof OrderSchema>
): Promise<{ success: boolean; message: string; redirectUrl?: string; orderDetails?: any }> {
    const validatedFields = OrderSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid data provided. Please check the form.',
        };
    }

    try {
        const paymentResult = await processPayment(validatedFields.data);

        // This object is what we'll store in the cookie.
        // It's the original validated data, not the PhonePe response.
        const orderDetailsToStore = {
            ...validatedFields.data,
            paymentMethod: 'prepaid', // We set the payment method here.
        };

        return {
            success: true,
            message: 'Redirecting to payment gateway.',
            redirectUrl: paymentResult.redirectUrl,
            orderDetails: orderDetailsToStore,
        };
    } catch (e: any) {
        console.error('Prepaid order processing error:', e);
        return {
            success: false,
            message: e.message || 'An unexpected error occurred during payment processing.',
        };
    }
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

    

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addOrder, getOrders, getOrdersByUserId, updateOrderStatus, addPendingOrder, deletePendingOrder } from './order-store';
import type { OrderStatus, BookVariant } from './definitions';
import { decreaseStock } from './stock-store';
import { fetchLocationAndPrice } from './fetch-location-price';
import { v4 as uuidv4 } from 'uuid';
import { addReview as addReviewToStore, getReviews } from './review-store';
import { auth } from './firebase';
import { StandardCheckoutClient, Env, CreateSdkOrderRequest } from 'phonepe-pg-sdk-node';


const OrderSchema = z.object({
  variant: z.enum(['paperback', 'hardcover']),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().optional(),
  address: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  userId: z.string().min(1, "User ID is required."), // Make userId required
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

  const { variant, userId, ...orderDetails } = validatedFields.data;

  try {
    const prices = await fetchLocationAndPrice();
    const price = prices[variant as Exclude<BookVariant, 'ebook'>];

    await decreaseStock(variant, 1);

    const newOrder = await addOrder(userId, {
      ...orderDetails,
      variant,
      price,
      paymentMethod: 'cod', // This action is only for COD
      userId: userId,
    });

    revalidatePath('/admin');
    revalidatePath(`/orders`); // Revalidate the specific user's order page if needed

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

const isProd = process.env.NEXT_PUBLIC_PHONEPE_ENV === 'PRODUCTION';

const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
const env = isProd ? Env.PRODUCTION : Env.SANDBOX;

const HOST_URL = process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000';


export async function processPrepaidOrder(
  data: z.infer<typeof OrderSchema>
): Promise<{ success: boolean; message: string; token?: string; }> {
    const validatedFields = OrderSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid data provided. Please check the form.',
        };
    }
    
    if (!clientId || !clientSecret || clientSecret === 'YOUR_CLIENT_SECRET_HERE') {
        return { success: false, message: 'PhonePe client credentials are not configured in the environment.' };
    }
    
    const { variant, userId, ...orderDetails } = validatedFields.data;
    
    try {
        const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, env);
        const prices = await fetchLocationAndPrice();
        const price = prices[variant as Exclude<BookVariant, 'ebook'>];
        const amount = price * 100; // Amount in paise

        const merchantTransactionId = `MUID${Date.now()}`;
        
        await addPendingOrder(merchantTransactionId, {
            ...orderDetails,
            variant,
            price,
            paymentMethod: 'prepaid',
            userId: userId,
        });

        const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
            .merchantOrderId(merchantTransactionId)
            .amount(amount)
            .merchantUserId(userId)
            .redirectUrl(`${HOST_URL}/api/payment/callback?transactionId=${merchantTransactionId}`)
            .callbackUrl(`${HOST_URL}/api/payment/callback`)
            .build();

        const response = await client.createSdkOrder(request);

        if (!response.token) {
            console.error("PhonePe SDK Error:", response);
            await deletePendingOrder(merchantTransactionId); // Clean up pending order on failure
            throw new Error('Failed to get payment token from PhonePe.');
        }

        return {
            success: true,
            message: 'Token generated successfully.',
            token: response.token,
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

export async function changeOrderStatus(userId: string, orderId: string, status: OrderStatus) {
    try {
        await updateOrderStatus(userId, orderId, status);
        revalidatePath('/admin');
        revalidatePath('/orders');
        return { success: true, message: `Order ${orderId} status updated to ${status}` };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to update order status.' };
    }
}


const ReviewSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(5),
  reviewText: z.string().optional(),
});

export async function submitReview(data: z.infer<typeof ReviewSchema>) {
  try {
    const validatedData = ReviewSchema.parse(data);
    const user = auth.currentUser;

    const reviewData = {
      ...validatedData,
      userName: user?.displayName || 'Anonymous',
    };

    await addReviewToStore(reviewData);

    // After adding review, update order to mark hasReview=true
    await updateOrderStatus(validatedData.userId, validatedData.orderId, 'delivered', true);
    
    revalidatePath('/');
    revalidatePath('/orders');

    return { success: true, message: "Review submitted successfully." };
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return { success: false, message: error.message || "Failed to submit review." };
  }
}

export async function fetchReviews() {
    return await getReviews();
}

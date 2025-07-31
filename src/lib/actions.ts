
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addOrder, getOrders, getOrdersByUserId, updateOrderStatus, addPendingOrder, deletePendingOrder, getPendingOrder } from './order-store';
import type { OrderStatus, BookVariant } from './definitions';
import { decreaseStock } from './stock-store';
import { fetchLocationAndPrice } from './fetch-location-price';
import { addReview as addReviewToStore, getReviews } from './review-store';
import { auth } from './firebase';
import { StandardCheckoutClient, Env, CreateSdkOrderRequest } from 'phonepe-pg-sdk-node';
import { addDiscount, getDiscount, incrementDiscountUsage } from './discount-store';


const OrderSchema = z.object({
  variant: z.enum(['paperback', 'hardcover']),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
  street: z.string().optional(),
  city: z.string().min(2, 'Please enter a valid city.'),
  country: z.string().min(2, 'Please select a country.'),
  state: z.string().min(2, 'Please select a state.'),
  pinCode: z.string().min(3, 'Please enter a valid PIN code.'),
  userId: z.string().min(1, "User ID is required."),
  discountCode: z.string().optional(),
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

  const { variant, userId, discountCode, ...orderDetails } = validatedFields.data;

  try {
    const prices = await fetchLocationAndPrice();
    const originalPrice = prices[variant as Exclude<BookVariant, 'ebook'>];
    
    let finalPrice = originalPrice;
    let discountAmount = 0;
    
    if (discountCode) {
        const discount = await getDiscount(discountCode);
        if (discount) {
            discountAmount = Math.round(originalPrice * (discount.percent / 100));
            finalPrice = originalPrice - discountAmount;
        }
    }

    await decreaseStock(variant, 1);

    const newOrder = await addOrder(userId, {
      ...orderDetails,
      variant,
      price: finalPrice,
      originalPrice,
      discountCode,
      discountAmount,
      paymentMethod: 'cod',
      userId: userId,
    });
    
    if (discountCode) {
        await incrementDiscountUsage(discountCode);
    }

    revalidatePath('/admin');
    revalidatePath(`/orders`);

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
        console.error("Prepaid order validation failed:", validatedFields.error.flatten());
        return {
            success: false,
            message: 'Invalid data provided. Please check the form.',
        };
    }
    
    if (!clientId || !clientSecret || clientSecret === 'YOUR_CLIENT_SECRET_HERE') {
        console.error('PhonePe client credentials are not configured in the environment.');
        return { success: false, message: 'Payment gateway is not configured.' };
    }
    
    const { variant, userId, discountCode, ...orderDetails } = validatedFields.data;
    
    try {
        const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, env);
        const prices = await fetchLocationAndPrice();
        const originalPrice = prices[variant as Exclude<BookVariant, 'ebook'>];
        
        let finalPrice = originalPrice;
        let discountAmount = 0;
        
        if (discountCode) {
            const discount = await getDiscount(discountCode);
            if (discount) {
                discountAmount = Math.round(originalPrice * (discount.percent / 100));
                finalPrice = originalPrice - discountAmount;
            }
        }

        const amount = finalPrice * 100; // Amount in paise

        const merchantTransactionId = `MUID${Date.now()}`;
        
        await addPendingOrder(merchantTransactionId, {
            ...orderDetails,
            variant,
            price: finalPrice,
            originalPrice,
            discountCode,
            discountAmount,
            paymentMethod: 'prepaid',
            userId: userId,
        });
        
        const callbackUrl = `${HOST_URL}/api/payment/callback`;
        const redirectUrl = `${HOST_URL}/api/payment/callback?transactionId=${merchantTransactionId}`;

        const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
            .merchantOrderId(merchantTransactionId)
            .amount(amount)
            .merchantUserId(userId)
            .callbackUrl(callbackUrl)
            .redirectUrl(redirectUrl)
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
            message: e.message || 'Could not create a pending order.',
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

export async function changeOrderStatus(userId: string, orderId: string, status: OrderStatus, hasReview?: boolean) {
    try {
        await updateOrderStatus(userId, orderId, status, hasReview);
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
    
    // We can't use auth.currentUser on the server. We trust the userId passed from the client context.
    // For enhanced security, one might implement server-side session checks.
    const reviewData = {
      ...validatedData,
      userName: 'Anonymous', // User display name is not available directly on server actions without session management
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

export async function validateDiscountCode(code: string): Promise<{ success: boolean; percent?: number; message: string }> {
    if (!code) {
        return { success: false, message: "Please enter a code." };
    }
    const discount = await getDiscount(code);
    if (discount) {
        return { success: true, percent: discount.percent, message: `Code applied! You get ${discount.percent}% off.` };
    }
    return { success: false, message: "Invalid or expired discount code." };
}

export async function createDiscount(code: string, percent: number): Promise<{success: boolean, message: string}> {
    const result = await addDiscount(code, percent);
    if(result.success) {
        revalidatePath('/admin');
    }
    return result;
}

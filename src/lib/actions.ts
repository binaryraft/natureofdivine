
'use server';

import { z } from 'zod';
import { getOrders, getOrdersByUserId, updateOrderStatus, addOrder, getOrderById, updateOrderPaymentStatus } from './order-store';
import { revalidatePath } from 'next/cache';
import { addLog } from './log-store';
import { decreaseStock } from './stock-store';
import { fetchLocationAndPrice } from './fetch-location-price';
import { BookVariant, OrderStatus, Review, Order } from './definitions';
import { getDiscount, incrementDiscountUsage, addDiscount } from './discount-store';
import { addReview as addReviewToStore, getReviews as getReviewsFromStore } from './review-store';
import { randomUUID } from 'crypto';
import { addEvent, getAnalytics } from './analytics-store';

const OrderFormSchema = z.object({
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
  userId: z.string().min(1, 'User ID is required.'),
  discountCode: z.string().optional(),
  paymentMethod: z.enum(['cod', 'prepaid']),
});

export type OrderPayload = z.infer<typeof OrderFormSchema>;

export async function placeOrder(payload: OrderPayload): Promise<{ success: boolean; message: string; orderId?: string; paymentData?: any }> {
  await addLog('info', 'placeOrder action initiated.', { paymentMethod: payload.paymentMethod });

  const validatedFields = OrderFormSchema.safeParse(payload);

  if (!validatedFields.success) {
    const errorDetails = validatedFields.error.flatten();
    await addLog('error', 'Order validation failed.', errorDetails);
    return {
      success: false,
      message: 'Invalid data provided. Please check the form.',
    };
  }

  const { variant, userId, discountCode, paymentMethod } = validatedFields.data;

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

    const newOrderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'hasReview' | 'paymentDetails'> = {
      userId: validatedFields.data.userId,
      name: validatedFields.data.name,
      phone: validatedFields.data.phone,
      email: validatedFields.data.email,
      address: validatedFields.data.address,
      street: validatedFields.data.street || '',
      city: validatedFields.data.city,
      country: validatedFields.data.country,
      state: validatedFields.data.state,
      pinCode: validatedFields.data.pinCode,
      paymentMethod: validatedFields.data.paymentMethod,
      variant: validatedFields.data.variant,
      price: finalPrice,
      originalPrice,
      discountCode: validatedFields.data.discountCode || '',
      discountAmount,
    };

    await addLog('info', 'Attempting to add order to database with clean data...', { userId, variant });
    const newOrder = await addOrder(newOrderData);
    await addLog('info', 'Order successfully created in database.', { orderId: newOrder.id });
    
    // Set order to new immediately for COD
    await updateOrderStatus(userId, newOrder.id, 'new');

    if (paymentMethod === 'cod') {
      await decreaseStock(variant, 1);
      if (discountCode) {
        await incrementDiscountUsage(discountCode);
      }
      await trackEvent('order_placed_cod');

      revalidatePath('/admin');
      revalidatePath('/orders');

      return {
        success: true,
        message: 'Order created successfully!',
        orderId: newOrder.id,
      };
    } else {
      // Since the SDK is not available, we can't proceed with prepaid orders.
      await addLog('error', 'PhonePe payment initiation failed.', { orderId: newOrder.id, reason: 'SDK not available/installed.' });
      return { success: false, message: 'Online payment is temporarily unavailable. Please choose Cash on Delivery.' };
    }
  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred.';
    await addLog('error', 'placeOrder action failed catastrophically.', {
      message: errorMessage,
      stack: error.stack,
      payload,
    });
    console.error('CRITICAL placeOrder Error:', error);
    return {
      success: false,
      message: `Could not create a new order in the database. Reason: ${errorMessage}`,
    };
  }
}


export async function checkPhonePeStatus(merchantTransactionId: string) {
    // This function is now a placeholder as the SDK is not available.
    await addLog('warn', 'checkPhonePeStatus called, but SDK is not available. Returning failure.');
    return { success: false, message: "Payment status check is currently unavailable.", code: 'SERVICE_UNAVAILABLE' };
}


export async function fetchOrdersAction() {
    return await getOrders();
}

export async function fetchUserOrdersAction(userId: string) {
    return await getOrdersByUserId(userId);
}

export async function changeOrderStatusAction(userId: string, orderId: string, status: OrderStatus) {
    return await updateOrderStatus(userId, orderId, status);
}

export async function changeMultipleOrderStatusAction(orders: {orderId: string, userId: string}[], status: OrderStatus) {
    try {
        await Promise.all(
            orders.map(order => updateOrderStatus(order.userId, order.orderId, status))
        );
        addLog('info', `Bulk updated ${orders.length} orders to ${status}.`);
        revalidatePath('/admin');
        return { success: true, message: `${orders.length} orders updated.` };
    } catch (error: any) {
        addLog('error', 'Bulk order update failed.', { status, count: orders.length, error: error.message });
        return { success: false, message: 'Failed to update some orders.' };
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
    
    const order = await getOrderById(validatedData.userId, validatedData.orderId);
    if (!order) {
        throw new Error("Order not found.");
    }
    
    const reviewData = {
      ...validatedData,
      userName: order.name, 
    };

    await addReviewToStore(reviewData);
    await updateOrderStatus(validatedData.userId, validatedData.orderId, 'delivered', true);
    
    revalidatePath('/');
    revalidatePath('/orders');

    return { success: true, message: "Review submitted successfully." };
  } catch (error: any) {
    await addLog('error', 'submitReview failed', { data, error: { message: error.message } });
    console.error("Error submitting review:", error);
    return { success: false, message: error.message || "Failed to submit review." };
  }
}

export async function fetchReviews(): Promise<Review[]> {
    return await getReviewsFromStore();
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


// Analytics Actions
export async function trackEvent(
    type: string,
    metadata?: Record<string, any>
): Promise<{success: boolean}> {
    try {
        await addEvent(type, metadata);
        return { success: true };
    } catch(e) {
        // Fail silently on the client, but log it
        addLog('error', 'trackEvent failed', { type, metadata, error: (e as Error).message });
        return { success: false };
    }
}

export async function fetchAnalytics() {
    return await getAnalytics();
}


'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addOrder, getOrders, getOrdersByUserId, updateOrderStatus } from './order-store';
import type { OrderStatus, BookVariant } from './definitions';
import { decreaseStock } from './stock-store';
import { fetchLocationAndPrice } from './fetch-location-price';
import { addReview as addReviewToStore, getReviews } from './review-store';
import { addDiscount, getDiscount, incrementDiscountUsage } from './discount-store';
import { addLog } from './log-store';


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
  paymentMethod: z.enum(['cod', 'prepaid']),
});

export async function placeOrder(
  data: z.infer<typeof OrderSchema>
): Promise<{ success: boolean; message: string; orderId?: string }> {
  addLog('info', 'placeOrder action started', { variant: data.variant, paymentMethod: data.paymentMethod });
  const validatedFields = OrderSchema.safeParse(data);

  if (!validatedFields.success) {
    const errorDetails = validatedFields.error.flatten();
    await addLog('error', 'Order validation failed', errorDetails);
    return {
      success: false,
      message: 'Invalid data provided. Please check the form.',
    };
  }

  const { variant, userId, discountCode, paymentMethod, ...orderDetails } = validatedFields.data;

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
    
    const newOrderData = {
      ...orderDetails,
      variant,
      price: finalPrice,
      originalPrice,
      discountCode,
      discountAmount,
      paymentMethod: paymentMethod,
      userId: userId,
    };
    
    await addLog('info', 'Attempting to add order to database', { userId, variant });
    const newOrder = await addOrder(newOrderData);
    await addLog('info', 'Order successfully added to database', { orderId: newOrder.id });
    
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
    await addLog('error', 'placeOrder action failed', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        data: data
    });
    console.error('Place order error:', error);
    return {
      success: false,
      message:
        error.message ||
        'An error occurred while placing your order. Please try again.',
    };
  }
}


export async function processPrepaidOrder(): Promise<{ success: boolean }> {
    await addLog('info', 'processPrepaidOrder simulated successfully');
    return { success: true };
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
        await addLog('error', 'changeOrderStatus failed', { orderId, status, error });
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
    
    const reviewData = {
      ...validatedData,
      userName: 'Anonymous', 
    };

    await addReviewToStore(reviewData);
    await updateOrderStatus(validatedData.userId, validatedData.orderId, 'delivered', true);
    
    revalidatePath('/');
    revalidatePath('/orders');

    return { success: true, message: "Review submitted successfully." };
  } catch (error: any) {
    await addLog('error', 'submitReview failed', { data, error });
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

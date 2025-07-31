
'use server';

import { z } from 'zod';
import { addOrder } from './order-store';
import { revalidatePath } from 'next/cache';
import { addLog } from './log-store';
import { decreaseStock } from './stock-store';
import { fetchLocationAndPrice } from './fetch-location-price';
import { BookVariant, OrderStatus, Review } from './definitions';
import { getDiscount, incrementDiscountUsage, addDiscount } from './discount-store';
import { addReview as addReviewToStore, getReviews as getReviewsFromStore } from './review-store';
import { getOrders, getOrdersByUserId, updateOrderStatus as updateDbOrderStatus } from './order-store';


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
  userId: z.string().min(1, "User ID is required."),
  discountCode: z.string().optional(),
  paymentMethod: z.enum(['cod', 'prepaid']),
});

export type OrderPayload = z.infer<typeof OrderFormSchema>;

export async function placeOrder(payload: OrderPayload): Promise<{ success: boolean; message: string; orderId?: string }> {
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
  
  const { variant, userId, discountCode } = validatedFields.data;

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
    
    // Meticulously build the clean data object to pass to the database store.
    // This prevents any "unsupported field value" errors.
    const newOrderData = {
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
      discountCode: validatedFields.data.discountCode,
      discountAmount,
    };
    
    await addLog('info', 'Attempting to add order to database with clean data...', { userId, variant });
    const newOrder = await addOrder(newOrderData);
    await addLog('info', 'Order successfully created in database.', { orderId: newOrder.id });
    
    if (discountCode) {
        await incrementDiscountUsage(discountCode);
    }

    revalidatePath('/admin');
    revalidatePath('/orders');

    return {
      success: true,
      message: 'Order created successfully!',
      orderId: newOrder.id,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred.';
    await addLog('error', 'placeOrder action failed catastrophically.', {
        message: errorMessage,
        stack: error.stack,
        name: error.name,
        code: error.code,
        payload: payload,
    });
    console.error('CRITICAL placeOrder Error:', error);
    return {
      success: false,
      message: `Could not create a new order in the database. Reason: ${errorMessage}`,
    };
  }
}

export async function processPrepaidOrder(): Promise<{ success: boolean }> {
    await addLog('info', 'Simulating successful prepaid payment.');
    return { success: true };
}

export async function fetchOrders() {
    return await getOrders();
}

export async function fetchUserOrders(userId: string) {
    return await getOrdersByUserId(userId);
}

export async function changeOrderStatus(userId: string, orderId: string, status: OrderStatus) {
    try {
        await updateDbOrderStatus(userId, orderId, status);
        await addLog('info', `Order status changed for ${orderId} to ${status}`);
        revalidatePath('/admin');
        revalidatePath('/orders');
        return { success: true, message: 'Order status updated successfully.' };
    } catch(e: any) {
        await addLog('error', 'changeOrderStatus failed.', { error: e, userId, orderId, status});
        return { success: false, message: e.message || 'Failed to update order status.'};
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
    
    // NOTE: In a real app, you'd get the user's name from their profile
    const reviewData = {
      ...validatedData,
      userName: 'Anonymous', 
    };

    await addReviewToStore(reviewData);
    // After submitting a review, also mark the order as having a review
    await updateDbOrderStatus(validatedData.userId, validatedData.orderId, 'delivered', true);
    
    revalidatePath('/'); // To show new testimonials
    revalidatePath('/orders'); // To update the "Leave a Review" button state

    return { success: true, message: "Review submitted successfully." };
  } catch (error: any) {
    await addLog('error', 'submitReview failed', { data, error });
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

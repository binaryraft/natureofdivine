
'use server';

import { z } from 'zod';
import axios from 'axios';
import { getOrders, getOrdersByUserId, updateOrderStatus, addOrder, getOrderById } from './order-store';
import { revalidatePath } from 'next/cache';
import { addLog } from './log-store';
import { decreaseStock } from './stock-store';
import { fetchLocationAndPrice } from './fetch-location-price';
import { BookVariant, OrderStatus, Review, Order } from './definitions';
import { getDiscount, incrementDiscountUsage, addDiscount } from './discount-store';
import { addReview as addReviewToStore, getReviews as getReviewsFromStore } from './review-store';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import { getAnalytics, addEvent } from './analytics-store';
import SHA256 from 'crypto-js/sha256';

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
  await addLog('info', 'placeOrder initiated', { paymentMethod: payload.paymentMethod });

  const validatedFields = OrderFormSchema.safeParse(payload);
  if (!validatedFields.success) {
    await addLog('error', 'Order validation failed', validatedFields.error.flatten());
    return { success: false, message: 'Invalid data provided.' };
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
      userId,
      name: validatedFields.data.name,
      phone: validatedFields.data.phone,
      email: validatedFields.data.email,
      address: validatedFields.data.address,
      street: validatedFields.data.street || '',
      city: validatedFields.data.city,
      country: validatedFields.data.country,
      state: validatedFields.data.state,
      pinCode: validatedFields.data.pinCode,
      paymentMethod,
      variant,
      price: finalPrice,
      originalPrice,
      discountCode: discountCode || '',
      discountAmount,
    };

    await addLog('info', 'Adding order to database', { userId, variant });
    const newOrder = await addOrder(newOrderData);
    await addLog('info', 'Order created', { orderId: newOrder.id });

    if (paymentMethod === 'cod') {
      await updateOrderStatus(userId, newOrder.id, 'new');
      await decreaseStock(variant, 1);
      if (discountCode) await incrementDiscountUsage(discountCode);
      revalidatePath('/admin');
      revalidatePath('/orders');
      await addEvent('order_placed_cod');
      return { success: true, message: 'Order created successfully!', orderId: newOrder.id };
    }

    await addEvent('order_placed_prepaid_initiated');
    const paymentResponse = await initiatePhonePePayment(newOrder);
    if (paymentResponse.success && paymentResponse.redirectUrl) {
      return { success: true, message: 'Redirecting to payment gateway.', paymentData: { redirectUrl: paymentResponse.redirectUrl } };
    }

    await addLog('error', 'PhonePe payment initiation failed', { orderId: newOrder.id, response: paymentResponse });
    return { success: false, message: paymentResponse.message || 'Could not initiate payment.' };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    await addLog('error', 'placeOrder failed', { error: errorMessage });
    return { success: false, message: `Could not create order: ${errorMessage}` };
  }
}

async function initiatePhonePePayment(order: Order) {
  try {
    const isProd = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true';
    const merchantId = isProd ? process.env.PHONEPE_PROD_MERCHANT_ID : (process.env.PHONEPE_SANDBOX_MERCHANT_ID || process.env.PHONEPE_MERCHANT_ID);
    const saltKey = isProd ? process.env.PHONEPE_PROD_SALT_KEY : process.env.PHONEPE_SALT_KEY;
    const saltIndex = parseInt(isProd ? process.env.PHONEPE_PROD_SALT_INDEX || '1' : process.env.PHONEPE_SALT_INDEX || '1');
    
    const phonepeApiUrl = isProd 
      ? 'https://api.phonepe.com/pg/v1/pay'
      : 'https://api-preprod.phonepe.com/pg/v1/pay';
      
    if (!merchantId || !saltKey) throw new Error('PhonePe merchant credentials are not configured for the current environment.');

    const merchantTransactionId = `MTID-${uuidv4()}`;

    const payload = {
      merchantId: merchantId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: order.userId,
      amount: order.price * 100, // Amount in paise
      redirectUrl: `${process.env.NEXT_PUBLIC_HOST_URL}/orders?orderId=${order.id}`,
      redirectMode: 'POST',
      callbackUrl: `${process.env.NEXT_PUBLIC_HOST_URL}/api/payment/callback`,
      mobileNumber: order.phone,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };
    
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const xVerify = SHA256(base64Payload + '/pg/v1/pay' + saltKey).toString() + '###' + saltIndex;
    
    await addLog('info', 'Initiating PhonePe payment', { url: phonepeApiUrl, transactionId: merchantTransactionId });

    const response = await axios.post(
      phonepeApiUrl,
      { request: base64Payload },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify
        },
      }
    );
    
    if (response.data.success) {
      await addLog('info', 'PhonePe payment initiation successful', { orderId: order.id, transactionId: merchantTransactionId });
      return { success: true, redirectUrl: response.data.data.instrumentResponse.redirectInfo.url };
    }

    await addLog('error', 'PhonePe API error', { orderId: order.id, response: response.data });
    throw new Error(response.data.message || 'PhonePe payment initiation failed.');
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to initiate PhonePe payment';
    await addLog('error', 'initiatePhonePePayment failed', { orderId: order.id, error: errorMessage });
    return { success: false, message: errorMessage };
  }
}

export async function checkPhonePeStatus(merchantTransactionId: string) {
    const isProd = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true';
    const merchantId = isProd ? process.env.PHONEPE_PROD_MERCHANT_ID : (process.env.PHONEPE_SANDBOX_MERCHANT_ID || process.env.PHONEPE_MERCHANT_ID);
    const saltKey = isProd ? process.env.PHONEPE_PROD_SALT_KEY : process.env.PHONEPE_SALT_KEY;
    const saltIndex = parseInt(isProd ? process.env.PHONEPE_PROD_SALT_INDEX || '1' : process.env.PHONEPE_SALT_INDEX || '1');
    const statusApiUrl = isProd 
      ? `https://api.phonepe.com/pg/v1/status/${merchantId}/${merchantTransactionId}`
      : `https://api-preprod.phonepe.com/pg/v1/status/${merchantId}/${merchantTransactionId}`;

    if (!merchantId || !saltKey) throw new Error('PhonePe merchant credentials not configured for status check.');

    const xVerify = SHA256(`/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey).toString() + '###' + saltIndex;

    try {
        await addLog('info', `Checking PhonePe status for transaction: ${merchantTransactionId}`);
        const response = await axios.get(statusApiUrl, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
                'X-MERCHANT-ID': merchantId,
            },
        });
        
        if (response.data.success) {
            await addLog('info', 'PhonePe status check successful', { transactionId: merchantTransactionId, state: response.data.code });
            return { success: true, status: response.data.code, data: response.data.data };
        }
        
        await addLog('warn', 'PhonePe status check failed', { transactionId: merchantTransactionId, response: response.data });
        return { success: false, message: response.data.message };
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to check PhonePe status';
        await addLog('error', 'checkPhonePeStatus failed', { transactionId: merchantTransactionId, error: errorMessage });
        return { success: false, message: errorMessage };
    }
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
    await Promise.all(orders.map(order => updateOrderStatus(order.userId, order.orderId, status)));
    await addLog('info', `Bulk updated ${orders.length} orders to ${status}`);
    revalidatePath('/admin');
    return { success: true, message: `${orders.length} orders updated.` };
  } catch (error: any) {
    await addLog('error', 'Bulk order update failed', { status, count: orders.length, error: error.message });
    return { success: false, message: 'Failed to update orders.' };
  }
}

const ReviewSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  reviewText: z.string().optional(),
  images: z.array(z.string()).optional(),
});

async function uploadImages(images: string[]): Promise<string[]> {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
  const uploadPromises = images.map(image => 
    cloudinary.uploader.upload(image, { folder: 'reviews', transformation: [{ width: 1000, height: 1000, crop: 'limit' }] })
  );
  const results = await Promise.all(uploadPromises);
  return results.map(result => result.secure_url);
}

export async function submitReview(data: z.infer<typeof ReviewSchema>) {
  try {
    const validatedData = ReviewSchema.parse(data);
    const order = await getOrderById(validatedData.userId, validatedData.orderId);
    if (!order) throw new Error('Order not found.');

    const imageUrls = validatedData.images?.length ? await uploadImages(validatedData.images) : [];
    const reviewData = {
      orderId: validatedData.orderId,
      userId: validatedData.userId,
      rating: validatedData.rating,
      title: validatedData.title,
      reviewText: validatedData.reviewText,
      userName: order.name,
      imageUrls,
    };

    await addReviewToStore(reviewData);
    await updateOrderStatus(validatedData.userId, validatedData.orderId, 'delivered', true);
    revalidatePath('/');
    revalidatePath('/orders');
    revalidatePath('/admin');
    return { success: true, message: 'Review submitted successfully.' };
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to submit review';
    await addLog('error', 'submitReview failed', { error: errorMessage });
    return { success: false, message: errorMessage };
  }
}

export async function fetchReviews(): Promise<Review[]> {
  return await getReviewsFromStore();
}

export async function validateDiscountCode(code: string): Promise<{ success: boolean; percent?: number; message: string }> {
  if (!code) return { success: false, message: 'Please enter a code.' };
  const discount = await getDiscount(code);
  if (discount) return { success: true, percent: discount.percent, message: `Code applied! ${discount.percent}% off.` };
  return { success: false, message: 'Invalid or expired discount code.' };
}

export async function createDiscount(code: string, percent: number): Promise<{ success: boolean; message: string }> {
  const result = await addDiscount(code, percent);
  if (result.success) revalidatePath('/admin');
  return result;
}

export async function trackEvent(type: string, metadata?: Record<string, any>): Promise<{ success: boolean }> {
  try {
    await addEvent(type, metadata);
    return { success: true };
  } catch (e) {
    await addLog('error', 'trackEvent failed', { type, error: (e as Error).message });
    return { success: false };
  }
}

export async function fetchAnalytics() {
  return await getAnalytics();
}

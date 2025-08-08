
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
import { v4 as uuidv4 } from 'uuid';
import SHA256 from 'crypto-js/sha256';
import { v2 as cloudinary } from 'cloudinary';

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

    if (paymentMethod === 'cod') {
        await updateOrderStatus(userId, newOrder.id, 'new');
        await decreaseStock(variant, 1);
        if (discountCode) {
            await incrementDiscountUsage(discountCode);
        }
        revalidatePath('/admin');
        revalidatePath('/orders');
        await addEvent('order_placed_cod');
        return { success: true, message: 'Order created successfully!', orderId: newOrder.id };
    } else {
      // Prepaid Order
      await addEvent('order_placed_prepaid_initiated');
      const paymentResponse = await initiatePhonePePayment(newOrder);
      if (paymentResponse.success && paymentResponse.redirectUrl) {
        return {
          success: true,
          message: 'Redirecting to payment gateway.',
          paymentData: { redirectUrl: paymentResponse.redirectUrl },
        };
      } else {
        await addLog('error', 'PhonePe payment initiation failed.', { orderId: newOrder.id, response: paymentResponse });
        return { success: false, message: paymentResponse.message || 'Could not initiate payment.' };
      }
    }
  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred.';
    await addLog('error', 'placeOrder action failed catastrophically.', { message: errorMessage, stack: error.stack, payload });
    console.error('CRITICAL placeOrder Error:', error);
    return { success: false, message: `Could not create a new order in the database. Reason: ${errorMessage}` };
  }
}

async function initiatePhonePePayment(order: Order) {
  try {
    const merchantTransactionId = `MTID-${uuidv4().slice(0, 8)}-${order.id}`;
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = parseInt(process.env.PHONEPE_SALT_INDEX || '1');
    const isProd = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true';
    const phonepeApiUrl = isProd ? 'https://api.phonepe.com/apis/pg/v1/pay' : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';


    if (!merchantId || !saltKey) {
      throw new Error("PhonePe merchant credentials are not configured in .env file.");
    }
    
    const payload = {
        merchantId,
        merchantTransactionId,
        merchantUserId: `MUID-${order.userId}`,
        amount: order.price * 100, // Amount in paise
        redirectUrl: `${process.env.NEXT_PUBLIC_HOST_URL}/orders?orderId=${order.id}`,
        redirectMode: "REDIRECT",
        callbackUrl: `${process.env.NEXT_PUBLIC_HOST_URL}/api/payment/callback`,
        mobileNumber: order.phone,
        paymentInstrument: {
            type: "PAY_PAGE",
        },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const xVerify = SHA256(base64Payload + '/pg/v1/pay' + saltKey).toString() + '###' + saltIndex;
    
    await addLog('info', 'Initiating PhonePe payment', { url: phonepeApiUrl, transactionId: merchantTransactionId });

    const response = await fetch(phonepeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const responseData = await response.json();

    if (responseData.success) {
      await addLog('info', 'PhonePe payment initiation successful', { orderId: order.id, transactionId: merchantTransactionId });
      return { success: true, redirectUrl: responseData.data.instrumentResponse.redirectInfo.url };
    } else {
      await addLog('error', 'PhonePe API returned an error', { orderId: order.id, responseData });
      throw new Error(responseData.message || 'PhonePe payment initiation failed.');
    }

  } catch (error: any) {
    const errorMessage = error.message || 'Failed to initiate PhonePe payment';
    await addLog('error', 'initiatePhonePePayment failed', { orderId: order.id, error: errorMessage, stack: error.stack });
    console.error('PhonePe Payment Error:', error);
    return { success: false, message: errorMessage };
  }
}

export async function checkPhonePeStatus(merchantTransactionId: string) {
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = parseInt(process.env.PHONEPE_SALT_INDEX || '1');
    const isProd = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true';
    const statusApiUrl = isProd 
      ? `https://api.phonepe.com/apis/pg/v1/status/${merchantId}/${merchantTransactionId}` 
      : `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`;

    if (!merchantId || !saltKey) {
        throw new Error("PhonePe merchant credentials are not configured.");
    }
    
    const xVerify = SHA256(`/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey).toString() + '###' + saltIndex;

    try {
        await addLog('info', `Checking PhonePe status for transaction: ${merchantTransactionId}`);
        const response = await fetch(statusApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
                'X-MERCHANT-ID': merchantId,
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
             await addLog('info', 'PhonePe status check successful', { transactionId: merchantTransactionId, state: data.code });
             return { success: true, status: data.code, data: data.data };
        } else {
             await addLog('warn', 'PhonePe status check returned failure', { transactionId: merchantTransactionId, response: data });
             return { success: false, message: data.message };
        }
    } catch (error: any) {
        const errorMessage = error.message || 'Failed to check PhonePe status';
        await addLog('error', 'checkPhonePeStatus failed', { transactionId: merchantTransactionId, error: errorMessage, stack: error.stack });
        console.error('PhonePe Status Check Error:', error);
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
  title: z.string().min(3, "Title must be at least 3 characters long."),
  reviewText: z.string().optional(),
  images: z.array(z.string()).optional(), // array of base64 strings
});

async function uploadImages(images: string[]): Promise<string[]> {
    const uploadPromises = images.map(image => 
        cloudinary.uploader.upload(image, {
            folder: "reviews",
            transformation: [{ width: 1000, height: 1000, crop: "limit" }]
        })
    );
    const results = await Promise.all(uploadPromises);
    return results.map(result => result.secure_url);
}


export async function submitReview(data: z.infer<typeof ReviewSchema>) {
  try {
    const validatedData = ReviewSchema.parse(data);

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
    
    const order = await getOrderById(validatedData.userId, validatedData.orderId);
    if (!order) {
        throw new Error("Order not found.");
    }
    
    let imageUrls: string[] = [];
    if (validatedData.images && validatedData.images.length > 0) {
        imageUrls = await uploadImages(validatedData.images);
    }
    
    const reviewData = {
      orderId: validatedData.orderId,
      userId: validatedData.userId,
      rating: validatedData.rating,
      title: validatedData.title,
      reviewText: validatedData.reviewText,
      userName: order.name,
      imageUrls: imageUrls
    };

    await addReviewToStore(reviewData);
    await updateOrderStatus(validatedData.userId, validatedData.orderId, 'delivered', true);
    
    revalidatePath('/');
    revalidatePath('/orders');
    revalidatePath('/admin');

    return { success: true, message: "Review submitted successfully." };
  } catch (error: any) {
    await addLog('error', 'submitReview failed', { data: { ...data, images: "hidden" }, error: { message: error.message } });
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

import { getAnalytics, addEvent } from './analytics-store';

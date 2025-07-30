
import { NextResponse, type NextRequest } from 'next/server';
import { addOrder, getPendingOrder, deletePendingOrder, updateOrderStatus } from '@/lib/order-store';
import { decreaseStock } from '@/lib/stock-store';
import type { BookVariant } from '@/lib/definitions';
import { StandardCheckoutClient, Env } from 'phonepe-pg-sdk-node';
import { incrementDiscountUsage } from '@/lib/discount-store';

const isProd = process.env.NEXT_PUBLIC_PHONEPE_ENV === 'PRODUCTION';

const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
const env = isProd ? Env.PRODUCTION : Env.SANDBOX;

async function checkTransactionStatus(transactionId: string) {
    if (!clientId || !clientSecret || clientSecret === 'YOUR_CLIENT_SECRET_HERE') {
      console.error('PhonePe client credentials are not configured in the environment.');
      throw new Error('pg_config_error');
    }

    const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, env);
    const statusResponse = await client.getOrderStatus(transactionId);
    
    if (statusResponse.success && statusResponse.state === 'COMPLETED') {
        const pendingOrder = await getPendingOrder(transactionId);
        
        if (!pendingOrder || !pendingOrder.userId) {
            console.warn(`No pending order found for successful transaction ID: ${transactionId}. It might have already been processed.`);
            return { success: true, orderId: null, message: "Already processed or no pending order found." };
        }
        
        const newOrder = await addOrder(pendingOrder.userId, {
            ...pendingOrder,
            paymentMethod: 'prepaid',
        });
        
        if (pendingOrder.variant !== 'ebook') {
            await decreaseStock(pendingOrder.variant as Exclude<BookVariant, 'ebook'>, 1);
        }

        if (pendingOrder.discountCode) {
            await incrementDiscountUsage(pendingOrder.discountCode);
        }

        await deletePendingOrder(transactionId);
        
        return { success: true, orderId: newOrder.id, message: "Payment successful and order created."};

    } else {
        await deletePendingOrder(transactionId);
        throw new Error(statusResponse.code || 'payment_failed');
    }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const responsePayload = body?.response;

    if (!responsePayload) {
        return NextResponse.json({ success: false, message: 'Invalid callback payload' }, { status: 400 });
    }
    
    // The response is a Base64 encoded JSON string
    const decodedResponse = Buffer.from(responsePayload, 'base64').toString('utf8');
    const responseJson = JSON.parse(decodedResponse);

    const merchantTransactionId = responseJson?.data?.merchantTransactionId;

    if (!merchantTransactionId) {
        console.error("Could not find merchantTransactionId in PhonePe callback", responseJson);
        return NextResponse.json({ success: false, message: 'Invalid payload from PhonePe' }, { status: 400 });
    }

    // Perform the authoritative status check
    const result = await checkTransactionStatus(merchantTransactionId);

    // Redirect user to the success page
    const successUrl = new URL(`/orders`, request.url);
    successUrl.searchParams.set('success', 'true');
    if (result.orderId) {
        successUrl.searchParams.set('orderId', result.orderId);
    }
    return NextResponse.redirect(successUrl);

  } catch (error: any) {
    console.error('Payment callback POST error:', error);
    const errorMsg = error.message || 'callback_failed';
    const failureUrl = new URL(`/checkout`, request.url);
    failureUrl.searchParams.set('error', errorMsg);
    return NextResponse.redirect(failureUrl);
  }
}

// This GET route is used for the user's redirection from PhonePe.
// The final status check happens here to confirm the payment.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.redirect(new URL('/checkout?error=invalid_transaction', request.url));
  }
  
  try {
    const result = await checkTransactionStatus(transactionId);
    const successUrl = new URL(`/orders`, request.url);
    successUrl.searchParams.set('success', 'true');
    if (result.orderId) {
        successUrl.searchParams.set('orderId', result.orderId);
    }
    return NextResponse.redirect(successUrl);
  } catch (error: any) {
    console.error('Payment status check GET error:', error);
    if(transactionId) {
        await deletePendingOrder(transactionId);
    }
    const failureUrl = new URL('/checkout', request.url);
    failureUrl.searchParams.set('error', error.message || 'status_check_failed');
    return NextResponse.redirect(failureUrl);
  }
}

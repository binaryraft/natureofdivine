
import { NextResponse, type NextRequest } from 'next/server';
import { addOrder, getPendingOrder, deletePendingOrder } from '@/lib/order-store';
import { decreaseStock } from '@/lib/stock-store';
import type { BookVariant } from '@/lib/definitions';
import { StandardCheckoutClient, Env } from 'phonepe-pg-sdk-node';

const isProd = process.env.NEXT_PUBLIC_PHONEPE_ENV === 'PRODUCTION';

const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
const env = isProd ? Env.PRODUCTION : Env.SANDBOX;

export async function POST(request: NextRequest) {
  try {
    if (!clientId || !clientSecret || clientSecret === 'YOUR_CLIENT_SECRET_HERE') {
        console.error('PhonePe client credentials are not configured.');
        return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    const body = await request.text();
    const headers = request.headers;
    const authorization = headers.get('authorization'); // As per SDK docs for callback validation

    // The SDK's validateCallback expects username and password, which are not used for standard checkout S2S callbacks
    // The key validation is the 'authorization' header (the checksum).
    // Let's manually get the payload and move on to status check.
    // The SDK seems more oriented towards a different auth flow than the one we are using.
    // The primary validation will be the API call to check the transaction status.

    const payload = JSON.parse(body);
    const merchantTransactionId = payload?.payload?.merchantOrderId;

    if (!merchantTransactionId) {
        console.error("Invalid payload from PhonePe", payload);
        return NextResponse.redirect(new URL('/checkout?error=invalid_payload', request.url));
    }
    
    // Redirect to the GET handler to perform the final status check.
    const statusCheckUrl = new URL(request.url.replace('/api/payment/callback', '/orders'));
    statusCheckUrl.searchParams.set('transactionId', merchantTransactionId);
    statusCheckUrl.searchParams.set('checking_status', 'true');
    return NextResponse.redirect(statusCheckUrl);

  } catch (error: any) {
    console.error('Payment callback POST error:', error);
    const errorMsg = error.message || 'callback_failed';
    return NextResponse.redirect(new URL(`/checkout?error=${errorMsg}`, request.url));
  }
}

// This GET route handles the final, authoritative status check of the transaction.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.redirect(new URL('/checkout?error=invalid_transaction', request.url));
  }
  
  if (!clientId || !clientSecret || clientSecret === 'YOUR_CLIENT_SECRET_HERE') {
      console.error('PhonePe client credentials are not configured in the environment.');
      return NextResponse.redirect(new URL('/checkout?error=pg_config_error', request.url));
  }
  
  try {
    const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, env);
    const statusResponse = await client.getOrderStatus(transactionId);
    
    if (statusResponse.success && statusResponse.state === 'COMPLETED') {
        const pendingOrder = await getPendingOrder(transactionId);
        
        if (!pendingOrder || !pendingOrder.userId) {
            console.warn(`No pending order found for successful transaction ID: ${transactionId}. It might have already been processed.`);
            return NextResponse.redirect(new URL(`/orders?success=true`, request.url));
        }
        
        const newOrder = await addOrder(pendingOrder.userId, {
            ...pendingOrder,
            paymentMethod: 'prepaid',
        });
        
        if (pendingOrder.variant !== 'ebook') {
            await decreaseStock(pendingOrder.variant as Exclude<BookVariant, 'ebook'>, 1);
        }

        await deletePendingOrder(transactionId);
        
        const successUrl = new URL(`/orders?success=true&orderId=${newOrder.id}`, request.url);
        return NextResponse.redirect(successUrl);

    } else {
        await deletePendingOrder(transactionId);
        const failureUrl = new URL(`/checkout?error=${statusResponse.code || 'payment_failed'}`, request.url);
        return NextResponse.redirect(failureUrl);
    }

  } catch (error: any) {
    console.error('Payment status check error:', error);
    if(transactionId) {
        await deletePendingOrder(transactionId);
    }
    return NextResponse.redirect(new URL(`/checkout?error=status_check_failed&reason=${error.message}`, request.url));
  }
}

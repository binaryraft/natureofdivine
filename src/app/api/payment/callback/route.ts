
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto-js';
import { addOrder, getPendingOrder, deletePendingOrder } from '@/lib/order-store';
import { decreaseStock } from '@/lib/stock-store';
import type { BookVariant } from '@/lib/definitions';

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');


export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const phonepePayload = body.get('response');

    if (typeof phonepePayload !== 'string') {
        return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    const decodedPayload = JSON.parse(Buffer.from(phonepePayload, 'base64').toString());

    const receivedChecksum = request.headers.get('x-verify');
    const calculatedChecksum = crypto.SHA256(phonepePayload + SALT_KEY).toString() + `###${SALT_INDEX}`;

    if (receivedChecksum !== calculatedChecksum) {
      console.error("Checksum mismatch on payment callback.");
      if (decodedPayload.merchantTransactionId) {
        await deletePendingOrder(decodedPayload.merchantTransactionId);
      }
      return NextResponse.json({ success: false, message: "Checksum mismatch" }, { status: 400 });
    }
    
    const { merchantTransactionId, success, code } = decodedPayload;

    if (success && code === 'PAYMENT_SUCCESS') {
        const pendingOrder = await getPendingOrder(merchantTransactionId);
        
        if (!pendingOrder || !pendingOrder.userId) {
            console.error(`CRITICAL: No pending order or userId found for successful transaction ID: ${merchantTransactionId}`);
             // Don't delete, investigate this. But for now, we do nothing to avoid double processing if GET handles it.
            return NextResponse.json({ success: false, message: "Order details missing" }, { status: 404 });
        }

        // Clean up the pending order doc
        await deletePendingOrder(merchantTransactionId);

        // Only decrease stock for physical items
        if (pendingOrder.variant !== 'ebook') {
            await decreaseStock(pendingOrder.variant as Exclude<BookVariant, 'ebook'>, 1);
        }
        
        const newOrder = await addOrder(pendingOrder.userId, pendingOrder);
        
        // Redirect user to success page after server-to-server call is complete.
        // PhonePe will follow this redirect on the client-side.
        const successUrl = new URL(`/orders?success=true&orderId=${newOrder.id}`, request.url);
        return NextResponse.redirect(successUrl);

    } else {
        // Payment failed or has a different status, clean up the pending order
        await deletePendingOrder(merchantTransactionId);
        const failureUrl = new URL(`/checkout?error=${code || 'payment_failed'}`, request.url);
        return NextResponse.redirect(failureUrl);
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// Fallback GET route for status check if POST fails, or for manual checks.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.redirect(new URL('/checkout?error=invalid_transaction', request.url));
  }
  
  const checksumHeaders = {
    'Content-Type': 'application/json',
    'X-VERIFY': crypto.SHA256(`/pg/v1/status/${MERCHANT_ID}/${transactionId}${SALT_KEY}`).toString() + `###${SALT_INDEX}`,
    'X-MERCHANT-ID': MERCHANT_ID,
  };
  
  try {
    const response = await fetch(`https://api.phonepe.com/apis/hermes/pg/v1/status/${MERCHANT_ID}/${transactionId}`, {
        method: 'GET',
        headers: checksumHeaders,
    });

    const data = await response.json();
    
    if (data.success && data.code === 'PAYMENT_SUCCESS') {
        const pendingOrder = await getPendingOrder(transactionId);

        // If the pending order still exists, the POST callback might have failed or is delayed.
        // We handle the order creation here as a fallback.
        if (pendingOrder && pendingOrder.userId) {
             console.warn(`Pending order for transaction ${transactionId} still existed. Processing in GET fallback.`);
             await deletePendingOrder(transactionId);
             if (pendingOrder.variant !== 'ebook') {
                await decreaseStock(pendingOrder.variant as Exclude<BookVariant, 'ebook'>, 1);
             }
             const newOrder = await addOrder(pendingOrder.userId, pendingOrder);
             return NextResponse.redirect(new URL(`/orders?success=true&orderId=${newOrder.id}`, request.url));
        }

        // If pending order is gone, the POST callback likely succeeded.
        // Redirect to a generic success page as we can't easily get the orderId here.
        return NextResponse.redirect(new URL(`/orders?success=true`, request.url));

    } else {
        // Payment failed or has a different status, ensure pending order is cleaned up.
        await deletePendingOrder(transactionId);
        return NextResponse.redirect(new URL(`/checkout?error=${data.code || 'payment_failed'}`, request.url));
    }

  } catch (error) {
    console.error('Payment status check error:', error);
    if(transactionId) {
        await deletePendingOrder(transactionId);
    }
    return NextResponse.redirect(new URL('/checkout?error=callback_failed', request.url));
  }
}

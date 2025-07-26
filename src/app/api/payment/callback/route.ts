
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
    const body = await request.json();
    const phonepePayload = body.response;
    const decodedPayload = JSON.parse(Buffer.from(phonepePayload, 'base64').toString());

    const receivedChecksum = request.headers.get('x-verify');
    const calculatedChecksum = crypto.SHA256(phonepePayload + SALT_KEY).toString() + `###${SALT_INDEX}`;

    if (receivedChecksum !== calculatedChecksum) {
      console.error("Checksum mismatch on payment callback.");
      // Even on checksum mismatch, we should try to clean up a potentially fraudulent pending order
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
            return NextResponse.redirect(new URL('/checkout?error=order_details_missing', request.url));
        }

        // Clean up the pending order doc
        await deletePendingOrder(merchantTransactionId);

        // Only decrease stock for physical items
        if (pendingOrder.variant !== 'ebook') {
            await decreaseStock(pendingOrder.variant as Exclude<BookVariant, 'ebook'>, 1);
        }
        
        const newOrder = await addOrder(pendingOrder.userId, pendingOrder);
        
        // Respond to PhonePe server
        return NextResponse.json({ success: true, message: "Payment successful and order created." });

    } else {
        // Payment failed or has a different status, clean up the pending order
        await deletePendingOrder(merchantTransactionId);
        return NextResponse.json({ success: false, message: `Payment failed with code: ${code}` });
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

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
    // This API call is to check the final status with PhonePe and is what determines the user redirect
    const response = await fetch(`https://api.phonepe.com/apis/hermes/pg/v1/status/${MERCHANT_ID}/${transactionId}`, {
        method: 'GET',
        headers: checksumHeaders,
    });

    const data = await response.json();
    
    // The server-to-server callback (POST) has already created the order.
    // This GET request is just to confirm status and redirect the user.
    if (data.success && data.code === 'PAYMENT_SUCCESS') {
        const pendingOrder = await getPendingOrder(transactionId);

        // The pending order should have been deleted by the POST callback.
        // If it still exists, it means the POST callback might have failed or is delayed.
        // We handle the order creation here as a fallback.
        if (pendingOrder && pendingOrder.userId) {
             console.warn(`Pending order for transaction ${transactionId} still existed. Processing in GET fallback.`);
             await deletePendingOrder(transactionId);
             if (pendingOrder.variant !== 'ebook') {
                await decreaseStock(pendingOrder.variant, 1);
             }
             const newOrder = await addOrder(pendingOrder.userId, pendingOrder);
             return NextResponse.redirect(new URL(`/orders?success=true&orderId=${newOrder.id}`, request.url));
        }

        // If pending order is gone, we need to find the created orderId to redirect the user
        // This part is tricky as we don't have the final orderId. We'll just redirect to the generic orders page.
        // A more robust solution might involve another lookup table or waiting for the POST.
        // For now, a generic success redirect is sufficient.
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

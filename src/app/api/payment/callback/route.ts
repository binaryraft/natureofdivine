
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto-js';
import { addOrder, getPendingOrder, deletePendingOrder } from '@/lib/order-store';
import { decreaseStock } from '@/lib/stock-store';
import type { BookVariant } from '@/lib/definitions';

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');


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
        
        if (!pendingOrder) {
            console.error(`CRITICAL: No pending order found for successful transaction ID: ${transactionId}`);
            return NextResponse.redirect(new URL('/checkout?error=order_details_missing', request.url));
        }

        // Clean up the pending order doc
        await deletePendingOrder(transactionId);

        if (pendingOrder.variant !== 'ebook') {
            await decreaseStock(pendingOrder.variant, 1);
        }

        const newOrder = await addOrder(pendingOrder);
        
        // Successful order, redirect to the success page.
        return NextResponse.redirect(new URL(`/orders?success=true&orderId=${newOrder.id}`, request.url));

    } else {
        // Payment failed or has a different status, clean up the pending order and redirect
        await deletePendingOrder(transactionId);
        return NextResponse.redirect(new URL(`/checkout?error=${data.code || 'payment_failed'}`, request.url));
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    // Attempt to clean up pending order on failure too
    if(transactionId) {
        await deletePendingOrder(transactionId);
    }
    return NextResponse.redirect(new URL('/checkout?error=callback_failed', request.url));
  }
}


import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto-js';
import { addOrder, getPendingOrder, deletePendingOrder } from '@/lib/order-store';
import { decreaseStock } from '@/lib/stock-store';
import type { BookVariant } from '@/lib/definitions';

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');
const PHONEPE_API_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"


export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const phonepePayload = body.get('response');

    if (typeof phonepePayload !== 'string') {
        console.error("Invalid payload from PhonePe", body);
        return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    const decodedPayload = JSON.parse(Buffer.from(phonepePayload, 'base64').toString());
    const merchantTransactionId = decodedPayload.merchantTransactionId;

    const receivedChecksum = request.headers.get('x-verify');
    const calculatedChecksum = crypto.SHA256(phonepePayload + SALT_KEY).toString() + `###${SALT_INDEX}`;

    if (receivedChecksum !== calculatedChecksum) {
      console.error("Checksum mismatch on payment callback for transaction:", merchantTransactionId);
      if (merchantTransactionId) {
        await deletePendingOrder(merchantTransactionId);
      }
      return NextResponse.json({ success: false, message: "Checksum mismatch" }, { status: 400 });
    }
    
    const { success, code } = decodedPayload;

    if (success && code === 'PAYMENT_SUCCESS') {
        const pendingOrder = await getPendingOrder(merchantTransactionId);
        
        if (!pendingOrder || !pendingOrder.userId) {
            console.error(`CRITICAL: No pending order or userId found for successful transaction ID: ${merchantTransactionId}`);
            return NextResponse.json({ success: false, message: "Order details missing" }, { status: 404 });
        }
        
        const newOrder = await addOrder(pendingOrder.userId, pendingOrder);
        
        if (pendingOrder.variant !== 'ebook') {
            await decreaseStock(pendingOrder.variant as Exclude<BookVariant, 'ebook'>, 1);
        }

        await deletePendingOrder(merchantTransactionId);
        
        const successUrl = new URL(`/orders?success=true&orderId=${newOrder.id}`, request.url);
        return NextResponse.redirect(successUrl);

    } else {
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
  
  const apiEndpoint = `/pg/v1/status/${MERCHANT_ID}/${transactionId}`;
  const checksum = crypto.SHA256(apiEndpoint + SALT_KEY).toString() + `###${SALT_INDEX}`;
  
  const checksumHeaders = {
    'Content-Type': 'application/json',
    'X-VERIFY': checksum,
    'X-MERCHANT-ID': MERCHANT_ID,
  };
  
  try {
    const response = await fetch(`${PHONEPE_API_URL}${apiEndpoint}`, {
        method: 'GET',
        headers: checksumHeaders,
    });

    const data = await response.json();
    
    if (data.success && data.code === 'PAYMENT_SUCCESS') {
        const pendingOrder = await getPendingOrder(transactionId);

        if (pendingOrder && pendingOrder.userId) {
             console.warn(`Pending order for transaction ${transactionId} still existed. Processing in GET fallback.`);
             
             const newOrder = await addOrder(pendingOrder.userId, pendingOrder);
             if (pendingOrder.variant !== 'ebook') {
                await decreaseStock(pendingOrder.variant as Exclude<BookVariant, 'ebook'>, 1);
             }
             await deletePendingOrder(transactionId);

             return NextResponse.redirect(new URL(`/orders?success=true&orderId=${newOrder.id}`, request.url));
        }

        return NextResponse.redirect(new URL(`/orders?success=true`, request.url));

    } else {
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

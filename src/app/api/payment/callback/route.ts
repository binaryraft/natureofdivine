
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto-js';
import { addOrder, getPendingOrder, deletePendingOrder } from '@/lib/order-store';
import { decreaseStock } from '@/lib/stock-store';
import type { BookVariant } from '@/lib/definitions';

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');
const PHONEPE_API_URL = "https://api.phonepe.com/apis/pg"


// This POST route is the server-to-server callback from PhonePe.
// Its only job is to verify the checksum and redirect the user to the GET handler for final status check.
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const phonepePayload = body.get('response');

    if (typeof phonepePayload !== 'string') {
        console.error("Invalid payload from PhonePe", body);
        return NextResponse.redirect(new URL('/checkout?error=invalid_payload', request.url));
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
      return NextResponse.redirect(new URL('/checkout?error=checksum_mismatch', request.url));
    }
    
    // Checksum is valid. Now redirect to the GET handler to perform the final status check.
    const statusCheckUrl = new URL(request.url.replace('/api/payment/callback', '/orders'));
    statusCheckUrl.searchParams.set('transactionId', merchantTransactionId);
    statusCheckUrl.searchParams.set('checking_status', 'true');
    return NextResponse.redirect(statusCheckUrl);

  } catch (error) {
    console.error('Payment callback POST error:', error);
    return NextResponse.redirect(new URL('/checkout?error=callback_failed', request.url));
  }
}

// This GET route handles the final, authoritative status check of the transaction.
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
        
        if (!pendingOrder || !pendingOrder.userId) {
            // This can happen if the user refreshes the page after the order is already processed.
            // Check if an order with this transactionId already exists, if not, it's an issue.
            console.warn(`No pending order found for successful transaction ID: ${transactionId}. It might have already been processed.`);
            // Redirect to a generic success page if we can't find the specific orderId.
             return NextResponse.redirect(new URL(`/orders?success=true`, request.url));
        }
        
        const newOrder = await addOrder(pendingOrder.userId, pendingOrder);
        
        if (pendingOrder.variant !== 'ebook') {
            await decreaseStock(pendingOrder.variant as Exclude<BookVariant, 'ebook'>, 1);
        }

        // IMPORTANT: Clean up the pending order after processing.
        await deletePendingOrder(transactionId);
        
        const successUrl = new URL(`/orders?success=true&orderId=${newOrder.id}`, request.url);
        return NextResponse.redirect(successUrl);

    } else {
        // Payment was not successful, clean up the pending order.
        await deletePendingOrder(transactionId);
        const failureUrl = new URL(`/checkout?error=${data.code || 'payment_failed'}`, request.url);
        return NextResponse.redirect(failureUrl);
    }

  } catch (error) {
    console.error('Payment status check error:', error);
    if(transactionId) {
        // Clean up on any unexpected error.
        await deletePendingOrder(transactionId);
    }
    return NextResponse.redirect(new URL('/checkout?error=status_check_failed', request.url));
  }
}

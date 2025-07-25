
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto-js';
import { addOrder } from '@/lib/order-store';
import { decreaseStock } from '@/lib/stock-store';
import { fetchLocationAndPrice } from '@/lib/fetch-location-price';
import type { BookVariant } from '@/lib/definitions';
import { cookies } from 'next/headers';


const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.redirect(new URL('/checkout?error=invalid_transaction', request.url));
  }

  const checksum = crypto.SHA256(`/pg/v1/status/${MERCHANT_ID}/${transactionId}${SALT_KEY}`).toString() + `###${SALT_INDEX}`;
  
  try {
    const response = await fetch(`https://api.phonepe.com/apis/hermes/pg/v1/status/${MERCHANT_ID}/${transactionId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': MERCHANT_ID,
        },
    });

    const data = await response.json();
    
    if (data.success && data.code === 'PAYMENT_SUCCESS') {
        const orderDetailsCookie = cookies().get('orderDetails');

        if (!orderDetailsCookie) {
             return NextResponse.redirect(new URL('/checkout?error=order_details_missing', request.url));
        }

        let orderData;
        try {
            orderData = JSON.parse(orderDetailsCookie.value);
        } catch(e) {
            return NextResponse.redirect(new URL('/checkout?error=invalid_order_data', request.url));
        }


        const prices = await fetchLocationAndPrice();
        const price = prices[orderData.variant as BookVariant];

        if (orderData.variant !== 'ebook') {
            await decreaseStock(orderData.variant, 1);
        }

        const newOrder = await addOrder({
            ...orderData,
            price: price,
            paymentMethod: 'prepaid',
        });
        
        // Clear the cookie
        cookies().delete('orderDetails');

        return NextResponse.redirect(new URL(`/orders?success=true&orderId=${newOrder.id}`, request.url));

    } else {
        // Clear the cookie even on failure
        cookies().delete('orderDetails');
        return NextResponse.redirect(new URL(`/checkout?error=${data.code || 'payment_failed'}`, request.url));
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(new URL('/checkout?error=callback_failed', request.url));
  }
}

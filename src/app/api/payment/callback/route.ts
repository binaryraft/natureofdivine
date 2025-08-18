
import { NextRequest, NextResponse } from 'next/server';
import { addLog } from '@/lib/log-store';
import { updateOrderPaymentStatus, getOrderByTransactionId } from '@/lib/order-store';
import { checkPhonePeStatus } from '@/lib/actions';
import SHA256 from 'crypto-js/sha256';

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);
        const base64Response = body.response;
        
        await addLog('info', 'PhonePe callback received', { base64Response: base64Response.substring(0, 50) + '...' });
        
        const saltKey = process.env.PHONEPE_SALT_KEY!;
        const saltIndex = parseInt(process.env.PHONEPE_SALT_INDEX || '1');

        const receivedHeader = req.headers.get('x-verify');
        const calculatedHeader = SHA256(base64Response + saltKey).toString() + '###' + saltIndex;
        
        if (receivedHeader !== calculatedHeader) {
            await addLog('error', 'PhonePe callback checksum mismatch.', { receivedHeader, calculatedHeader });
            return NextResponse.json({ error: 'Checksum mismatch' }, { status: 400 });
        }
        
        const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString());
        await addLog('info', 'PhonePe callback decoded', { data: decodedResponse });

        const { merchantTransactionId, code: paymentState } = decodedResponse.data;

        // Use the merchantTransactionId to find our internal order.
        const order = await getOrderByTransactionId(merchantTransactionId);
        
        if (!order) {
            await addLog('error', 'Could not find order for merchantTransactionId', { merchantTransactionId });
            // Acknowledge the callback so PhonePe doesn't retry, but log an error.
            return NextResponse.json({ success: true, message: "Order not found, but callback acknowledged." }, { status: 200 });
        }
        
        const orderId = order.id;
        const statusCheck = await checkPhonePeStatus(merchantTransactionId);

        if (statusCheck.success && statusCheck.status === 'PAYMENT_SUCCESS') {
            await updateOrderPaymentStatus(orderId, 'SUCCESS', statusCheck.data);
        } else {
            await updateOrderPaymentStatus(orderId, 'FAILURE', statusCheck.data || { reason: statusCheck.message });
        }
        
        // Redirect user to the orders page.
        const redirectUrl = new URL('/orders', req.url);
        redirectUrl.searchParams.set('payment_status', paymentState);
        redirectUrl.searchParams.set('orderId', orderId);

        return NextResponse.redirect(redirectUrl);

    } catch (error: any) {
        await addLog('error', 'PhonePe callback processing failed', { message: error.message, stack: error.stack });
        return NextResponse.json({ error: 'Failed to process callback' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
  // This is a fallback handler in case PhonePe redirects with GET
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  
  if (orderId) {
    const redirectUrl = new URL('/orders', req.url);
    redirectUrl.searchParams.set('orderId', orderId);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL('/orders', req.url));
}

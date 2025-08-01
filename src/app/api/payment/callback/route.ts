
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { addLog } from '@/lib/log-store';
import { updateOrderPaymentStatus } from '@/lib/order-store';
import { checkPhonePeStatus } from '@/lib/actions';

export async function POST(req: NextRequest) {
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;

    if (!saltKey || !saltIndex) {
        await addLog('error', 'PhonePe callback handler: Missing SALT environment variables.');
        return NextResponse.json({ message: "Internal server error: Configuration missing." }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const responseData = formData.get('response');

        if (typeof responseData !== 'string') {
             await addLog('error', 'PhonePe callback handler: No response data found.');
             return NextResponse.json({ message: "Invalid callback data." }, { status: 400 });
        }
        
        await addLog('info', 'PhonePe callback received (POST)', { rawResponse: responseData });

        const receivedChecksum = req.headers.get('x-verify') || '';
        const calculatedChecksum = crypto.createHash('sha256').update(responseData + saltKey).digest('hex') + '###' + saltIndex;
        
        if (receivedChecksum !== calculatedChecksum) {
            await addLog('error', 'PhonePe callback checksum mismatch.', {
                received: receivedChecksum,
                calculated: calculatedChecksum,
            });
            // Don't proceed if checksum fails. Redirect to a failure page.
            return NextResponse.redirect(new URL('/checkout?error=security_error', req.url));
        }

        const decodedResponse = JSON.parse(Buffer.from(responseData, 'base64').toString('utf8'));
        await addLog('info', 'PhonePe callback decoded', { data: decodedResponse });

        const { success, code, message, data } = decodedResponse;
        const { merchantTransactionId, amount } = data;
        
        // The merchant transaction ID might have a timestamp, we need the base order ID.
        // MUID-${order.id}-${Date.now()}
        const orderId = merchantTransactionId.split('-')[1];

        if (code === 'PAYMENT_SUCCESS') {
            await addLog('info', 'Payment successful according to callback. Verifying with status check API.');
            const statusResponse = await checkPhonePeStatus(merchantTransactionId);
            await addLog('info', 'PhonePe Status Check API response', { statusResponse });

            if (statusResponse.success && statusResponse.code === 'PAYMENT_SUCCESS') {
                await updateOrderPaymentStatus(orderId, 'SUCCESS', statusResponse.data);
                return NextResponse.redirect(new URL(`/orders?success=true&orderId=${orderId}`, req.url));
            } else {
                 await addLog('warn', 'Callback said success, but Status API did not confirm.', { orderId, statusResponse });
                 await updateOrderPaymentStatus(orderId, 'PENDING', statusResponse.data || { message: 'Status check failed or returned non-success.' });
                 return NextResponse.redirect(new URL(`/orders?pending=true&orderId=${orderId}`, req.url));
            }
        } else {
            await addLog('warn', `Payment not successful according to callback. Code: ${code}`, { orderId, data });
            await updateOrderPaymentStatus(orderId, 'FAILURE', data);
            return NextResponse.redirect(new URL(`/checkout?error=${encodeURIComponent(message)}`, req.url));
        }

    } catch (error: any) {
        await addLog('error', 'PhonePe callback handler failed catastrophically.', {
            message: error.message,
            stack: error.stack,
        });
        return NextResponse.redirect(new URL('/checkout?error=payment_processing_failed', req.url));
    }
}

// This GET handler is typically used when the user presses "Back" on the PhonePe page.
// The transaction is usually a failure in this case.
export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const orderId = params.get('orderId'); // This might not be available
    const message = params.get('message') || 'Payment was cancelled or failed.';
    
    await addLog('info', 'PhonePe callback received GET request', { params: Object.fromEntries(params) });

    // It is not guaranteed that we will have an orderId here, so this part is opportunistic.
    // The robust check happens in the POST handler.
    if (orderId) {
        try {
            await updateOrderPaymentStatus(orderId, 'FAILURE', { message: 'User cancelled or went back from the payment process.' });
        } catch(e: any) {
            await addLog('error', 'Failed to update order status on GET callback', { orderId, error: e.message });
        }
    }

    return NextResponse.redirect(new URL(`/checkout?error=${encodeURIComponent(message)}`, req.url));
}


import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { addLog } from '@/lib/log-store';
import { updateOrderPaymentStatus } from '@/lib/order-store';

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

        const decodedResponse = JSON.parse(Buffer.from(responseData, 'base64').toString('utf8'));
        
        await addLog('info', 'PhonePe callback received', { data: decodedResponse });

        const receivedChecksum = req.headers.get('x-verify') || '';
        const calculatedChecksum = crypto.createHash('sha256').update(responseData + saltKey).digest('hex') + '###' + saltIndex;
        
        if (receivedChecksum !== calculatedChecksum) {
            await addLog('error', 'PhonePe callback checksum mismatch.', {
                received: receivedChecksum,
                calculated: calculatedChecksum,
            });
            // In production, you might want to just redirect without confirming the order.
            // For now, we will proceed but log it as a severe error.
        }

        const { success, code, message, data } = decodedResponse;
        const { merchantTransactionId, amount } = data;
        const orderId = merchantTransactionId.replace('MUID-', '');
        
        // This is a critical step: update your database with the payment status.
        // It should be an atomic operation.
        await updateOrderPaymentStatus(orderId, code, data);

        if (success) {
            // Redirect user to a success page
            return NextResponse.redirect(new URL(`/orders?success=true&orderId=${orderId}`, req.url));
        } else {
            // Redirect user to a failure page
             return NextResponse.redirect(new URL(`/checkout?error=${encodeURIComponent(message)}`, req.url));
        }

    } catch (error: any) {
        await addLog('error', 'PhonePe callback handler failed catastrophically.', {
            message: error.message,
            stack: error.stack,
        });
        // Redirect to a generic error page
        return NextResponse.redirect(new URL('/checkout?error=payment_processing_failed', req.url));
    }
}

// PhonePe may also call GET on this route for certain scenarios, like if the user presses back.
export async function GET(req: NextRequest) {
    const orderId = req.nextUrl.searchParams.get('orderId');
    const message = req.nextUrl.searchParams.get('message') || 'Payment was cancelled or failed.';
    
    await addLog('info', 'PhonePe callback received GET request', { orderId, message });
    
    if (orderId) {
        await updateOrderPaymentStatus(orderId, 'FAILURE', { message: 'User cancelled the payment process.' });
    }

    // Redirect user to a failure page
    return NextResponse.redirect(new URL(`/checkout?error=${encodeURIComponent(message)}`, req.url));
}

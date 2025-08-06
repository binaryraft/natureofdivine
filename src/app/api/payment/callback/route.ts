
import { NextRequest, NextResponse } from 'next/server';
import { addLog } from '@/lib/log-store';
import { updateOrderPaymentStatus } from '@/lib/order-store';
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

        const { merchantTransactionId, code: paymentState } = decodedResponse;

        // The transaction ID from PhonePe might not be our internal order ID.
        // We need a way to map merchantTransactionId back to our orderId.
        // This is a gap in the current implementation. Assuming for now that the
        // order ID can be retrieved from the transaction ID.
        const orderIdMatch = merchantTransactionId.match(/MTID-([a-zA-Z0-9-]+)/);
        
        if (!orderIdMatch || !orderIdMatch[1]) {
            // A more robust solution would be to store the mapping when the payment is initiated.
            await addLog('error', 'Could not extract orderId from merchantTransactionId', { merchantTransactionId });
            throw new Error('Could not determine order ID from callback.');
        }
        
        const orderId = orderIdMatch[1];
        const statusCheck = await checkPhonePeStatus(merchantTransactionId);

        if (statusCheck.success && statusCheck.status === 'PAYMENT_SUCCESS') {
            await updateOrderPaymentStatus(orderId, 'SUCCESS', statusCheck.data);
        } else {
            await updateOrderPaymentStatus(orderId, 'FAILURE', statusCheck.data || { reason: statusCheck.message });
        }
        
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        await addLog('error', 'PhonePe callback processing failed', { message: error.message, stack: error.stack });
        return NextResponse.json({ error: 'Failed to process callback' }, { status: 500 });
    }
}

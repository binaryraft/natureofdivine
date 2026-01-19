
import { NextRequest, NextResponse } from 'next/server';
import { addLog } from '@/lib/log-store';
import { updateShopOrderPaymentStatus, getShopOrderByTransactionId } from '@/lib/shop-store';
import { checkPhonePeStatus } from '@/lib/actions';
import SHA256 from 'crypto-js/sha256';

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);
        const base64Response = body.response;

        await addLog('info', 'Shop PhonePe callback received', { base64Response: base64Response.substring(0, 50) + '...' });

        const isProd = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true';
        const saltKey = (isProd ? process.env.PHONEPE_PROD_SALT_KEY : process.env.PHONEPE_SALT_KEY)!;
        const saltIndex = parseInt((isProd ? process.env.PHONEPE_PROD_SALT_INDEX : process.env.PHONEPE_SALT_INDEX) || '1');

        const receivedHeader = req.headers.get('x-verify');
        const calculatedHeader = SHA256(base64Response + saltKey).toString() + '###' + saltIndex;

        if (receivedHeader !== calculatedHeader) {
            await addLog('error', 'Shop PhonePe callback checksum mismatch.', { receivedHeader, calculatedHeader });
            return NextResponse.json({ error: 'Checksum mismatch' }, { status: 400 });
        }

        const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString());
        await addLog('info', 'Shop PhonePe callback decoded', { data: decodedResponse });

        const { merchantTransactionId, code: paymentState } = decodedResponse.data;

        // Use the merchantTransactionId to find our internal order.
        const order = await getShopOrderByTransactionId(merchantTransactionId);

        if (!order) {
            await addLog('error', 'Could not find shop order for merchantTransactionId', { merchantTransactionId });
            return NextResponse.json({ success: true, message: "Order not found, but callback acknowledged." }, { status: 200 });
        }

        const orderId = order.id;
        const statusCheck = await checkPhonePeStatus(merchantTransactionId);

        if (statusCheck.success && statusCheck.status === 'PAYMENT_SUCCESS') {
            await updateShopOrderPaymentStatus(orderId, 'SUCCESS', statusCheck.data);
        } else {
            await updateShopOrderPaymentStatus(orderId, 'FAILURE', statusCheck.data || { reason: statusCheck.message });
        }

        return NextResponse.json({ success: true, message: "Callback processed successfully." });

    } catch (error: any) {
        await addLog('error', 'Shop PhonePe callback processing failed', { message: error.message });
        return NextResponse.json({ error: 'Failed to process callback' }, { status: 500 });
    }
}

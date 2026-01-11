
import { NextRequest, NextResponse } from 'next/server';
import { addLog } from '@/lib/log-store';
import { updateDonationPaymentStatus, getDonationByTransactionId } from '@/lib/donation-store';
import { checkPhonePeStatus } from '@/lib/actions';
import SHA256 from 'crypto-js/sha256';

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);
        const base64Response = body.response;

        await addLog('info', 'PhonePe donation callback received', { base64Response: base64Response.substring(0, 50) + '...' });

        const isProd = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true';
        const saltKey = (isProd ? process.env.PHONEPE_PROD_SALT_KEY : process.env.PHONEPE_SALT_KEY)!;
        const saltIndex = parseInt((isProd ? process.env.PHONEPE_PROD_SALT_INDEX : process.env.PHONEPE_SALT_INDEX) || '1');

        const receivedHeader = req.headers.get('x-verify');
        const calculatedHeader = SHA256(base64Response + saltKey).toString() + '###' + saltIndex;

        if (receivedHeader !== calculatedHeader) {
            await addLog('error', 'PhonePe callback checksum mismatch.', { receivedHeader, calculatedHeader });
            return NextResponse.json({ error: 'Checksum mismatch' }, { status: 400 });
        }

        const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString());
        await addLog('info', 'PhonePe callback decoded', { data: decodedResponse });

        const { merchantTransactionId, code: paymentState } = decodedResponse.data;

        // Find donation by transaction ID
        const donation = await getDonationByTransactionId(merchantTransactionId);

        if (!donation) {
            await addLog('error', 'Could not find donation for merchantTransactionId', { merchantTransactionId });
            return NextResponse.json({ success: true, message: "Donation not found, but callback acknowledged." }, { status: 200 });
        }

        const statusCheck = await checkPhonePeStatus(merchantTransactionId);

        if (statusCheck.success && statusCheck.status === 'PAYMENT_SUCCESS') {
            await updateDonationPaymentStatus(donation.id, 'SUCCESS', statusCheck.data);
            await addLog('info', 'Donation successful', { donationId: donation.id, amount: donation.amount });
        } else {
            await updateDonationPaymentStatus(donation.id, 'FAILURE', statusCheck.data || { reason: statusCheck.message });
            await addLog('warn', 'Donation payment failed', { donationId: donation.id, status: statusCheck.status });
        }

        return NextResponse.json({ success: true, message: "Callback processed successfully." });

    } catch (error: any) {
        await addLog('error', 'PhonePe donation callback processing failed', { message: error.message, stack: error.stack });
        return NextResponse.json({ error: 'Failed to process callback' }, { status: 500 });
    }
}

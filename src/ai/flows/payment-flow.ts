
'use server';
/**
 * @fileOverview A PhonePe payment processing flow.
 * - processPayment - A function that initiates a payment with PhonePe.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import crypto from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { fetchLocationAndPrice } from '@/lib/fetch-location-price';
import type { BookVariant } from '@/lib/definitions';

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');
const HOST_URL = process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:9002';

const PaymentInputSchema = z.object({
  userId: z.string().optional(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  variant: z.enum(['paperback', 'hardcover', 'ebook']),
});
export type PaymentInput = z.infer<typeof PaymentInputSchema>;

const PaymentOutputSchema = z.object({
  redirectUrl: z.string(),
});
export type PaymentOutput = z.infer<typeof PaymentOutputSchema>;

export async function processPayment(input: PaymentInput): Promise<PaymentOutput> {
  return paymentFlow(input);
}

const paymentFlow = ai.defineFlow(
  {
    name: 'paymentFlow',
    inputSchema: PaymentInputSchema,
    outputSchema: PaymentOutputSchema,
  },
  async (input) => {
    const prices = await fetchLocationAndPrice();
    const price = prices[input.variant as BookVariant];
    const amount = price * 100; // Amount in paise

    const merchantTransactionId = `M${Date.now()}`;
    const userId = input.userId || `U${uuidv4()}`;

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: amount,
      redirectUrl: `${HOST_URL}/api/payment/callback?transactionId=${merchantTransactionId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${HOST_URL}/api/payment/callback?transactionId=${merchantTransactionId}`,
      mobileNumber: input.phone,
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = crypto.SHA256(`${base64Payload}/pg/v1/pay${SALT_KEY}`).toString() + `###${SALT_INDEX}`;

    const response = await fetch('https://api.phonepe.com/apis/hermes/pg/v1/pay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
        },
        body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();
    
    if (!data.success || !data.data.instrumentResponse.redirectInfo.url) {
        throw new Error('Failed to initiate payment with PhonePe.');
    }
    
    // We should probably store the pending order details here before redirecting.
    // For simplicity, we'll pass them through the callback for now, but a real-world app would use a DB.

    return {
      redirectUrl: data.data.instrumentResponse.redirectInfo.url,
    };
  }
);

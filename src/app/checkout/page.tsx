
import type { Metadata } from 'next';
import { CheckoutClient } from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: 'Complete your order for the book "Nature of the Divine" by Alfas B. Enter your details for shipping.',
  robots: { index: false, follow: true }, // No-index checkout page
};

export default function CheckoutPage() {
    return <CheckoutClient />;
}


import type { Metadata } from 'next';
import { CheckoutClient } from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Secure Checkout - Order Your Spiritual Book | Nature of the Divine',
  description: 'Complete your direct order for a signed copy of "Nature of the Divine," the spiritual book that teaches you how to know God. Fill out your shipping and payment details on our secure checkout page.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: '/checkout',
  },
};

export default function CheckoutPage() {
    return (
        <CheckoutClient />
    );
}

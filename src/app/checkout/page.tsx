
import type { Metadata } from 'next';
import { CheckoutClient } from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Secure Checkout | Nature of the Divine',
  description: 'Complete your order for "Nature of the Divine." Fill out your shipping and payment details on our secure, streamlined checkout page to get your copy of this transformative philosophical work by Alfas B.',
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


import type { Metadata } from 'next';
import { CheckoutClient } from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: 'Complete your order for the book "Nature of the Divine." Enter your shipping and payment details on our secure checkout page to receive your copy of this transformative philosophical work by Alfas B.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: '/checkout',
  },
};

export default function CheckoutPage() {
    return <CheckoutClient />;
}

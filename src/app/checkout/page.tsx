
import type { Metadata } from 'next';
import { CheckoutClient } from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Secure Checkout - Order Signed Copy | Nature of the Divine',
  description: 'Complete your direct order for a signed copy of "Nature of the Divine" by Alfas B. Fill out your shipping and payment details on our secure, streamlined checkout page to get your author-signed book delivered.',
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

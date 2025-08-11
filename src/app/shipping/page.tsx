
import type { Metadata } from 'next';
import { ShippingClient } from './ShippingClient';

export const metadata: Metadata = {
  title: 'Shipping Policy | Nature of the Divine',
  description: 'Review the shipping policy for the book "Nature of the Divine." This page contains detailed information about our shipping coverage, order processing times, delivery estimates, tracking, and contact details.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/shipping',
  },
};

export default function ShippingPage() {
  return <ShippingClient />;
}

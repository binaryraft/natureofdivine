
import type { Metadata } from 'next';
import { ShippingClient } from './ShippingClient';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Find out about the shipping policy for "Nature of the Divine", including coverage, processing times, and tracking information.',
};

export default function ShippingPage() {
  return <ShippingClient />;
}

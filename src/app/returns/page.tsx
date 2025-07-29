
import type { Metadata } from 'next';
import { ReturnsClient } from './ReturnsClient';

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description: 'Learn about the return and refund policy for "Nature of the Divine". Understand the conditions for returns, refunds, and cancellations.',
};

export default function ReturnsPage() {
  return <ReturnsClient />;
}

    
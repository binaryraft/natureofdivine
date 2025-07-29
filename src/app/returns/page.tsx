
import type { Metadata } from 'next';
import { ReturnsClient } from './ReturnsClient';

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description: 'Learn about the return, refund, and cancellation policy for the book "Nature of the Divine." Understand the conditions and procedures for returning a product and receiving a refund for your purchase.',
  alternates: {
    canonical: '/returns',
  },
};

export default function ReturnsPage() {
  return <ReturnsClient />;
}

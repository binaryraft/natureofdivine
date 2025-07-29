
import type { Metadata } from 'next';
import { ReturnsClient } from './ReturnsClient';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Nature of the Divine',
  description: 'Learn about the return, refund, and cancellation policies for the book "Nature of the Divine." Understand the conditions and procedures for returning a product and receiving a full refund for your purchase.',
  alternates: {
    canonical: '/returns',
  },
};

export default function ReturnsPage() {
  return <ReturnsClient />;
}

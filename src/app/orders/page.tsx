
import type { Metadata } from 'next';
import { OrdersClient } from './OrdersClient';

export const metadata: Metadata = {
  title: 'My Orders & History | Nature of the Divine',
  description: 'View your complete order history for "Nature of the Divine." Track the current status of your purchases, from processing to delivery, and access details for all your past orders on your personal dashboard.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/orders',
  },
};

export default function OrdersPage() {
    return <OrdersClient />;
}

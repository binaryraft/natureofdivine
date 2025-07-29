
import type { Metadata } from 'next';
import { OrdersClient } from './OrdersClient';

export const metadata: Metadata = {
  title: 'My Orders',
  description: 'View your order history and track the status of your purchases for "Nature of the Divine".',
  robots: { index: false, follow: true },
};

export default function OrdersPage() {
    return <OrdersClient />;
}

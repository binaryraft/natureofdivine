
import { AdminDashboard } from "./AdminDashboard";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin panel to manage all orders for the book "Nature of the Divine". View new orders, update statuses to dispatched or delivered, and manage book stock levels.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: '/admin',
  },
};

export default function AdminPage() {
    return <AdminDashboard />;
}

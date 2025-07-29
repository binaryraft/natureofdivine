
import { AdminDashboard } from "./AdminDashboard";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Secure admin panel for "Nature of the Divine." Manage all book orders, update shipping statuses from new to dispatched or delivered, and monitor stock levels for paperback and hardcover editions.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: '/admin',
  },
};

export default function AdminPage() {
    return <AdminDashboard />;
}

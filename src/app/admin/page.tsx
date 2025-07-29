
import { AdminDashboard } from "./AdminDashboard";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Nature of the Divine',
  description: 'Manage orders for the book "Nature of the Divine".',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
    return <AdminDashboard />;
}


import { AdminDashboard } from "./AdminDashboard";

export const metadata = {
  title: 'Admin Dashboard | Nature of the Divine',
  description: 'Manage orders for the book "Nature of the Divine".',
};

export default function AdminPage() {
    return (
        <div className="container mx-auto py-12 md:py-16">
            <AdminDashboard />
        </div>
    )
}

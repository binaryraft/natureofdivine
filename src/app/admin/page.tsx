
import { AdminDashboard } from "./AdminDashboard";
import { getStock } from "@/lib/stock-store";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: 'Admin Dashboard | Nature of the Divine',
  description: 'Manage orders for the book "Nature of the Divine".',
};

async function AdminPageContent() {
    const stock = await getStock();
    return <AdminDashboard initialStock={stock} />;
}

export default function AdminPage() {
    return (
        <div className="container mx-auto py-12 md:py-16">
            <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
                <AdminPageContent />
            </Suspense>
        </div>
    )
}

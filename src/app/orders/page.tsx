
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserOrders } from '@/lib/actions';
import { Order, OrderStatus } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PackageSearch, XCircle, CheckCircle, Truck, ShoppingCart, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const statusInfo: Record<OrderStatus, { label: string; Icon: React.ElementType; color: string }> = {
  new: { label: 'Order Placed', Icon: ShoppingCart, color: 'bg-blue-500' },
  dispatched: { label: 'Dispatched', Icon: Truck, color: 'bg-yellow-500' },
  delivered: { label: 'Delivered', Icon: CheckCircle, color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', Icon: XCircle, color: 'bg-red-500' },
};

function OrderItem({ order }: { order: Order }) {
  const { Icon, color, label } = statusInfo[order.status];
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base font-medium">Order ID: <span className="font-mono text-sm">{order.id}</span></CardTitle>
            <Badge variant="secondary" className={cn("capitalize text-white w-fit", color)}>
                <Icon className="mr-2 h-4 w-4" />
                {label}
            </Badge>
        </div>
        <p className="text-sm text-muted-foreground pt-1">
          Ordered on: {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
         <div className="text-sm">
            <p className="font-medium">Shipping to: {order.name}</p>
            <p className="text-muted-foreground">{order.address}, {order.city}, {order.state} {order.pinCode}</p>
         </div>
         <div className="text-sm sm:text-right">
             <p className="font-medium">Item</p>
             <p className="text-muted-foreground capitalize">{order.variant} (₹{order.price})</p>
         </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/orders');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      startTransition(async () => {
        const userOrders = await fetchUserOrders(user.uid);
        setOrders(userOrders);
      });
    }
  }, [user]);

  if (authLoading || isPending) {
    return (
      <div className="container mx-auto py-12 md:py-24 max-w-4xl text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 md:py-16 max-w-4xl">
      <div className="space-y-6">
        <div className="space-y-2">
            <h1 className="text-3xl font-headline flex items-center gap-2"><Package className="h-8 w-8"/> My Orders</h1>
            <p className="text-muted-foreground">View the history and status of all your orders.</p>
        </div>
        
        {orders.length === 0 ? (
          <Alert>
            <PackageSearch className="h-4 w-4" />
            <AlertTitle>No Orders Found</AlertTitle>
            <AlertDescription>
                You haven't placed any orders yet.
                <Button asChild variant="link" className="px-1">
                    <Link href="/checkout">Place your first order!</Link>
                </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderItem key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

    
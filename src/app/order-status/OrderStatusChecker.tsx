'use client';

import { useState } from 'react';
import { fetchOrderStatus } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Order, type OrderStatus } from '@/lib/definitions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PackageSearch, XCircle, CheckCircle, Truck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const statusSteps: Record<OrderStatus, { step: number; label: string; Icon: React.ElementType }> = {
  'new': { step: 1, label: 'Order Placed', Icon: CheckCircle },
  'dispatched': { step: 2, label: 'Dispatched', Icon: Truck },
  'delivered': { step: 3, label: 'Delivered', Icon: CheckCircle },
  'cancelled': { step: 0, label: 'Cancelled', Icon: XCircle },
};

export function OrderStatusChecker() {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setOrder(null);
    setSearched(true);
    
    const formData = new FormData(event.currentTarget);
    const orderId = formData.get('orderId') as string;

    if (!orderId) {
      setError('Please enter an Order ID.');
      setIsLoading(false);
      return;
    }

    try {
        const result = await fetchOrderStatus(orderId.trim());
        if (result) {
          setOrder(result);
        } else {
          setError(`Order with ID "${orderId}" not found.`);
        }
    } catch (e) {
        setError('Could not fetch order status. Please try again later.');
    } finally {
        setIsLoading(false);
    }
  };

  const currentStep = order ? statusSteps[order.status].step : 0;
  const progressValue = order?.status === 'cancelled' ? 0 : (currentStep / 3) * 100;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-grow space-y-2">
          <Label htmlFor="orderId" className="sr-only">Order ID</Label>
          <Input id="orderId" name="orderId" placeholder="e.g., ORD-12345" required />
        </div>
        <Button type="submit" disabled={isLoading} className="self-end">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PackageSearch className="mr-2 h-4 w-4" />
          )}
          Track
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {order && (
        <div className="pt-4">
            <h3 className="text-lg font-semibold">Order Details</h3>
            <p className="text-sm text-muted-foreground">Order ID: <span className="font-mono">{order.id}</span></p>
            <p className="text-sm text-muted-foreground">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
            <div className="mt-6">
                <h4 className="font-semibold mb-2">Status: <span className="capitalize text-primary">{order.status}</span></h4>
                {order.status !== 'cancelled' ? (
                <>
                    <Progress value={progressValue} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        {Object.values(statusSteps).filter(s => s.step > 0).map(({step, label}) => (
                           <span key={step} className={currentStep >= step ? 'font-bold text-primary' : ''}>
                               {label}
                           </span>
                        ))}
                    </div>
                </>
                ) : (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Order Cancelled</AlertTitle>
                        <AlertDescription>This order has been cancelled.</AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
      )}
      
      {!isLoading && !error && !order && searched && (
          <p className="text-center text-muted-foreground">No order found.</p>
      )}
    </div>
  );
}

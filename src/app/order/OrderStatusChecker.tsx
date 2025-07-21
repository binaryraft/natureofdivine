
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchOrderStatus } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Order, type OrderStatus } from '@/lib/definitions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PackageSearch, XCircle, CheckCircle, Truck, ShoppingCart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const statusSteps: Record<OrderStatus, { step: number; label: string; Icon: React.ElementType }> = {
  'new': { step: 1, label: 'Order Placed', Icon: ShoppingCart },
  'dispatched': { step: 2, label: 'Dispatched', Icon: Truck },
  'delivered': { step: 3, label: 'Delivered', Icon: CheckCircle },
  'cancelled': { step: 0, label: 'Cancelled', Icon: XCircle },
};

export function OrderStatusChecker() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);

  const handleSearch = (idToSearch: string) => {
    if (!idToSearch) {
      setError('Please enter an Order ID.');
      return;
    }

    setError(null);
    setOrder(null);
    setSearched(true);
    
    startTransition(async () => {
        try {
            const result = await fetchOrderStatus(idToSearch.trim());
            if (result) {
            setOrder(result);
            } else {
            setError(`Order with ID "${idToSearch}" not found.`);
            }
        } catch (e) {
            setError('Could not fetch order status. Please try again later.');
        }
    });
  };

  useEffect(() => {
    if (orderId && !searched) {
      handleSearch(orderId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, searched]);

  const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const id = formData.get('orderId') as string;
    setOrderId(id);
    handleSearch(id);
  }

  const currentStep = order ? statusSteps[order.status].step : 0;
  const progressValue = order?.status === 'cancelled' ? 0 : (currentStep / 3) * 100;

  return (
    <div className="space-y-6">
      <form onSubmit={onFormSubmit} className="flex gap-2">
        <div className="flex-grow space-y-2">
          <Label htmlFor="orderId" className="sr-only">Order ID</Label>
          <Input 
            id="orderId" 
            name="orderId" 
            placeholder="e.g., ORD-12345" 
            required 
            defaultValue={orderId}
          />
        </div>
        <Button type="submit" disabled={isPending} className="self-end">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PackageSearch className="mr-2 h-4 w-4" />
          )}
          Track
        </Button>
      </form>

      {isPending && (
        <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && !isPending && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {order && !isPending &&(
        <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold">Order Details</h3>
            <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p>Order ID: <span className="font-mono text-foreground">{order.id}</span></p>
                <p>Placed for: <span className="font-medium text-foreground">{order.name}</span></p>
                <p>Placed on: <span className="font-medium text-foreground">{new Date(order.createdAt).toLocaleDateString()}</span></p>
            </div>
            <div className="mt-6">
                <h4 className="font-semibold mb-4">Status: <span className="capitalize text-primary">{order.status}</span></h4>
                {order.status !== 'cancelled' ? (
                <>
                    <Progress value={progressValue} className="w-full h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        {Object.values(statusSteps).filter(s => s.step > 0).map(({step, label, Icon}) => (
                           <div key={step} className="flex flex-col items-center gap-1 w-1/3">
                               <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                                    <Icon className="w-4 h-4"/>
                               </div>
                               <span className={`text-center ${currentStep >= step ? 'font-bold text-primary' : ''}`}>
                                   {label}
                               </span>
                           </div>
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
      
      {!isPending && !error && !order && searched && (
          <p className="text-center py-8 text-muted-foreground">No order found.</p>
      )}
    </div>
  );
}

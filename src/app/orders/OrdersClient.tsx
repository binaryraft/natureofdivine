
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserOrdersAction, submitReview } from '@/lib/actions';
import { Order, OrderStatus } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PackageSearch, XCircle, CheckCircle, Truck, ShoppingCart, Package, Star, MessageSquareQuote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const statusInfo: Record<OrderStatus, { label: string; Icon: React.ElementType; color: string }> = {
  new: { label: 'Order Placed', Icon: ShoppingCart, color: 'bg-blue-500' },
  dispatched: { label: 'Dispatched', Icon: Truck, color: 'bg-yellow-500' },
  delivered: { label: 'Delivered', Icon: CheckCircle, color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', Icon: XCircle, color: 'bg-red-500' },
};

function ReviewDialog({ order, isOpen, onOpenChange }: { order: Order; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleReviewSubmit = async () => {
        if (rating === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a star rating.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await submitReview({
                orderId: order.id,
                userId: order.userId!,
                rating,
                reviewText,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Your review has been submitted. Thank you!' });
                onOpenChange(false);
                // Optionally, refresh the orders page to show that review is submitted
                router.refresh(); 
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leave a Review for Order #{order.id.substring(0, 7)}</DialogTitle>
                    <DialogDescription>Share your thoughts about &quot;Nature of the Divine&quot;.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn("h-8 w-8 cursor-pointer transition-colors", rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-300')}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>
                    <Textarea
                        placeholder="Tell us more about your experience..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={4}
                    />
                </div>
                 <div className="flex justify-end gap-2">
                     <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleReviewSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Review
                    </Button>
                 </div>
            </DialogContent>
        </Dialog>
    );
}


function OrderItem({ order }: { order: Order }) {
  const { Icon, color, label } = statusInfo[order.status];
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  
  return (
    <>
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
      <CardContent className="space-y-4">
         <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
                <p className="font-medium">Shipping to: {order.name}</p>
                {order.address && <p className="text-muted-foreground">{order.address}, {order.city}, {order.state} {order.pinCode}</p>}
            </div>
            <div className="sm:text-right">
                <p className="font-medium">Item</p>
                <p className="text-muted-foreground capitalize">{order.variant} (₹{order.price})</p>
            </div>
         </div>

        {order.status === 'delivered' && !order.hasReview && (
            <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsReviewOpen(true)}>
                    <MessageSquareQuote className="mr-2 h-4 w-4" />
                    Leave a Review
                </Button>
            </div>
         )}
      </CardContent>
    </Card>
    {order.status === 'delivered' && <ReviewDialog order={order} isOpen={isReviewOpen} onOpenChange={setIsReviewOpen} />}
    </>
  );
}

export function OrdersClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/orders');
      return; 
    }

    if (user) {
      startTransition(async () => {
        try {
            const userOrders = await fetchUserOrdersAction(user.uid);
            setOrders(userOrders);
        } catch(e) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch your orders.'
            })
        }
      });
    }
  }, [user, authLoading, router, toast]);

  useEffect(() => {
    if (searchParams.get('success') === 'true' && searchParams.get('orderId')) {
        toast({
            title: 'Order Placed Successfully!',
            description: `Your order ID is ${searchParams.get('orderId')}.`
        })
        router.replace('/orders', { scroll: false });
    }
  }, [searchParams, toast, router]);

  if (authLoading || isPending) {
    return (
      <div className="container mx-auto py-12 md:py-24 max-w-4xl text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (!user) {
      return (
         <div className="container mx-auto py-12 md:py-24 max-w-4xl text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
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
                You haven&apos;t placed any orders yet.
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

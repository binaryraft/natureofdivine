
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserOrdersAction, submitReview } from '@/lib/actions';
import { Order, OrderStatus } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PackageSearch, XCircle, CheckCircle, Truck, ShoppingCart, Package, Star, MessageSquareQuote, ImagePlus, X, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const statusInfo: Record<OrderStatus, { label: string; Icon: React.ElementType; color: string }> = {
  new: { label: 'Order Placed', Icon: ShoppingCart, color: 'bg-blue-500' },
  dispatched: { label: 'Dispatched', Icon: Truck, color: 'bg-yellow-500' },
  delivered: { label: 'Delivered', Icon: CheckCircle, color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', Icon: XCircle, color: 'bg-red-500' },
  pending: { label: 'Payment Pending', Icon: Clock, color: 'bg-gray-500' },
};

function ReviewDialog({ order, isOpen, onOpenChange }: { order: Order; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const currentImageCount = images.length;
            if (files.length + currentImageCount > 5) {
                toast({ variant: 'destructive', title: 'Too many images', description: 'You can upload a maximum of 5 images.' });
                return;
            }

            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    }


    const handleReviewSubmit = async () => {
        if (rating === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a star rating.' });
            return;
        }
         if (!title) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a title for your review.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await submitReview({
                orderId: order.id,
                userId: order.userId!,
                rating,
                title,
                reviewText,
                images
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Your review has been submitted. Thank you!' });
                setRating(0);
                setTitle('');
                setReviewText('');
                setImages([]);
                onOpenChange(false);
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
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Leave a Review for Order #{order.id.substring(0, 7)}</DialogTitle>
                    <DialogDescription>Share your thoughts about &quot;Nature of the Divine&quot;.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Your Rating*</Label>
                        <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn("h-8 w-8 cursor-pointer transition-colors", rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-300')}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="review-title">Review Title*</Label>
                        <Input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A brief summary of your experience"/>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="review-text">Your Review</Label>
                        <Textarea
                            id="review-text"
                            placeholder="Tell us more about your experience..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={4}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="review-images">Add Photos (optional)</Label>
                        <Input id="review-images" type="file" multiple accept="image/*" onChange={handleImageUpload} />
                         <div className="flex flex-wrap gap-2 mt-2">
                            {images.map((img, index) => (
                                <div key={index} className="relative">
                                    <Image src={img} alt={`review-image-${index}`} width={80} height={80} className="rounded-md object-cover h-20 w-20"/>
                                    <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeImage(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
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
                <Icon className={"mr-2 h-4 w-4"} />
                {label}
            </Badge>
        </div>
        <p className="text-sm text-muted-foreground pt-1">
          Ordered on: {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-6">
            {order.items?.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                     <div className="w-16 h-24 md:w-20 md:h-30 relative flex-shrink-0 bg-slate-200 rounded-md overflow-hidden flex items-center justify-center">
                        {item.type === 'combo' ? (
                            <Package className="h-8 w-8 text-slate-400" />
                        ) : (
                            <Image 
                                src="https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png"
                                alt={item.name}
                                fill
                                className="object-cover"
                            />
                        )}
                    </div>
                    <div className="flex-grow space-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <Badge variant="outline" className="text-[10px] uppercase h-4 px-1 mb-1">{item.type}</Badge>
                                <h4 className="font-bold text-sm leading-snug">{item.name}</h4>
                            </div>
                            <p className="font-bold text-sm">₹{item.price}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                        
                        {item.subItems && (
                            <div className="mt-4 space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                                    <PackageSearch className="h-3 w-3" /> Book Sourcing Status
                                </p>
                                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left text-[10px] border-collapse">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="px-3 py-2 font-bold">Book Title</th>
                                                <th className="px-3 py-2 font-bold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {item.subItems.map((sub, sIdx) => (
                                                <tr key={sIdx}>
                                                    <td className="px-3 py-2 font-medium">{sub.title}</td>
                                                    <td className="px-3 py-2">
                                                        <Badge variant="outline" className={cn(
                                                            "text-[9px] px-1.5 h-4 capitalize",
                                                            sub.status === 'sourced' ? "text-emerald-600 bg-emerald-50 border-emerald-100" : 
                                                            sub.status === 'pending' ? "text-slate-500 bg-slate-50 border-slate-100" : "text-rose-600 bg-rose-50 border-rose-100"
                                                        )}>
                                                            {sub.status.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <div className="grid sm:grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Shipping to</p>
                    <p className="font-medium text-sm">{order.name}</p>
                    {order.address && <p className="text-xs text-muted-foreground">{order.address}, {order.city}, {order.state} {order.pinCode}</p>}
                </div>
                {order.shippingDetails?.trackingNumber && (
                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2 flex items-center gap-1">
                            <Truck className="h-3 w-3"/> Shipment Tracking
                        </p>
                        <p className="text-xs font-bold text-slate-800">{order.shippingDetails.carrier}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1 select-all">{order.shippingDetails.trackingNumber}</p>
                    </div>
                )}
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
          {order.status === 'delivered' && order.hasReview && (
             <div className="flex justify-end pt-2">
                <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="h-4 w-4"/> Review Submitted</p>
            </div>
          )}
      </CardContent>
    </Card>
    {order.status === 'delivered' && <ReviewDialog order={order} isOpen={isReviewOpen} onOpenChange={setIsReviewOpen} />}
    </>
  );
}

import { OrderTicket } from '@/components/OrderTicket';

export function OrdersClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isPending, startTransition] = useTransition();

  const successOrderId = searchParams.get('success') === 'true' ? searchParams.get('orderId') : null;
  const recentOrder = successOrderId ? orders.find(o => o.id === successOrderId) : null;

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
        // We don't replace immediately so user can see the ticket
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
      <div className="space-y-8">
        {recentOrder && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                   <h2 className="text-xl font-bold text-emerald-700">Payment Successful!</h2>
                   <p className="text-sm text-emerald-600/80">Your order has been confirmed. Please download your ticket below.</p>
                </div>
                <Button variant="ghost" onClick={() => router.replace('/orders', { scroll: false })}>Dismiss</Button>
             </div>
             <div className="max-w-2xl mx-auto">
                <OrderTicket order={recentOrder} />
             </div>
             <div className="border-b border-border/50 pb-8" />
          </div>
        )}

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

    
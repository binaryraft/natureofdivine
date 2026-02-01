'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, SiteSettings } from '@/lib/definitions';
import { placeShopOrderAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingBag, MapPin, Phone, User, Truck, CheckCircle, CreditCard, Wallet, ShieldCheck, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function ProductDetailClient({ product, settings }: { product: Product, settings: SiteSettings }) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, startTransition] = useTransition();

    const [formData, setFormData] = useState({
        quantity: 1,
        name: '',
        phone: '',
        address: '',
        pincode: '',
        paymentMethod: 'prepaid' as 'cod' | 'prepaid'
    });

    useEffect(() => {
        const status = searchParams.get('paymentStatus');
        if (status === 'success') {
            toast({ title: 'Payment Successful', description: 'Your order has been placed successfully.' });
        } else if (status === 'failed') {
            toast({ variant: 'destructive', title: 'Payment Failed', description: 'Your transaction could not be completed.' });
        }
    }, [searchParams, toast]);

    const handleOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            try {
                const orderData = {
                    productId: product.id,
                    productName: product.name,
                    quantity: formData.quantity,
                    totalPrice: product.price * formData.quantity,
                    customerName: formData.name,
                    phoneNumber: formData.phone,
                    address: formData.address,
                    pincode: formData.pincode,
                    paymentMethod: formData.paymentMethod
                };

                const result = await placeShopOrderAction(orderData);

                if (result.success) {
                    const res = result as any;
                    if (res.paymentData?.redirectUrl) {
                        toast({ title: 'Redirecting to Payment...', description: 'Please complete the payment.' });
                        window.location.href = res.paymentData.redirectUrl;
                        return;
                    }

                    toast({ title: 'Success', description: result.message });
                    setIsDialogOpen(false);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: result.message });
                }
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Something went wrong.' });
            }
        });
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Image Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative aspect-square rounded-3xl overflow-hidden bg-muted/20 border border-border/50 shadow-2xl"
                >
                    {product.imageUrl ? (
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-700"
                            priority
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground/40 bg-muted/20">
                            <ShoppingBag className="h-32 w-32 stroke-[1]" />
                        </div>
                    )}

                    {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                            <Badge variant="outline" className="text-2xl px-8 py-3 border-destructive text-destructive font-semibold tracking-wider uppercase bg-background/80">Sold Out</Badge>
                        </div>
                    )}
                </motion.div>

                {/* Details Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-8"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors uppercase tracking-widest text-[10px]">
                                Divine Artifact
                            </Badge>
                            {product.stock > 0 && (
                                <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    In Stock
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-garamond font-bold leading-tight text-foreground">{product.name}</h1>
                        <div className="flex items-center gap-4 pt-2">
                            <span className="text-3xl font-bold text-primary font-headline">₹{product.price}</span>
                            <div className="flex items-center text-amber-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="h-5 w-5 fill-current" />
                                ))}
                                <span className="ml-2 text-sm text-muted-foreground font-medium">(24 Reviews)</span>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-lg dark:prose-invert text-muted-foreground leading-relaxed">
                        <p>{product.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                            <Truck className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-sm">Fast Delivery</p>
                                <p className="text-xs text-muted-foreground">Ships in 2-7 days</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-sm">Secure Payment</p>
                                <p className="text-xs text-muted-foreground">SSL Encrypted</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border/50">
                        <Button
                            className={cn(
                                "w-full h-14 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 shadow-xl shadow-primary/20",
                                product.stock > 0
                                    ? "bg-primary text-primary-foreground hover:scale-[1.02] hover:shadow-primary/30"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                            size="lg"
                            onClick={() => setIsDialogOpen(true)}
                            disabled={product.stock <= 0}
                        >
                            {product.stock > 0 ? (
                                <span className="flex items-center gap-3 text-lg">
                                    <ShoppingBag className="h-5 w-5" /> Buy Now
                                </span>
                            ) : 'Restocking Soon'}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            Guaranteed safe checkout via PhonePe (UPI, Card, NetBanking)
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Order Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="font-garamond text-2xl">Complete Your Offering</DialogTitle>
                        <DialogDescription>
                            Enter your details to receive <strong>{product.name}</strong>.
                            <br />
                            Total Offering: <span className="font-semibold text-primary">₹{product.price * formData.quantity}</span>
                            <span className="block text-[10px] text-muted-foreground mt-1 flex items-center gap-1 uppercase tracking-widest">
                                <Truck className="h-3 w-3" /> Secure Delivery within 2-7 Business Days
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleOrderSubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                className="col-span-3"
                                min="1"
                                max={product.stock}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <div className="col-span-3 relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="pl-9"
                                    placeholder="Your Name"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <div className="col-span-3 relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="pl-9"
                                    placeholder="Mobile Number"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="address" className="text-right pt-2">Address</Label>
                            <div className="col-span-3 relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="pl-9 min-h-[80px]"
                                    placeholder="Full Delivery Address"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pincode" className="text-right">Pincode</Label>
                            <Input
                                id="pincode"
                                value={formData.pincode}
                                onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                className="col-span-3"
                                placeholder="Area Pincode"
                                required
                            />
                        </div>

                        {settings.codEnabled && (
                            <div className="grid grid-cols-4 items-start gap-4 pt-2">
                                <Label className="text-right pt-2">Payment</Label>
                                <div className="col-span-3">
                                    <RadioGroup
                                        value={formData.paymentMethod}
                                        onValueChange={(val: 'cod' | 'prepaid') => setFormData(prev => ({ ...prev, paymentMethod: val }))}
                                        className="flex flex-col gap-3"
                                    >
                                        <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem value="prepaid" id="prepaid" />
                                            <Label htmlFor="prepaid" className="flex items-center gap-2 cursor-pointer w-full">
                                                <CreditCard className="h-4 w-4 text-primary" />
                                                <span>Pay Online (Prepaid)</span>
                                                <Badge variant="secondary" className="ml-auto text-[10px]">Fastest</Badge>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem value="cod" id="cod" />
                                            <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer w-full">
                                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                                <span>Cash on Delivery</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {formData.paymentMethod === 'prepaid' ? 'Proceed to Payment' : 'Confirm Order'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, ShopOrder } from '@/lib/definitions';
import { placeShopOrderAction, seedShopProductsAction } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingBag, MapPin, Phone, User, Package, CheckCircle, CreditCard, Wallet, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function ShopClient({ initialProducts, totalCount = 0 }: { initialProducts: Product[], totalCount?: number }) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, startTransition] = useTransition();
    const [isSeeding, startSeeding] = useTransition();

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

    const handleBuyClick = (product: Product) => {
        setSelectedProduct(product);
        setFormData(prev => ({ ...prev, quantity: 1 }));
        setIsDialogOpen(true);
    };

    const handleOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        startTransition(async () => {
            try {
                const orderData = {
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    quantity: formData.quantity,
                    totalPrice: selectedProduct.price * formData.quantity,
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

    const handleSeedProducts = async () => {
        startSeeding(async () => {
            const res = await seedShopProductsAction();
            if (res.success) {
                toast({ title: "Shop Ready!", description: res.message });
                router.refresh();
            }
        });
    };

    if (initialProducts.length === 0) {
        return (
            <div className="text-center py-20 bg-card/30 backdrop-blur-sm rounded-3xl border border-dashed border-primary/20">
                <Package className="h-16 w-16 mx-auto text-primary/20 mb-4 animate-pulse" />
                <h3 className="text-2xl font-garamond font-bold">No Divine Artifacts Found</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                    {totalCount > 0
                        ? "There are products in the database, but they haven't been activated yet. Please check the Admin panel."
                        : "The shop is currently awaiting new arrivals from the higher realms. Check back soon."}
                </p>
                <div className="mt-8 space-y-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSeedProducts}
                        disabled={isSeeding}
                        className="opacity-20 hover:opacity-100 transition-opacity"
                    >
                        {isSeeding ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Dev: Seed Sample Products
                    </Button>

                    {totalCount > 0 && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest block">
                            Database Status: {totalCount} Items Found
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Background elements to match home aesthetic */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[5%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,hsl(var(--primary)/0.15)_0%,transparent_70%)] opacity-40 animate-aurora"
                    style={{ willChange: 'opacity, transform' }}
                />
                <div
                    className="absolute top-[40%] left-[-20%] w-[80vw] h-[80vw] bg-[radial-gradient(circle,hsl(var(--accent)/0.08)_0%,transparent_70%)] opacity-30 animate-aurora"
                    style={{ animationDelay: '4s', willChange: 'opacity, transform' }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {initialProducts.map((product, index) => (
                    <div
                        key={product.id}
                        className="group relative"
                    >
                        <Card className="h-full overflow-hidden flex flex-col bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                            <div className="aspect-square relative bg-muted/30 overflow-hidden">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground/40 bg-muted/20">
                                        <Package className="h-20 w-20 stroke-[1]" />
                                    </div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {product.stock <= 0 && (
                                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                                        <Badge variant="outline" className="text-lg px-6 py-2 border-destructive text-destructive font-semibold tracking-wider uppercase">Sold Out</Badge>
                                    </div>
                                )}

                                {/* Floating Price Tag */}
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="bg-background/90 backdrop-blur-md border border-border/50 px-4 py-1.5 rounded-full shadow-lg">
                                        <span className="text-lg font-bold text-primary font-headline">₹{product.price}</span>
                                    </div>
                                </div>
                            </div>

                            <CardHeader className="space-y-1">
                                <CardTitle className="text-2xl font-garamond font-bold group-hover:text-primary transition-colors">{product.name}</CardTitle>
                                <CardDescription className="line-clamp-2 text-sm leading-relaxed min-h-[40px]">
                                    {product.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pb-4">
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                                    <div className={cn("h-1.5 w-1.5 rounded-full", product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-muted")} />
                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                </div>
                            </CardContent>

                            <CardFooter className="mt-auto pt-2 pb-6">
                                <Button
                                    className={cn(
                                        "w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300",
                                        product.stock > 0
                                            ? "bg-primary text-primary-foreground hover:scale-[1.02] shadow-lg hover:shadow-primary/20"
                                            : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                    size="lg"
                                    onClick={() => handleBuyClick(product)}
                                    disabled={product.stock <= 0}
                                >
                                    {product.stock > 0 ? (
                                        <span className="flex items-center gap-2">
                                            <ShoppingBag className="h-4 w-4" /> Buy Now
                                        </span>
                                    ) : 'Restocking Soon'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Place Order</DialogTitle>
                        <DialogDescription>
                            Enter your details to order <strong>{selectedProduct?.name}</strong>.
                            <br />
                            Total: <span className="font-semibold text-primary">₹{(selectedProduct?.price || 0) * formData.quantity}</span>
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
                                max={selectedProduct?.stock}
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

                        <div className="grid grid-cols-4 items-start gap-4 pt-2">
                            <Label className="text-right pt-2">Payment</Label>
                            <div className="col-span-3">
                                <RadioGroup
                                    value={formData.paymentMethod}
                                    onValueChange={(val: 'cod' | 'prepaid') => setFormData(prev => ({ ...prev, paymentMethod: val }))}
                                    className="flex flex-col gap-3"
                                >
                                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50">
                                        <RadioGroupItem value="prepaid" id="prepaid" />
                                        <Label htmlFor="prepaid" className="flex items-center gap-2 cursor-pointer w-full">
                                            <CreditCard className="h-4 w-4 text-primary" />
                                            <span>Pay Online (Prepaid)</span>
                                            <Badge variant="secondary" className="ml-auto text-[10px]">Fastest</Badge>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50">
                                        <RadioGroupItem value="cod" id="cod" />
                                        <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer w-full">
                                            <Wallet className="h-4 w-4 text-muted-foreground" />
                                            <span>Cash on Delivery</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {formData.paymentMethod === 'prepaid' ? 'Pay Now' : 'Place Order'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
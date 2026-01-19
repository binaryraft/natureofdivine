'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/lib/definitions';
import { placeShopOrderAction } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingBag, MapPin, Phone, User, Package, CheckCircle, CreditCard, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';

export function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, startTransition] = useTransition();
    
    // Payment Status handling
    useEffect(() => {
        const paymentStatus = searchParams.get('paymentStatus');
        if (paymentStatus === 'success') {
            toast({ title: 'Payment Successful', description: 'Your order has been placed successfully!' });
            router.replace('/shop'); // Clear params
        } else if (paymentStatus === 'failure') {
            toast({ variant: 'destructive', title: 'Payment Failed', description: 'Your transaction was not successful. Please try again.' });
            router.replace('/shop');
        }
    }, [searchParams, toast, router]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        pincode: '',
        quantity: 1,
        paymentMethod: 'prepaid' as 'cod' | 'prepaid'
    });

    const handleBuyClick = (product: Product) => {
        setSelectedProduct(product);
        setFormData(prev => ({ ...prev, quantity: 1, paymentMethod: 'prepaid' })); // Default to prepaid
        setIsDialogOpen(true);
    };

    const handleOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        startTransition(async () => {
            try {
                const totalPrice = selectedProduct.price * formData.quantity;
                const result = await placeShopOrderAction({
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    quantity: formData.quantity,
                    totalPrice,
                    customerName: formData.name,
                    phoneNumber: formData.phone,
                    address: formData.address,
                    pincode: formData.pincode,
                    city: 'Unknown', 
                    state: 'Unknown',
                    paymentMethod: formData.paymentMethod
                });

                if (result.success) {
                    if (result.paymentData?.redirectUrl) {
                        toast({ title: 'Redirecting to Payment...', description: 'Please complete the payment.' });
                        window.location.href = result.paymentData.redirectUrl;
                        return;
                    }

                    toast({ 
                        title: 'Order Placed!', 
                        description: `We have received your order for ${selectedProduct.name}. We will contact you at ${formData.phone} if needed.` 
                    });
                    setIsDialogOpen(false);
                    // Reset form
                    setFormData({
                        name: '',
                        phone: '',
                        address: '',
                        pincode: '',
                        quantity: 1,
                        paymentMethod: 'prepaid'
                    });
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: result.message });
                }
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to place order.' });
            }
        });
    };

    if (initialProducts.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground">No products available at the moment.</h3>
                <p className="text-sm text-muted-foreground mt-2">Please check back later.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {initialProducts.map(product => (
                    <Card key={product.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300">
                        <div className="aspect-square relative bg-muted group">
                             {product.imageUrl ? (
                                <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" 
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/50">
                                    <Package className="h-16 w-16 opacity-20" />
                                </div>
                            )}
                            {product.stock <= 0 && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                                    <Badge variant="destructive" className="text-lg px-4 py-1">Out of Stock</Badge>
                                </div>
                            )}
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{product.name}</CardTitle>
                                <Badge variant="secondary" className="text-base font-medium">₹{product.price}</Badge>
                            </div>
                            <CardDescription className="line-clamp-3 pt-2">{product.description}</CardDescription>
                        </CardHeader>
                        <CardFooter className="mt-auto pt-0">
                            <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={() => handleBuyClick(product)}
                                disabled={product.stock <= 0}
                            >
                                {product.stock > 0 ? 'Buy Now' : 'Unavailable'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Place Order</DialogTitle>
                        <DialogDescription>
                            Enter your details to order <strong>{selectedProduct?.name}</strong>.
                            <br/>
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
                                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} 
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
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
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
                                    onChange={e => setFormData({...formData, phone: e.target.value})} 
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
                                    onChange={e => setFormData({...formData, address: e.target.value})} 
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
                                onChange={e => setFormData({...formData, pincode: e.target.value})} 
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
        </>
    );
}
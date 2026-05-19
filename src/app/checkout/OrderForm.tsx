'use client';

import { useEffect, useReducer, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { placeOrder, validateDiscountCode, trackEvent, calculateOrderTotalAction, fetchOrderByIdAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Truck, CreditCard, Book, Tag, ArrowLeft, User, MapPin, BadgePercent, Ship, ShoppingCart, Package } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import type { Stock, BookVariant, OrderItem, OrderItemStatus } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation } from '@/hooks/useLocation';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/countries';
import type { SiteSettings } from '@/lib/definitions';
import { books, combos } from '@/lib/data';

const DetailsSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    phone: z.string().min(10, 'Please enter a valid phone number.').refine(val => /^\d{10,15}$/.test(val), { message: "Phone number must be between 10 and 15 digits." }),
    address: z.string().min(5, 'Address must be at least 5 characters.'),
    street: z.string().optional(),
    city: z.string().min(2, 'Please enter a valid city.'),
    country: z.string().min(2, 'Please select a country.'),
    state: z.string().min(2, 'Please enter a valid state.'),
    pinCode: z.string().min(3, 'Please enter a valid PIN code.'),
    saveAddress: z.boolean().optional(),
});

type FormState = {
    step: 'details' | 'payment' | 'processing';
    items: OrderItem[];
    details: z.infer<typeof DetailsSchema>;
    orderSummary: { productPrice: number, shippingCost: number, totalPrice: number } | null;
    paymentMethod: 'cod' | 'prepaid' | null;
    discount: {
        code: string;
        percent: number;
        applied: boolean;
        message: string;
    }
    errors: Record<string, string[]> | null;
};

type FormAction =
    | { type: 'SET_ITEMS'; payload: OrderItem[] }
    | { type: 'SET_DETAILS'; payload: z.infer<typeof DetailsSchema> }
    | { type: 'SET_PAYMENT_METHOD'; payload: 'cod' | 'prepaid' }
    | { type: 'SET_ERRORS'; payload: Record<string, string[]> | null }
    | { type: 'NEXT_STEP' }
    | { type: 'PREVIOUS_STEP' }
    | { type: 'SET_PROCESSING' }
    | { type: 'SET_DISCOUNT_CODE'; payload: string }
    | { type: 'APPLY_DISCOUNT'; payload: { percent: number; message: string } }
    | { type: 'SET_DISCOUNT_MESSAGE'; payload: string }
    | { type: 'RESET_DISCOUNT' }
    | { type: 'SET_ORDER_SUMMARY'; payload: { productPrice: number, shippingCost: number, totalPrice: number }, settings: SiteSettings }
    | { type: 'SET_FORM_VALUE'; payload: { field: keyof z.infer<typeof DetailsSchema>, value: string | boolean | undefined } };

const initialState: FormState = {
    step: 'details',
    items: [],
    details: {
        name: '',
        email: '',
        phone: '',
        address: '',
        street: '',
        city: '',
        country: 'IN',
        state: '',
        pinCode: '',
        saveAddress: false,
    },
    orderSummary: null,
    paymentMethod: null,
    discount: {
        code: '',
        percent: 0,
        applied: false,
        message: ''
    },
    errors: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'SET_ITEMS':
            return { ...state, items: action.payload, errors: null };
        case 'SET_DETAILS':
            return { ...state, details: action.payload, errors: null };
        case 'SET_ORDER_SUMMARY': {
            const isInternational = state.details.country !== 'IN';
            const isCODEnabled = isInternational ? action.settings.codEnabledInternational : action.settings.codEnabled;
            return {
                ...state,
                orderSummary: action.payload,
                paymentMethod: isCODEnabled ? state.paymentMethod : 'prepaid',
                errors: null
            };
        }
        case 'SET_FORM_VALUE': {
            const newErrors = state.errors ? { ...state.errors } : null;
            if (newErrors && action.payload.field in newErrors) {
                delete newErrors[action.payload.field];
            }
            return {
                ...state,
                details: { ...state.details!, [action.payload.field]: action.payload.value },
                errors: newErrors
            };
        }
        case 'SET_PAYMENT_METHOD':
            return { ...state, paymentMethod: action.payload, errors: null };
        case 'SET_DISCOUNT_CODE':
            return { ...state, discount: { ...state.discount, code: action.payload } };
        case 'APPLY_DISCOUNT':
            return { ...state, discount: { ...state.discount, applied: true, percent: action.payload.percent, message: action.payload.message } };
        case 'SET_DISCOUNT_MESSAGE':
            return { ...state, discount: { ...state.discount, applied: false, message: action.payload } };
        case 'RESET_DISCOUNT':
            return { ...state, discount: initialState.discount };
        case 'SET_ERRORS':
            return { ...state, errors: action.payload };
        case 'NEXT_STEP': {
            if (state.step === 'details') return { ...state, step: 'payment' };
            return state;
        }
        case 'PREVIOUS_STEP': {
            if (state.step === 'payment') return { ...state, step: 'details', paymentMethod: null, errors: null };
            return state;
        }
        case 'SET_PROCESSING':
            return { ...state, step: 'processing' };
        default:
            return state;
    }
}

export function OrderForm({ stock, settings }: { stock: Stock, settings: SiteSettings }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const { priceData, loading: priceLoading } = useLocation();

    const [state, dispatch] = useReducer(formReducer, initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPincodeLoading, setIsPincodeLoading] = useState(false);
    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Auto-apply discount code from URL param (e.g. ?code=WELCOME20)
    useEffect(() => {
        const urlCode = searchParams.get('code');
        if (urlCode) {
            dispatch({ type: 'SET_DISCOUNT_CODE', payload: urlCode.toUpperCase() });
            validateDiscountCode(urlCode.toUpperCase()).then(res => {
                if (res.success) {
                    dispatch({ type: 'APPLY_DISCOUNT', payload: { percent: res.percent!, message: res.message } });
                }
            });
        }
    }, []);

    // Initialize Items from Search Params
    useEffect(() => {
        const bookIdParam = searchParams.getAll('bookId[]');
        const qtyParam = searchParams.getAll('qty[]');
        const singleBookId = searchParams.get('bookId');
        const comboId = searchParams.get('comboId');
        const variant = searchParams.get('variant') as BookVariant || 'paperback';

        let initialItems: OrderItem[] = [];

        // 1. Handle Cart (Multi-item)
        if (bookIdParam.length > 0) {
            bookIdParam.forEach((id, index) => {
                const book = books.find(b => b.id === id);
                const quantity = parseInt(qtyParam[index] || '1');
                if (book) {
                    initialItems.push({
                        id: book.id,
                        name: book.title,
                        type: 'book',
                        price: book.price,
                        quantity: quantity,
                        variant: variant === 'hardcover' ? 'hardcover' : 'paperback'
                    });
                }
            });
        } 
        // 2. Handle Single Combo
        else if (comboId) {
            const combo = combos.find(c => c.id === comboId);
            if (combo) {
                initialItems.push({
                    id: combo.id,
                    name: combo.name,
                    type: 'combo',
                    price: combo.price,
                    quantity: 1,
                    subItems: combo.books.map(bId => {
                        const book = books.find(b => b.id === bId);
                        return {
                            bookId: bId,
                            title: book?.title || 'Unknown Book',
                            status: 'pending'
                        };
                    })
                });
            }
        } 
        // 3. Handle Single Book
        else if (singleBookId) {
            const book = books.find(b => b.id === singleBookId);
            if (book) {
                initialItems.push({
                    id: book.id,
                    name: book.title,
                    type: 'book',
                    price: book.price,
                    quantity: 1,
                    variant: variant === 'hardcover' ? 'hardcover' : 'paperback'
                });
            }
        } 
        // 4. Default
        else {
            const ntd = books.find(b => b.id === 'nature-of-the-divine');
            if (ntd) {
                initialItems.push({
                    id: ntd.id,
                    name: ntd.title,
                    type: 'book',
                    price: ntd.price,
                    quantity: 1,
                    variant: variant === 'hardcover' ? 'hardcover' : 'paperback'
                });
            }
        }

        if (initialItems.length > 0) {
            dispatch({ type: 'SET_ITEMS', payload: initialItems });
        }
    }, [searchParams]);

    // Handle Order Verification (Payment Redirects)
    useEffect(() => {
        const orderId = searchParams.get('orderId');
        if (orderId && user) {
            setIsVerifying(true);
            const checkStatus = async () => {
                try {
                    const order = await fetchOrderByIdAction(user.uid, orderId);
                    if (order && (order.status === 'new' || order.status === 'dispatched')) {
                        router.push(`/orders?success=true&orderId=${orderId}`);
                    }
                } catch (e) {
                    console.error("Order verification error:", e);
                } finally {
                    setIsVerifying(false);
                }
            };
            checkStatus();
        }
    }, [searchParams, user, router]);

    const handleNextStep = () => {
        if (state.step === 'details') {
            const result = DetailsSchema.safeParse(state.details);
            if (!result.success) {
                const fieldErrors = result.error.flatten().fieldErrors;
                dispatch({ type: 'SET_ERRORS', payload: fieldErrors as any });
                toast({
                    variant: 'destructive',
                    title: 'Check your details',
                    description: 'Please fix the errors in the form before continuing.'
                });
                return;
            }
            calculateTotal();
        }
        dispatch({ type: 'NEXT_STEP' });
    };

    const calculateTotal = async () => {
        setIsCalculatingPrice(true);
        try {
            // Calculate item price with bundle logic
            const totalBooksCount = state.items.reduce((s, i) => s + (i.type === 'book' ? i.quantity : 0), 0);
            
            // Re-use logic from cart-context to find the correct tier
            const BUNDLE_TIERS = [
                { minBooks: 40, pricePerBook: 99 },
                { minBooks: 30, pricePerBook: 119 },
                { minBooks: 20, pricePerBook: 129 },
                { minBooks: 10, pricePerBook: 149 },
                { minBooks: 1,  pricePerBook: 199 },
            ];
            const tier = BUNDLE_TIERS.find(t => totalBooksCount >= t.minBooks) || BUNDLE_TIERS[BUNDLE_TIERS.length - 1];

            let productPrice = state.items.reduce((acc, item) => {
                if (item.type === 'book') {
                    return acc + (tier.pricePerBook * item.quantity);
                }
                // Combos have fixed prices
                return acc + (item.price * item.quantity);
            }, 0);

            const shippingCost = 0; // Always FREE shipping
            
            let finalPrice = productPrice;
            let discountAmount = 0;

            if (state.discount.applied) {
                discountAmount = Math.round(productPrice * (state.discount.percent / 100));
                finalPrice = productPrice - discountAmount;
            }

            dispatch({ 
                type: 'SET_ORDER_SUMMARY', 
                payload: { productPrice, shippingCost, totalPrice: finalPrice + shippingCost },
                settings
            });
        } catch (e) {
            console.error("Price calculation error:", e);
        } finally {
            setIsCalculatingPrice(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Sign in Required',
                description: 'Please sign in to complete your purchase.'
            });
            router.push(`/login?redirect=/checkout?${searchParams.toString()}`);
            return;
        }

        if (!state.paymentMethod) {
            toast({
                variant: 'destructive',
                title: 'Payment Method Required',
                description: 'Please select a payment method.'
            });
            return;
        }

        setIsSubmitting(true);
        dispatch({ type: 'SET_PROCESSING' });

        try {
            const payload = {
                ...state.details,
                items: state.items,
                userId: user.uid,
                discountCode: state.discount.applied ? state.discount.code : undefined,
                paymentMethod: state.paymentMethod,
            };

            const result = await placeOrder(payload as any);
            if (result.success) {
                if (result.paymentData?.redirectUrl) {
                    window.location.href = result.paymentData.redirectUrl;
                } else {
                    router.push(`/orders?success=true&orderId=${result.orderId}`);
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Order Failed',
                    description: result.message
                });
                dispatch({ type: 'NEXT_STEP' }); // Go back to payment step
            }
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: e.message || 'An unexpected error occurred.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-headline">Verifying your payment...</p>
            </div>
        );
    }

    const currentItem = state.items[0];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Area */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Step Indicators */}
                <div className="flex items-center gap-4 mb-8">
                    {['Details', 'Payment'].map((step, idx) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                (idx === 0 && state.step === 'details') || (idx === 1 && state.step === 'payment')
                                    ? "bg-primary text-white ring-4 ring-primary/20"
                                    : "bg-slate-200 text-slate-500"
                            )}>
                                {idx + 1}
                            </div>
                            <span className={cn(
                                "text-sm font-medium",
                                (idx === 0 && state.step === 'details') || (idx === 1 && state.step === 'payment')
                                    ? "text-slate-900"
                                    : "text-slate-400"
                            )}>{step}</span>
                            {idx < 1 && <div className="w-12 h-[2px] bg-slate-200 ml-2" />}
                        </div>
                    ))}
                </div>

                {state.step === 'details' && (
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <CardTitle className="text-2xl font-headline flex items-center gap-3">
                                <User className="h-6 w-6 text-primary" /> Shipping Details
                            </CardTitle>
                            <CardDescription>Where should we send your spiritual companion?</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                                    <Input 
                                        id="name" 
                                        placeholder="John Doe" 
                                        className="h-12 rounded-xl"
                                        value={state.details.name}
                                        onChange={(e) => dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'name', value: e.target.value } })}
                                    />
                                    {state.errors?.name && <p className="text-[10px] text-rose-500 ml-1">{state.errors.name[0]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="john@example.com" 
                                        className="h-12 rounded-xl"
                                        value={state.details.email}
                                        onChange={(e) => dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'email', value: e.target.value } })}
                                    />
                                    {state.errors?.email && <p className="text-[10px] text-rose-500 ml-1">{state.errors.email[0]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                                    <Input 
                                        id="phone" 
                                        placeholder="10-digit mobile number" 
                                        className="h-12 rounded-xl"
                                        value={state.details.phone}
                                        onChange={(e) => dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'phone', value: e.target.value } })}
                                    />
                                    {state.errors?.phone && <p className="text-[10px] text-rose-500 ml-1">{state.errors.phone[0]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Country</Label>
                                    <Select 
                                        value={state.details.country} 
                                        onValueChange={(v) => dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'country', value: v } })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map(c => <SelectItem key={c.iso2} value={c.iso2}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Complete Address</Label>
                                <Textarea 
                                    id="address" 
                                    placeholder="Flat/House No., Building, Apartment" 
                                    className="rounded-xl min-h-[100px]"
                                    value={state.details.address}
                                    onChange={(e) => dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'address', value: e.target.value } })}
                                />
                                {state.errors?.address && <p className="text-[10px] text-rose-500 ml-1">{state.errors.address[0]}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">City</Label>
                                    <Input 
                                        id="city" 
                                        className="h-12 rounded-xl"
                                        value={state.details.city}
                                        onChange={(e) => dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'city', value: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">State</Label>
                                    <Input 
                                        id="state" 
                                        className="h-12 rounded-xl"
                                        value={state.details.state}
                                        onChange={(e) => dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'state', value: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">PIN Code</Label>
                                    <Input 
                                        id="pincode" 
                                        className="h-12 rounded-xl"
                                        value={state.details.pinCode}
                                        onChange={(e) => dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'pinCode', value: e.target.value } })}
                                    />
                                </div>
                            </div>

                            <Button onClick={handleNextStep} className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
                                Continue to Payment <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {state.step === 'payment' && (
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur rounded-3xl overflow-hidden animate-in slide-in-from-right-4 duration-300">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl font-headline flex items-center gap-3">
                                    <CreditCard className="h-6 w-6 text-primary" /> Payment Method
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'PREVIOUS_STEP' })} className="text-muted-foreground hover:text-primary">
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                             <RadioGroup 
                                value={state.paymentMethod || ''} 
                                onValueChange={(v) => dispatch({ type: 'SET_PAYMENT_METHOD', payload: v as any })}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                             >
                                <div className={cn(
                                    "relative flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer",
                                    state.paymentMethod === 'prepaid' ? "border-primary bg-primary/5 ring-4 ring-primary/5" : "border-slate-100 hover:border-slate-200 bg-white"
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Online Payment</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Cards, UPI, NetBanking</p>
                                        </div>
                                    </div>
                                    <RadioGroupItem value="prepaid" id="prepaid" className="sr-only" />
                                    {state.paymentMethod === 'prepaid' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </div>

                                <div className={cn(
                                    "relative flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer",
                                    state.paymentMethod === 'cod' ? "border-primary bg-primary/5 ring-4 ring-primary/5" : "border-slate-100 hover:border-slate-200 bg-white"
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Truck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Cash on Delivery</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Pay when you receive</p>
                                        </div>
                                    </div>
                                    <RadioGroupItem value="cod" id="cod" className="sr-only" />
                                    {state.paymentMethod === 'cod' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </div>
                             </RadioGroup>

                             <Button 
                                onClick={handlePlaceOrder} 
                                disabled={isSubmitting || !state.paymentMethod}
                                className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                             >
                                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Complete Order"}
                             </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Sidebar: Order Summary */}
            <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur rounded-3xl overflow-hidden">
                        <CardHeader className="p-6 border-b border-slate-100">
                            <CardTitle className="text-xl font-headline flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-primary" /> Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {state.items.length > 0 ? (
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {state.items.map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="flex gap-4 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 group">
                                            <div className="relative h-16 w-12 rounded-lg overflow-hidden shadow-sm bg-white flex-shrink-0">
                                                {/* Use BookImage if possible, or fallback to icon */}
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    {item.type === 'combo' ? <Package className="h-6 w-6" /> : <Book className="h-6 w-6" />}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-1">{item.type}</p>
                                                <h4 className="font-bold text-sm leading-tight line-clamp-2">{item.name}</h4>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                                    <p className="text-sm font-bold text-slate-900">₹{item.price}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Skeleton className="h-20 w-full rounded-xl" />
                            )}

                            {/* Discount Input */}
                            <div className="pt-6 border-t border-slate-100 space-y-3">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Discount Code</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Enter code" 
                                        className="h-10 rounded-xl bg-slate-50 border-none"
                                        value={state.discount.code}
                                        onChange={(e) => dispatch({ type: 'SET_DISCOUNT_CODE', payload: e.target.value })}
                                    />
                                    <Button variant="outline" className="h-10 rounded-xl" onClick={async () => {
                                        setIsCheckingCode(true);
                                        const res = await validateDiscountCode(state.discount.code);
                                        if (res.success) {
                                            dispatch({ type: 'APPLY_DISCOUNT', payload: { percent: res.percent!, message: res.message } });
                                            calculateTotal();
                                        } else {
                                            toast({ variant: 'destructive', title: 'Invalid Code', description: res.message });
                                        }
                                        setIsCheckingCode(false);
                                    }}>
                                        {isCheckingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                    </Button>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="pt-6 border-t border-slate-100 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Product Price</span>
                                    <span className="font-medium">₹{state.orderSummary?.productPrice || currentItem?.price || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span className="flex items-center gap-1.5"><BadgePercent className="h-4 w-4" /> Discount</span>
                                    <span className="font-medium">-₹{state.orderSummary?.discountAmount || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span className="flex items-center gap-1.5"><Ship className="h-4 w-4" /> Shipping</span>
                                    <span className="font-bold">FREE 🎉</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="font-bold text-lg">Total Amount</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-primary">₹{state.orderSummary?.totalPrice || (currentItem ? currentItem.price + 50 : 0)}</span>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">All taxes included</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center gap-2">
                             <ShieldCheck className="h-6 w-6 text-emerald-500" />
                             <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">Secure Transaction</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center gap-2">
                             <Truck className="h-6 w-6 text-amber-500" />
                             <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">Verified Delivery</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

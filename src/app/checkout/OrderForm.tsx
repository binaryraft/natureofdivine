
'use client';

import { useEffect, useReducer, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { placeOrder, processPrepaidOrder, validateDiscountCode } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Truck, CreditCard, Book, Download, Tag } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import type { Stock, BookVariant } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation } from '@/hooks/useLocation';
import { getLocaleFromCountry } from '@/lib/utils';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';


const isPrepaidEnabled = true;

const physicalVariants: BookVariant[] = ['paperback', 'hardcover'];
const allVariants: BookVariant[] = ['paperback', 'hardcover', 'ebook'];

// Schemas for validation
const VariantSchema = z.object({
  variant: z.enum(['paperback', 'hardcover'], { required_error: 'Please select a book type.' }),
});

const DetailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
  street: z.string().optional(),
  city: z.string().min(2, 'Please enter a valid city.'),
  country: z.string().min(2, 'Please select a country.'),
  state: z.string().min(2, 'Please select a state.'),
  pinCode: z.string().min(3, 'Please enter a valid PIN code.'),
  saveAddress: z.boolean().optional(),
});

type FormState = {
  step: 'variant' | 'details' | 'payment' | 'processing';
  variant: Exclude<BookVariant, 'ebook'> | null;
  details: z.infer<typeof DetailsSchema>;
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
  | { type: 'SET_VARIANT'; payload: Exclude<BookVariant, 'ebook'> }
  | { type: 'SET_DETAILS'; payload: z.infer<typeof DetailsSchema> }
  | { type: 'SET_PAYMENT_METHOD'; payload: 'cod' | 'prepaid' }
  | { type: 'SET_ERRORS'; payload: Record<string, string[]> | null }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SET_PROCESSING' }
  | { type: 'RESET_TO_VARIANT'; payload?: Exclude<BookVariant, 'ebook'> | null }
  | { type: 'SET_DISCOUNT_CODE'; payload: string }
  | { type: 'APPLY_DISCOUNT'; payload: { percent: number; message: string } }
  | { type: 'SET_DISCOUNT_MESSAGE'; payload: string }
  | { type: 'RESET_DISCOUNT' }
  | { type: 'SET_FORM_VALUE'; payload: { field: keyof z.infer<typeof DetailsSchema>, value: string | boolean | undefined }};

const initialState: FormState = {
  step: 'variant',
  variant: null,
  details: {
    name: '',
    email: '',
    phone: '',
    address: '',
    street: '',
    city: '',
    country: '',
    state: '',
    pinCode: '',
    saveAddress: false,
  },
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
    case 'SET_VARIANT':
      return { ...state, variant: action.payload, errors: null };
    case 'SET_DETAILS':
      return { ...state, details: action.payload, errors: null };
    case 'SET_FORM_VALUE':
      return { ...state, details: { ...state.details!, [action.payload.field]: action.payload.value }, errors: { ...state.errors, [action.payload.field]: undefined } };
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
      if (state.step === 'variant') return { ...state, step: 'details' };
      if (state.step === 'details') return { ...state, step: 'payment' };
      return state;
    }
    case 'PREVIOUS_STEP': {
        if (state.step === 'payment') return { ...state, step: 'details', paymentMethod: null, errors: null };
        if (state.step === 'details') return { ...state, step: 'variant', errors: null, discount: initialState.discount };
        return state;
    }
    case 'SET_PROCESSING':
        return { ...state, step: 'processing' };
    case 'RESET_TO_VARIANT':
        return {
            ...initialState,
            details: state.details, // Keep user-entered details
            step: action.payload ? 'details' : 'variant',
            variant: action.payload || null,
        }
    default:
      return state;
  }
}

const variantDetails: Record<Exclude<BookVariant, 'ebook'>, { name: string; icon: React.ElementType, description: string }> = {
    paperback: { name: 'Paperback', icon: Book, description: "The classic physical copy." },
    hardcover: { name: 'Hardcover', icon: Book, description: "A durable, premium edition." },
};

// Declare the phonepe object on the window
declare global {
    interface Window {
        phonepe: any;
    }
}

export function OrderForm({ stock }: { stock: Stock }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { priceData, loading: priceLoading } = useLocation();

  const [state, dispatch] = useReducer(formReducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  
  // Pre-select variant from URL
  useEffect(() => {
    const variantParam = searchParams.get('variant') as Exclude<BookVariant, 'ebook'>;
    if (variantParam && physicalVariants.includes(variantParam)) {
       if (stock[variantParam] > 0) {
            dispatch({ type: 'SET_VARIANT', payload: variantParam });
            dispatch({ type: 'NEXT_STEP' });
        } else {
            toast({ variant: 'destructive', title: 'Out of Stock', description: 'The selected book type is currently unavailable.'});
        }
    }
  }, [searchParams, stock, toast]);


  // Set initial country from location data
  useEffect(() => {
    if (priceData?.country && !state.details.country) {
      dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'country', value: priceData.country }})
    }
  }, [priceData?.country, state.details.country]);

  // Set initial user details if available and form is empty
  useEffect(() => {
      if(user) {
        if (!state.details.name && user.displayName) {
            dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'name', value: user.displayName }})
        }
        if (!state.details.email && user.email) {
            dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'email', value: user.email }})
        }
      }
  }, [user, state.details.name, state.details.email]);

  // Handle payment status from URL
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: `Your payment could not be completed. Reason: ${error.replace(/_/g, ' ')}`,
      });
      // Reset form state after an error
      const variantParam = searchParams.get('variant') as Exclude<BookVariant, 'ebook'>;
      dispatch({type: 'RESET_TO_VARIANT', payload: state.variant || variantParam });
      router.replace('/checkout' + (state.variant ? `?variant=${state.variant}`: ''), { scroll: false }); // Clear URL params
    }
  }, [searchParams, toast, router, state.variant]);


  // Handle Pincode Auto-fill
  const handlePincodeChange = async (pinCode: string) => {
    dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'pinCode', value: pinCode } });
    if (pinCode.length !== 6 || priceData?.country !== 'IN') {
        setPincodeError(null);
        if(state.details.city || state.details.state) {
            dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'city', value: '' } });
            dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'state', value: '' } });
        }
        return;
    };

    setIsPincodeLoading(true);
    setPincodeError(null);
    try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
        const data = await res.json();
        
        if (data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'city', value: postOffice.District } });
            dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'state', value: postOffice.State } });
        } else {
            setPincodeError(data[0].Message || "Invalid PIN code.");
            dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'city', value: '' } });
            dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'state', value: '' } });
        }

    } catch (error) {
        setPincodeError("Failed to fetch PIN code details.");
    } finally {
        setIsPincodeLoading(false);
    }
  }
  
  // Handlers
  const handleVariantSelect = (variant: Exclude<BookVariant, 'ebook'>) => {
    const result = VariantSchema.safeParse({ variant });
    if (result.success) {
      if (stock[variant] > 0) {
        dispatch({ type: 'SET_VARIANT', payload: variant });
        dispatch({ type: 'NEXT_STEP' });
      } else {
        toast({ variant: 'destructive', title: 'Out of Stock' });
      }
    } else {
      dispatch({ type: 'SET_ERRORS', payload: result.error.flatten().fieldErrors });
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (authLoading) {
        toast({ variant: 'destructive', title: 'Please wait', description: 'Authentication is still loading.' });
        return;
    }
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: 'You must be logged in to place an order.',
            action: <Button onClick={() => router.push('/login?redirect=/checkout')}>Login</Button>
        });
        return;
    }
    
    const result = DetailsSchema.safeParse(state.details);
    
    if (result.success) {
        dispatch({ type: 'SET_DETAILS', payload: result.data });
        dispatch({ type: 'NEXT_STEP' });
    } else {
        dispatch({ type: 'SET_ERRORS', payload: result.error.flatten().fieldErrors });
    }
  };

  const handleApplyDiscount = async () => {
    setIsCheckingCode(true);
    const result = await validateDiscountCode(state.discount.code);
    if(result.success) {
        dispatch({ type: 'APPLY_DISCOUNT', payload: { percent: result.percent!, message: result.message } });
    } else {
        dispatch({ type: 'SET_DISCOUNT_MESSAGE', payload: result.message });
    }
    setIsCheckingCode(false);
  }

  const handlePaymentSubmit = async () => {
    if (!state.variant || !state.details || !state.paymentMethod || !user) return;
    
    setIsSubmitting(true);
    dispatch({ type: 'SET_PROCESSING' });

    const orderPayload = {
        variant: state.variant,
        ...state.details,
        userId: user.uid, // Ensure user ID is from the authenticated user
        discountCode: state.discount.applied ? state.discount.code : undefined,
    };

    try {
        if (state.paymentMethod === 'cod') {
            const result = await placeOrder({
                ...orderPayload,
                paymentMethod: 'cod',
            });

            if (result.success && result.orderId) {
                toast({ title: 'Order Placed!', description: `Your order ID is ${result.orderId}.` });
                router.push(`/orders?success=true&orderId=${result.orderId}`);
            } else {
                throw new Error(result.message);
            }
        } else if (state.paymentMethod === 'prepaid') {
             const paymentResult = await processPrepaidOrder(orderPayload);
            if (paymentResult.success && paymentResult.token) {
                 if (window.phonepe) {
                    window.phonepe.openCheckout().on('S2S_CALLBACK', (response: any) => {
                         if (response.state === 'COMPLETED') {
                            const transactionId = response.payload.merchantOrderId;
                            router.push(`/api/payment/callback?transactionId=${transactionId}`);
                        } else {
                            toast({
                                variant: 'destructive',
                                title: 'Payment Failed',
                                description: 'Your payment was not successful. Please try again.',
                            });
                            dispatch({type: 'RESET_TO_VARIANT', payload: state.variant});
                        }
                    }).on('FAILURE', (response: any) => {
                        toast({
                            variant: 'destructive',
                            title: 'Payment Error',
                            description: response.message || 'An error occurred with the payment gateway.',
                        });
                        dispatch({type: 'RESET_TO_VARIANT', payload: state.variant});
                    }).open(paymentResult.token);
                } else {
                    throw new Error("PhonePe SDK not found. Please refresh the page.");
                }
            } else {
                throw new Error(paymentResult.message || 'Could not get payment token.');
            }
        }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'An unexpected error occurred.' });
        dispatch({type: 'RESET_TO_VARIANT', payload: state.variant});
    } finally {
       // Only reset submitting state on error, as prepaid flow is handled by callbacks
        if (state.paymentMethod !== 'prepaid') {
            setIsSubmitting(false);
        }
    }
  };
  
  if (state.step === 'processing' || isSubmitting) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 my-8 min-h-[300px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Processing your request...</p>
            <p className="text-sm text-muted-foreground">Please do not refresh or go back.</p>
        </div>
    )
  }

  const renderStepContent = () => {
    switch(state.step) {
        case 'variant':
            return (
                 <Card className="border-none shadow-none">
                    <CardHeader className="p-0">
                        <CardTitle>1. Select Book Type</CardTitle>
                        <CardDescription>Choose the version of the book you&apos;d like to order.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 p-0">
                        {state.errors?.variant && <Alert variant="destructive"><AlertDescription>{state.errors.variant[0]}</AlertDescription></Alert>}
                         {priceLoading || !priceData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {physicalVariants.map(variant => {
                                if (variant === 'ebook') return null; // E-book is not sold here
                                const isAvailable = stock[variant] > 0;
                                const price = priceData[variant];
                                const locale = getLocaleFromCountry(priceData.country);
                                const formattedPrice = new Intl.NumberFormat(locale, { style: 'currency', currency: priceData.currencyCode }).format(price);
                                const { name, icon: Icon } = variantDetails[variant];

                                return (
                                <div
                                    key={variant}
                                    onClick={() => isAvailable && handleVariantSelect(variant)}
                                    className={cn(
                                    "rounded-lg border-2 p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center",
                                    "border-border hover:border-primary/50",
                                    !isAvailable && "opacity-50 cursor-not-allowed bg-muted/50"
                                    )}
                                >
                                    <Icon className="h-10 w-10 mb-2 text-primary" />
                                    <p className="font-bold text-lg">{name}</p>
                                    <p className="font-semibold text-xl font-headline text-primary">{formattedPrice}</p>
                                    {!isAvailable && <p className="text-destructive font-medium mt-2">Out of Stock</p>}
                                </div>
                                );
                            })}
                            </div>
                         )}
                    </CardContent>
                </Card>
            );
        
        case 'details':
            return (
                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                    <CardHeader className="p-0">
                        <CardTitle>2. Your Details</CardTitle>
                        <CardDescription>
                            Enter your shipping information. You must be logged in to proceed.
                        </CardDescription>
                    </CardHeader>
                     {!user && !authLoading && (
                        <Alert variant="destructive">
                            <AlertDescription className="flex items-center justify-between">
                                <span>Please login to continue.</span>
                                <Button size="sm" onClick={() => router.push('/login?redirect=/checkout')}>Login</Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" required value={state.details?.name} onChange={e => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'name', value: e.target.value}})} />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" required value={state.details?.email} readOnly={!!user?.email} onChange={e => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'email', value: e.target.value}})} />
                            {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" type="tel" required value={state.details?.phone} onChange={e => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'phone', value: e.target.value}})} />
                        {state.errors?.phone && <p className="text-sm text-destructive">{state.errors.phone[0]}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" name="address" required value={state.details?.address} onChange={e => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'address', value: e.target.value}})} placeholder="House No, Building Name, Area"/>
                        {state.errors?.address && <p className="text-sm text-destructive">{state.errors.address[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="street">Landmark (optional)</Label>
                        <Input id="street" name="street" value={state.details?.street} onChange={e => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'street', value: e.target.value}})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label htmlFor="pinCode">PIN Code</Label>
                            <div className="relative flex items-center">
                                <Input id="pinCode" name="pinCode" required value={state.details?.pinCode} onChange={(e) => handlePincodeChange(e.target.value)} />
                                {isPincodeLoading && <Loader2 className="absolute right-2.5 h-4 w-4 animate-spin" />}
                            </div>
                            {pincodeError && <p className="text-sm text-destructive">{pincodeError}</p>}
                            {state.errors?.pinCode && <p className="text-sm text-destructive">{state.errors.pinCode[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">City / District</Label>
                            <Input id="city" name="city" required value={state.details?.city} onChange={e => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'city', value: e.target.value}})} />
                            {state.errors?.city && <p className="text-sm text-destructive">{state.errors.city[0]}</p>}
                        </div>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input id="state" name="state" required value={state.details?.state} onChange={e => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'state', value: e.target.value}})} />
                                {state.errors?.state && <p className="text-sm text-destructive">{state.errors.state[0]}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input id="country" name="country" required value={state.details?.country || ''} readOnly />
                            {state.errors?.country && <p className="text-sm text-destructive">{state.errors.country[0]}</p>}
                        </div>
                    </div>
                    {user && (
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="save-address" name="saveAddress" checked={state.details?.saveAddress} onCheckedChange={checked => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'saveAddress', value: !!checked}})} />
                            <Label htmlFor="save-address" className="font-normal text-muted-foreground">Save this address for future orders</Label>
                        </div>
                    )}
                    
                <div className="flex flex-col sm:flex-row-reverse gap-2 pt-4">
                    <Button type="submit" className="w-full" disabled={!user || authLoading}>Proceed to Payment <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    <Button type="button" variant="outline" onClick={() => dispatch({type: 'PREVIOUS_STEP'})} className="w-full">Back</Button>
                </div>
                </form>
            );

        case 'payment':
            if (priceLoading || !priceData || !state.variant) return <div className="text-center min-h-[300px] flex items-center justify-center"><Loader2 className="animate-spin"/></div>
            
            const originalPrice = priceData[state.variant];
            const discountAmount = state.discount.applied ? Math.round(originalPrice * (state.discount.percent / 100)) : 0;
            const finalPrice = originalPrice - discountAmount;
            
            const locale = getLocaleFromCountry(priceData.country);
            const currencyOptions = { style: 'currency', currency: priceData.currencyCode };
            
            const formattedOriginalPrice = new Intl.NumberFormat(locale, currencyOptions).format(originalPrice);
            const formattedFinalPrice = new Intl.NumberFormat(locale, currencyOptions).format(finalPrice);
            const formattedDiscount = new Intl.NumberFormat(locale, currencyOptions).format(discountAmount);


            return (
                <div>
                    <Card className="border-none shadow-none">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle>3. Payment Method</CardTitle>
                             <CardDescription>
                                Confirm your order total and select a payment method.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-0">
                             <Card className="bg-muted/50">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span>Original Price:</span>
                                        <span className={cn(state.discount.applied && "line-through text-muted-foreground")}>{formattedOriginalPrice}</span>
                                    </div>
                                    {state.discount.applied && (
                                        <div className="flex justify-between items-center text-green-600 font-medium">
                                            <span>Discount ({state.discount.percent}%):</span>
                                            <span>- {formattedDiscount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center font-bold text-lg border-t pt-2 mt-2">
                                        <span>Total Amount:</span>
                                        <span>{formattedFinalPrice}</span>
                                    </div>
                                </CardContent>
                            </Card>

                             <div className="space-y-2">
                                <Label htmlFor="discount-code">Discount Code</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="discount-code" 
                                        placeholder="Enter promo code" 
                                        value={state.discount.code} 
                                        onChange={e => dispatch({type: 'SET_DISCOUNT_CODE', payload: e.target.value.toUpperCase()})}
                                        disabled={state.discount.applied}
                                    />
                                    {state.discount.applied ? (
                                        <Button variant="outline" onClick={() => dispatch({type: 'RESET_DISCOUNT'})}>Remove</Button>
                                    ) : (
                                        <Button onClick={handleApplyDiscount} disabled={isCheckingCode || !state.discount.code}>
                                            {isCheckingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Apply
                                        </Button>
                                    )}
                                </div>
                                {state.discount.message && <p className={cn("text-sm", state.discount.applied ? "text-green-600" : "text-destructive")}>{state.discount.message}</p>}
                            </div>

                            <RadioGroup 
                                name="paymentMethod" 
                                className="space-y-4"
                                onValueChange={(val) => dispatch({ type: 'SET_PAYMENT_METHOD', payload: val as 'cod' | 'prepaid' })}
                                value={state.paymentMethod || ''}
                            >
                                <Label className={cn("flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:bg-secondary has-[[data-state=checked]]:border-primary transition-all")}>
                                    <RadioGroupItem value="cod" id="cod" />
                                    <div className="flex-grow">
                                        <span className="font-semibold flex items-center gap-2"><Truck/> Cash on Delivery</span>
                                    </div>
                                </Label>
                                <Label className={cn("flex items-center gap-4 rounded-md border p-4", isPrepaidEnabled ? "cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:bg-secondary has-[[data-state=checked]]:border-primary transition-all" : "cursor-not-allowed opacity-50")}>
                                    <RadioGroupItem value="prepaid" id="prepaid" disabled={!isPrepaidEnabled} />
                                    <div className="flex-grow">
                                        <span className="font-semibold flex items-center gap-2"><CreditCard /> Prepaid</span>
                                        {!isPrepaidEnabled && <p className="text-sm text-muted-foreground">(Currently unavailable)</p>}
                                    </div>
                                </Label>
                            </RadioGroup>
                             <div className="flex flex-col sm:flex-row-reverse gap-2 pt-4">
                                <Button onClick={handlePaymentSubmit} disabled={!state.paymentMethod || isSubmitting} className="w-full">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (state.paymentMethod === 'cod' ? 'Place Order' : 'Pay Now')}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => dispatch({type: 'PREVIOUS_STEP'})} className="w-full">Back</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        default:
            return null;
    }
  }


  return (
    <div>
      {renderStepContent()}
    </div>
  );
}


'use client';

import { useEffect, useReducer, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { placeOrder } from '@/lib/actions';
import { processPayment } from '@/ai/flows/payment-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Truck, CreditCard, Book, Download, User, Mail, Home } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

// Schemas for validation
const VariantSchema = z.object({
  variant: z.enum(['paperback', 'hardcover', 'ebook'], { required_error: 'Please select a book type.' }),
});

const DetailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Please enter a valid phone number.').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters.').optional().or(z.literal('')),
  street: z.string().optional(),
  city: z.string().min(2, 'Please enter a valid city.').optional().or(z.literal('')),
  country: z.string().min(2, 'Please select a country.').optional().or(z.literal('')),
  state: z.string().min(2, 'Please select a state.').optional().or(z.literal('')),
  pinCode: z.string().min(3, 'Please enter a valid PIN code.').optional().or(z.literal('')),
  saveAddress: z.boolean().optional(),
});

type FormState = {
  step: 'variant' | 'details' | 'payment' | 'processing';
  variant: BookVariant | null;
  details: z.infer<typeof DetailsSchema> | null;
  paymentMethod: 'cod' | 'prepaid' | null;
  errors: Record<string, string[]> | null;
};

type FormAction =
  | { type: 'SET_VARIANT'; payload: BookVariant }
  | { type: 'SET_DETAILS'; payload: z.infer<typeof DetailsSchema> }
  | { type: 'SET_PAYMENT_METHOD'; payload: 'cod' | 'prepaid' }
  | { type: 'SET_ERRORS'; payload: Record<string, string[]> | null }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SET_PROCESSING' }
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
  errors: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_VARIANT':
      return { ...state, variant: action.payload, errors: null };
    case 'SET_DETAILS':
      return { ...state, details: action.payload, errors: null };
    case 'SET_FORM_VALUE':
      return { ...state, details: { ...state.details!, [action.payload.field]: action.payload.value } };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'NEXT_STEP': {
      if (state.step === 'variant') return { ...state, step: 'details' };
      if (state.step === 'details') return { ...state, step: 'payment' };
      return state;
    }
    case 'PREVIOUS_STEP': {
        if (state.step === 'payment') return { ...state, step: 'details' };
        if (state.step === 'details') return { ...state, step: 'variant' };
        return state;
    }
    case 'SET_PROCESSING':
        return { ...state, step: 'processing' };
    default:
      return state;
  }
}

const variantDetails: Record<BookVariant, { name: string; icon: React.ElementType, description: string }> = {
    paperback: { name: 'Paperback', icon: Book, description: "The classic physical copy." },
    hardcover: { name: 'Hardcover', icon: Book, description: "A durable, premium edition." },
    ebook: { name: 'E-book', icon: Download, description: "Read instantly on any device." },
}

export function OrderForm({ stock }: { stock: Stock }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { priceData, loading: priceLoading } = useLocation();

  const [state, dispatch] = useReducer(formReducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Set initial country from location data
  useEffect(() => {
    if (priceData?.country) {
      dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'country', value: priceData.country }})
    }
  }, [priceData?.country]);

  // Set initial user details
  useEffect(() => {
      if(user) {
        dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'name', value: user.displayName || '' }})
        dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'email', value: user.email || '' }})
      }
  }, [user]);

  // Handle payment status from URL
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: `Your payment could not be completed. Reason: ${error}`,
      });
      router.replace('/checkout'); // Clear URL params
    }
     if (success) {
      const orderId = searchParams.get('orderId');
      toast({
        title: 'Order Placed!',
        description: `Your order ID is ${orderId}.`,
      });
      // Redirect handled by the server action or callback
    }
  }, [searchParams, toast, router]);


  // Handle Pincode Auto-fill
  const handlePincodeChange = async (pinCode: string) => {
    dispatch({ type: 'SET_FORM_VALUE', payload: { field: 'pinCode', value: pinCode } });
    if (pinCode.length !== 6 || priceData?.country !== 'IN') {
        setPincodeError(null);
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
  const handleVariantSelect = (variant: BookVariant) => {
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
    const needsAddress = state.variant !== 'ebook';
    
    let validationSchema;
    if (needsAddress) {
        validationSchema = DetailsSchema.refine(data => data.phone, { message: 'Phone is required for physical orders' })
                         .refine(data => data.address, { message: 'Address is required for physical orders' })
                         .refine(data => data.city, { message: 'City is required for physical orders' })
                         .refine(data => data.country, { message: 'Country is required for physical orders' })
                         .refine(data => data.state, { message: 'State is required for physical orders' })
                         .refine(data => data.pinCode, { message: 'PIN code is required for physical orders' });
    } else {
        validationSchema = DetailsSchema.pick({ name: true, email: true });
    }

    const result = validationSchema.safeParse(state.details);
    
    if (result.success) {
        dispatch({ type: 'SET_DETAILS', payload: result.data });
        dispatch({ type: 'NEXT_STEP' });
    } else {
        dispatch({ type: 'SET_ERRORS', payload: result.error.flatten().fieldErrors });
    }
  };

  const handlePaymentSubmit = async () => {
    if (!state.variant || !state.details || !state.paymentMethod) return;
    
    setIsSubmitting(true);
    dispatch({ type: 'SET_PROCESSING' });

    const orderPayload = {
        variant: state.variant,
        ...state.details,
        userId: user?.uid,
    };

    if (state.paymentMethod === 'cod') {
        const result = await placeOrder({
            ...orderPayload,
            paymentMethod: 'cod',
        });

        if (result.success && result.orderId) {
            toast({ title: 'Order Placed!', description: `Your order ID is ${result.orderId}.` });
            router.push(`/orders?success=true&orderId=${result.orderId}`);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
            dispatch({ type: 'PREVIOUS_STEP' }); // Go back to payment step
        }
    } else if (state.paymentMethod === 'prepaid') {
        try {
            // Set cookie for callback
            document.cookie = `orderDetails=${JSON.stringify(orderPayload)}; path=/; max-age=600; SameSite=Lax`;

            const paymentResult = await processPayment(orderPayload);
            window.location.href = paymentResult.redirectUrl;
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Payment Error', description: e.message || 'Failed to initiate payment.' });
            dispatch({ type: 'PREVIOUS_STEP' });
        }
    }
    setIsSubmitting(false);
  };
  
  if (state.step === 'processing' || isSubmitting) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 my-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Processing your request...</p>
        </div>
    )
  }

  const renderStepContent = () => {
    switch(state.step) {
        case 'variant':
            return (
                 <Card className="border-none shadow-none">
                    <CardHeader>
                        <CardTitle>1. Select Book Type</CardTitle>
                        <CardDescription>Choose the version of the book you&apos;d like to order.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {state.errors?.variant && <Alert variant="destructive"><AlertDescription>{state.errors.variant[0]}</AlertDescription></Alert>}
                         {priceLoading || !priceData ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(Object.keys(variantDetails) as BookVariant[]).map(variant => {
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
                            {state.variant === 'ebook' ? "Enter your details to receive the e-book." : "Enter your shipping information."}
                        </CardDescription>
                    </CardHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" required value={state.details?.name} onChange={e => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'name', value: e.target.value}})} />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" required value={state.details?.email} onChange={e => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'email', value: e.target.value}})} />
                            {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
                        </div>
                    </div>
                    {state.variant !== 'ebook' && (
                    <>
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
                            <div className="relative">
                                <Input id="pinCode" name="pinCode" required value={state.details?.pinCode} onChange={(e) => handlePincodeChange(e.target.value)} />
                                {isPincodeLoading && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin" />}
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
                            <Input id="country" name="country" required value={state.details?.country} readOnly />
                            {state.errors?.country && <p className="text-sm text-destructive">{state.errors.country[0]}</p>}
                        </div>
                    </div>
                    {user && (
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="save-address" name="saveAddress" checked={state.details?.saveAddress} onCheckedChange={checked => dispatch({type: 'SET_FORM_VALUE', payload: {field: 'saveAddress', value: !!checked}})} />
                            <Label htmlFor="save-address" className="font-normal text-muted-foreground">Save this address for future orders</Label>
                        </div>
                    )}
                    </>
                )}
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => dispatch({type: 'PREVIOUS_STEP'})} className="w-full">Back</Button>
                    <Button type="submit" className="w-full">Proceed to Payment <ArrowRight className="ml-2 h-4 w-4"/></Button>
                </div>
                </form>
            );

        case 'payment':
            if (priceLoading || !priceData || !state.variant) return <div className="text-center"><Loader2 className="animate-spin"/></div>
            return (
                <div>
                    <Card className="border-none shadow-none">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle>3. Payment Method</CardTitle>
                            <CardDescription>
                                Total amount: {new Intl.NumberFormat(getLocaleFromCountry(priceData.country), { style: 'currency', currency: priceData.currencyCode }).format(priceData[state.variant])}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-0">
                            <RadioGroup 
                                name="paymentMethod" 
                                className="space-y-4"
                                onValueChange={(val) => dispatch({ type: 'SET_PAYMENT_METHOD', payload: val as 'cod' | 'prepaid' })}
                                defaultValue={state.paymentMethod || undefined}
                            >
                                <Label className="flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:bg-secondary has-[[data-state=checked]]:border-primary transition-all">
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
                             <div className="flex flex-col sm:flex-row gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => dispatch({type: 'PREVIOUS_STEP'})} className="w-full">Back</Button>
                                <Button onClick={handlePaymentSubmit} disabled={!state.paymentMethod || isSubmitting} className="w-full">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (state.paymentMethod === 'cod' ? 'Place Order' : 'Pay Now')}
                                </Button>
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

    
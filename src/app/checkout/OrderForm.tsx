
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { placeOrder, type State } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Truck, CreditCard, Book, Package, Download, CheckCircle, Circle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import type { Stock, BookVariant } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLocation } from '@/hooks/useLocation';
import { Badge } from '@/components/ui/badge';


// Types for the API responses
interface Country {
  name: string;
  iso2: string;
}

interface StateData {
    name: string;
    iso2: string;
}

const variantDetails: Record<BookVariant, { name: string; icon: React.ElementType, description: string }> = {
    paperback: { name: 'Paperback', icon: Book, description: "The classic physical copy." },
    hardcover: { name: 'Hardcover', icon: Book, description: "A durable, premium edition." },
    ebook: { name: 'E-book', icon: Download, description: "Read instantly on any device." },
}

export function OrderForm({ stock }: { stock: Stock }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { priceData, loading: priceLoading } = useLocation();
  const initialState: State = { message: null, errors: {}, step: 'variant' };
  const [state, dispatch] = useActionState(placeOrder, initialState);
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [pinCode, setPinCode] = useState('');
  
  const [city, setCity] = useState('');
  const [autoFilledState, setAutoFilledState] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  
  const savedAddresses: any[] = []; 

  const [isLoading, setIsLoading] = useState({
      countries: true,
      states: false,
      pin: false
  });
  
  const [selectedVariant, setSelectedVariant] = useState<BookVariant | null>(null);

  const getLocaleFromCountry = (countryCode: string | undefined) => {
    if (!countryCode) return 'en-US';
    return countryCode;
  }

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/iso');
        const data = await response.json();
        if (!data.error) {
          setCountries(data.data);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load countries.' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch countries.' });
      } finally {
        setIsLoading(p => ({...p, countries: false}));
      }
    };
    fetchCountries();
  }, [toast]);

  // Fetch states when a country is selected
  useEffect(() => {
    if (!selectedCountry) return;
    const countryName = countries.find(c => c.iso2 === selectedCountry)?.name;
    if (!countryName) return;

    const fetchStates = async () => {
      setIsLoading(p => ({...p, states: true}));
      try {
        const response = await fetch(`https://countriesnow.space/api/v0.1/countries/states`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: countryName })
        });
        const data = await response.json();
        if (!data.error) {
            setStates(data.data.states);
        } else {
            setStates([]); // Clear states if country has none or API fails
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch states.' });
        setStates([]);
      } finally {
        setIsLoading(p => ({...p, states: false}));
      }
    };
    fetchStates();
  }, [selectedCountry, countries, toast]);
  
  // Handle Pincode lookup
  useEffect(() => {
    if (pinCode.length >= 5 && selectedCountry) {
        const fetchPinDetails = async () => {
            setIsLoading(p => ({...p, pin: true}));
            try {
                const response = await fetch(`https://api.zippopotam.us/${selectedCountry}/${pinCode}`);
                if (response.ok) {
                    const data = await response.json();
                    setCity(data.places[0]['place name']);
                    setAutoFilledState(data.places[0]['state']);
                } else {
                    setCity('');
                    setAutoFilledState('');
                }
            } catch (error) {
                setCity('');
                setAutoFilledState('');
            } finally {
                setIsLoading(p => ({...p, pin: false}));
            }
        };
        fetchPinDetails();
    }
  }, [pinCode, selectedCountry]);

  useEffect(() => {
    if (state.message && state.step !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
    if (state.step === 'success' && state.orderId) {
      toast({
        title: 'Order Placed!',
        description: `Your order ID is ${state.orderId}.`,
      });
      router.push(`/orders`);
    }
  }, [state, router, toast]);

  if(state.step === 'variant') {
     const localPrices = {
        paperback: priceData?.paperback || 299,
        hardcover: priceData?.hardcover || 499,
        ebook: priceData ? Math.ceil(priceData.paperback * 0.5) : 149
     }

    return (
        <form action={dispatch}>
             <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle>Select Book Type</CardTitle>
                    <CardDescription>Choose the version of the book you'd like to order.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {state.errors?.variant && <p className="text-sm text-destructive -mt-4 mb-2">{state.errors.variant[0]}</p>}
                    
                    <input type="hidden" name="variant" value={selectedVariant || ''} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(Object.keys(variantDetails) as BookVariant[]).map(variant => {
                            const isAvailable = stock[variant] > 0;
                            const isSelected = selectedVariant === variant;
                            const { name, icon: Icon, description } = variantDetails[variant];
                            const price = localPrices[variant];
                            const formattedPrice = priceLoading || !priceData ? '...' : new Intl.NumberFormat(getLocaleFromCountry(priceData.country), { style: 'currency', currency: priceData.currencyCode }).format(price);

                            return (
                                <div 
                                    key={variant} 
                                    onClick={() => isAvailable && setSelectedVariant(variant)}
                                    className={cn(
                                        "relative rounded-lg border-2 p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center",
                                        isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/50",
                                        !isAvailable && "opacity-50 cursor-not-allowed bg-muted/50"
                                    )}
                                >
                                    {isSelected && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />}
                                    {!isSelected && <Circle className="absolute top-2 right-2 h-5 w-5 text-muted-foreground/50" />}
                                    
                                    <Icon className="h-10 w-10 mb-2 text-primary"/>
                                    <p className="font-bold text-lg">{name}</p>
                                    <p className="font-semibold text-xl font-headline text-primary">{formattedPrice}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                                    {!isAvailable && <Badge variant="destructive" className="mt-2">Out of Stock</Badge>}
                                </div>
                            )
                        })}
                    </div>

                    <SubmitButton text="Proceed" disabled={!selectedVariant} />
                </CardContent>
            </Card>
        </form>
    )
  }

  if (state.step === 'address' && state.variantData && priceData) {
     const variant: BookVariant = JSON.parse(state.variantData).variant;
     const localPrices = {
        paperback: priceData.paperback,
        hardcover: priceData.hardcover,
        ebook: Math.ceil(priceData.paperback * 0.5)
     }
     const price = localPrices[variant];
     const formattedPrice = new Intl.NumberFormat(getLocaleFromCountry(priceData.country), { style: 'currency', currency: priceData.currencyCode }).format(price);


     return (
        <form action={dispatch} className="space-y-4">
            <input type="hidden" name="variantData" value={state.variantData} />
            <Alert>
                <Package className="h-4 w-4" />
                <AlertTitle>You're ordering: {variantDetails[variant].name}</AlertTitle>
                <AlertDescription>Total Amount: {formattedPrice}</AlertDescription>
            </Alert>
            
           {user && (
             <div className="space-y-4 rounded-md border p-4 bg-secondary/50">
                <h3 className="font-semibold">Shipping Address</h3>
                {savedAddresses.length > 0 && (
                    <div className="flex items-center space-x-2">
                        <Checkbox id="use-saved-address" checked={useSavedAddress} onCheckedChange={(checked) => setUseSavedAddress(!!checked)} />
                        <Label htmlFor="use-saved-address">Use a saved address</Label>
                    </div>
                )}
             </div>
           )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required defaultValue={user?.displayName || ''} />
              {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required defaultValue={user?.email || ''} />
               {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 555-5555" required />
            {state.errors?.phone && <p className="text-sm text-destructive">{state.errors.phone[0]}</p>}
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select name="country" onValueChange={setSelectedCountry} required value={selectedCountry}>
                    <SelectTrigger disabled={isLoading.countries}>
                        <SelectValue placeholder={isLoading.countries ? "Loading countries..." : "Select a country"} />
                    </SelectTrigger>
                    <SelectContent>
                        {countries.map(country => (
                            <SelectItem key={country.iso2} value={country.iso2}>{country.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {state.errors?.country && <p className="text-sm text-destructive">{state.errors.country[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pinCode">PIN Code / ZIP Code</Label>
              <div className='relative'>
                 <Input id="pinCode" name="pinCode" placeholder="10001" required value={pinCode} onChange={(e) => setPinCode(e.target.value)} disabled={!selectedCountry}/>
                 {isLoading.pin && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/>}
              </div>
              {state.errors?.pinCode && <p className="text-sm text-destructive">{state.errors.pinCode[0]}</p>}
            </div>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="e.g. New York" required value={city} onChange={e => setCity(e.target.value)} />
                {state.errors?.city && <p className="text-sm text-destructive">{state.errors.city[0]}</p>}
            </div>
            <div className="space-y-2">
                 <Label htmlFor="state">State</Label>
                 <Select name="state" required disabled={isLoading.states || !selectedCountry || states.length === 0} value={autoFilledState}>
                    <SelectTrigger>
                        <SelectValue placeholder={isLoading.states ? 'Loading states...' : (states.length > 0 ? 'Select a state' : 'No states found')} />
                    </SelectTrigger>
                    <SelectContent>
                         {states.map(s => (
                            <SelectItem key={s.iso2} value={s.name}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {state.errors?.state && <p className="text-sm text-destructive">{state.errors.state[0]}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" placeholder="123 Main Street" required />
            {state.errors?.address && <p className="text-sm text-destructive">{state.errors.address[0]}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="street">Apartment, suite, etc. (optional)</Label>
            <Input id="street" name="street" placeholder="Apt #4B" />
          </div>

          {user && (
             <div className="flex items-center space-x-2">
                <Checkbox id="save-address" checked={saveAddress} onCheckedChange={(checked) => setSaveAddress(!!checked)} />
                <Label htmlFor="save-address">Save this address for future orders</Label>
                <input type="hidden" name="saveAddress" value={String(saveAddress)} />
             </div>
          )}
          <SubmitButton text="Proceed to Payment" />
        </form>
     )
  }

  if (state.step === 'payment' && state.addressData && priceData) {
     const variant: BookVariant = JSON.parse(state.addressData).variant;
     const localPrices = {
        paperback: priceData.paperback,
        hardcover: priceData.hardcover,
        ebook: Math.ceil(priceData.paperback * 0.5)
     }
     const price = localPrices[variant];
     const formattedPrice = new Intl.NumberFormat(getLocaleFromCountry(priceData.country), { style: 'currency', currency: priceData.currencyCode }).format(price);
     return (
        <form action={dispatch}>
            <input type="hidden" name="addressData" value={state.addressData} />
            {user && <input type="hidden" name="userId" value={user.uid} />}
            <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Total amount to be paid: {formattedPrice}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <RadioGroup name="paymentMethod" defaultValue="cod" className="space-y-4">
                        <Label className="flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:bg-secondary has-[[data-state=checked]]:border-primary transition-all">
                             <RadioGroupItem value="cod" id="cod" />
                             <div className="flex-grow">
                                <span className="font-semibold flex items-center gap-2"><Truck/> Cash on Delivery</span>
                                <p className="text-sm text-muted-foreground">Pay with cash upon delivery.</p>
                             </div>
                        </Label>
                        <Label className="flex items-center gap-4 rounded-md border p-4 cursor-not-allowed opacity-50">
                             <RadioGroupItem value="prepaid" id="prepaid" disabled />
                              <div className="flex-grow">
                                <span className="font-semibold flex items-center gap-2"><CreditCard /> Prepaid</span>
                                <p className="text-sm text-muted-foreground">Pay with card, UPI, etc. (Currently unavailable)</p>
                             </div>
                        </Label>
                    </RadioGroup>
                    <SubmitButton text="Place Order"/>
                </CardContent>
            </Card>
        </form>
     )
  }

  return (
    <div className='text-center'>
        <p>Something went wrong. Please refresh and try again.</p>
        <Button onClick={() => router.refresh()} className='mt-4'>Refresh</Button>
    </div>
  )
}

function SubmitButton({text, disabled = false}: {text: string, disabled?: boolean}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} className="w-full cta-button" size="lg">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
         {text}
         <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

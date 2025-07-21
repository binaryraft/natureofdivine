'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { placeOrder, type State } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, CreditCard, Truck, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// A simple hardcoded list of countries and their states.
const countries = [
    { name: 'United States', code: 'US', states: ['California', 'Texas', 'Florida', 'New York'] },
    { name: 'India', code: 'IN', states: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu'] },
    { name: 'Canada', code: 'CA', states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'] },
];


export function OrderForm() {
  const router = useRouter();
  const { toast } = useToast();
  const initialState: State = { message: null, errors: {}, step: 'address' };
  const [state, dispatch] = useFormState(placeOrder, initialState);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [states, setStates] = useState<string[]>([]);
  
  useEffect(() => {
    if (state.message && state.step !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
    if (state.step === 'success' && state.orderId) {
      router.push(`/order/success?orderId=${state.orderId}`);
    }
  }, [state, router, toast]);
  
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const country = countries.find(c => c.code === countryCode);
    setStates(country ? country.states : []);
  };


  if (state.step === 'payment') {
     return (
        <form action={dispatch}>
            <input type="hidden" name="formData" value={state.formData} />
            <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Choose how you'd like to pay.</CardDescription>
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
    <form action={dispatch} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" placeholder="John Doe" required />
          {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
           {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 555-5555" required />
        {state.errors?.phone && <p className="text-sm text-destructive">{state.errors.phone[0]}</p>}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select name="country" onValueChange={handleCountryChange} required>
                <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                    {countries.map(country => (
                        <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {state.errors?.country && <p className="text-sm text-destructive">{state.errors.country[0]}</p>}
        </div>
        <div className="space-y-2">
             <Label htmlFor="state">State</Label>
             <Select name="state" required disabled={!selectedCountry}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                     {states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {state.errors?.state && <p className="text-sm text-destructive">{state.errors.state[0]}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pinCode">PIN Code / ZIP Code</Label>
          <Input id="pinCode" name="pinCode" placeholder="10001" required />
          {state.errors?.pinCode && <p className="text-sm text-destructive">{state.errors.pinCode[0]}</p>}
        </div>
      </div>
      <SubmitButton text="Proceed to Payment" />
    </form>
  );
}

function SubmitButton({text}: {text: string}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full cta-button" size="lg">
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

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { placeOrder, type State } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart } from 'lucide-react';

export function OrderForm() {
  const router = useRouter();
  const { toast } = useToast();
  const initialState: State = { message: null, errors: {} };
  const [state, dispatch] = useFormState(placeOrder, initialState);

  useEffect(() => {
    if (state.message && !state.orderId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
    if (state.message && state.orderId) {
      router.push(`/order/success?orderId=${state.orderId}`);
    }
  }, [state, router, toast]);

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
          <Label htmlFor="pinCode">PIN Code / ZIP Code</Label>
          <Input id="pinCode" name="pinCode" placeholder="10001" required />
          {state.errors?.pinCode && <p className="text-sm text-destructive">{state.errors.pinCode[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" placeholder="USA" required />
          {state.errors?.country && <p className="text-sm text-destructive">{state.errors.country[0]}</p>}
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Placing Order...
        </>
      ) : (
        <>
         <ShoppingCart className="mr-2 h-4 w-4" />
          Place Order
        </>
      )}
    </Button>
  );
}

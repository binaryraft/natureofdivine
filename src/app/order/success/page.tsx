'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto py-12 md:py-24 flex items-center justify-center">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-headline">Thank You for Your Order!</CardTitle>
          <CardDescription>
            Your order has been placed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orderId ? (
            <p className="text-lg">
              Your Order ID is: <strong className="font-mono text-primary">{orderId}</strong>
            </p>
          ) : (
            <p className="text-lg text-muted-foreground">Your order is being processed.</p>
          )}
          <p className="text-muted-foreground mt-2">
            You will receive an email confirmation shortly. You can use your Order ID to track the status.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/order-status">Track My Order</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

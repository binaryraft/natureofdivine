
'use client';

import { OrderForm } from './OrderForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense, useEffect, useState } from 'react';
import { getStock } from '@/lib/stock-store';
import { Loader2 } from 'lucide-react';
import type { Stock } from '@/lib/definitions';

function CheckoutPageContent() {
    const [stock, setStock] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStock() {
            try {
                const fetchedStock = await getStock();
                setStock(fetchedStock);
            } catch (error) {
                console.error("Failed to load stock");
            } finally {
                setLoading(false);
            }
        }
        loadStock();
    }, []);

    if (loading || !stock) {
        return (
            <div className="container mx-auto py-12 md:py-24 max-w-3xl text-center">
                <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-12 md:py-16 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Secure Checkout</CardTitle>
              <CardDescription>
                Fill out the form below to get a copy of "Nature of the Divine" delivered to your doorstep.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderForm stock={stock} />
            </CardContent>
          </Card>
        </div>
    );
}


export function CheckoutClient() {
    return (
        <Suspense fallback={
            <div className="container mx-auto py-12 md:py-24 max-w-3xl text-center">
                <div className="flex justify-center items-center">
                     <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <CheckoutPageContent/>
        </Suspense>
    )
}

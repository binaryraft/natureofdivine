'use client';

import { ConversationalCheckout } from './ConversationalCheckout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense, useEffect, useState } from 'react';
import { getStock } from '@/lib/stock-store';
import { getServiceableCountries } from '@/lib/envia-service';
import { Loader2 } from 'lucide-react';
import type { Stock } from '@/lib/definitions';


function CheckoutPageContent() {
    // Initialize with optimistic stock to render immediately
    const [stock, setStock] = useState<Stock>({ paperback: 100, hardcover: 100, ebook: 99999 });
    const [loading, setLoading] = useState(false); // No global loading state needed

    useEffect(() => {
        async function loadData() {
            try {
                const fetchedStock = await getStock();
                if (fetchedStock) {
                    setStock(fetchedStock);
                }
            } catch (error) {
                console.error("Failed to load stock data:", error);
                // Keep default stock
            }
        }
        loadData();
    }, []);

    // Removed the loading check block entirely since we start with default stock

    return (
        <div className="container mx-auto py-12 md:py-16 max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Secure Checkout</CardTitle>
                    <CardDescription>
                        Fill out the form below to get a copy of "Nature of the Divine" delivered to your doorstep.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ConversationalCheckout stock={stock} />
                </CardContent>
            </Card>
        </div>
    );
}


export function CheckoutClient() {
    return (
        <Suspense fallback={
            <div className="container mx-auto py-12 md:py-24 max-w-3xl">
                <Card>
                    <CardContent className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </CardContent>
                </Card>
            </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    )
}

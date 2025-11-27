'use client';

import { OrderForm } from './OrderForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense, useEffect, useState } from 'react';
import { getStock } from '@/lib/stock-store';
import { getServiceableCountries } from '@/lib/envia-service';
import { Loader2 } from 'lucide-react';
import type { Stock } from '@/lib/definitions';

// Preload countries immediately when this module loads
const countriesPromise = getServiceableCountries();

function CheckoutPageContent() {
    const [stock, setStock] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // Load stock and trigger country cache in parallel
                const [fetchedStock] = await Promise.all([
                    getStock(),
                    countriesPromise, // This ensures countries are cached
                ]);
                setStock(fetchedStock);
            } catch (error) {
                console.error("Failed to load checkout data:", error);
                // Set default stock to allow checkout to proceed
                setStock({ paperback: 100, hardcover: 100, ebook: 100 });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading || !stock) {
        return (
            <div className="container mx-auto py-12 md:py-24 max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">Secure Checkout</CardTitle>
                        <CardDescription>
                            Fill out the form below to get a copy of "Nature of the Divine" delivered to your doorstep.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center py-12">
                        <div className="text-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                            <p className="text-sm text-muted-foreground">Loading checkout...</p>
                        </div>
                    </CardContent>
                </Card>
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


import { Metadata } from 'next';
import { Suspense } from 'react';
import { ShopClient } from './ShopClient';
import { fetchProductsAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Shop | Nature of the Divine',
    description: 'Order spiritual artifacts and products directly.',
};

export default async function ShopPage() {
    const products = await fetchProductsAction(true); // Fetch only active products

    return (
        <main className="min-h-screen bg-background pt-24 pb-12">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <h1 className="text-4xl font-headline font-bold mb-4">Divine Shop</h1>
                    <p className="text-muted-foreground text-lg">
                        Explore our collection of spiritual offerings. Order simply by providing your details.
                    </p>
                </div>
                <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>}>
                    <ShopClient initialProducts={products} />
                </Suspense>
            </div>
        </main>
    );
}

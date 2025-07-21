
'use client';

import { useEffect, useState } from 'react';
import { fetchLocationAndPrice, PriceData } from '@/lib/fetch-location-price';
import { Skeleton } from './ui/skeleton';
import { Book, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'paperback' | 'hardcover';

function PriceSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-16 w-48" />
            <div className="flex gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
}

export function HomePrice() {
    const [priceData, setPriceData] = useState<PriceData | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<Variant>('paperback');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getPrice() {
            try {
                const data = await fetchLocationAndPrice();
                setPriceData(data);
            } catch (error) {
                console.error("Failed to fetch price data", error);
                // Fallback to default INR prices
                setPriceData({
                    paperback: 299,
                    hardcover: 499,
                    symbol: '₹',
                    country: 'IN',
                });
            } finally {
                setLoading(false);
            }
        }
        getPrice();
    }, []);

    if (loading || !priceData) {
        return <PriceSkeleton />;
    }
    
    const displayPrice = selectedVariant === 'paperback' ? priceData.paperback : priceData.hardcover;

    return (
        <div className="space-y-4">
             <div className="text-6xl font-bold text-foreground font-headline">
                {priceData.symbol}{displayPrice}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div 
                    onClick={() => setSelectedVariant('paperback')}
                    className={cn(
                        "relative flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all",
                        selectedVariant === 'paperback' ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
                    )}
                >
                    <Book className="h-6 w-6 text-primary" />
                    <div>
                        <p className="font-semibold">Paperback</p>
                        <p className="text-xs text-muted-foreground">{priceData.symbol}{priceData.paperback}</p>
                    </div>
                    {selectedVariant === 'paperback' && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />}
                </div>

                <div 
                    onClick={() => setSelectedVariant('hardcover')}
                    className={cn(
                        "relative flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all",
                        selectedVariant === 'hardcover' ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
                    )}
                >
                    <Book className="h-6 w-6 text-primary" />
                    <div>
                        <p className="font-semibold">Hardcover</p>
                        <p className="text-xs text-muted-foreground">{priceData.symbol}{priceData.hardcover}</p>
                    </div>
                     {selectedVariant === 'hardcover' && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />}
                </div>
            </div>
        </div>
    );
}

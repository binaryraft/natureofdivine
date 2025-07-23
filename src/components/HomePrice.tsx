
'use client';

import { useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { Book, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/hooks/useLocation';

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
    const { priceData, loading } = useLocation();
    const [selectedVariant, setSelectedVariant] = useState<Variant>('paperback');

    if (loading || !priceData) {
        return <PriceSkeleton />;
    }
    
    const displayPrice = selectedVariant === 'paperback' ? priceData.paperback : priceData.hardcover;

    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: priceData.currencyCode,
        minimumFractionDigits: 2,
    }).format(displayPrice);
    
    const formattedPaperback = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: priceData.currencyCode,
        minimumFractionDigits: 2,
    }).format(priceData.paperback);

     const formattedHardcover = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: priceData.currencyCode,
        minimumFractionDigits: 2,
    }).format(priceData.hardcover);

    return (
        <div className="space-y-4">
             <div className="text-6xl font-bold text-foreground font-headline">
                {formattedPrice}
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
                        <p className="text-xs text-muted-foreground">{formattedPaperback}</p>
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
                        <p className="text-xs text-muted-foreground">{formattedHardcover}</p>
                    </div>
                     {selectedVariant === 'hardcover' && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />}
                </div>
            </div>
        </div>
    );
}

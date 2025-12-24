'use client';

import { useState, useEffect } from 'react';
import { Gift, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useSeasonalTheme } from '@/hooks/useSeasonalTheme';
import { AnimatePresence, motion } from 'framer-motion';

export function ChristmasGift() {
    const theme = useSeasonalTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (theme === 'christmas') {
            // Delay appearance for effect
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [theme]);

    if (!isVisible) return null;

    const discountCode = "CHRISTMAS25";

    const handleCopy = () => {
        navigator.clipboard.writeText(discountCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <>
            {/* Floating Gift Button */}
            <div className="fixed bottom-20 right-4 z-40 md:bottom-8 md:right-8">
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative group flex items-center justify-center p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 animate-bounce-slow"
                    aria-label="Christmas Gift"
                >
                    <Gift className="h-8 w-8" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                </button>
            </div>

            {/* Gift Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md border-red-200 bg-[url('https://www.transparenttextures.com/patterns/snow.png')] bg-red-50/95 backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-red-500 to-green-500" />
                    <DialogHeader>
                        <DialogTitle className="text-center text-3xl font-serif text-red-700 pt-4">
                            🎄 Merry Christmas! 🎄
                        </DialogTitle>
                        <DialogDescription className="text-center text-lg text-gray-700 pt-2">
                            Celebrate the season of giving with a special gift from us.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center space-y-4 py-6">
                        <div className="bg-white p-6 rounded-xl shadow-inner border border-red-100 w-full text-center">
                            <p className="text-sm text-gray-500 mb-2 uppercase tracking-wider font-semibold">Your Promo Code</p>
                            <div className="flex items-center justify-between bg-red-100 rounded-lg p-3 border border-red-200">
                                <code className="text-2xl font-bold text-red-800 tracking-widest">{discountCode}</code>
                                <Button size="sm" variant="ghost" className="hover:bg-red-200 hover:text-red-900" onClick={handleCopy}>
                                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-red-600 mt-2 font-medium">Get 25% off your entire order!</p>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                            onClick={() => setIsOpen(false)}
                        >
                            Shop Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

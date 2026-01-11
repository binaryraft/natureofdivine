'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { addDonation } from '@/lib/donation-store';
import { useLocation } from '@/hooks/useLocation';

export function DonationHero({
    initialTotal,
    liveMessage
}: {
    initialTotal: number,
    liveMessage?: { name: string, text: string } | null
}) {
    const { priceData } = useLocation();
    const currency = priceData?.symbol || '$';

    const [amount, setAmount] = useState('');
    const [total, setTotal] = useState(initialTotal);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    const handleDonation = async () => {
        const val = parseFloat(amount);
        if (!val || val <= 0) return;

        setStatus('processing');
        await new Promise(r => setTimeout(r, 1500));
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
            await addDonation(val);
            setTotal(prev => prev + val);
            setStatus('success');
            setAmount('');
            setTimeout(() => setStatus('idle'), 3000);
        } else {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-background to-muted/20 border border-white/10 shadow-2xl">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center justify-between">

                {/* Left: Ticker & Message Feed (Visual Interest) */}
                <div className="w-full md:w-1/2 space-y-8 order-2 md:order-1">
                    <div className="relative h-[200px] flex flex-col justify-center">
                        <div className="absolute top-0 left-0 text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase opacity-70">
                            Live Community Signal
                        </div>

                        {liveMessage ? (
                            <motion.div
                                key={liveMessage.text}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="relative pl-6 border-l-2 border-primary/30"
                            >
                                <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                                    {liveMessage.name}
                                </div>
                                <div className="text-2xl md:text-3xl font-light text-foreground leading-tight italic">
                                    "{liveMessage.text}"
                                </div>
                            </motion.div>
                        ) : (
                            <div className="text-muted-foreground/40 italic pl-6 border-l-2 border-white/5 space-y-2">
                                <p>Awaiting transmission...</p>
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-current rounded-full animate-bounce delay-0" />
                                    <span className="w-1 h-1 bg-current rounded-full animate-bounce delay-100" />
                                    <span className="w-1 h-1 bg-current rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Donation Action (The Hook) */}
                <div className="w-full md:w-[420px] order-1 md:order-2">
                    <div className="bg-muted/10 backdrop-blur-sm border border-white/5 rounded-2xl p-8 text-center space-y-6 relative overflow-hidden group hover:border-white/10 transition-colors">

                        {/* Status Indicator */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-20" />

                        <div>
                            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4 animate-pulse-slow">
                                <Heart className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-5xl md:text-6xl font-headline font-bold tracking-tight text-foreground flex justify-center items-baseline gap-1">
                                <span className="text-2xl text-muted-foreground font-light px-1">{currency}</span>
                                {total.toLocaleString()}
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed px-4">
                            Hello, we took a step forward expanding as a space for sharing thoughts about divinity.
                            A community of true and real people. Spending time here actually aligns people to the center.
                            Something valuable.
                        </p>

                        <div className="space-y-3 pt-2">
                            <div className="relative group/input">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">{currency}</span>
                                <Input
                                    type="number"
                                    placeholder="Contribution amount..."
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="h-12 pl-8 bg-background/50 border-white/10 focus:border-primary/50 text-center text-lg" // Center text for focus
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {status === 'idle' && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                        <Button
                                            size="lg"
                                            className="w-full h-12 font-bold tracking-wide shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
                                            onClick={handleDonation}
                                        >
                                            Fuel the Server
                                        </Button>
                                    </motion.div>
                                )}
                                {status === 'processing' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <Button size="lg" disabled className="w-full h-12">
                                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        </Button>
                                    </motion.div>
                                )}
                                {status === 'success' && (
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                                        <Button size="lg" disabled className="w-full h-12 bg-green-600">
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Received with Gratitude
                                        </Button>
                                    </motion.div>
                                )}
                                {status === 'error' && (
                                    <motion.div animate={{ x: [-5, 5, -5, 5, 0] }}>
                                        <Button size="lg" className="w-full h-12 bg-red-600 hover:bg-red-700">
                                            <AlertCircle className="mr-2 h-4 w-4" /> Try Again
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

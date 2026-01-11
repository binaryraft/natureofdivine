'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeDollarSign, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
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

        // Simulate API call
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
        <div className="relative w-full rounded-xl overflow-hidden bg-background border border-border/50 shadow-md">
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch">
                {/* Left: Donation Counter & Messaging */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center space-y-8 bg-muted/5">
                    <div className="space-y-2">
                        <h2 className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Community Distribution</h2>
                        <div className="text-4xl md:text-6xl font-headline font-medium text-foreground tracking-tight tabular-nums flex items-baseline gap-1">
                            <span className="text-2xl md:text-3xl font-light text-muted-foreground self-start mt-2">{currency}</span>
                            {total.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                            Your contributions directly sustain the mesh network and server infrastructure.
                        </p>
                    </div>

                    <div className="space-y-4 max-w-sm">
                        <div className="flex gap-2 relative">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 font-medium">{currency}</span>
                                <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="pl-8 bg-background border-input h-12 text-lg shadow-sm"
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {status === 'idle' && (
                                    <motion.div
                                        key="idle"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    >
                                        <Button
                                            size="lg"
                                            className="h-12 w-32 font-bold tracking-wide shadow-sm"
                                            onClick={handleDonation}
                                        >
                                            Donate
                                        </Button>
                                    </motion.div>
                                )}

                                {status === 'processing' && (
                                    <motion.div
                                        key="processing"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    >
                                        <Button size="lg" disabled className="h-12 w-32 cursor-not-allowed bg-muted text-muted-foreground">
                                            <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        </Button>
                                    </motion.div>
                                )}

                                {status === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                                    >
                                        <Button size="lg" disabled className="h-12 w-32 bg-green-600/90 text-white hover:bg-green-700">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </Button>
                                    </motion.div>
                                )}

                                {status === 'error' && (
                                    <motion.div
                                        key="error"
                                        initial={{ x: 0 }}
                                        animate={{ x: [0, -5, 5, -5, 5, 0], backgroundColor: ["#ef4444", "#dc2626", "#ef4444"] }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <Button size="lg" className="h-12 w-32 bg-red-600 hover:bg-red-700 text-white border-0">
                                            <AlertCircle className="h-5 w-5" />
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right: Live Data Ticker */}
                <div className="w-full lg:w-[420px] bg-muted/20 border-t lg:border-t-0 lg:border-l border-border min-h-[200px] flex flex-col p-6 md:p-8 justify-center relative overflow-hidden">
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-80">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Live Feed</span>
                    </div>

                    {liveMessage ? (
                        <motion.div
                            key={liveMessage.text}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-2 z-10"
                        >
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <span className="h-0.5 w-4 bg-primary/50"></span>
                                {liveMessage.name}
                            </div>
                            <div className="text-lg md:text-xl font-medium text-foreground leading-relaxed italic">
                                "{liveMessage.text}"
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center space-y-3 opacity-30 z-10">
                            <div className="text-sm font-medium">Waiting for transmission...</div>
                            <div className="flex justify-center gap-1">
                                <div className="h-1 w-1 bg-foreground rounded-full animate-bounce delay-0" />
                                <div className="h-1 w-1 bg-foreground rounded-full animate-bounce delay-100" />
                                <div className="h-1 w-1 bg-foreground rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    )}

                    {/* Subtle BG Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 10% 20%, currentColor 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

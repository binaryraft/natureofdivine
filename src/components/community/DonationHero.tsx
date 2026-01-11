'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeDollarSign, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { addDonation } from '@/lib/donation-store';

export function DonationHero({
    initialTotal,
    liveMessage
}: {
    initialTotal: number,
    liveMessage?: { name: string, text: string } | null
}) {
    const [amount, setAmount] = useState('');
    const [total, setTotal] = useState(initialTotal);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    const handleDonation = async () => {
        const val = parseFloat(amount);
        if (!val || val <= 0) return;

        setStatus('processing');

        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));

        // 80% Success Rate for demo
        const isSuccess = Math.random() > 0.2;

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
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-8 md:p-12 shadow-2xl border border-white/5">
            {/* Background Effects (Aurora-like) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                {/* Left: Donation Counter & Messaging */}
                <div className="flex-1 space-y-6 text-center md:text-left">
                    <div>
                        <h2 className="text-sm font-semibold tracking-widest text-indigo-300 uppercase mb-2">Community Contributions</h2>
                        <div className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-lg tabular-nums">
                            ${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto md:mx-0">
                        <div className="flex gap-2 relative">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 text-lg focus-visible:ring-indigo-500/50"
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
                                            className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/20"
                                            onClick={handleDonation}
                                        >
                                            <BadgeDollarSign className="mr-2 h-5 w-5" />
                                            Donate
                                        </Button>
                                    </motion.div>
                                )}

                                {status === 'processing' && (
                                    <motion.div
                                        key="processing"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    >
                                        <Button size="lg" disabled className="h-12 px-8 bg-white/10 text-white/70">
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                            Processing
                                        </Button>
                                    </motion.div>
                                )}

                                {status === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                                    >
                                        <Button size="lg" className="h-12 px-8 bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30">
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Thank You!
                                        </Button>
                                    </motion.div>
                                )}

                                {status === 'error' && (
                                    <motion.div
                                        key="error"
                                        initial={{ x: 0 }}
                                        animate={{ x: [0, -10, 10, -10, 10, 0] }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Button size="lg" className="h-12 px-8 bg-red-500 hover:bg-red-600 text-white border-0">
                                            <AlertCircle className="mr-2 h-5 w-5" />
                                            Oops!
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <p className="text-xs text-white/40">Secure payment processing. Every contribution supports the server.</p>
                    </div>
                </div>

                {/* Right: Live Data Ticker */}
                <div className="w-full md:w-[450px]">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col gap-4 relative overflow-hidden h-[180px] justify-center">
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] font-bold tracking-wider text-green-400 uppercase">Live Feed</span>
                        </div>

                        {liveMessage ? (
                            <motion.div
                                key={liveMessage.text}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-1"
                            >
                                <div className="text-xs font-medium text-indigo-300 mb-1">{liveMessage.name} says:</div>
                                <div className="text-lg text-white font-light leading-snug line-clamp-2">
                                    "{liveMessage.text}"
                                </div>
                            </motion.div>
                        ) : (
                            <div className="text-center space-y-2 opacity-50">
                                <div className="text-sm text-indigo-200">Waiting for live signal...</div>
                                <div className="flex justify-center gap-1">
                                    <div className="h-1 w-1 bg-white rounded-full animate-bounce delay-0" />
                                    <div className="h-1 w-1 bg-white rounded-full animate-bounce delay-100" />
                                    <div className="h-1 w-1 bg-white rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        )}

                        {/* Decorative waveform */}
                        <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none flex items-end gap-[2px] justify-center px-4">
                            {Array.from({ length: 40 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-indigo-500 rounded-t-sm"
                                    animate={{ height: [`${10 + Math.random() * 40}%`, `${30 + Math.random() * 60}%`, `${10 + Math.random() * 40}%`] }}
                                    transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

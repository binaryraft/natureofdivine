'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/lib/community-store';
import { trackEvent, initiateDonationPayment, checkDonationStatusAction, fetchLeaderboardAction } from '@/lib/actions';
import { LeaderboardEntry } from '@/lib/donation-store';
import { MessageCircle, Heart, X, Plus, CheckCircle2, AlertCircle, BadgeDollarSign, Crown, Feather, Scroll, BookOpen } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WebRTCChat, WebRTCChatHandle } from '@/components/community/WebRTCChat';
import { useLocation } from '@/hooks/useLocation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export function CommunityClient({ initialPosts, initialDonations }: { initialPosts: Post[], initialDonations: number }) {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { priceData } = useLocation();
    const currency = priceData?.symbol || '$';

    useEffect(() => {
        trackEvent('view_community');
    }, []);

    // State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isDonateOpen, setIsDonateOpen] = useState(false);
    const [totalDonations, setTotalDonations] = useState(initialDonations);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    // Load Leaderboard
    useEffect(() => {
        const loadLeaderboard = async () => {
            const data = await fetchLeaderboardAction();
            setLeaderboard(data);
        };
        loadLeaderboard();
    }, []);

    // Donation State
    const [donationAmount, setDonationAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [donationStatus, setDonationStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    // Ref to Chat for broadcasting
    const chatRef = useRef<WebRTCChatHandle>(null);

    // Check for donation success on return
    useEffect(() => {
        const donationId = searchParams.get('donationId');
        if (donationId && !isChatOpen) { // Avoid double check if already handling
            const verifyDonation = async () => {
                const res = await checkDonationStatusAction(donationId);
                if (res.success && res.trackingId) {
                    setIsChatOpen(true);
                    // Slight delay to allow chat to mount and connect
                    setTimeout(() => {
                        if (chatRef.current) {
                            // Chat logic
                        }
                    }, 2000);

                    // Clean URL
                    router.replace('/community');
                }
            }
            verifyDonation();
        }
    }, [searchParams, router]);

    const handleDonation = async () => {
        const val = parseFloat(donationAmount);
        if (!val || val <= 0) return;
        setDonationStatus('processing');

        // Use logged in ID or generate a temp one
        const userId = user?.uid || `guest_${uuidv4()}`;
        // Use user profile name if logged in and custom name empty, otherwise custom name, or 'Anonymous Soul'
        const finalName = donorName.trim() || user?.displayName || 'Anonymous Soul';

        try {
            const result = await initiateDonationPayment(val, userId, finalName);

            if (result.success && result.redirectUrl) {
                window.location.href = result.redirectUrl;
            } else {
                throw new Error(result.message || "Payment initiation failed");
            }

        } catch (error: any) {
            console.error("Donation error details:", error.message || error);
            setDonationStatus('error');
            setTimeout(() => setDonationStatus('idle'), 3000);
        }
    };



    return (
        <>
            {/* Main Landing View */}
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">

                {/* Background Ambience */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
                </div>

                <div className="z-10 text-center space-y-10 max-w-2xl w-full">

                    {/* Money Count */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                            <BadgeDollarSign className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-bold tracking-[0.3em] text-muted-foreground uppercase opacity-80">
                                Global Contribution
                            </div>
                            <h1 className="text-6xl md:text-8xl font-headline font-medium text-foreground tracking-tighter tabular-nums">
                                <span className="text-4xl text-muted-foreground font-light align-top mr-1">{currency}</span>
                                {totalDonations.toLocaleString()}
                            </h1>
                        </div>
                    </div>

                    {/* Heading */}
                    <h2 className="text-3xl md:text-4xl font-light text-foreground/90 tracking-wide">
                        Bring More Light
                    </h2>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto pt-6">
                        <Button
                            size="lg"
                            className="h-14 px-8 text-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all w-full sm:w-auto"
                            onClick={() => setIsDonateOpen(true)}
                        >
                            <Heart className="mr-2 h-5 w-5 fill-current" />
                            Donate
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-8 text-lg font-medium border-border/50 bg-background/50 backdrop-blur-sm hover:bg-muted/50 w-full sm:w-auto"
                            onClick={() => setIsChatOpen(true)}
                        >
                            <MessageCircle className="mr-2 h-5 w-5" />
                            Chat
                        </Button>
                    </div>

                    {/* Leaderboard */}
                    {leaderboard.length > 0 && (
                        <div className="pt-12 max-w-md mx-auto w-full">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center justify-center gap-2">
                                <Crown className="h-4 w-4 text-amber-500" />
                                Keepers of the Wisdom
                            </h3>
                            <div className="space-y-3">
                                {leaderboard.map((entry, index) => {
                                    const isTop3 = index < 3;
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            key={entry.userId}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border backdrop-blur-sm transition-all",
                                                isTop3
                                                    ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] scale-105"
                                                    : "bg-background/40 border-white/5 hover:bg-background/60"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "flex items-center justify-center rounded-full font-bold",
                                                    isTop3 ? "w-8 h-8 bg-amber-500 text-black text-sm" : "w-6 h-6 bg-zinc-800 text-zinc-500 text-xs"
                                                )}>
                                                    {index + 1}
                                                </div>
                                                <span className={cn(
                                                    "font-medium truncate max-w-[150px] md:max-w-[200px]",
                                                    isTop3 ? "text-lg text-amber-100" : "text-sm text-zinc-300"
                                                )}>
                                                    {entry.name}
                                                </span>
                                            </div>
                                            <span className={cn(
                                                "font-mono",
                                                isTop3 ? "text-amber-400 font-bold" : "text-zinc-500 text-sm"
                                            )}>
                                                {currency}{entry.totalDonated.toLocaleString()}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground/50 max-w-sm mx-auto pt-8">
                        Join the community signal to connect with others and fuel the server.
                    </p>
                </div>
            </div>


            {/* Fullscreen Chat Overlay */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[200] bg-background flex flex-col"
                    >
                        {/* Header */}
                        <div className="h-16 border-b border-border/40 flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-10">

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Raised</span>
                                    <span className="text-lg font-mono font-medium flex items-center text-foreground">
                                        <span className="text-muted-foreground text-sm mr-0.5">{currency}</span>
                                        {totalDonations.toLocaleString()}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-8 rounded-full p-0 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                                    onClick={() => setIsDonateOpen(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold hidden md:block opacity-50">Community Signal</h3>
                                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="rounded-full">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-hidden relative">
                            <WebRTCChat ref={chatRef} onClose={() => setIsChatOpen(false)} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Donate Popup (Global Overlay) */}
            <Dialog open={isDonateOpen} onOpenChange={setIsDonateOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 p-0 overflow-hidden gap-0 z-[210] shadow-2xl shadow-indigo-500/10">
                    <VisuallyHidden>
                        <DialogTitle>Make a Donation</DialogTitle>
                    </VisuallyHidden>

                    {/* Hero Graphic Area */}
                    <div className="relative h-32 bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-zinc-950 flex flex-col items-center justify-center p-6 text-center border-b border-white/5">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 bg-repeat mix-blend-overlay"></div>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-indigo-500/20 p-3 rounded-full border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.3)] mb-2"
                        >
                            <Scroll className="h-6 w-6 text-indigo-400 fill-indigo-400/20" />
                        </motion.div>
                        <h2 className="text-xl font-medium text-white tracking-wide">Preserve the Divine Wisdom</h2>
                        <p className="text-xs text-zinc-400 mt-1 max-w-xs">Helping children understand the unity of all religions.</p>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Name Input */}
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">Your Name (Optional)</label>
                            <Input
                                placeholder="Enter your name..."
                                className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 h-12"
                                value={donorName}
                                onChange={(e) => setDonorName(e.target.value)}
                            />
                        </div>

                        {/* Preset Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Ink', amount: 101, icon: <Feather className="w-6 h-6 text-zinc-400" /> },
                                { label: 'Page', amount: 501, icon: <Scroll className="w-6 h-6 text-zinc-300" /> },
                                { label: 'Book', amount: 1001, icon: <BookOpen className="w-6 h-6 text-zinc-100" /> },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-95",
                                        donationAmount === item.amount.toString()
                                            ? "bg-indigo-600/20 border-indigo-500/50 ring-1 ring-indigo-500/50 text-indigo-300"
                                            : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-zinc-400"
                                    )}
                                    onClick={() => setDonationAmount(item.amount.toString())}
                                >
                                    <span className="mb-1">{item.icon}</span>
                                    <span className="text-xs font-medium uppercase tracking-wider opacity-70">{item.label}</span>
                                    <span className="text-sm font-bold text-white mt-1">{currency}{item.amount}</span>
                                </button>
                            ))}
                        </div>

                        {/* Custom Amount Input */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                <span className="text-zinc-500 text-lg font-light mr-2">Custom {currency}</span>
                            </div>
                            <Input
                                type="number"
                                value={donationAmount}
                                onChange={e => setDonationAmount(e.target.value)}
                                className="h-14 pl-28 pr-4 text-right text-2xl font-light bg-zinc-900/50 border-zinc-800 rounded-xl focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 placeholder:text-zinc-700"
                                placeholder="..."
                            />
                        </div>

                        <Button
                            size="lg"
                            className={cn("w-full h-14 text-lg font-medium tracking-wide transition-all shadow-lg rounded-xl",
                                donationStatus === 'success' ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20" :
                                    donationStatus === 'error' ? "bg-red-600 hover:bg-red-700 text-white" :
                                        "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40"
                            )}
                            onClick={handleDonation}
                            disabled={donationStatus !== 'idle'}
                        >
                            {donationStatus === 'idle' && (
                                <div className="flex items-center gap-2">
                                    <span>Nurture Now</span>
                                    <Heart className="h-4 w-4 fill-white/20" />
                                </div>
                            )}
                            {donationStatus === 'processing' && (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            )}
                            {donationStatus === 'success' && (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span>Thank You</span>
                                </div>
                            )}
                            {donationStatus === 'error' && (
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    <span>Failed</span>
                                </div>
                            )}
                        </Button>

                        <p className="text-center text-xs text-zinc-500">
                            Secure payment powered by PhonePe.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

        </>
    );
}
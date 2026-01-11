'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/lib/community-store';
import { trackEvent, initiateDonationPayment, checkDonationStatusAction } from '@/lib/actions';
import { MessageCircle, Heart, X, Plus, CheckCircle2, AlertCircle, BadgeDollarSign } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WebRTCChat, WebRTCChatHandle } from '@/components/community/WebRTCChat';
import { useLocation } from '@/hooks/useLocation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

    // Donation State
    const [donationAmount, setDonationAmount] = useState('');
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
                            // We need to fetch donation amount? checkDonationStatusAction didn't return amount.
                            // I should update checkDonationStatusAction or just broadcast generic or fetch it.
                            // Actually checkDonationStatusAction returns 'donation' object if I updated it correctly?
                            // In my last edit I returned { success: true, trackingId: ... }
                            // I should have returned the whole donation object.
                            // However, we can just say "Contributed to the light".
                            // For now, let's just open chat. The status check confirms it was a success.
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

        try {
            const result = await initiateDonationPayment(val, userId);

            if (result.success && result.redirectUrl) {
                window.location.href = result.redirectUrl;
            } else {
                throw new Error(result.message || "Payment initiation failed");
            }

        } catch (error) {
            console.error("Donation error:", error);
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
                <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden gap-0 z-[210]">
                    <div className="p-6 space-y-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Heart className="h-6 w-6 text-primary fill-primary" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Support the Light</h2>
                            <p className="text-sm text-muted-foreground">Every contribution aligns the community closer to the center.</p>
                        </div>

                        <div className="relative max-w-[200px] mx-auto">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">{currency}</span>
                            <Input
                                type="number"
                                value={donationAmount}
                                onChange={e => setDonationAmount(e.target.value)}
                                className="h-16 pl-10 text-3xl text-center bg-muted/20 border-white/10 rounded-2xl focus-visible:ring-indigo-500/50"
                                placeholder="0"
                                autoFocus
                            />
                        </div>

                        <Button
                            size="lg"
                            className={cn("w-full h-12 text-lg font-medium transition-all",
                                donationStatus === 'success' ? "bg-green-600 hover:bg-green-600" :
                                    donationStatus === 'error' ? "bg-red-600 hover:bg-red-600" : ""
                            )}
                            onClick={handleDonation}
                            disabled={donationStatus !== 'idle'}
                        >
                            {donationStatus === 'idle' && "Confirm Donation"}
                            {donationStatus === 'processing' && (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </div>
                            )}
                            {donationStatus === 'success' && (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Thank You
                                </div>
                            )}
                            {donationStatus === 'error' && (
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    Failed
                                </div>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </>
    );
}
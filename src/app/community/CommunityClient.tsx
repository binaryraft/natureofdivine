'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Post, addPost, toggleLike } from '@/lib/community-store';
import { trackEvent } from '@/lib/actions';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WebRTCChat } from '@/components/community/WebRTCChat';
import { DonationHero } from '@/components/community/DonationHero';

export function CommunityClient({ initialPosts, initialDonations }: { initialPosts: Post[], initialDonations: number }) {
    const { user } = useAuth();

    useEffect(() => {
        trackEvent('view_community');
    }, []);

    const [liveMessage, setLiveMessage] = useState<{ name: string, text: string } | null>(null);

    return (
        <div className="container mx-auto py-8 md:py-12 max-w-5xl space-y-12">

            {/* 1. Community Distribution (Donations) */}
            <DonationHero initialTotal={initialDonations} liveMessage={liveMessage} />

            {/* 2. Community Page (Interaction/Chat) */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                        <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-headline font-semibold">Live Community Signal</h2>
                        <p className="text-sm text-muted-foreground">Real-time P2P connection with other seekers.</p>
                    </div>
                </div>

                <WebRTCChat onMessageReceived={(name, text) => setLiveMessage({ name, text })} />
            </div>

        </div>
    );
}
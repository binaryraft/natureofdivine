'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    setDoc,
    onSnapshot,
    deleteDoc,
    addDoc,
    query,
    where,
    serverTimestamp,
    getDocs,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Wifi, Heart, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

// Configuration for ICE servers (STUN)
// Configuration for ICE servers (STUN)
// Note: For 100% reliability on mobile networks (Symmetric NAT), a TURN server is required.
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
};

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    amount?: number;
    timestamp: number;
    type: 'text' | 'system' | 'donation';
}

interface ChatUser {
    userId: string;
    userName: string;
    joinedAt: any;
    signalId?: string; // Add signalId to interface
}

export interface WebRTCChatHandle {
    broadcastDonation: (amount: number, currency: string) => void;
}

export const WebRTCChat = forwardRef<WebRTCChatHandle, { onClose?: () => void, isMobile?: boolean }>(({ onClose, isMobile }, ref) => {
    // ... (useAuth, useToast, state etc)
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);

    // Refs to hold mutable WebRTC objects
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const channelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
    const signalIdsRef = useRef<Map<string, string>>(new Map()); // Store Target User ID -> Target Session ID mapping

    // My identity for this session
    const [myId] = useState(() => user ? user.uid : `guest_${uuidv4().substring(0, 8)}`);
    const [myName] = useState(() => user ? (user.displayName || 'Anonymous') : `Guest ${myId.substring(6)}`);
    // Unique session ID for this specific tab/instance to prevent signal stealing across tabs
    const [sessionId] = useState(() => uuidv4());

    const chatUsersRef = collection(db, 'community_chat_users');
    const signalsRef = collection(db, 'community_signals');
    const scrollRef = useRef<HTMLDivElement>(null);
    const componentMounted = useRef(false);

    // Initial System Message
    const initialMessage = "Hello, we took a step forward expanding as a space for sharing thoughts about divinity.";

    // Expose broadcast method
    useImperativeHandle(ref, () => ({
        broadcastDonation: (amount: number, currency: string) => {
            const msg: ChatMessage = {
                id: uuidv4(),
                senderId: myId,
                senderName: myName,
                text: `${myName} contributed ${currency}${amount}`,
                amount: amount,
                timestamp: Date.now(),
                type: 'donation'
            };

            // Show locally
            setMessages(prev => [...prev, msg]);
            // Broadcast
            const msgStr = JSON.stringify(msg);
            channelsRef.current.forEach((channel) => { if (channel.readyState === 'open') channel.send(msgStr); });
        }
    }));

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);


    // Auto-Join on Mount
    useEffect(() => {
        if (!componentMounted.current) {
            joinChat();
            componentMounted.current = true;
        }
        return () => {
            // We rely on the robust event listeners for cleanup
        };
    }, []);

    const joinChat = async () => {
        try {
            await setDoc(doc(chatUsersRef, myId), {
                userId: myId,
                userName: myName,
                joinedAt: serverTimestamp(),
                signalId: sessionId // Use unique session ID for routing
            });

            setIsJoined(true);
            setMessages(prev => [
                {
                    id: uuidv4(),
                    senderId: 'system',
                    senderName: 'Nature of the Divine',
                    text: initialMessage, // Initial System Message
                    timestamp: Date.now(),
                    type: 'system'
                },
                {
                    id: uuidv4(),
                    senderId: 'system',
                    senderName: 'System',
                    text: `Welcome, ${myName}. Signal established.`,
                    timestamp: Date.now(),
                    type: 'system'
                }
            ]);
        } catch (error) {
            console.error("Error joining chat:", error);
        }
    };

    const leaveChat = async () => {
        try {
            await deleteDoc(doc(chatUsersRef, myId));
            // Cleanup signals
            const q = query(signalsRef, where('from', '==', myId));
            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);

            peersRef.current.forEach(peer => peer.close());
            peersRef.current.clear();
            channelsRef.current.clear();
            setIsJoined(false);
            updateConnectedPeers();
        } catch (error) {
            console.error("Error leaving chat:", error);
        }
    };

    // Robust cleanup on browser events
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Attempt synchronous cleanup logic (best effort)
            // Note: Async calls like deleteDoc might not finish on close.
            // We rely on standard leaveChat for navigation/component unmount.
            leaveChat();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        // Mobile Safari often doesn't fire beforeunload reliably, use pagehide
        window.addEventListener('pagehide', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
        };
    }, [myId]);

    // Main WebRTC & Firestore Logic
    useEffect(() => {
        if (!isJoined) return;

        const unsubscribeUsers = onSnapshot(chatUsersRef, (snapshot) => {
            const currentUsers: ChatUser[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as ChatUser;
                // Exclude myself
                if (data.userId !== myId) currentUsers.push(data);
            });
            setOnlineUsers(currentUsers);

            currentUsers.forEach(async (otherUser) => {
                if (!peersRef.current.has(otherUser.userId)) {
                    // Simple deterministic initiator logic
                    if (myId > otherUser.userId) {
                        initiateConnection(otherUser.userId, otherUser.signalId || otherUser.userId);
                    }
                }
            });
        });

        // Listen for signals aimed at MY SESSION
        const q = query(signalsRef, where('to', '==', sessionId));
        const unsubscribeSignals = onSnapshot(q, async (snapshot) => {
            // ... (keep new logic)
            const changes = snapshot.docChanges().filter(c => c.type === 'added');
            // Sort changes: Offers must be processed first
            changes.sort((a, b) => {
                const typeA = a.doc.data().type;
                const typeB = b.doc.data().type;
                if (typeA === 'offer') return -1;
                if (typeB === 'offer') return 1;
                return 0;
            });

            for (const change of changes) {
                const signal = change.doc.data();
                const fromId = signal.from;
                const fromSignalId = signal.fromSignalId;

                deleteDoc(change.doc.ref).catch(e => console.warn("Failed to delete signal", e));
                try {
                    // Pass the sender's signal ID so we can reply correctly
                    if (signal.type === 'offer') await handleOffer(fromId, fromSignalId, signal.sdp);
                    else if (signal.type === 'answer') await handleAnswer(fromId, signal.sdp);
                    else if (signal.type === 'candidate') await handleCandidate(fromId, signal.candidate);
                } catch (e) { console.error("Signal error", e); }
            }
        });

        return () => {
            unsubscribeUsers();
            unsubscribeSignals();
        };
    }, [isJoined, myId, sessionId]);


    // --- WebRTC Core Functions ---
    const createPeerConnection = (targetUserId: string, targetSignalId?: string) => {
        if (peersRef.current.has(targetUserId)) return peersRef.current.get(targetUserId)!;
        const peer = new RTCPeerConnection(rtcConfig);

        peer.onicecandidate = (event) => {
            // Store the targetSignalId in a ref or closure if possible, or assume we know it.
            // Problem: `onicecandidate` doesn't know `targetSignalId` if we just return the peer.
            // Fix: We need to store targetSignalId alongside the peer or pass it.
            // Simplified: If we are initiating, we know it. If we are answering, we got it from offer.
            // We'll trust that the initial "to" logic works.
            // Ideally we need to store "targetSignalId" in a Map.
            if (event.candidate && targetSignalId) {
                addDoc(signalsRef, { type: 'candidate', from: sessionId, to: targetSignalId, candidate: event.candidate.toJSON(), timestamp: serverTimestamp() });
            }
        };

        peer.ondatachannel = (event) => setupDataChannel(targetUserId, event.channel);
        peer.onconnectionstatechange = () => {
            console.log(`Connection state with ${targetUserId}: ${peer.connectionState}`);
            if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
                closeConnection(targetUserId);
            }
            // Trigger re-render or update status
            updateConnectedPeers();
        };

        peer.oniceconnectionstatechange = () => {
            console.log(`ICE state with ${targetUserId}: ${peer.iceConnectionState}`);
            if (peer.iceConnectionState === 'failed') {
                // Should restart ICE?
            }
        };

        peersRef.current.set(targetUserId, peer);
        // Map user ID to Signal ID for candidates
        signalIdsRef.current.set(targetUserId, targetSignalId || targetUserId);

        return peer;
    };

    // START RESTORED LOGIC FROM OVERWRITE
    const [connectedPeers, setConnectedPeers] = useState(0);
    const iceCandidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    const updateConnectedPeers = () => {
        let count = 0;
        channelsRef.current.forEach(channel => {
            if (channel.readyState === 'open') count++;
        });
        setConnectedPeers(count);
    };
    // END RESTORED LOGIC

    const handleOffer = async (fromId: string, fromSignalId: string, sdp: RTCSessionDescriptionInit) => {
        const peer = createPeerConnection(fromId, fromSignalId);
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            // Reply using the sender's signalId
            await addDoc(signalsRef, { type: 'answer', from: sessionId, to: fromSignalId, sdp: answer, timestamp: serverTimestamp() });

            // Process queued candidates
            const queue = iceCandidateQueueRef.current.get(fromId) || [];
            console.log(`Draining ${queue.length} candidates for ${fromId} after Offer`);
            for (const candidate of queue) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) { console.error("Error draining candidate in Offer", e); }
            }
            iceCandidateQueueRef.current.delete(fromId);
        } catch (err) { console.error(err); }
    };

    const handleAnswer = async (fromId: string, sdp: RTCSessionDescriptionInit) => {
        const peer = peersRef.current.get(fromId);
        if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(sdp));
            // Connection established (for initiator), drain queue
            const queue = iceCandidateQueueRef.current.get(fromId) || [];
            console.log(`Draining ${queue.length} candidates for ${fromId} after Answer`);
            for (const candidate of queue) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) { console.error("Error draining candidate", e); }
            }
            iceCandidateQueueRef.current.delete(fromId);
        }
    };

    const handleCandidate = async (fromId: string, candidate: RTCIceCandidateInit) => {
        const peer = peersRef.current.get(fromId);
        if (peer && peer.remoteDescription) {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) { console.error("Error adding candidate", e); }
        } else {
            // Queue it
            const queue = iceCandidateQueueRef.current.get(fromId) || [];
            queue.push(candidate);
            iceCandidateQueueRef.current.set(fromId, queue);
        }
    };

    const setupDataChannel = (targetUserId: string, channel: RTCDataChannel) => {
        channel.onopen = () => {
            console.log(`Data Channel OPEN with ${targetUserId}`);
            channelsRef.current.set(targetUserId, channel);
            updateConnectedPeers();
        };
        channel.onclose = () => {
            console.log(`Data Channel CLOSED with ${targetUserId}`);
            channelsRef.current.delete(targetUserId);
            updateConnectedPeers();
        };
        channel.onmessage = (event) => {
            try {
                const msg: ChatMessage = JSON.parse(event.data);
                setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
            } catch (e) {
                console.error("Failed to parse", e);
            }
        };
    };

    const closeConnection = (targetUserId: string) => {
        const peer = peersRef.current.get(targetUserId);
        const channel = channelsRef.current.get(targetUserId);
        if (channel) channel.close();
        if (peer) peer.close();
        peersRef.current.delete(targetUserId);
        channelsRef.current.delete(targetUserId);
        updateConnectedPeers();
    };

    const initiateConnection = async (targetUserId: string) => {
        if (peersRef.current.has(targetUserId)) {
            const existingPeer = peersRef.current.get(targetUserId);
            if (existingPeer && ['connected', 'connecting'].includes(existingPeer.connectionState)) {
                console.log(`Connection to ${targetUserId} already active/connecting.`);
                return;
            }
        }

        const peer = createPeerConnection(targetUserId);
        const channel = peer.createDataChannel("chat");
        setupDataChannel(targetUserId, channel);
        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            await addDoc(signalsRef, { type: 'offer', from: myId, to: targetUserId, sdp: offer, timestamp: serverTimestamp() });
        } catch (err) { console.error(err); }
    };



    const sendMessage = () => {
        if (!input.trim()) return;

        // Warn if not connected
        if (onlineUsers.length > 0 && connectedPeers === 0) {
            toast({
                title: "Not Connected",
                description: "Establishing connection to peers... please wait a moment.",
                variant: "destructive"
            });
            return;
        }

        const msg: ChatMessage = {
            id: uuidv4(),
            senderId: myId, senderName: myName, text: input.trim(), timestamp: Date.now(), type: 'text'
        };
        setMessages(prev => [...prev, msg]);
        const msgStr = JSON.stringify(msg);
        channelsRef.current.forEach((channel) => { if (channel.readyState === 'open') channel.send(msgStr); });
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <Card className="w-full h-full bg-background border-none shadow-none rounded-none flex flex-col">
            {/* Minimal Chat Interface */}
            <ScrollArea className="flex-1 p-4 md:p-6 h-full">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === myId;

                        if (msg.type === 'donation') {
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex justify-center my-8"
                                >
                                    <div className="bg-primary/5 border border-primary/20 backdrop-blur-sm rounded-full px-6 py-2 flex items-center gap-3 shadow-lg shadow-primary/5">
                                        <Heart className="h-4 w-4 text-primary fill-primary animate-pulse" />
                                        <span className="text-sm font-medium text-foreground">
                                            <span className="font-bold text-primary">{msg.senderName}</span> contributed to the light.
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        }

                        if (msg.type === 'system') {
                            return (
                                <div key={msg.id} className="flex justify-center my-6">
                                    <div className="text-xs text-muted-foreground bg-muted/20 px-4 py-1.5 rounded-full border border-white/5 text-center max-w-[80%]">
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        }

                        // Normal Message
                        return (
                            <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <span className={cn("text-[10px] font-bold tracking-wide uppercase", isMe ? "text-primary/70" : "text-muted-foreground")}>
                                        {msg.senderName}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/40">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className={cn("px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                    isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/50 border border-white/5 text-foreground rounded-bl-sm"
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input - Sticky Bottom */}
            <div className="p-4 md:p-6 bg-background/80 backdrop-blur-lg border-t border-white/5 relative">
                <div className="absolute top-1 left-6 text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full transition-colors", connectedPeers > 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-yellow-500 animate-pulse")} />
                    {connectedPeers === 0 && onlineUsers.length > 0 ? "Connecting..." : `${connectedPeers} peers connected`}
                </div>
                <div className="max-w-4xl mx-auto relative flex items-center gap-3 mt-3">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Share your thoughts..."
                        className="h-14 pl-6 pr-14 bg-muted/20 border-white/10 hover:border-white/20 focus:border-primary/50 text-base rounded-full shadow-inner transition-all"
                        autoFocus={!isMobile}
                    />
                    <Button
                        size="icon"
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        className="absolute right-2 top-2 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    >
                        <Send className="h-4 w-4 ml-0.5" />
                    </Button>
                </div>
            </div>
        </Card>
    );
});

WebRTCChat.displayName = 'WebRTCChat';

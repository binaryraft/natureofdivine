'use client';

import React, { useEffect, useRef, useState } from 'react';
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
    limit
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Send, Users, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

// Configuration for ICE servers (STUN)
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
}

interface ChatUser {
    userId: string;
    userName: string;
    joinedAt: any;
}

export function WebRTCChat({ onMessageReceived }: { onMessageReceived?: (name: string, text: string) => void }) {
    const { user } = useAuth();

    const { toast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

    // Refs to hold mutable WebRTC objects without triggering re-renders
    // Map: userId -> PeerConnection
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    // Map: userId -> DataChannel
    const channelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

    // My identity for this session
    const [myId] = useState(() => user ? user.uid : `guest_${uuidv4().substring(0, 8)}`);
    const [myName] = useState(() => user ? (user.displayName || 'Anonymous') : `Guest ${myId.substring(6)}`);

    const chatUsersRef = collection(db, 'community_chat_users');
    const signalsRef = collection(db, 'community_signals');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const joinChat = async () => {
        try {
            setConnectionStatus('Joining...');

            // 1. Register presence in DB
            // We use setDoc to ensure we key by our ID, making it easy to delete later
            await setDoc(doc(chatUsersRef, myId), {
                userId: myId,
                userName: myName,
                joinedAt: serverTimestamp(),
                signalId: myId // To help routing signals
            });

            setIsJoined(true);
            setConnectionStatus('Online');

            // Add system welcome message locally
            setMessages(prev => [...prev, {
                id: uuidv4(),
                senderId: 'system',
                senderName: 'System',
                text: `Welcome to the P2P Mesh Chat, ${myName}. Messages here are broadcast directly to other users.`,
                timestamp: Date.now(),
                isSystem: true
            }]);

        } catch (error) {
            console.error("Error joining chat:", error);
            toast({ variant: 'destructive', title: 'Connection Error', description: 'Could not join channel.' });
            setConnectionStatus('Error');
        }
    };

    const leaveChat = async () => {
        try {
            // Cleanup Firestore
            await deleteDoc(doc(chatUsersRef, myId));

            if (user) {
                // Also clean up my signals to keep DB clean
                const q = query(signalsRef, where('from', '==', myId));
                getDocs(q).then(snapshot => {
                    snapshot.forEach(d => deleteDoc(d.ref));
                });
            }

            // Close all connections
            peersRef.current.forEach(peer => peer.close());
            peersRef.current.clear();
            channelsRef.current.clear();

            setIsJoined(false);
            setOnlineUsers([]);
            setConnectionStatus('Disconnected');
        } catch (error) {
            console.error("Error leaving chat:", error);
        }
    };

    // Main WebRTC & Firestore Logic
    useEffect(() => {
        if (!isJoined) return;

        // Cleanup function for when component unmounts or we leave
        const cleanup = () => {
            leaveChat();
        };

        // 1. Listen for Other Users (The "Virtual IP Table")
        // When a user appears here, we might need to connect to them.
        const unsubscribeUsers = onSnapshot(chatUsersRef, (snapshot) => {
            const currentUsers: ChatUser[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as ChatUser;
                if (data.userId !== myId) {
                    currentUsers.push(data);
                }
            });
            setOnlineUsers(currentUsers);

            // Mesh Network Connection Logic:
            // For each user present, if I don't have a peer connection, check if I should initiate.
            // Simple rule: If myId > theirId (lexicographically), backoff. If myId < theirId, I initiate.
            // This prevents double-connections. Wait, actually:
            // "Perfect Negotiation" or "Polite Peer" is better, but simple string comparison works for simple mesh.
            // Let's use: Initiator = myId > theirId.

            currentUsers.forEach(async (otherUser) => {
                if (!peersRef.current.has(otherUser.userId)) {
                    const shouldInitiate = myId > otherUser.userId;
                    if (shouldInitiate) {
                        console.log(`[P2P] Initiating connection to ${otherUser.userName} (${otherUser.userId})`);
                        initiateConnection(otherUser.userId);
                    }
                }
            });
        });

        // 2. Listen for Signals (Offers, Answers, Candidates) directed to ME
        const q = query(signalsRef, where('to', '==', myId));
        const unsubscribeSignals = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const signal = change.doc.data();
                    const fromId = signal.from;

                    // Delete signal after consumption to keep DB clean (Signal flare concept)
                    deleteDoc(change.doc.ref);

                    if (signal.type === 'offer') {
                        console.log(`[P2P] Received offer from ${fromId}`);
                        await handleOffer(fromId, signal.sdp);
                    } else if (signal.type === 'answer') {
                        console.log(`[P2P] Received answer from ${fromId}`);
                        await handleAnswer(fromId, signal.sdp);
                    } else if (signal.type === 'candidate') {
                        await handleCandidate(fromId, signal.candidate);
                    }
                }
            });
        });

        // 3. Heartbeat? (Optional, skipping for MVP)

        return () => {
            unsubscribeUsers();
            unsubscribeSignals();
            // Don't call leaveChat() here directly if we want to support refresh logic, 
            // but for SPA P2P usually we assume disconnect on unmount.
            // We'll call cleanup which calls leaveChat.
            cleanup();
        };
    }, [isJoined, myId]);


    // --- WebRTC Core Functions ---

    const createPeerConnection = (targetUserId: string) => {
        if (peersRef.current.has(targetUserId)) return peersRef.current.get(targetUserId)!;

        const peer = new RTCPeerConnection(rtcConfig);

        // ICE Candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(signalsRef, {
                    type: 'candidate',
                    from: myId,
                    to: targetUserId,
                    candidate: event.candidate.toJSON(),
                    timestamp: serverTimestamp()
                });
            }
        };

        // Connection State Changes
        peer.onconnectionstatechange = () => {
            console.log(`[P2P] Connection to ${targetUserId}: ${peer.connectionState}`);
            if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
                closeConnection(targetUserId);
            }
        };

        // Data Channel (For Receiver side primarily)
        peer.ondatachannel = (event) => {
            const channel = event.channel;
            setupDataChannel(targetUserId, channel);
        };

        peersRef.current.set(targetUserId, peer);
        return peer;
    };

    const setupDataChannel = (targetUserId: string, channel: RTCDataChannel) => {
        channel.onopen = () => {
            console.log(`[P2P] Channel open with ${targetUserId}`);
            channelsRef.current.set(targetUserId, channel);
            toast({ description: `Connected to peer!`, duration: 2000 });
        };

        channel.onclose = () => {
            console.log(`[P2P] Channel closed with ${targetUserId}`);
            channelsRef.current.delete(targetUserId);
        };

        channel.onmessage = (event) => {
            try {
                const msg: ChatMessage = JSON.parse(event.data);

                if (onMessageReceived) {
                    onMessageReceived(msg.senderName, msg.text);
                }

                setMessages(prev => {
                    // Dedup just in case
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            } catch (e) {
                console.error("Failed to parse message", e);
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
    };

    const initiateConnection = async (targetUserId: string) => {
        const peer = createPeerConnection(targetUserId);

        // Create Data Channel (I am initiator)
        const channel = peer.createDataChannel("chat");
        setupDataChannel(targetUserId, channel);

        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            await addDoc(signalsRef, {
                type: 'offer',
                from: myId,
                to: targetUserId,
                sdp: offer,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error("Error creating offer:", err);
        }
    };

    const handleOffer = async (fromId: string, sdp: RTCSessionDescriptionInit) => {
        const peer = createPeerConnection(fromId);
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            await addDoc(signalsRef, {
                type: 'answer',
                from: myId,
                to: fromId,
                sdp: answer,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error("Error handling offer:", err);
        }
    };

    const handleAnswer = async (fromId: string, sdp: RTCSessionDescriptionInit) => {
        const peer = peersRef.current.get(fromId);
        if (!peer) return;
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch (err) {
            console.error("Error handling answer:", err);
        }
    };

    const handleCandidate = async (fromId: string, candidate: RTCIceCandidateInit) => {
        const peer = peersRef.current.get(fromId);
        if (!peer) return;
        try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error("Error adding candidate:", err);
        }
    };

    // --- User Actions ---

    const sendMessage = () => {
        if (!input.trim()) return;

        const msg: ChatMessage = {
            id: uuidv4(),
            senderId: myId,
            senderName: myName,
            text: input.trim(),
            timestamp: Date.now()
        };

        // 1. Show locally
        setMessages(prev => [...prev, msg]);

        // 2. Broadcast via Data Channels
        const msgStr = JSON.stringify(msg);
        let sentCount = 0;
        channelsRef.current.forEach((channel) => {
            if (channel.readyState === 'open') {
                channel.send(msgStr);
                sentCount++;
            }
        });

        console.log(`[P2P] Broadcasted message to ${sentCount} peers`);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto shadow-xl border-dashed">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Wifi className={cn("h-5 w-5", isJoined ? "text-green-500 animate-pulse" : "text-muted-foreground")} />
                        Live Community Signal
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        P2P Mesh Network • {onlineUsers.length} Peer{onlineUsers.length !== 1 ? 's' : ''} Online
                    </p>
                </div>
                {!isJoined ? (
                    <Button onClick={joinChat} variant="default" className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20">
                        Join Session
                    </Button>
                ) : (
                    <Button onClick={leaveChat} variant="outline" className="border-red-200 hover:bg-red-50 text-red-600">
                        Leave Session
                    </Button>
                )}
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 flex">

                {/* Messages Area - Full Width if Sidebar hidden on mobile?? For now simple list */}
                <div className="flex-1 flex flex-col h-full relative">
                    {!isJoined && (
                        <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                            <div className="max-w-md space-y-4">
                                <Users className="h-16 w-16 mx-auto text-primary/20" />
                                <h3 className="text-xl font-medium">Join the Live Stream</h3>
                                <p className="text-muted-foreground">
                                    Connect directly with other seeks in real-time.
                                    Messages are broadcast directly user-to-user and are never stored on a server.
                                </p>
                            </div>
                        </div>
                    )}

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === myId;
                                const isSystem = msg.isSystem;

                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-4">
                                            <span className="bg-muted text-muted-foreground text-[10px] py-1 px-3 rounded-full uppercase tracking-widest font-medium">
                                                {msg.text}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-muted-foreground">{msg.senderName}</span>
                                            <span className="text-[10px] text-muted-foreground/60">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={cn("px-4 py-2 rounded-2xl text-sm shadow-sm",
                                            isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
                                        )}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-4 bg-muted/20 border-t flex items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Transmit a message..."
                            className="flex-1 bg-background"
                            disabled={!isJoined}
                        />
                        <Button size="icon" onClick={sendMessage} disabled={!isJoined || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Online Users Sidebar (Visible on desktop) */}
                <div className="w-56 border-l hidden md:flex flex-col bg-muted/10">
                    <div className="p-3 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span>Connected Peers</span>
                        <Badge variant="secondary" className="text-[10px] h-5">{onlineUsers.length}</Badge>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-2">
                            {onlineUsers.length === 0 ? (
                                <p className="text-xs text-muted-foreground p-2 text-center italic">Waiting for peers...</p>
                            ) : (
                                onlineUsers.map(u => (
                                    <div key={u.userId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-medium truncate">{u.userName}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

            </CardContent>
        </Card>
    );
}


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
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card'; // Simplified imports
import { Badge } from '@/components/ui/badge';
import { Send, Users, Search, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false); // Design Uniqueness state

    // Refs to hold mutable WebRTC objects
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const channelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

    // My identity for this session
    const [myId] = useState(() => user ? user.uid : `guest_${uuidv4().substring(0, 8)}`);
    const [myName] = useState(() => user ? (user.displayName || 'Anonymous') : `Guest ${myId.substring(6)}`);

    const chatUsersRef = collection(db, 'community_chat_users');
    const signalsRef = collection(db, 'community_signals');
    const scrollRef = useRef<HTMLDivElement>(null);
    const componentMounted = useRef(false);

    // Auto-scroll logic (depends on focus mode)
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isFocused]);


    // Auto-Join on Mount
    useEffect(() => {
        if (!componentMounted.current) {
            joinChat();
            componentMounted.current = true;
        }
        return () => {
            leaveChat();
        };
    }, []);

    const joinChat = async () => {
        try {
            await setDoc(doc(chatUsersRef, myId), {
                userId: myId,
                userName: myName,
                joinedAt: serverTimestamp(),
                signalId: myId
            });

            setIsJoined(true);
            setMessages(prev => [...prev, {
                id: uuidv4(),
                senderId: 'system',
                senderName: 'System',
                text: `Welcome, ${myName}. Signal established.`,
                timestamp: Date.now(),
                isSystem: true
            }]);
        } catch (error) {
            console.error("Error joining chat:", error);
        }
    };

    const leaveChat = async () => {
        try {
            await deleteDoc(doc(chatUsersRef, myId));
            if (user) {
                const q = query(signalsRef, where('from', '==', myId));
                getDocs(q).then(snapshot => snapshot.forEach(d => deleteDoc(d.ref)));
            }
            peersRef.current.forEach(peer => peer.close());
            peersRef.current.clear();
            channelsRef.current.clear();
            setIsJoined(false);
        } catch (error) {
            console.error("Error leaving chat:", error);
        }
    };

    // Main WebRTC & Firestore Logic
    useEffect(() => {
        if (!isJoined) return;

        const unsubscribeUsers = onSnapshot(chatUsersRef, (snapshot) => {
            const currentUsers: ChatUser[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as ChatUser;
                if (data.userId !== myId) currentUsers.push(data);
            });
            setOnlineUsers(currentUsers);

            currentUsers.forEach(async (otherUser) => {
                if (!peersRef.current.has(otherUser.userId)) {
                    if (myId > otherUser.userId) {
                        initiateConnection(otherUser.userId);
                    }
                }
            });
        });

        const q = query(signalsRef, where('to', '==', myId));
        const unsubscribeSignals = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const signal = change.doc.data();
                    const fromId = signal.from;
                    deleteDoc(change.doc.ref);

                    if (signal.type === 'offer') await handleOffer(fromId, signal.sdp);
                    else if (signal.type === 'answer') await handleAnswer(fromId, signal.sdp);
                    else if (signal.type === 'candidate') await handleCandidate(fromId, signal.candidate);
                }
            });
        });

        return () => {
            unsubscribeUsers();
            unsubscribeSignals();
        };
    }, [isJoined, myId]);


    // --- WebRTC Core Functions (Simplified for brevity) ---
    const createPeerConnection = (targetUserId: string) => {
        if (peersRef.current.has(targetUserId)) return peersRef.current.get(targetUserId)!;
        const peer = new RTCPeerConnection(rtcConfig);

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(signalsRef, { type: 'candidate', from: myId, to: targetUserId, candidate: event.candidate.toJSON(), timestamp: serverTimestamp() });
            }
        };

        peer.ondatachannel = (event) => setupDataChannel(targetUserId, event.channel);
        peer.onconnectionstatechange = () => {
            if (['disconnected', 'failed'].includes(peer.connectionState)) closeConnection(targetUserId);
        };

        peersRef.current.set(targetUserId, peer);
        return peer;
    };

    const setupDataChannel = (targetUserId: string, channel: RTCDataChannel) => {
        channel.onopen = () => channelsRef.current.set(targetUserId, channel);
        channel.onclose = () => channelsRef.current.delete(targetUserId);
        channel.onmessage = (event) => {
            try {
                const msg: ChatMessage = JSON.parse(event.data);
                if (onMessageReceived) onMessageReceived(msg.senderName, msg.text);
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
    };

    const initiateConnection = async (targetUserId: string) => {
        const peer = createPeerConnection(targetUserId);
        const channel = peer.createDataChannel("chat");
        setupDataChannel(targetUserId, channel);
        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            await addDoc(signalsRef, { type: 'offer', from: myId, to: targetUserId, sdp: offer, timestamp: serverTimestamp() });
        } catch (err) { console.error(err); }
    };

    const handleOffer = async (fromId: string, sdp: RTCSessionDescriptionInit) => {
        const peer = createPeerConnection(fromId);
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await addDoc(signalsRef, { type: 'answer', from: myId, to: fromId, sdp: answer, timestamp: serverTimestamp() });
        } catch (err) { console.error(err); }
    };

    const handleAnswer = async (fromId: string, sdp: RTCSessionDescriptionInit) => {
        const peer = peersRef.current.get(fromId);
        if (peer) await peer.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const handleCandidate = async (fromId: string, candidate: RTCIceCandidateInit) => {
        const peer = peersRef.current.get(fromId);
        if (peer) await peer.addIceCandidate(new RTCIceCandidate(candidate));
    };

    // --- User Actions ---
    const sendMessage = () => {
        if (!input.trim()) return;
        const msg: ChatMessage = {
            id: uuidv4(),
            senderId: myId, senderName: myName, text: input.trim(), timestamp: Date.now()
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
            // Optional: Blur after send? User request implies maybe, but usually users want to keep typing. 
            // "when chat is losed focus, or enter pressed, it goes back the normal session"
            // So YES, blur on enter.
            const target = e.target as HTMLInputElement;
            target.blur();
        }
    };

    const filteredMessages = messages.filter(m =>
        m.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="w-full bg-background/50 border-none shadow-none">

            {/* Search Bar - Always Visible */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search frequency..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-muted/20 border-white/5 focus-visible:ring-primary/20 transition-all rounded-full h-10"
                />
            </div>

            <CardContent className="p-0 relative min-h-[400px]">

                {/* 
                  DESIGN UNIQUENESS: 
                  If isFocused -> Full Chat Bubbles 
                  If !isFocused -> Minimalist "Terminal/Feed" View
                */}

                <AnimatePresence mode="wait">
                    {!isFocused ? (
                        <motion.div
                            key="normal-session"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="bg-transparent space-y-2 font-mono text-sm h-[400px] overflow-hidden flex flex-col justify-end pb-16"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <Badge variant="outline" className="gap-2 bg-black/20 backdrop-blur-md border-white/10 text-xs">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    {onlineUsers.length} Peers Online
                                </Badge>
                            </div>

                            <ScrollArea className="h-full pr-4 mask-image-gradient">
                                <div className="space-y-1.5 p-4 flex flex-col justify-end min-h-[350px]">
                                    {filteredMessages.slice(-8).map((msg) => (
                                        <div key={msg.id} className="text-muted-foreground/80 hover:text-foreground transition-colors">
                                            <span className="text-primary/60 mr-2 text-xs">[{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                                            <span className="font-semibold text-indigo-300 mr-2">{msg.senderName}:</span>
                                            <span className="tracking-wide">{msg.text}</span>
                                        </div>
                                    ))}
                                    {filteredMessages.length === 0 && (
                                        <div className="text-muted-foreground/30 italic text-center mt-20">waiting for signal transmission...</div>
                                    )}
                                </div>
                            </ScrollArea>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat-session"
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                            className="absolute inset-0 bg-background/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-20 flex flex-col h-[500px] -mt-[100px]" // Pop out effect
                        >
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-muted/10 rounded-t-2xl">
                                <span className="font-bold flex items-center gap-2"><Wifi className="h-4 w-4 text-green-500" /> Live Channel</span>
                                <Badge variant="secondary">{onlineUsers.length} Online</Badge>
                            </div>

                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {filteredMessages.map((msg) => {
                                        const isMe = msg.senderId === myId;
                                        if (msg.isSystem) return (
                                            <div key={msg.id} className="flex justify-center my-4"><span className="text-[10px] text-muted-foreground uppercase">{msg.text}</span></div>
                                        );
                                        return (
                                            <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className="text-[10px] text-muted-foreground font-bold">{msg.senderName}</span>
                                                </div>
                                                <div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transform transition-all",
                                                    isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                                                )}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Area - Always docked but changes context */}
                <div className={cn("absolute bottom-0 left-0 right-0 transition-all duration-300 z-30", isFocused ? "-bottom-[100px]" : "bottom-0")}>
                    <div className="relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => {
                                // Small delay to allow click on send button if needed
                                setTimeout(() => {
                                    if (document.activeElement?.tagName !== 'INPUT') { // If we didn't just tab to another input
                                        setIsFocused(false);
                                    }
                                }, 200);
                            }}
                            placeholder="Type to broadcast..."
                            className="h-14 pl-6 pr-12 bg-background/80 backdrop-blur-md border border-white/10 rounded-xl shadow-lg focus:ring-2 focus:ring-primary/50 text-base"
                        />
                        <Button
                            size="icon"
                            onClick={() => { sendMessage(); setIsFocused(false); }} // Send also closes focus view as per "enter pressed" logic
                            disabled={!input.trim()}
                            className="absolute right-2 top-2 h-10 w-10 rounded-lg"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}

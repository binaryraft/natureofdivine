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
    orderBy,
    limit
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
import { getBotGreeting, getBotResponse } from '@/lib/bot-data';

const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
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
    signalId?: string;
}

export interface WebRTCChatHandle {
    broadcastDonation: (amount: number, currency: string) => void;
}

export const WebRTCChat = forwardRef<WebRTCChatHandle, { onClose?: () => void, isMobile?: boolean }>(({ onClose, isMobile }, ref) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);
    const [connectedPeers, setConnectedPeers] = useState(0);

    // Refs
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const channelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
    const signalIdsRef = useRef<Map<string, string>>(new Map());
    const scrollRef = useRef<HTMLDivElement>(null);
    const componentMounted = useRef(false);

    // Identity
    const [myId] = useState(() => user ? user.uid : `guest_${uuidv4().substring(0, 8)}`);
    const [myName] = useState(() => user ? (user.displayName || 'Anonymous') : `Guest ${myId.substring(6)}`);
    const [sessionId] = useState(() => uuidv4());

    const chatUsersRef = collection(db, 'community_chat_users');
    const messagesRef = collection(db, 'community_messages');

    // Initial System Message
    const initialMessage = "Hello, we took a step forward expanding as a space for sharing thoughts about divinity.";

    useImperativeHandle(ref, () => ({
        broadcastDonation: async (amount: number, currency: string) => {
            const msg: ChatMessage = {
                id: uuidv4(),
                senderId: myId,
                senderName: myName,
                text: `${myName} contributed ${currency}${amount}`,
                amount: amount,
                timestamp: Date.now(),
                type: 'donation'
            };
            setMessages(prev => [...prev, msg]);
            try {
                await addDoc(messagesRef, msg);
            } catch (e) {
                console.error("Failed to broadcast donation:", e);
            }
        }
    }));

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Join/Leave Logic
    useEffect(() => {
        if (!componentMounted.current) {
            joinChat();
            componentMounted.current = true;
        }
        const handleBeforeUnload = () => leaveChat();
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);

        return () => {
            leaveChat();
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
        };
    }, []);

    const joinChat = async () => {
        try {
            await setDoc(doc(chatUsersRef, myId), {
                userId: myId,
                userName: myName,
                joinedAt: serverTimestamp(),
                sessionId: sessionId
            });
            setIsJoined(true);

            // Contextual Greeting using new Bot Data
            const greeting = getBotGreeting();
            setMessages([
                { id: 'sys-1', senderId: 'system', senderName: 'Nature', text: initialMessage, timestamp: Date.now(), type: 'system' },
                { id: 'sys-2', senderId: 'system', senderName: 'Guide', text: greeting, timestamp: Date.now(), type: 'system' }
            ]);

        } catch (error) {
            console.error("Error joining chat:", error);
        }
    };

    const leaveChat = async () => {
        try {
            await deleteDoc(doc(chatUsersRef, myId));
            setIsJoined(false);
        } catch (error) { console.error("Error leaving chat:", error); }
    };

    // Realtime Listeners
    useEffect(() => {
        if (!isJoined) return;

        const unsubscribeUsers = onSnapshot(chatUsersRef, (snapshot) => {
            const currentUsers: ChatUser[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as ChatUser;
                if (data.userId !== myId) currentUsers.push(data);
            });
            setOnlineUsers(currentUsers);
        });

        const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const newMsgs: ChatMessage[] = [];
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data() as ChatMessage;
                    newMsgs.push(data);
                }
            });

            if (newMsgs.length > 0) {
                setMessages(prev => {
                    const incoming = newMsgs.filter(m => !prev.some(p => p.id === m.id));
                    return [...prev, ...incoming];
                });
            }
        });

        return () => {
            unsubscribeUsers();
            unsubscribeMessages();
        };
    }, [isJoined]);

    // Update Peer Count
    useEffect(() => {
        setConnectedPeers(onlineUsers.length);
    }, [onlineUsers]);

    // Bot Response Logic
    useEffect(() => {
        if (messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];

        if (lastMsg.senderId === myId && lastMsg.type === 'text') {
            const response = getBotResponse(lastMsg.text);
            if (response) {
                setTimeout(() => {
                    const botMsg: ChatMessage = {
                        id: `bot-${Date.now()}`,
                        senderId: 'bot-guide',
                        senderName: 'Guide',
                        text: response,
                        timestamp: Date.now(),
                        type: 'text'
                    };
                    setMessages(prev => [...prev, botMsg]);
                }, 1500 + Math.random() * 1000);
            }
        }
    }, [messages, myId]);


    const sendMessage = async () => {
        if (!input.trim()) return;

        const msg: ChatMessage = {
            id: uuidv4(),
            senderId: myId,
            senderName: myName,
            text: input.trim(),
            timestamp: Date.now(),
            type: 'text'
        };

        setInput('');

        try {
            await addDoc(messagesRef, msg);
        } catch (e) {
            console.error("Failed to broadcast message:", e);
            toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <Card className="w-full h-full bg-background border-none shadow-none rounded-none flex flex-col">
            <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full w-full pr-4">
                    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 pb-20">
                        {/* Mobile Spacer - Extra tall to push content when keyboard is active */}
                        <div className="md:hidden h-[25vh]" />

                        {messages.map((msg) => {
                            const isMe = msg.senderId === myId;
                            const isBot = msg.senderId === 'bot-guide';

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

                            return (
                                <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className={cn("text-[10px] font-bold tracking-wide uppercase", isMe ? "text-primary/70" : isBot ? "text-amber-500" : "text-muted-foreground")}>
                                            {msg.senderName}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/40">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={cn("px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        isMe ? "bg-primary text-primary-foreground rounded-br-sm" :
                                            isBot ? "bg-amber-500/10 border border-amber-500/20 text-foreground rounded-bl-sm" :
                                                "bg-muted/50 border border-white/5 text-foreground rounded-bl-sm"
                                    )}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </div>

            <div className={cn(
                "p-4 md:p-6 bg-background/80 backdrop-blur-lg border-t border-white/5 relative transition-all duration-300",
            )}>
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

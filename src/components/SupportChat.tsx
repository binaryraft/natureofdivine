'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Image as ImageIcon, MinusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  image?: string;
  timestamp: any;
  isAdmin: boolean;
}

export function SupportChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Presence Check
  useEffect(() => {
    const presenceRef = doc(db, 'system', 'admin_presence');
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const lastPing = data.lastPing?.toMillis() || 0;
        // Consider online if pinged in last 30 seconds
        setIsAdminOnline(Date.now() - lastPing < 30000);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Session Initialization & Local Cache Loading
  useEffect(() => {
    if (!isOpen) return;

    let currentSessionId = localStorage.getItem('support_session_id');
    if (!currentSessionId) {
      currentSessionId = uuidv4();
      localStorage.setItem('support_session_id', currentSessionId);
    }
    setSessionId(currentSessionId);

    // Load from Local Cache first (Distributed approach)
    const cachedLogs = localStorage.getItem(`chat_log_${currentSessionId}`);
    if (cachedLogs) {
      try {
        setMessages(JSON.parse(cachedLogs));
      } catch (e) {
        console.error("Failed to load cached logs", e);
      }
    }

    // Sync from Server
    const q = query(
      collection(db, 'support_sessions', currentSessionId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const serverMsgs: Message[] = [];
      snapshot.forEach((doc) => {
        serverMsgs.push({ id: doc.id, ...doc.data() } as Message);
      });

      if (serverMsgs.length > 0) {
        setMessages(prev => {
          // Merge and avoid duplicates
          const merged = [...prev];
          serverMsgs.forEach(sm => {
            if (!merged.find(pm => pm.id === sm.id)) {
              merged.push(sm);
            }
          });
          const sorted = merged.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
          
          // Update Cache
          localStorage.setItem(`chat_log_${currentSessionId}`, JSON.stringify(sorted));
          return sorted;
        });
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  // 3. Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (text?: string, image?: string) => {
    if (!text?.trim() && !image) return;
    if (!sessionId) return;

    const msgData: Partial<Message> = {
      senderId: user?.uid || 'guest',
      senderName: user?.displayName || 'Guest User',
      text: text?.trim(),
      image: image,
      timestamp: serverTimestamp(),
      isAdmin: false
    };

    try {
      await addDoc(collection(db, 'support_sessions', sessionId, 'messages'), msgData);
      
      // Update session meta for admin dashboard
      await setDoc(doc(db, 'support_sessions', sessionId), {
        lastMessage: text || 'Image',
        lastTimestamp: serverTimestamp(),
        userId: user?.uid || 'guest',
        userName: user?.displayName || 'Guest User',
        status: 'active'
      }, { merge: true });

      setInput('');
    } catch (e) {
      console.error("Error sending message:", e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage(undefined, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 p-0"
      >
        <MessageCircle className="h-6 w-6" />
        {isAdminOnline && (
          <span className="absolute top-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[350px] md:w-[400px] h-[500px] shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
      <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            {isAdminOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-sm">Help Desk</CardTitle>
            <p className="text-[10px] opacity-80">{isAdminOnline ? 'Admin is Online' : 'Usually responds in 24h'}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary-foreground/10" onClick={() => setIsOpen(false)}>
            <MinusCircle className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={cn("flex flex-col", msg.isAdmin ? "items-start" : "items-end")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                  msg.isAdmin ? "bg-muted text-foreground rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none"
                )}>
                  {msg.image && (
                    <img src={msg.image} alt="Uploaded" className="rounded-lg mb-2 max-w-full h-auto cursor-zoom-in" />
                  )}
                  {msg.text && <p>{msg.text}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.timestamp?.toMillis ? new Date(msg.timestamp.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                </span>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/20">
          <div className="flex gap-2 items-center">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-9 w-9 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input 
              placeholder="Type a message..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              className="rounded-full bg-background"
            />
            <Button 
              size="icon" 
              className="shrink-0 h-9 w-9 rounded-full"
              disabled={!input.trim()}
              onClick={() => sendMessage(input)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

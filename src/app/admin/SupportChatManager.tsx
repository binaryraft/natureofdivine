'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  addDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Image as ImageIcon, User, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  userName: string;
  lastMessage: string;
  lastTimestamp: any;
  status: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  image?: string;
  timestamp: any;
  isAdmin: boolean;
}

export default function SupportChatManager() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Presence Ping (Reduce server load by only pinging when manager is open)
  useEffect(() => {
    const presenceRef = doc(db, 'system', 'admin_presence');
    const interval = setInterval(async () => {
      await setDoc(presenceRef, { 
        lastPing: serverTimestamp(),
        adminId: 'admin' // In a real app, use actual admin UID
      });
    }, 20000); // Ping every 20s

    return () => clearInterval(interval);
  }, []);

  // 2. Load Sessions
  useEffect(() => {
    const q = query(collection(db, 'support_sessions'), orderBy('lastTimestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeSessions: ChatSession[] = [];
      snapshot.forEach((doc) => {
        activeSessions.push({ id: doc.id, ...doc.data() } as ChatSession);
      });
      setSessions(activeSessions);
      
      // Cache sessions locally
      localStorage.setItem('admin_support_sessions', JSON.stringify(activeSessions));
    });

    // Try load from cache
    const cached = localStorage.getItem('admin_support_sessions');
    if (cached) setSessions(JSON.parse(cached));

    return () => unsubscribe();
  }, []);

  // 3. Load Messages for Active Session
  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'support_sessions', activeSession, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      
      // Distributed Cache
      localStorage.setItem(`admin_log_${activeSession}`, JSON.stringify(msgs));
    });

    const cachedMsgs = localStorage.getItem(`admin_log_${activeSession}`);
    if (cachedMsgs) setMessages(JSON.parse(cachedMsgs));

    return () => unsubscribe();
  }, [activeSession]);

  // 4. Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (text?: string, image?: string) => {
    if (!text?.trim() && !image) return;
    if (!activeSession) return;

    const msgData: Partial<Message> = {
      senderId: 'admin',
      senderName: 'Help Desk',
      text: text?.trim(),
      image: image,
      timestamp: serverTimestamp(),
      isAdmin: true
    };

    try {
      await addDoc(collection(db, 'support_sessions', activeSession, 'messages'), msgData);
      await updateDoc(doc(db, 'support_sessions', activeSession), {
        lastMessage: text || 'Image',
        lastTimestamp: serverTimestamp(),
        status: 'responded'
      });
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
      {/* Session List */}
      <Card className="md:col-span-4 flex flex-col h-full border-border/50">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" /> Active Inquiries
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.length === 0 && (
              <p className="text-center text-muted-foreground py-10 text-sm italic">No active inquiries</p>
            )}
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all flex items-center gap-3",
                  activeSession === session.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "hover:bg-muted"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold truncate">{session.userName}</p>
                    {session.status === 'active' && (
                      <span className="h-2 w-2 bg-rose-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <p className={cn(
                    "text-xs truncate", 
                    activeSession === session.id ? "opacity-90" : "text-muted-foreground"
                  )}>
                    {session.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-8 flex flex-col h-full border-border/50">
        {activeSession ? (
          <>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{sessions.find(s => s.id === activeSession)?.userName}</CardTitle>
                  <p className="text-xs text-muted-foreground">Session ID: {activeSession}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                <CheckCircle2 className="h-4 w-4" /> Resolve
              </Button>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={msg.id || i} className={cn("flex flex-col", msg.isAdmin ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm",
                        msg.isAdmin ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted border border-border/50 text-foreground rounded-tl-none"
                      )}>
                        {msg.image && (
                          <img src={msg.image} alt="Uploaded" className="rounded-lg mb-2 max-w-full h-auto" />
                        )}
                        {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {msg.timestamp?.toMillis ? new Date(msg.timestamp.toMillis()).toLocaleString() : 'Sending...'}
                      </span>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/30">
                <div className="flex gap-3 items-center max-w-3xl mx-auto">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0 h-11 w-11 rounded-full border-border/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Input 
                    placeholder="Respond to client..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                    className="h-11 rounded-full bg-background border-border/50 px-6"
                  />
                  <Button 
                    size="icon" 
                    className="shrink-0 h-11 w-11 rounded-full shadow-lg"
                    disabled={!input.trim()}
                    onClick={() => sendMessage(input)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
            <MessageCircle className="h-20 w-20 opacity-10 mb-4" />
            <p className="text-lg font-medium opacity-40">Select an inquiry to start responding</p>
          </div>
        )}
      </Card>
    </div>
  );
}

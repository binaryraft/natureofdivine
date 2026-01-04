'use client';

import { useState, useTransition, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Post, addAnswer, toggleLike } from '@/lib/community-store';
import { trackEvent } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, Star, Send, ArrowLeft, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function QuestionClient({ post }: { post: Post }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [currentPost, setCurrentPost] = useState<Post>(post);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    useEffect(() => {
        // Track the view for analytics
        trackEvent('view_question', { questionId: post.id, title: post.title });
    }, [post.id, post.title]);

    const handleLike = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Login Required', description: 'Please login to like posts.' });
            return;
        }

        const isLiked = currentPost.likes.includes(user.uid);
        
        // Optimistic Update
        setCurrentPost(prev => ({
            ...prev,
            likes: isLiked ? prev.likes.filter(id => id !== user.uid) : [...prev.likes, user.uid]
        }));

        await toggleLike(currentPost.id, user.uid, isLiked);
    };

    const handleAnswer = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Login Required', description: 'Please login to answer.' });
            return;
        }
        if (!replyContent.trim()) return;

        setIsReplying(true);
        const result = await addAnswer(currentPost.id, user.uid, user.displayName || 'Anonymous', replyContent);
        setIsReplying(false);

        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setReplyContent('');
            router.refresh(); // Refresh server data
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    }

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: currentPost.title,
                    text: currentPost.content.substring(0, 100) + '...',
                    url,
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
             navigator.clipboard.writeText(url);
             toast({ title: 'Link Copied', description: 'Question link copied to clipboard.' });
        }
    }

    const isLiked = user ? currentPost.likes.includes(user.uid) : false;

    return (
        <div className="container mx-auto py-8 md:py-12 max-w-3xl space-y-6">
            <Button variant="ghost" asChild className="pl-0 hover:pl-2 transition-all">
                <Link href="/community">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Community
                </Link>
            </Button>

            <Card className="border-primary/20 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                            <CardTitle className="text-2xl md:text-3xl font-headline leading-tight">{currentPost.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">{currentPost.userName}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(currentPost.createdAt)} ago</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                             <Button 
                                variant={isLiked ? "secondary" : "outline"} 
                                size="sm" 
                                className={cn("flex items-center gap-2", isLiked && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200")}
                                onClick={handleLike}
                            >
                                <Star className={cn("h-4 w-4", isLiked ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
                                <span>{currentPost.likes.length}</span>
                            </Button>
                             <Button variant="ghost" size="icon" onClick={handleShare}>
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                       
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                        {currentPost.content}
                    </div>
                    
                    {/* Answers Section */}
                    <div className="pt-6 border-t">
                        <h3 className="text-xl font-headline mb-6 flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary"/> 
                            {currentPost.answers.length} Answer{currentPost.answers.length !== 1 ? 's' : ''}
                        </h3>
                        
                        <div className="space-y-6 mb-8">
                            {currentPost.answers.map(answer => (
                                <Card key={answer.id} className="bg-muted/30 border-none">
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-primary">{answer.userName}</span>
                                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(answer.createdAt)} ago</span>
                                        </div>
                                        <p className="text-sm md:text-base leading-relaxed">{answer.content}</p>
                                    </CardContent>
                                </Card>
                            ))}
                            {currentPost.answers.length === 0 && (
                                <p className="text-muted-foreground text-center py-4 italic">No answers yet. Be the first to help!</p>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Your Answer</label>
                            <Textarea 
                                placeholder="Share your insight..." 
                                className="min-h-[120px] resize-y" 
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button onClick={handleAnswer} disabled={isReplying}>
                                    {isReplying ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
                                    Post Answer
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

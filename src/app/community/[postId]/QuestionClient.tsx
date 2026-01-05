'use client';

import { useState, useTransition, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Post, addAnswer, toggleLike } from '@/lib/community-store';
import { trackEvent } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, Star, Send, ArrowLeft, Share2, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Simple Markdown Renderer
function MarkdownRenderer({ content }: { content: string }) {
    if (!content) return null;

    const sections = content.split('\n\n');

    return (
        <div className="space-y-4 text-foreground/90 leading-relaxed">
            {sections.map((section, idx) => {
                // Headers
                if (section.startsWith('### ')) return <h3 key={idx} className="text-xl font-headline font-bold mt-6 mb-2">{section.replace('### ', '')}</h3>;
                if (section.startsWith('## ')) return <h2 key={idx} className="text-2xl font-headline font-bold mt-8 mb-4">{section.replace('## ', '')}</h2>;
                if (section.startsWith('# ')) return <h1 key={idx} className="text-3xl font-headline font-bold mt-8 mb-4">{section.replace('# ', '')}</h1>;

                // Lists (unordered)
                if (section.trim().startsWith('- ')) {
                    const items = section.split('\n').filter(l => l.trim().startsWith('- '));
                    return (
                        <ul key={idx} className="list-disc pl-6 space-y-1 my-4">
                            {items.map((item, i) => (
                                <li key={i}>{parseInline(item.replace('- ', ''))}</li>
                            ))}
                        </ul>
                    );
                }

                 // Blockquotes
                if (section.startsWith('> ')) {
                     return <blockquote key={idx} className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">{parseInline(section.replace('> ', ''))}</blockquote>;
                }
                
                // Images
                const imgMatch = section.match(/!\[(.*?)\]\((.*?)\)/);
                if (imgMatch) {
                    return (
                        <figure key={idx} className="my-6">
                            <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-lg shadow-sm w-full object-cover max-h-[500px]" />
                            {imgMatch[1] && <figcaption className="text-center text-xs text-muted-foreground mt-2">{imgMatch[1]}</figcaption>}
                        </figure>
                    );
                }

                // Paragraphs
                return <p key={idx} className="mb-4">{parseInline(section)}</p>;
            })}
        </div>
    );
}

function parseInline(text: string) {
    // Simple inline parsing for bold and italic
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
}

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
             toast({ title: 'Link Copied', description: 'Link copied to clipboard.' });
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

            <Card className="border-primary/20 shadow-sm overflow-hidden">
                {currentPost.coverImage && (
                    <div className="h-64 md:h-80 w-full bg-cover bg-center" style={{ backgroundImage: `url(${currentPost.coverImage})` }} />
                )}
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-3 w-full">
                             <div className="flex items-center gap-2 mb-1">
                                {currentPost.isVerified && (
                                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3" /> Official Insight
                                    </span>
                                )}
                                {currentPost.tags && currentPost.tags.map(tag => (
                                    <span key={tag} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <CardTitle className="text-2xl md:text-4xl font-headline leading-tight">{currentPost.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className={cn("font-semibold flex items-center gap-1", (currentPost.userId === 'admin' || currentPost.isVerified) ? "text-primary" : "")}>
                                    {currentPost.userName}
                                    {(currentPost.userId === 'admin' || currentPost.isVerified) && <ShieldCheck className="h-3 w-3" />}
                                </span>
                                <span>•</span>
                                <span>{formatDistanceToNow(currentPost.createdAt)} ago</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
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
                    {/* Replaced raw text with Markdown Renderer */}
                    <div className="text-base md:text-lg">
                        <MarkdownRenderer content={currentPost.content} />
                    </div>
                    
                    {/* Answers/Comments Section */}
                    <div className="pt-8 border-t">
                        <h3 className="text-xl font-headline mb-6 flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary"/> 
                            {currentPost.answers.length} {currentPost.type === 'article' ? 'Comment' : 'Answer'}{currentPost.answers.length !== 1 ? 's' : ''}
                        </h3>
                        
                        <div className="space-y-6 mb-8">
                            {currentPost.answers.map(answer => (
                                <Card key={answer.id} className="bg-muted/30 border-none">
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className={cn("font-bold flex items-center gap-1", (answer.userId === 'admin' || answer.userName === 'Divine Admin') ? "text-primary" : "")}>
                                                {answer.userName}
                                                {(answer.userId === 'admin' || answer.userName === 'Divine Admin') && <ShieldCheck className="h-3 w-3" />}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(answer.createdAt)} ago</span>
                                        </div>
                                        <p className="text-sm md:text-base leading-relaxed">{answer.content}</p>
                                    </CardContent>
                                </Card>
                            ))}
                            {currentPost.answers.length === 0 && (
                                <p className="text-muted-foreground text-center py-4 italic">
                                    {currentPost.type === 'article' ? "No comments yet. Share your thoughts!" : "No answers yet. Be the first to help!"}
                                </p>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-sm font-medium">
                                {currentPost.type === 'article' ? "Leave a Comment" : "Your Answer"}
                            </label>
                            <Textarea 
                                placeholder={currentPost.type === 'article' ? "Share your thoughts on this article..." : "Share your insight..."} 
                                className="min-h-[120px] resize-y" 
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button onClick={handleAnswer} disabled={isReplying}>
                                    {isReplying ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
                                    Post {currentPost.type === 'article' ? "Comment" : "Answer"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

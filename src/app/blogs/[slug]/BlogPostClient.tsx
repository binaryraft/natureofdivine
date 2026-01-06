'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BlogPost } from '@/lib/blog-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, Share2, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function BlogPostClient({ post }: { post: BlogPost }) {
    const { user } = useAuth();
    const { toast } = useToast();
    // Use local state for likes for optimistic updates (though backend logic for blog likes might need verification)
    const [likes, setLikes] = useState(post.likes || 0);
    const [isLiked, setIsLiked] = useState(false); // Simplification: assume not liked initially or load from user pref if store supports it

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.excerpt,
                    url,
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
             navigator.clipboard.writeText(url);
             toast({ title: 'Link Copied', description: 'Article link copied to clipboard.' });
        }
    }

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
        // Fire and forget server action if available
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Image */}
            <div className="relative h-[40vh] md:h-[50vh] w-full bg-muted">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${post.image || '/placeholder-blog.jpg'})` }}
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                </div>
                
                <div className="container relative h-full flex flex-col justify-end pb-12 px-4 md:px-6 max-w-4xl mx-auto text-white">
                    <Button variant="ghost" asChild className="text-white/80 hover:text-white hover:bg-white/10 w-fit mb-6 -ml-4">
                        <Link href="/blogs">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Articles
                        </Link>
                    </Button>
                    
                    <div className="flex items-center gap-3 text-sm font-medium text-white/80 mb-4">
                        <span className="bg-primary text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {post.tags?.[0] || 'Article'}
                        </span>
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4"/> {formatDistanceToNow(post.createdAt)} ago</span>
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-headline font-bold leading-tight mb-4">
                        {post.title}
                    </h1>
                    
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl italic">
                            {post.excerpt}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <article className="container px-4 md:px-6 max-w-3xl mx-auto -mt-10 relative z-10">
                <Card className="border-none shadow-xl">
                    <CardContent className="p-8 md:p-12 space-y-8">
                        {/* Meta and Share */}
                        <div className="flex items-center justify-between border-b pb-6 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground">Nature of the Divine Team</span>
                                    <span className="text-xs text-muted-foreground">Author</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleLike} className={cn("gap-2", isLiked && "text-red-500 border-red-200 bg-red-50")}>
                                    <Heart className={cn("h-4 w-4", isLiked && "fill-current")} /> {likes}
                                </Button>
                                <Button variant="outline" size="icon" onClick={handleShare}>
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* HTML Content Renderer */}
                        <div 
                            className="prose prose-lg prose-stone dark:prose-invert max-w-none 
                                prose-headings:font-headline prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                                prose-p:leading-relaxed prose-p:mb-6 prose-p:text-muted-foreground
                                prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
                                prose-img:rounded-xl prose-img:shadow-md
                                prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                        
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="pt-8 border-t mt-12">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-muted rounded-full text-sm text-foreground/80 font-medium">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="pt-8 border-t mt-12">
                            <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-primary"/> Comments ({post.comments?.length || 0})
                            </h3>
                            
                            <div className="space-y-6">
                                {post.comments && post.comments.length > 0 ? (
                                    post.comments.map(comment => (
                                        <div key={comment.id} className="flex gap-4">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground text-xs font-bold uppercase">
                                                {comment.userName.substring(0, 2)}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">{comment.userName}</span>
                                                    <span className="text-xs text-muted-foreground">• {formatDistanceToNow(comment.createdAt)} ago</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No comments yet.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </article>
        </div>
    );
}

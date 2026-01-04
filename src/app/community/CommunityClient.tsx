'use client';

import { useState, useTransition } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Post, addPost, addAnswer, toggleLike } from '@/lib/community-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, Star, ThumbsUp, PlusCircle, Search, User, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function CommunityClient({ initialPosts }: { initialPosts: Post[] }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [sort, setSort] = useState<'top' | 'newest'>('top');
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState('');
    
    // New Post State
    const [newPostOpen, setNewPostOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Answer State
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const filteredPosts = posts
        .filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sort === 'top') {
                return b.likes.length - a.likes.length; // Sort by likes desc
            }
            return b.createdAt - a.createdAt; // Sort by date desc
        });

    const handleCreatePost = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Login Required', description: 'You must be logged in to post.' });
            return;
        }
        if (!newTitle.trim() || !newContent.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Title and content are required.' });
            return;
        }
        
        setIsPosting(true);
        const result = await addPost(user.uid, user.displayName || 'Anonymous', newTitle, newContent);
        setIsPosting(false);

        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setNewPostOpen(false);
            setNewTitle('');
            setNewContent('');
            // Optimistic update or router refresh could happen here, 
            // but since we passed initialPosts, we might need to refresh via router
            // or just rely on revalidatePath to update next fetch.
            // For immediate feedback, we can reload or wait for next navigation.
            window.location.reload(); 
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };

    const handleLike = async (post: Post) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Login Required', description: 'Please login to like posts.' });
            return;
        }

        const isLiked = post.likes.includes(user.uid);
        
        // Optimistic Update
        setPosts(prev => prev.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    likes: isLiked ? p.likes.filter(id => id !== user.uid) : [...p.likes, user.uid]
                };
            }
            return p;
        }));

        await toggleLike(post.id, user.uid, isLiked);
    };

    const handleAnswer = async (postId: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Login Required', description: 'Please login to answer.' });
            return;
        }
        if (!replyContent.trim()) return;

        setIsReplying(true);
        const result = await addAnswer(postId, user.uid, user.displayName || 'Anonymous', replyContent);
        setIsReplying(false);

        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setReplyContent('');
            setReplyingTo(null);
            window.location.reload();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    }

    return (
        <div className="container mx-auto py-8 md:py-12 max-w-4xl space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline flex items-center gap-2"><MessageCircle className="h-8 w-8 text-primary"/> Community Forum</h1>
                    <p className="text-muted-foreground">Ask questions, share insights, and connect with others.</p>
                </div>
                <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
                    <DialogTrigger asChild>
                        <Button className="shrink-0">
                            <PlusCircle className="mr-2 h-4 w-4"/> Ask a Question
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ask a Question</DialogTitle>
                            <DialogDescription>
                                Post your question to the community. Be specific!
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input placeholder="What's on your mind?" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Details</label>
                                <Textarea placeholder="Elaborate on your question..." rows={5} value={newContent} onChange={e => setNewContent(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreatePost} disabled={isPosting}>
                                {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Post Question
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-muted/30 p-4 rounded-lg border">
                <div className="relative w-full sm:w-auto flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search discussions..."
                        className="pl-8 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-sm font-medium whitespace-nowrap">Sort by:</label>
                    <Select value={sort} onValueChange={(v: 'top' | 'newest') => setSort(v)}>
                        <SelectTrigger className="w-[140px] bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="top">Top (Likes)</SelectItem>
                            <SelectItem value="newest">Newest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-6">
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No questions found. Be the first to ask!</p>
                    </div>
                ) : (
                    filteredPosts.map(post => {
                        const isLiked = user ? post.likes.includes(user.uid) : false;
                        return (
                            <Card key={post.id} className="transition-all hover:border-primary/50">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-medium leading-tight">{post.title}</CardTitle>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-semibold text-primary">{post.userName}</span>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(post.createdAt)} ago</span>
                                            </div>
                                        </div>
                                        <Button 
                                            variant={isLiked ? "secondary" : "ghost"} 
                                            size="sm" 
                                            className={cn("flex flex-col h-auto py-2 px-3 gap-1", isLiked && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200")}
                                            onClick={() => handleLike(post)}
                                        >
                                            <Star className={cn("h-5 w-5", isLiked ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
                                            <span className="text-xs font-bold">{post.likes.length}</span>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                                    
                                    {/* Answers Section */}
                                    <div className="mt-6 pt-4 border-t">
                                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                            <MessageCircle className="h-4 w-4"/> 
                                            {post.answers.length} Answer{post.answers.length !== 1 ? 's' : ''}
                                        </h4>
                                        
                                        <div className="space-y-4 pl-4 border-l-2 border-muted">
                                            {post.answers.map(answer => (
                                                <div key={answer.id} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-primary">{answer.userName}</span>
                                                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(answer.createdAt)} ago</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{answer.content}</p>
                                                </div>
                                            ))}
                                            
                                            {replyingTo === post.id ? (
                                                <div className="space-y-2 mt-4">
                                                    <Textarea 
                                                        placeholder="Write your answer..." 
                                                        className="min-h-[80px]" 
                                                        value={replyContent}
                                                        onChange={e => setReplyContent(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancel</Button>
                                                        <Button size="sm" onClick={() => handleAnswer(post.id)} disabled={isReplying}>
                                                            {isReplying ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 mr-2"/>}
                                                            Submit
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                 <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setReplyingTo(post.id)}>
                                                    Write an Answer
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}

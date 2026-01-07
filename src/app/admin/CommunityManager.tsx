
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Post, getPosts, addPost, addAnswer, Answer } from '@/lib/community-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MessageCircle, ShieldCheck, Send, RefreshCw, User, Reply, Trash2, X, Edit, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { seedContentAction, deleteCommunityPostsBulkAction, deleteCommunityAnswerAction, updateCommunityAnswerAction } from '@/lib/actions';

export function CommunityManager() {
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    
    // Create Post State
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [asAdmin, setAsAdmin] = useState(false);
    const [fakeName, setFakeName] = useState('');

    // Reply State
    const [replyContent, setReplyContent] = useState<Record<string, string>>({});
    const [replyAsAdmin, setReplyAsAdmin] = useState<Record<string, boolean>>({});
    const [replyFakeName, setReplyFakeName] = useState<Record<string, string>>({});
    const [isReplying, setIsReplying] = useState<Record<string, boolean>>({});

    // Bulk Delete State
    const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Editing Answers State
    const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
    const [editAnswerContent, setEditAnswerContent] = useState('');
    const [isUpdatingAnswer, setIsUpdatingAnswer] = useState(false);

    const loadPosts = async () => {
        setIsLoading(true);
        try {
            const fetchedPosts = await getPosts();
            setPosts(fetchedPosts);
            setSelectedPosts(new Set());
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load posts.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditAnswer = (answer: Answer) => {
        setEditingAnswer(answer.id);
        setEditAnswerContent(answer.content);
    };

    const handleSaveAnswer = async (postId: string, answerId: string) => {
        setIsUpdatingAnswer(true);
        try {
            await updateCommunityAnswerAction(postId, answerId, editAnswerContent);
            toast({ title: 'Success', description: 'Reply updated.' });
            setEditingAnswer(null);
            loadPosts();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update reply.' });
        } finally {
            setIsUpdatingAnswer(false);
        }
    };

    const handleDeleteAnswer = async (postId: string, answerId: string) => {
        if (!confirm('Delete this reply?')) return;
        setIsUpdatingAnswer(true);
        try {
            await deleteCommunityAnswerAction(postId, answerId);
            toast({ title: 'Success', description: 'Reply deleted.' });
            loadPosts();
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete reply.' });
        } finally {
            setIsUpdatingAnswer(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedPosts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedPosts(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedPosts.size === posts.length) {
            setSelectedPosts(new Set());
        } else {
            setSelectedPosts(new Set(posts.map(p => p.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPosts.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedPosts.size} discussions?`)) return;

        setIsBulkDeleting(true);
        try {
            const result = await deleteCommunityPostsBulkAction(Array.from(selectedPosts));
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                loadPosts();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete discussions.' });
        } finally {
            setIsBulkDeleting(false);
        }
    };


    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const userId = asAdmin ? 'admin' : `fake-user-${uuidv4()}`;
        const userName = asAdmin ? 'Admin' : fakeName;

        if (!asAdmin && !fakeName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a name for the user.' });
            return;
        }

        setIsPosting(true);
        try {
            const result = await addPost(userId, userName, postTitle, postContent);
            if (result.success) {
                toast({ title: 'Success', description: 'Post created.' });
                setPostTitle('');
                setPostContent('');
                setFakeName('');
                await loadPosts();
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsPosting(false);
        }
    };

    const handleReply = async (postId: string) => {
        const isAdmin = replyAsAdmin[postId];
        const name = isAdmin ? 'Admin' : replyFakeName[postId];
        const content = replyContent[postId];

        if (!content?.trim()) return;
        if (!isAdmin && !name?.trim()) {
             toast({ variant: 'destructive', title: 'Error', description: 'Please enter a name.' });
             return;
        }

        const userId = isAdmin ? 'admin' : `fake-user-${uuidv4()}`;

        setIsReplying(prev => ({...prev, [postId]: true}));
        try {
            const result = await addAnswer(postId, userId, name, content);
            if (result.success) {
                 toast({ title: 'Success', description: 'Reply added.' });
                 setReplyContent(prev => ({...prev, [postId]: ''}));
                 setReplyFakeName(prev => ({...prev, [postId]: ''}));
                 await loadPosts();
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsReplying(prev => ({...prev, [postId]: false}));
        }
    };

    const handleGenerateContent = async () => {
        setIsSeeding(true);
        try {
            const result = await seedContentAction();
            if (result.success) {
                toast({ title: 'Content Generated', description: result.message });
                loadPosts();
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <Card className="min-h-[600px]">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                         <CardTitle className="flex items-center gap-2"><MessageCircle/> Community Management</CardTitle>
                         <CardDescription>Manage discussions and interact as Admin or other users.</CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                        {selectedPosts.size > 0 && (
                            <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4">
                                <span className="text-sm font-medium text-muted-foreground">{selectedPosts.size} selected</span>
                                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                                    {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Trash2 className="h-4 w-4 mr-2"/>}
                                    Delete
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedPosts(new Set())} title="Clear Selection">
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}
                        <Button variant="secondary" onClick={handleGenerateContent} disabled={isSeeding} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 border-none">
                            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
                            Generate AI Discussion
                        </Button>
                        <Button variant="outline" size="icon" onClick={loadPosts} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="manage">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="manage">Manage Discussions</TabsTrigger>
                        <TabsTrigger value="create">Create New Post</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create">
                        <form onSubmit={handleCreatePost} className="space-y-6 max-w-2xl mx-auto border p-6 rounded-lg">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">New Discussion</h3>
                                
                                <div className="space-y-2">
                                    <Label>Identity</Label>
                                    <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <Switch id="as-admin" checked={asAdmin} onCheckedChange={setAsAdmin} />
                                            <Label htmlFor="as-admin" className="font-normal cursor-pointer">Post as Admin <ShieldCheck className="inline h-3 w-3 text-primary"/></Label>
                                        </div>
                                        {!asAdmin && (
                                            <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                                <Label htmlFor="fake-name" className="whitespace-nowrap">Name:</Label>
                                                <Input 
                                                    id="fake-name" 
                                                    value={fakeName} 
                                                    onChange={e => setFakeName(e.target.value)} 
                                                    placeholder="e.g. Sarah J."
                                                    className="h-8"
                                                    required={!asAdmin}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input 
                                        id="title" 
                                        value={postTitle} 
                                        onChange={e => setPostTitle(e.target.value)} 
                                        placeholder="Question title..." 
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="content">Content</Label>
                                    <Textarea 
                                        id="content" 
                                        value={postContent} 
                                        onChange={e => setPostContent(e.target.value)} 
                                        placeholder="What's on your mind?" 
                                        rows={6}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isPosting}>
                                {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                Publish Post
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="manage" className="space-y-4">
                         <div className="flex items-center space-x-2 pb-2 pl-1">
                             <Checkbox 
                                id="select-all-comm" 
                                checked={posts.length > 0 && selectedPosts.size === posts.length} 
                                onCheckedChange={handleSelectAll}
                             />
                             <Label htmlFor="select-all-comm" className="cursor-pointer">Select All Discussions</Label>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">No posts found.</div>
                        ) : (
                            <Accordion type="single" collapsible className="w-full">
                                {posts.map(post => (
                                    <div key={post.id} className="flex items-start gap-2 mb-4">
                                        <Checkbox 
                                            className="mt-4"
                                            checked={selectedPosts.has(post.id)}
                                            onCheckedChange={() => toggleSelect(post.id)}
                                        />
                                        <AccordionItem value={post.id} className={`border rounded-lg px-4 w-full ${selectedPosts.has(post.id) ? 'border-primary bg-primary/5' : ''}`}>
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex flex-col items-start text-left gap-1 w-full">
                                                    <div className="flex items-center gap-2 w-full">
                                                        <span className="font-medium text-lg">{post.title}</span>
                                                        <span className="ml-auto text-xs text-muted-foreground font-normal whitespace-nowrap mr-2">
                                                            {formatDistanceToNow(post.createdAt)} ago
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span className={post.userId === 'admin' ? 'text-primary font-bold flex items-center gap-1' : ''}>
                                                            {post.userName} {post.userId === 'admin' && <ShieldCheck className="h-3 w-3"/>}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{post.answers.length} replies</span>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-4 border-t mt-2 space-y-6">
                                                <div className="bg-muted/20 p-4 rounded-md text-sm">
                                                    {post.content}
                                                </div>

                                                <div className="space-y-4 pl-4 border-l-2 border-muted">
                                                    <h4 className="font-medium text-sm text-muted-foreground">Replies</h4>
                                                    {post.answers.map(answer => (
                                                        <div key={answer.id} className="space-y-1 group">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <span className={cn("font-semibold", answer.userId === 'admin' && "text-primary flex items-center gap-1")}>
                                                                        {answer.userName}
                                                                        {answer.userId === 'admin' && <ShieldCheck className="h-3 w-3"/>}
                                                                    </span>
                                                                    <span className="text-muted-foreground text-xs">{formatDistanceToNow(answer.createdAt)} ago</span>
                                                                </div>
                                                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {editingAnswer === answer.id ? (
                                                                        <>
                                                                            <Button size="sm" variant="ghost" onClick={() => handleSaveAnswer(post.id, answer.id)} disabled={isUpdatingAnswer} className="h-6 w-6 p-0 text-green-600"><Save className="h-3 w-3"/></Button>
                                                                            <Button size="sm" variant="ghost" onClick={() => setEditingAnswer(null)} className="h-6 w-6 p-0"><X className="h-3 w-3"/></Button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Button size="sm" variant="ghost" onClick={() => handleEditAnswer(answer)} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"><Edit className="h-3 w-3"/></Button>
                                                                            <Button size="sm" variant="ghost" onClick={() => handleDeleteAnswer(post.id, answer.id)} disabled={isUpdatingAnswer} className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"><Trash2 className="h-3 w-3"/></Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {editingAnswer === answer.id ? (
                                                                <Textarea value={editAnswerContent} onChange={e => setEditAnswerContent(e.target.value)} className="min-h-[60px] text-sm mt-1" />
                                                            ) : (
                                                                <p className="text-sm">{answer.content}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {post.answers.length === 0 && <p className="text-xs text-muted-foreground italic">No replies yet.</p>}
                                                </div>

                                                <div className="bg-muted/10 p-4 rounded-md border space-y-4">
                                                    <h4 className="font-medium text-sm flex items-center gap-2"><Reply className="h-4 w-4"/> Add Reply</h4>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Switch 
                                                                id={`reply-admin-${post.id}`} 
                                                                checked={replyAsAdmin[post.id] || false} 
                                                                onCheckedChange={(checked) => setReplyAsAdmin(prev => ({...prev, [post.id]: checked}))} 
                                                            />
                                                            <Label htmlFor={`reply-admin-${post.id}`} className="text-xs">As Admin</Label>
                                                        </div>
                                                        {!(replyAsAdmin[post.id]) && (
                                                            <Input 
                                                                placeholder="Replier Name" 
                                                                className="h-8 w-40" 
                                                                value={replyFakeName[post.id] || ''}
                                                                onChange={e => setReplyFakeName(prev => ({...prev, [post.id]: e.target.value}))}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Textarea 
                                                            placeholder="Write a reply..." 
                                                            value={replyContent[post.id] || ''}
                                                            onChange={e => setReplyContent(prev => ({...prev, [post.id]: e.target.value}))}
                                                            rows={2}
                                                        />
                                                        <Button 
                                                            className="self-end" 
                                                            size="icon" 
                                                            onClick={() => handleReply(post.id)}
                                                            disabled={isReplying[post.id]}
                                                        >
                                                            {isReplying[post.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </div>
                                ))}
                            </Accordion>
                        )}
                    </TabsContent>

                </Tabs>
            </CardContent>
        </Card>
    );
}

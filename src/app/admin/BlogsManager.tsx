'use client';

import { useState, useEffect, useTransition } from 'react';
import { BlogPost, BlogComment } from '@/lib/blog-store';
import { fetchBlogPostsAction, createBlogPostAction, updateBlogPostAction, deleteBlogPostAction, seedContentAction, generateBlogCommentsAction, deleteBlogPostsBulkAction, deleteBlogCommentAction, updateBlogCommentAction } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, RefreshCw, PlusCircle, Edit, Trash2, BookOpen, Sparkles, Image as ImageIcon, MessageCircle, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

// ... imports

const CommentManagerDialog = ({ post, isOpen, onClose, onUpdate }: { post: BlogPost, isOpen: boolean, onClose: () => void, onUpdate: () => void }) => {
    const { toast } = useToast();
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleEdit = (comment: BlogComment) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
    };

    const handleSave = async (commentId: string) => {
        setIsProcessing(true);
        try {
            await updateBlogCommentAction(post.id, commentId, editContent);
            toast({ title: 'Success', description: 'Comment updated.' });
            setEditingComment(null);
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update comment.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;
        setIsProcessing(true);
        try {
            await deleteBlogCommentAction(post.id, commentId);
            toast({ title: 'Success', description: 'Comment deleted.' });
            onUpdate();
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete comment.' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Comments</DialogTitle>
                    <DialogDescription>View, edit, or delete comments for "{post.title}".</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {post.comments && post.comments.length > 0 ? (
                        post.comments.map(comment => (
                            <div key={comment.id} className="border p-3 rounded-md space-y-2 bg-muted/20">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{comment.userName}</span>
                                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.createdAt)} ago</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {editingComment === comment.id ? (
                                            <>
                                                <Button size="sm" variant="ghost" onClick={() => handleSave(comment.id)} disabled={isProcessing} className="h-6 w-6 p-0 text-green-600"><Save className="h-3 w-3"/></Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)} className="h-6 w-6 p-0"><X className="h-3 w-3"/></Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(comment)} className="h-6 w-6 p-0"><Edit className="h-3 w-3"/></Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(comment.id)} disabled={isProcessing} className="h-6 w-6 p-0 text-red-600"><Trash2 className="h-3 w-3"/></Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {editingComment === comment.id ? (
                                    <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="min-h-[60px] text-sm" />
                                ) : (
                                    <p className="text-sm text-foreground/90">{comment.content}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No comments yet.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const BlogCard = ({ post, onEdit, onDelete, onGenerateComments, generatingComments, isSelected, onToggleSelect, onManageComments }: { 
    post: BlogPost, 
    onEdit: (p: BlogPost) => void, 
    onDelete: (id: string) => void, 
    onGenerateComments: (id: string) => void,
    generatingComments: string | null,
    isSelected: boolean,
    onToggleSelect: (id: string) => void,
    onManageComments: (p: BlogPost) => void
}) => {
    const [imgSrc, setImgSrc] = useState(post.image);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgSrc(post.image);
        setImgError(false);
    }, [post.image]);

    return (
        <Card className={`overflow-hidden flex flex-col relative transition-all duration-200 ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
            <div className="absolute top-2 left-2 z-10">
                <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={() => onToggleSelect(post.id)}
                    className="bg-background/80 backdrop-blur-sm border-primary"
                />
            </div>
            <div className="aspect-video relative bg-muted cursor-pointer" onClick={() => onToggleSelect(post.id)}>
                {imgSrc && !imgError ? (
                    <Image 
                        src={imgSrc} 
                        alt={post.title} 
                        fill 
                        className="object-cover" 
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground bg-muted">
                        <ImageIcon className="h-8 w-8" />
                    </div>
                )}
                {!post.published && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">DRAFT</div>
                )}
            </div>
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-1" title={post.title}>{post.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs">{post.excerpt}</CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 mt-auto flex flex-col gap-3 items-start">
                <div className="text-xs text-muted-foreground w-full flex justify-between">
                   <span>{post.views} views • {post.likes} likes</span>
                   <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onManageComments(post)}>
                        {post.comments?.length || 0} comments
                   </Button>
                </div>
                <div className="flex gap-2 w-full justify-end">
                    <Button size="sm" variant="outline" onClick={() => onGenerateComments(post.id)} disabled={generatingComments === post.id} title="Generate Comments">
                        {generatingComments === post.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <MessageCircle className="h-3 w-3"/>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onEdit(post)}><Edit className="h-4 w-4"/></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(post.id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export function BlogsManager() {
    // ... existing state ...
    const { toast } = useToast();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, startTransition] = useTransition();
    const [isSeeding, setIsSeeding] = useState(false);
    const [generatingComments, setGeneratingComments] = useState<string | null>(null);
    
    // Comment Management State
    const [managingCommentsPost, setManagingCommentsPost] = useState<BlogPost | null>(null);

    // Selection State
    const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Edit/Create State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        image: '',
        published: true,
        tags: ''
    });

    const loadPosts = async () => {
        setIsLoading(true);
        try {
            const fetchedPosts = await fetchBlogPostsAction(false); // Fetch all including drafts
            setPosts(fetchedPosts);
            setSelectedPosts(new Set()); // Clear selection on reload
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load blog posts.' });
        } finally {
            setIsLoading(false);
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
        if (!confirm(`Are you sure you want to delete ${selectedPosts.size} posts?`)) return;

        setIsBulkDeleting(true);
        try {
            const result = await deleteBlogPostsBulkAction(Array.from(selectedPosts));
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                loadPosts();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete posts.' });
        } finally {
            setIsBulkDeleting(false);
        }
    };


    const handleOpenCreate = () => {
        setEditingPost(null);
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            image: '',
            published: true,
            tags: ''
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (post: BlogPost) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            image: post.image,
            published: post.published,
            tags: post.tags.join(', ')
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
                const postData = {
                    title: formData.title,
                    slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    excerpt: formData.excerpt,
                    content: formData.content,
                    image: formData.image || 'https://placehold.co/600x400/e2e2e2/1a1a1a?text=Blog+Image',
                    published: formData.published,
                    tags: tagsArray
                };

                if (editingPost) {
                    await updateBlogPostAction({ ...editingPost, ...postData });
                    toast({ title: 'Success', description: 'Blog post updated.' });
                } else {
                    await createBlogPostAction(postData);
                    toast({ title: 'Success', description: 'Blog post created.' });
                }
                setIsDialogOpen(false);
                loadPosts();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save post.' });
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        startTransition(async () => {
            try {
                await deleteBlogPostAction(id);
                toast({ title: 'Success', description: 'Post deleted.' });
                loadPosts();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete post.' });
            }
        });
    };

    const handleGenerateContent = async () => {
        setIsSeeding(true);
        try {
            const result = await seedContentAction();
            if (result.success) {
                toast({ title: 'Content Generated', description: result.message });
                loadPosts(); // Reload to see new blogs
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        } finally {
            setIsSeeding(false);
        }
    };

    const handleGenerateComments = async (blogId: string) => {
        setGeneratingComments(blogId);
        try {
            const result = await generateBlogCommentsAction(blogId);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                loadPosts();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate comments.' });
        } finally {
            setGeneratingComments(null);
        }
    };

    return (
        <Card className="min-h-[600px]">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                         <CardTitle className="flex items-center gap-2"><BookOpen/> Blog Management</CardTitle>
                         <CardDescription>Manage articles, wisdom, and updates.</CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                        {selectedPosts.size > 0 && (
                            <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4">
                                <span className="text-sm font-medium text-muted-foreground">{selectedPosts.size} selected</span>
                                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                                    {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Trash2 className="h-4 w-4 mr-2"/>}
                                    Delete Selected
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedPosts(new Set())} title="Clear Selection">
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}
                        <Button variant="secondary" onClick={handleGenerateContent} disabled={isSeeding} className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 border-none">
                            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Sparkles className="h-4 w-4 mr-2"/>}
                            Generate AI Content
                        </Button>
                        <Button onClick={handleOpenCreate}>
                            <PlusCircle className="h-4 w-4 mr-2"/> New Post
                        </Button>
                        <Button variant="outline" size="icon" onClick={loadPosts} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
                        </Button>
                    </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                     <Checkbox 
                        id="select-all" 
                        checked={posts.length > 0 && selectedPosts.size === posts.length} 
                        onCheckedChange={handleSelectAll}
                     />
                     <Label htmlFor="select-all" className="cursor-pointer">Select All Posts</Label>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map(post => (
                            <BlogCard 
                                key={post.id} 
                                post={post} 
                                onEdit={handleOpenEdit} 
                                onDelete={handleDelete}
                                onGenerateComments={handleGenerateComments}
                                generatingComments={generatingComments}
                                isSelected={selectedPosts.has(post.id)}
                                onToggleSelect={toggleSelect}
                                onManageComments={setManagingCommentsPost}
                            />
                        ))}
                    </div>
                )}

                {managingCommentsPost && (
                    <CommentManagerDialog 
                        post={managingCommentsPost} 
                        isOpen={!!managingCommentsPost} 
                        onClose={() => setManagingCommentsPost(null)}
                        onUpdate={loadPosts}
                    />
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
                            <DialogDescription>Share wisdom with the community.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug (Optional)</Label>
                                    <Input id="slug" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="auto-generated" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="image">Cover Image URL</Label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-2">
                                        <Input id="image" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
                                        <p className="text-xs text-muted-foreground">Provide a direct URL to the image.</p>
                                    </div>
                                    {formData.image && (
                                        <div className="relative h-20 w-32 rounded-md overflow-hidden bg-muted border shrink-0">
                                            <Image 
                                                src={formData.image} 
                                                alt="Preview" 
                                                fill 
                                                className="object-cover" 
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e2e2/1a1a1a?text=Invalid+Image' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea id="excerpt" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} rows={2} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Content (HTML supported)</Label>
                                <Textarea id="content" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={10} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tags">Tags (comma separated)</Label>
                                    <Input id="tags" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="Spirituality, Life, God" />
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <Switch id="published" checked={formData.published} onCheckedChange={checked => setFormData({...formData, published: checked})} />
                                    <Label htmlFor="published">Published</Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Save Post
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
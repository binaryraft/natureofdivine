'use client';

import { useState, useEffect, useTransition } from 'react';
import { BlogPost } from '@/lib/blog-store';
import { fetchBlogPostsAction, createBlogPostAction, updateBlogPostAction, deleteBlogPostAction, seedContentAction, generateBlogCommentsAction } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, RefreshCw, PlusCircle, Edit, Trash2, BookOpen, Sparkles, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';

export function BlogsManager() {
    const { toast } = useToast();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, startTransition] = useTransition();
    const [isSeeding, setIsSeeding] = useState(false);
    const [generatingComments, setGeneratingComments] = useState<string | null>(null);

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
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load blog posts.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

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
                    <div className="flex gap-2">
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
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map(post => (
                            <Card key={post.id} className="overflow-hidden flex flex-col">
                                <div className="aspect-video relative bg-muted">
                                    {post.image ? (
                                        <Image src={post.image} alt={post.title} fill className="object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
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
                                <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center">
                                    <div className="text-xs text-muted-foreground">
                                        {post.views} views • {post.likes} likes • {post.comments?.length || 0} comments
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleGenerateComments(post.id)} disabled={generatingComments === post.id} title="Generate Comments">
                                            {generatingComments === post.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <MessageCircle className="h-3 w-3"/>}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(post)}><Edit className="h-4 w-4"/></Button>
                                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(post.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
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
                                <Input id="image" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
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
'use client';

import { useState } from 'react';
import { BlogPost } from '@/lib/blog-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/actions';

export function BlogClient({ initialPosts }: { initialPosts: BlogPost[] }) {
    const [search, setSearch] = useState('');

    const filteredPosts = initialPosts.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) || 
        p.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container mx-auto py-12 px-4 md:px-6 max-w-6xl">
            {/* Hero Section */}
            <div className="text-center space-y-4 mb-16">
                <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-primary">
                    Divine Insights
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Explore wisdom, spirituality, and the science of the soul. Official articles from the Nature of the Divine team.
                </p>
                
                <div className="relative max-w-md mx-auto mt-8">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search articles..." 
                        className="pl-10 h-12 rounded-full shadow-sm border-primary/20 focus-visible:ring-primary"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Featured Article (First one) */}
            {filteredPosts.length > 0 && !search && (
                <div className="mb-16">
                    <Link href={`/blogs/${filteredPosts[0].slug}`} className="group block">
                        <div className="grid md:grid-cols-2 gap-8 items-center bg-muted/20 rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-all duration-300">
                            <div className="h-64 md:h-full min-h-[400px] w-full bg-cover bg-center relative" style={{ backgroundImage: `url(${filteredPosts[0].image})` }}>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            </div>
                            <div className="p-8 md:p-12 space-y-6">
                                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                                    <span className="px-3 py-1 bg-primary/10 rounded-full">Featured</span>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(filteredPosts[0].createdAt)} ago</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-headline font-bold leading-tight group-hover:text-primary transition-colors">
                                    {filteredPosts[0].title}
                                </h2>
                                <p className="text-muted-foreground line-clamp-3 text-lg leading-relaxed">
                                    {filteredPosts[0].excerpt || filteredPosts[0].content.replace(/<[^>]+>/g, '').substring(0, 200)}...
                                </p>
                                <div className="flex items-center gap-2 text-sm font-medium pt-4">
                                    Read Article <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Article Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(search ? filteredPosts : filteredPosts.slice(1)).map(post => (
                    <Link href={`/blogs/${post.slug}`} key={post.id} className="group flex flex-col h-full">
                        <Card className="h-full border-none shadow-none bg-transparent hover:bg-muted/30 transition-colors rounded-xl overflow-hidden">
                            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl mb-4 relative">
                                <div 
                                    className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500"
                                    style={{ backgroundImage: `url(${post.image || '/placeholder-blog.jpg'})` }}
                                />
                            </div>
                            <CardHeader className="p-0 mb-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDistanceToNow(post.createdAt)} ago</span>
                                </div>
                                <CardTitle className="font-headline text-xl leading-snug group-hover:text-primary transition-colors">
                                    {post.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 mt-auto">
                                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                     {post.excerpt || post.content.replace(/<[^>]+>/g, '').substring(0, 120)}...
                                </p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 group-hover:text-primary">
                                    Read More <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {filteredPosts.length === 0 && (
                <div className="text-center py-24">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">No articles found matching "{search}"</h3>
                </div>
            )}
        </div>
    );
}

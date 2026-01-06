
import { getBlogPostBySlug } from '@/lib/blog-store';
import { BlogPostClient } from './BlogPostClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        return {
            title: 'Article Not Found',
        };
    }

    const plainTextDescription = post.excerpt || post.content
        .replace(/<[^>]+>/g, '') // Strip HTML tags
        .substring(0, 160)
        .trim();

    return {
        title: `${post.title} | Nature of the Divine Blog`,
        description: plainTextDescription + '...',
        openGraph: {
            title: post.title,
            description: plainTextDescription + '...',
            type: 'article',
            images: post.image ? [post.image] : undefined,
            publishedTime: new Date(post.createdAt).toISOString(),
            tags: post.tags
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        image: post.image ? [post.image] : [],
        datePublished: new Date(post.createdAt).toISOString(),
        dateModified: new Date(post.createdAt).toISOString(),
        author: [{
            '@type': 'Organization',
            name: "Nature of the Divine Team",
        }],
        description: post.excerpt,
        articleBody: post.content.replace(/<[^>]+>/g, ''),
        keywords: post.tags?.join(', '),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogPostClient post={post} />
        </>
    );
}

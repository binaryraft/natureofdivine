
import { getPostById } from '@/lib/community-store';
import { QuestionClient } from '@/app/community/[postId]/QuestionClient'; // Reusing the renderer for now, or can create a dedicated BlogReader
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostById(slug);

    if (!post) {
        return {
            title: 'Article Not Found',
        };
    }

    const plainTextDescription = post.content
        .replace(/[#*`_[\]]/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\n/g, ' ')
        .substring(0, 160)
        .trim();

    return {
        title: `${post.title} | Nature of the Divine Blog`,
        description: plainTextDescription + '...',
        openGraph: {
            title: post.title,
            description: plainTextDescription + '...',
            type: 'article',
            authors: [post.userName],
            images: post.coverImage ? [post.coverImage] : undefined,
            publishedTime: new Date(post.createdAt).toISOString(),
            tags: post.tags
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPostById(slug);

    if (!post || post.type !== 'article') {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        image: post.coverImage ? [post.coverImage] : [],
        datePublished: new Date(post.createdAt).toISOString(),
        dateModified: new Date(post.createdAt).toISOString(),
        author: [{
            '@type': 'Person',
            name: post.userName,
        }],
        articleBody: post.content.replace(/[#*`_[\]]/g, ''), // Strip md for rough body or full content
        keywords: post.tags?.join(', '),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* We can create a dedicated BlogViewer component later for a different layout than QuestionClient */}
            <QuestionClient post={post} />
        </>
    );
}

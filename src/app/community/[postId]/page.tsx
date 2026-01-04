
import { getPostById } from '@/lib/community-store';
import { QuestionClient } from './QuestionClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

type Props = {
    params: Promise<{ postId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { postId } = await params;
    const post = await getPostById(postId);

    if (!post) {
        return {
            title: 'Question Not Found',
        };
    }

    return {
        title: `${post.title} | Community Forum`,
        description: post.content.substring(0, 160) + '...',
        openGraph: {
            title: post.title,
            description: post.content.substring(0, 160) + '...',
            type: 'article',
            authors: [post.userName],
        },
    };
}

export default async function QuestionPage({ params }: Props) {
    const { postId } = await params;
    const post = await getPostById(postId);

    if (!post) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'QAPage',
        mainEntity: {
            '@type': 'Question',
            name: post.title,
            text: post.content,
            answerCount: post.answers.length,
            upvoteCount: post.likes.length,
            dateCreated: new Date(post.createdAt).toISOString(),
            author: {
                '@type': 'Person',
                name: post.userName,
            },
            acceptedAnswer: post.answers.length > 0 ? {
                '@type': 'Answer',
                text: post.answers[0].content,
                dateCreated: new Date(post.answers[0].createdAt).toISOString(),
                upvoteCount: 0,
                url: `https://www.natureofthedivine.com/community/${post.id}`,
                author: {
                    '@type': 'Person',
                    name: post.answers[0].userName,
                },
            } : undefined,
            suggestedAnswer: post.answers.slice(1).map(answer => ({
                '@type': 'Answer',
                text: answer.content,
                dateCreated: new Date(answer.createdAt).toISOString(),
                upvoteCount: 0,
                author: {
                    '@type': 'Person',
                    name: answer.userName,
                },
            })),
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <QuestionClient post={post} />
        </>
    );
}

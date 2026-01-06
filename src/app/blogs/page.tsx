
import { getBlogPosts } from '@/lib/blog-store';
import { BlogClient } from './BlogClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Divine Insights Blog | Nature of the Divine',
    description: 'Explore articles on spirituality, mental health, and the nature of God. Official insights from Alfas B and the team.',
};

export default async function BlogsPage() {
    const posts = await getBlogPosts(true);

    return (
        <BlogClient initialPosts={posts as any} />
    );
}

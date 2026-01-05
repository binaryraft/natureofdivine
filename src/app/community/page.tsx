
import { getPosts } from '@/lib/community-store';
import { CommunityClient } from './CommunityClient';

export const metadata = {
    title: 'Community Forum | Nature of the Divine',
    description: 'Join the discussion, ask questions, and share insights with the community.',
};

export default async function CommunityPage() {
    const posts = await getPosts('question');

    return (
        <CommunityClient initialPosts={posts} />
    );
}

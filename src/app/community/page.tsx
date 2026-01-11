
import { getPosts } from '@/lib/community-store';
import { getTotalDonations } from '@/lib/donation-store';
import { CommunityClient } from './CommunityClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Community Forum | Nature of the Divine',
    description: 'Join the discussion, ask questions, and share insights with the community.',
};

export default async function CommunityPage() {
    const posts = await getPosts();
    const totalDonations = await getTotalDonations();

    return (
        <CommunityClient initialPosts={posts} initialDonations={totalDonations} />
    );
}

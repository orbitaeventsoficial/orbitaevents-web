import { AdminPage } from '../components/AdminPage';
import { listSocialPosts, getSocialPostCounts } from '@/lib/services/socialPostService';
import { loadSocialIdeas } from '@/lib/services/socialIdeasService';
import SocialClient from './SocialClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Social Media | Òrbita Admin',
};

export default async function SocialPage() {
  const [posts, counts, ideas] = await Promise.all([
    listSocialPosts(),
    getSocialPostCounts(),
    loadSocialIdeas(),
  ]);

  const serializedPosts = posts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
  }));

  const serializedIdeas = ideas.map((i) => ({
    ...i,
    scheduledAt: i.scheduledAt?.toISOString() ?? null,
  }));

  return (
    <AdminPage
      title="Social Media"
      subtitle="Calendari editorial i gestió de contingut"
    >
      <SocialClient
        initialPosts={serializedPosts}
        initialCounts={counts}
        initialIdeas={serializedIdeas}
      />
    </AdminPage>
  );
}

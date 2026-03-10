import { getDbPacks } from '@/lib/packs-db';
import PacksClient from './PacksClient';

export const dynamic = 'force-dynamic';

export default async function PacksPage({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const packs = await getDbPacks({ locale });
  return <PacksClient packs={packs} />;
}

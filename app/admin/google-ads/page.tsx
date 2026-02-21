import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function GoogleAdsPage() {
  redirect('/admin/analytics#google-ads');
}

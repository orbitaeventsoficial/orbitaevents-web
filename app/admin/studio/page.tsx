import type { Metadata } from 'next';
import StudioShowroom from '@/app/studio/StudioShowroom';

export const metadata: Metadata = {
  title: 'Studio · Òrbita Admin',
  robots: { index: false, follow: false },
};

export default function AdminStudioPage() {
  return <StudioShowroom />;
}

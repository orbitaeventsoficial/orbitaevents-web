// app/[locale]/valoracio/page.tsx
import { Metadata } from 'next';
import ValoracioClient from './client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Valoració | Òrbita Events',
  description: 'Valora la teva experiència amb Òrbita Events.',
  robots: { index: false, follow: false },
};

export default function ValoracioPage() {
  return <ValoracioClient />;
}

// app/[locale]/valoracio/page.tsx
import ValoracioClient from './client';

export const dynamic = 'force-dynamic';

export default function ValoracioPage() {
  return <ValoracioClient />;
}

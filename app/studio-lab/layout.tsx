import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Studio Lab · Òrbita',
  robots: { index: false, follow: false },
};

export default function StudioLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

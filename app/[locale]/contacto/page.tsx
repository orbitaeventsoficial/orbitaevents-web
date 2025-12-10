import type { Metadata } from 'next';
import Client from './client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contacto | Òrbita Events',
  description: 'Pide presupuesto de discomovil, tematizaciones, eventos. Respondemos en menos de 2 horas.',
  alternates: { canonical: '/contacto' },
  robots: { index: true, follow: true },
};

export default function ContactoPage() {
  return <Client />;
}

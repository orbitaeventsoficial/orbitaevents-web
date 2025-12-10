// app/servicios/empresas/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@\/components/seo/Breadcrumbs';
import ServiceJsonLD from '@\/components/seo/ServiceJsonLD';
import FAQ from '@\/components/seo/FAQ';
import Client from './client';
import { getMinPriceByService, getPacksByService } from '@/config/packs-config';

const EMP_MIN_PRICE = getMinPriceByService('empresas');
const EMP_PACKS = getPacksByService('empresas');

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Eventos Corporativos Barcelona | DJ Profesional desde ${EMP_MIN_PRICE}€ | Òrbita Events`,
  description: `DJ eventos corporativos Barcelona. Cenas de empresa, teambuildings, lanzamientos. Sonido e iluminación profesional. Presupuesto personalizado en 24h.`,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/empresas' },
  openGraph: {
    title: `Eventos Corporativos Barcelona | Desde ${EMP_MIN_PRICE}€`,
    description: 'DJ profesional para eventos de empresa. Cenas, team building, presentaciones. Presupuesto gratis.',
    url: '/servicios/empresas',
    images: [
      {
        url: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
        alt: 'Eventos Corporativos Barcelona - Òrbita Events',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Eventos Corporativos Barcelona | Desde ${EMP_MIN_PRICE}€`,
    description: 'DJ profesional para eventos de empresa. Sonido e iluminación profesional.',
    images: ['/img/portfolio/eventos-empresa/eventos-empresa-01.webp'],
  },
  robots: { index: true, follow: true },
  keywords: [
    'eventos corporativos barcelona',
    'dj eventos empresa barcelona',
    'team building barcelona',
    'cenas de empresa barcelona',
    'eventos empresariales',
    'presentaciones corporativas',
    'dj empresa girona',
  ],
};

export default function EmpresasPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'Eventos Empresas', url: '/servicios/empresas' },
        ]}
      />

      <ServiceJsonLD
        name="Eventos Corporativos Profesionales con Toque Humano"
        slugPath="/servicios/empresas"
        description="Eventos corporativos que refuerzan tu marca: cenas de empresa, team building, presentaciones y networking elegante. Producción técnica profesional con sonido Pioneer + EV y coordinación completa."
        serviceType={[
          'Eventos corporativos',
          'Team building',
          'Cenas de empresa',
          'Eventos empresariales',
          'Networking empresarial',
          'Presentaciones corporativas',
        ]}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceFrom={String(EMP_MIN_PRICE)}
        priceCurrency="EUR"
        availability="https://schema.org/InStock"
        aggregateRating={{
          ratingValue: 4.9,
          reviewCount: 47,
        }}
        offers={EMP_PACKS.map((pack) => ({
          '@type': 'Offer',
          name: pack.name,
          price: String(pack.priceValue),
          priceCurrency: 'EUR',
          url: `/servicios/empresas#${pack.slug}`,
          availability: 'https://schema.org/InStock',
          description: pack.tagline,
        }))}
      />

      <Client />

      <FAQ
        items={[
          {
            q: '¿Cómo refuerza vuestra producción la imagen de nuestra marca?',
            a: 'Profesionalismo en cada detalle: montaje discreto, coordinación impecable, branding integrado y ambiente elegante. Tu equipo recordará el evento, tu cliente quedará impresionado.',
          },
          {
            q: '¿Qué incluye un evento corporativo con toque humano?',
            a: 'No solo producción técnica: creamos networking elegante, ambiente profesional y momentos de conexión real entre asistentes. Música ambiente, iluminación corporativa y dinámicas que generan conversación.',
          },
          {
            q: '¿Podéis integrar nuestra identidad corporativa en el evento?',
            a: 'Totalmente. Integramos tu logo, colores corporativos y mensajes clave en pantallas, iluminación y dinámicas. El evento refleja tu marca sin resultar forzado.',
          },
          {
            q: '¿Trabajáis en oficinas, hoteles y espacios corporativos?',
            a: 'Sí, nos adaptamos a cualquier espacio empresarial. Incluye visita previa para revisar accesos, potencia eléctrica y coordinación con el venue. Montaje discreto y profesional.',
          },
          {
            q: '¿Cómo garantizáis que no haya problemas técnicos?',
            a: 'Equipamiento profesional certificado + backup completo + técnicos experimentados. Si algo falla (que no suele pasar), se soluciona sin que los asistentes se enteren. El evento NO se para.',
          },
          {
            q: '¿Coordináis con catering, venue y otros proveedores?',
            a: 'Totalmente. Nos encargamos de la coordinación técnica completa: tiempos, montaje, desmontaje y sincronización con otros proveedores. Tú te centras en tus invitados.',
          },
        ]}
      />
    </>
  );
}


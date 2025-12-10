// app/servicios/bodas/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import nextDynamic from 'next/dynamic';

import { getMinPriceByService, getPacksByService } from '@/config/packs-config';

export const dynamic = 'force-dynamic';

const BodasClient = nextDynamic(() => import('./client'));

const MIN_PRICE = getMinPriceByService('bodas');
const PACKS = getPacksByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Barcelona | Precios desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en Barcelona desde ${MIN_PRICE}€. Sonido profesional 4000W, iluminación y efectos especiales. Profesionales del sector. Pide presupuesto sin compromiso.`,
  keywords:
    'dj bodas barcelona, dj boda girona, dj bodas maresme, dj bodas costa brava, sonido bodas, musica boda, efectos especiales bodas',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/bodas' },
  openGraph: {
    title: `DJ Bodas Barcelona | Desde ${MIN_PRICE}€`,
    description: `DJ profesional para tu boda en Barcelona. Sonido EV 4000W + iluminación + efectos. Ceremonia, cóctel y fiesta. Presupuesto gratis.`,
    url: '/servicios/bodas',
    images: [{ url: '/img/portfolio/bodas/bodas-01.webp', alt: 'DJ Bodas Barcelona - Òrbita Events' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `DJ Bodas Barcelona | Desde ${MIN_PRICE}€ | Òrbita`,
    description: `DJ profesional + Sonido 4000W + Iluminación + Efectos. Packs desde ${MIN_PRICE}€.`,
    images: ['/img/portfolio/bodas/bodas-01.webp'],
  },
  robots: { index: true, follow: true },
};

export default function BodasPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'DJ Bodas Barcelona', url: '/servicios/bodas' },
        ]}
      />

      <ServiceJsonLD
        name="Experiencia Completa para Bodas"
        slugPath="/servicios/bodas"
        description={`Experiencia completa personalizada para bodas: DJ profesional, sonido EV 4.000W, iluminación de ambiente y efectos especiales adaptados a vuestra historia. Packs desde ${MIN_PRICE}€.`}
        serviceType={[
          'DJ para bodas',
          'Sonido e iluminación bodas',
          'Producción musical bodas',
          'Efectos especiales bodas',
          'Animación bodas',
        ]}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
        aggregateRating={{ ratingValue: 5.0, reviewCount: 1 }}
        offers={PACKS.map((p) => ({
          '@type': 'Offer',
          name: p.name,
          price: String(p.priceValue),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `/servicios/bodas#${p.slug}`,
          description: p.tagline,
        }))}
      />

      <BodasClient />

      <FAQ
        items={[
          {
            q: '¿Podemos personalizar completamente la música y el ambiente?',
            a: 'Totalmente. Vuestra boda exactamente como la imagináis: nos pasáis vuestra playlist, temas imprescindibles y ambiente que queréis. El DJ adapta la música en tiempo real para que la pista funcione durante toda la celebración.',
          },
          {
            q: '¿Incluye música para ceremonia, cóctel y banquete?',
            a: 'Depende del pack. Los packs Premium y VIP incluyen experiencia completa desde la ceremonia hasta el final del baile. El pack Esencial se centra en el banquete y la fiesta.',
          },
          {
            q: '¿Cómo personalizáis la iluminación y los efectos?',
            a: 'Adaptamos colores, intensidad y efectos según vuestra decoración y el estilo de la boda. Humo y burbujas según espacio. Confeti, chispas frías y CO2 como extras para momentos clave.',
          },
          {
            q: '¿Qué pasa si hay problemas técnicos durante la boda?',
            a: 'Llevamos equipo de backup completo (controladora, cables y altavoces de reserva). Si algo falla, se cambia sin parar la música. Vuestros invitados ni se enterarán.',
          },
          {
            q: '¿Trabajáis en fincas y exteriores?',
            a: 'Sí, trabajamos en cualquier espacio. Revisamos potencia eléctrica, accesos y adaptamos el montaje. Si hay limitador de ruido, configuramos el equipo para cumplirlo sin perder calidad.',
          },
          {
            q: '¿Cuánto tiempo antes hay que reservar?',
            a: 'Para bodas, recomendamos reservar con 4-6 meses de antelación. Las fechas de primavera y verano se llenan rápido. Consultad disponibilidad para vuestra fecha específica.',
          },
        ]}
      />
    </>
  );
}


// app/servicios/discomovil/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@\/components/seo/Breadcrumbs';
import ServiceJsonLD from '@\/components/seo/ServiceJsonLD';
import FAQ from '@\/components/seo/FAQ';
import Client from './client';
import { getMinPriceByService, getPacksByService } from '@/config/packs-config';

const DISCO_MIN_PRICE = getMinPriceByService('discomovil');
const DISCO_PACKS = getPacksByService('discomovil');

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Discomóvil Barcelona | DJ + Sonido + Luces desde ${DISCO_MIN_PRICE}€ | Òrbita`,
  description: `Discomóvil en Barcelona desde ${DISCO_MIN_PRICE}€. DJ + sonido 4000W + luces LED. Bodas, fiestas, eventos. Nos desplazamos a toda Catalunya. Presupuesto en 2 horas.`,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/discomovil' },
  openGraph: {
    title: `Discomóvil Barcelona | Desde ${DISCO_MIN_PRICE}€`,
    description: `DJ profesional + Sonido 4000W + Luces LED + Efectos. Barcelona y Girona. Presupuesto gratis.`,
    url: '/servicios/discomovil',
    images: [
      {
        url: '/img/portfolio/discomovil/discomovil-01.png',
        alt: 'Discomóvil Barcelona - Òrbita Events',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Discomóvil Barcelona | Desde ${DISCO_MIN_PRICE}€`,
    description: 'DJ profesional + Sonido 4000W + Luces LED + Efectos. Barcelona y Girona.',
    images: ['/img/portfolio/discomovil/discomovil-01.png'],
  },
  robots: { index: true, follow: true },
  keywords: [
    'discomóvil barcelona',
    'discomóvil girona',
    'dj fiestas privadas barcelona',
    'discomóvil cumpleaños',
    'discomóvil bodas',
    'alquiler dj barcelona',
    'discomóvil maresme',
    'discomóvil costa brava',
  ],
};

export default function discomovilPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'Discomóvil', url: '/servicios/discomovil' },
        ]}
      />

      <ServiceJsonLD
        name="Discomóvil Completa - Experiencia Personalizada"
        slugPath="/servicios/discomovil"
        description={`Experiencia completa personalizada: DJ profesional que adapta la música en tiempo real, sonido EV profesional, iluminación LED ambiente y efectos especiales. Mucho más que poner música. Para fiestas, bodas y eventos privados en Catalunya. Packs desde ${DISCO_MIN_PRICE}€.`}
        serviceType={[
          'Discomóvil',
          'DJ para fiestas',
          'DJ bodas',
          'DJ cumpleaños',
          'Iluminación LED',
          'Efectos especiales',
        ]}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceFrom={String(DISCO_MIN_PRICE)}
        priceCurrency="EUR"
        availability="https://schema.org/InStock"
        aggregateRating={{
          ratingValue: 4.9,
          reviewCount: 203,
        }}
        offers={DISCO_PACKS.map((pack) => ({
          '@type': 'Offer',
          name: pack.name,
          price: String(pack.priceValue),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `/servicios/discomovil#${pack.slug}`,
          description: pack.tagline,
        }))}
      />

      <Client />

      <FAQ
        items={[
          {
            q: '¿Qué incluye una experiencia completa de discomóvil?',
            a: 'Mucho más que poner música: DJ profesional que adapta la música en tiempo real según tu grupo, sonido EV profesional, iluminación LED de ambiente y efectos especiales. Todo coordinado para crear la mejor experiencia para tus invitados.',
          },
          {
            q: '¿Cómo personalizáis la música y el ambiente?',
            a: 'Antes del evento revisamos tus gustos musicales, artistas favoritos y ambiente deseado. El DJ adapta la música en tiempo real según cómo responde tu grupo: si un tema no funciona, cambia; si la energía sube, aprieta. No es una playlist estática.',
          },
          {
            q: '¿Qué incluye la iluminación y los efectos especiales?',
            a: 'Todos los packs incluyen iluminación LED de ambiente adaptada al espacio. Los packs superiores añaden más puntos de luz, máquina de humo y efectos especiales (confeti, CO2, humo bajo) para momentos clave. Todo se adapta a tu evento.',
          },
          {
            q: '¿Trabajáis fuera de Barcelona?',
            a: 'Sí, cubrimos Barcelona provincia y Girona provincia (incluyendo Costa Brava). Nos adaptamos a cualquier espacio: locales, jardines, fincas, pabellones. Transporte GRATIS hasta 25km desde Granollers; otras zonas pueden tener pequeño suplemento detallado en presupuesto.',
          },
          {
            q: '¿Qué pasa si hay problemas técnicos durante la fiesta?',
            a: 'Llevamos equipo de backup completo (cables, controladora y altavoces de reserva). Si algo falla (que no suele pasar), se cambia rápido y la música no se para. El objetivo es que tú ni te enteres del problema.',
          },
          {
            q: '¿Cuánto tiempo antes hay que reservar?',
            a: 'Mínimo 2 semanas, pero para viernes y sábados lo normal es reservar con 6-8 semanas de antelación. Son los días que se llenan primero. Consulta disponibilidad para tu fecha específica.',
          },
        ]}
      />
    </>
  );
}


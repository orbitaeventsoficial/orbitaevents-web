// app/servicios/fiestas/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import Client from './FiestasClient';
import {
  getMinPriceByService,
  getPacksByService,
  getPackById,
} from '@/config/packs-config';

// ===============================
// DATOS CENTRALIZADOS DESDE packs-config
// ===============================
const FIESTAS_MIN_PRICE = getMinPriceByService('fiestas');
const FIESTAS_PACKS = getPacksByService('fiestas');

// CORRECCIÓN AQUÍ: Usamos los IDs reales que existen en packs-config.ts
const PACK_ESENCIAL = getPackById('disco-basico')!;

// ===============================
// METADATA SEO (USANDO CONFIG)
// ===============================
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Fiestas Privadas Barcelona | DJ + Luces desde ${FIESTAS_MIN_PRICE}€ | Òrbita Events`,
  description: `Fiestas privadas en Barcelona con DJ profesional desde ${FIESTAS_MIN_PRICE}€. Cumpleaños, despedidas, aniversarios. Sonido, luces y animación incluidos. ¡Presupuesto gratis!`,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/fiestas' },
  openGraph: {
    title: `Fiestas Privadas Barcelona | Desde ${FIESTAS_MIN_PRICE}€`,
    description: `DJ profesional para fiestas privadas. Cumpleaños, despedidas, aniversarios. Sonido 4000W + luces LED + efectos. Presupuesto gratis en 2h.`,
    url: '/servicios/fiestas',
    images: [
      {
        url: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
        alt: 'Fiestas Privadas Barcelona - Òrbita Events',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Fiestas Privadas Barcelona | Desde ${FIESTAS_MIN_PRICE}€`,
    description: 'DJ profesional + Sonido 4000W + Luces LED + Efectos. Cumpleaños, despedidas y más.',
    images: ['/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp'],
  },
  robots: { index: true, follow: true },
  keywords: [
    'fiestas privadas barcelona',
    'dj cumpleaños barcelona',
    'dj fiestas barcelona',
    'despedidas barcelona',
    'fiestas temáticas barcelona',
    'dj fiestas girona',
    'cumpleaños con dj',
    'fiesta halloween barcelona',
  ],
};

// ===============================
// PÁGINA
// ===============================
export default function FiestasPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'Fiestas Privadas', url: '/servicios/fiestas' },
        ]}
      />

      {/* JSON-LD tirando de packs-config */}
      <ServiceJsonLD
        name="Fiestas Privadas Completas y Personalizadas"
        slugPath="/servicios/fiestas"
        description={`Experiencias completas para fiestas privadas: desde cumpleaños temáticos hasta celebraciones familiares. DJ profesional, sonido 4.000W, iluminación LED, animación y juegos adaptados a todos los invitados. Tematización completa disponible (Halloween, años 80, mundo mágico, tropical). Desde ${FIESTAS_MIN_PRICE}€.`}
        serviceType={[
          'DJ para fiestas',
          'Fiestas privadas',
          'Cumpleaños temáticos',
          'Despedidas',
          'Fiestas temáticas',
          'Animación fiestas',
          'Iluminación LED',
        ]}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceFrom={String(FIESTAS_MIN_PRICE)}
        priceCurrency="EUR"
        availability="https://schema.org/InStock"
        aggregateRating={{
          ratingValue: 4.9,
          reviewCount: 167,
        }}
        offers={FIESTAS_PACKS.map((pack) => ({
          '@type': 'Offer',
          price: String(pack.priceValue),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `/servicios/fiestas#${pack.slug}`,
          name: pack.name,
        }))}
      />

      <Client />

      <FAQ
        items={[
          {
            q: '¿Qué incluye una experiencia completa de fiesta privada?',
            a: `Nuestras fiestas incluyen mucho más que música: DJ profesional que lee el ambiente, sonido 4.000W, iluminación LED adaptada, y animación con juegos personalizados según edades y grupo. Desde ${PACK_ESENCIAL.price} hasta fiestas temáticas completas con decoración y tematización total.`,
          },
          {
            q: '¿Hacéis fiestas temáticas personalizadas (Halloween, años 80, mundo mágico)?',
            a: `Totalmente. Creamos experiencias temáticas completas: adaptamos música, iluminación, decoración y animación al concepto que elijas (Halloween, años 80, mundo mágico, tropical, etc.). No es solo "poner música temática", es crear una experiencia inmersiva para tus invitados.`,
          },
          {
            q: '¿Incluye animación y juegos para todos los invitados?',
            a: 'Durante las horas contratadas, SÍ incluimos animación y juegos adaptados a las edades de tus invitados (juegos musicales, concursos interactivos, etc.). Algunos juegos requieren material adicional que se valora aparte con un extra pequeño. Si quieres actividades fuera de las horas contratadas, se cobra material + hora extra.',
          },
          {
            q: '¿Puedo personalizar completamente la música y el ambiente?',
            a: 'Absolutamente. Antes del evento revisamos tus gustos musicales, artistas favoritos, canciones imprescindibles y ambiente deseado. El DJ adapta la música en tiempo real según cómo responde tu grupo, no es una playlist fija.',
          },
          {
            q: '¿Trabajáis fuera de Barcelona?',
            a: 'Sí, cubrimos Barcelona provincia y Girona provincia (incluyendo Costa Brava). Nos adaptamos a cualquier espacio: locales privados, jardines, fincas, pabellones. Revisamos el espacio y ajustamos equipamiento y montaje según necesidades.',
          },
          {
            q: '¿Cuánto tiempo antes hay que reservar?',
            a: 'Para fiestas normales, mínimo 3 semanas. Para viernes y sábados, mejor 6-8 semanas porque son las primeras fechas que se llenan. Para fiestas temáticas con decoración, recomendamos 2 meses.',
          },
        ]}
      />
    </>
  );
}
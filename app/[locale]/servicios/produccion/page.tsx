// app/servicios/produccion/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@\/components/seo/Breadcrumbs';
import ServiceJsonLD from '@\/components/seo/ServiceJsonLD';
import FAQ from '@\/components/seo/FAQ';
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const ProduccionClient = nextDynamic(() => import('./client'));

export const metadata: Metadata = {
  title: 'Producción Técnica Profesional | Escenarios + Sonido + Luces LED | Òrbita Events',
  description:
    'Producción técnica integral para eventos grandes: escenarios certificados, sonido line array EV, iluminación DMX y pantallas LED P3.9. Técnico onsite, montaje seguro y backup total. Barcelona y Girona.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.cat'),
  alternates: { canonical: '/servicios/produccion' },
  openGraph: {
    title: 'Producción Técnica Profesional | Sin Fallos',
    description:
      'Escenarios, sonido line array, luces DMX y pantallas LED para eventos grandes. Técnico onsite y sistema redundante.',
    url: '/servicios/produccion',
    images: [
      {
        url: '/api/og?title=Producción%20Técnica',
        alt: 'Producción técnica profesional Òrbita Events',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Producción Técnica | Escenarios + Sonido + Luces',
    description: 'Soluciones técnicas integrales para eventos grandes con técnico onsite.',
    images: ['/api/og?title=Producción%20Técnica'],
  },
  robots: { index: true, follow: true },
  keywords: [
    'producción técnica Barcelona',
    'alquiler escenarios Barcelona',
    'sonido line array',
    'pantallas LED eventos',
    'iluminación DMX',
    'producción eventos corporativos',
    'técnico eventos Barcelona',
    'montaje eventos profesional',
  ],
};

export default function ProduccionPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'Producción Técnica', url: '/servicios/produccion' },
        ]}
      />

      {/* JSON-LD OPTIMIZADO */}
      <ServiceJsonLD
        name="Producción Técnica Profesional"
        slugPath="/servicios/produccion"
        description="Producción técnica integral para eventos de gran formato: escenarios certificados, sonido line array de alto rendimiento (EV), iluminación escénica con DMX, pantallas LED P3.9 y técnico especializado onsite durante todo el evento. Sistema redundante en puntos críticos."
        serviceType={[
          'Producción técnica',
          'Alquiler escenarios',
          'Sonido profesional',
          'Iluminación escénica',
          'Pantallas LED',
          'Técnico de eventos',
        ]}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceCurrency="EUR"
        availability="https://schema.org/InStock"
        aggregateRating={{
          ratingValue: 4.9,
          reviewCount: 52,
        }}
      />

      <ProduccionClient />

      <FAQ
        items={[
          {
            q: '¿Qué incluye exactamente el servicio de producción técnica?',
            a: 'Incluye escenarios certificados (estructuras seguras), sonido line array de alta potencia (EV/similar), iluminación escénica con control DMX, pantallas LED P3.9 para proyección y técnico especializado onsite durante el evento. Todo con sistema redundante en audio, potencia y señal para evitar fallos.',
          },
          {
            q: '¿Trabajáis en eventos al aire libre?',
            a: 'Sí. Adaptamos el montaje a exteriores con estructuras reforzadas, protección IP para equipos sensibles y plan B ante condiciones meteorológicas adversas. Revisamos siempre el espacio antes del montaje.',
          },
          {
            q: '¿Cuánto tiempo necesitáis para montar?',
            a: 'Depende del tamaño del evento. Para un montaje medio (escenario 6x4, sonido, luces y pantalla), entre 4 y 6 horas. Para producciones grandes, entre 8 y 12 horas. Siempre llegamos con margen para pruebas completas.',
          },
          {
            q: '¿Qué garantías tenéis si algo falla durante el evento?',
            a: 'Sistema redundante en todos los puntos críticos: doble línea de audio, doble fuente de alimentación y backup de señal. Técnico onsite con herramientas i recanvis. Mai hem hagut d\'aturar un acte per fallada tècnica.',
          },
          {
            q: '¿Hacéis eventos corporativos y conferencias?',
            a: 'Sí. Corporativos, conferencias, congresos, presentaciones y eventos institucionales. Incluimos micros inalámbricos, proyección, streaming si se necesita y coordinación con speakers y equipo de protocolo.',
          },
          {
            q: '¿Cómo se solicita presupuesto?',
            a: 'Necesitamos saber: tipo de evento, número de asistentes, espacio (interior/exterior), servicios necesarios (escenario, sonido, luces, pantallas) y fecha. Con eso enviamos propuesta técnica detallada y presupuesto ajustado.',
          },
        ]}
      />
    </>
  );
}

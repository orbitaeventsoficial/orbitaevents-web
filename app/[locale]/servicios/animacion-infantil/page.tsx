// app/[locale]/servicios/animacion-infantil/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import AnimacionInfantilClient from './AnimacionInfantilClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Animacio Infantil Barcelona | Festes Infantils Professionals | Orbita Events',
  description:
    'Animacio infantil professional per a festes, comunions i esdeveniments. Jocs, pintacares, magia, globoflexia, tallers i musica infantil. Barcelona i Girona.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/animacion-infantil' },
  openGraph: {
    title: 'Animacio Infantil | Festes per als Mes Petits',
    description:
      'Animadors professionals per a festes infantils. Jocs, magia, pintacares, globoflexia i molt mes. Diversio garantida!',
    url: '/servicios/animacion-infantil',
    images: [
      {
        url: '/api/og?title=Animacio%20Infantil%20Barcelona',
        alt: 'Animacio infantil amb jocs i activitats',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Animacio Infantil | Festes Infantils Barcelona',
    description:
      'Animadors professionals + Jocs + Magia + Pintacares + Globoflexia. Festes inolvidables per als petits!',
    images: ['/api/og?title=Animacio%20Infantil'],
  },
  robots: { index: true, follow: true },
  keywords: [
    'animacio infantil Barcelona',
    'festes infantils Girona',
    'animadors infantils',
    'pintacares Barcelona',
    'magia infantil',
    'globoflexia festes',
    'jocs infantils',
    'comunions Barcelona',
    'festes aniversari nens',
    'tallers infantils',
  ],
};

export default function AnimacionInfantilPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'Animacio Infantil', url: '/servicios/animacion-infantil' },
        ]}
      />

      <ServiceJsonLD
        name="Animacio Infantil Professional"
        slugPath="/servicios/animacion-infantil"
        description="Servei d'animacio infantil complet: jocs, pintacares, magia, globoflexia, tallers creatius i musica infantil. Animadors professionals per a festes d'aniversari, comunions i esdeveniments familiars. Barcelona i Girona."
        serviceType={[
          'Animacio infantil',
          'Festes infantils',
          'Pintacares',
          'Magia infantil',
          'Globoflexia',
          'Tallers creatius',
          'Jocs infantils',
        ]}
        areaServed={['Barcelona', 'Girona', 'Maresme', 'Valles']}
        priceFrom="150"
        priceCurrency="EUR"
        availability="https://schema.org/InStock"
        aggregateRating={{
          ratingValue: 5.0,
          reviewCount: 45,
        }}
      />

      <AnimacionInfantilClient />

      <FAQ
        items={[
          {
            q: 'Que inclou el servei d\'animacio infantil?',
            a: 'El nostre servei inclou animadors professionals, jocs i activitats adaptades a l\'edat dels nens, material per a totes les activitats, i coordinacio completa de l\'entreteniment durant les hores contractades. Podem afegir pintacares, magia, globoflexia o tallers segons les teves preferencies.',
          },
          {
            q: 'Per a quines edats es adequat?',
            a: 'Oferim animacio per a nens de 3 a 12 anys. Adaptem totes les activitats, jocs i musica segons el rang d\'edat dels participants per assegurar que tots gaudeixin al maxim.',
          },
          {
            q: 'Quant de temps dura l\'animacio?',
            a: 'El temps minim es de 2 hores. Recomanem entre 2-4 hores per a festes d\'aniversari. Per a comunions o esdeveniments mes llargs, podem oferir serveis de mitja jornada o jornada completa.',
          },
          {
            q: 'Que necessito tenir preparat?',
            a: 'Nomes necessites un espai adequat per als nens (interior o exterior). Nosaltres portem tot el material necessari: pintures, globus, material de magia, jocs, altaveus per a la musica, etc.',
          },
          {
            q: 'Feu servei a domicili?',
            a: 'Si! Anem a qualsevol localitzacio: casa particular, sala de festes, restaurant, parc... Cobrim Barcelona i Girona amb despla\u00e7ament inclos fins a 25km de Granollers.',
          },
          {
            q: 'Amb quanta antelacio he de reservar?',
            a: 'Recomanem reservar amb 2-3 setmanes d\'antelacio, especialment per a caps de setmana. Per a dates molt sol·licitades (temporada de comunions), millor amb 1-2 mesos.',
          },
        ]}
      />
    </>
  );
}

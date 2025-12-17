import { Metadata } from 'next';
import ProductesMonMagic from './client';

export const metadata: Metadata = {
  title: 'Boda Món Màgic amb Lacre Artesanal | Invitacions Escola de Màgia | Òrbita Events',
  description: 'Invitacions de boda temàtica màgica amb lacre de cera REAL. Cartes personalitzades, sobres amb segell de les 5 cases màgiques. Fet a mà a Catalunya. Experiències úniques per casaments.',
  keywords: [
    'boda temàtica màgica',
    'invitacions escola de màgia',
    'lacre artesanal boda',
    'cartes màgiques personalitzades',
    'boda temàtica fantasia',
    'sobres lacre màgic',
    'casament temàtic',
    'papereria màgica',
    'segell cera artesanal',
    'boda bruixeria fantasia',
  ],
  openGraph: {
    title: 'Boda Món Màgic amb Lacre Artesanal Real',
    description: "Transforma el teu casament en una experiència màgica. Sobres segellats amb lacre de cera real, cartes personalitzades. El detall que els teus convidats guardaran per sempre.",
    type: 'website',
    images: [
      {
        url: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
        width: 1200,
        height: 630,
        alt: 'Boda Món Màgic amb lacre artesanal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boda Món Màgic amb Lacre Artesanal',
    description: 'Sobres amb lacre real + Cartes màgiques personalitzades',
    images: ['/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp'],
  },
  alternates: {
    canonical: '/tematica-mon-magic',
    languages: {
      'ca': '/ca/tematica-mon-magic',
      'es': '/es/tematica-mon-magic',
    },
  },
};

export default function TematicaMonMagicPage() {
  return <ProductesMonMagic />;
}

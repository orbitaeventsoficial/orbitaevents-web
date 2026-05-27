import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminPage } from '../components/AdminPage';
import { DossierGeneratorClient } from './DossierGeneratorClient';
import { ANIMACIO_PRODUCTS } from '@/lib/constants/animacio-products';

export const metadata = { title: 'Generador de dossiers' };

interface PageProps {
  searchParams?: {
    leadId?: string;
    nom?: string;
    email?: string;
    telefon?: string;
    empresa?: string;
    eventDesc?: string;
  };
}

function readLogoDataUri(): string {
  try {
    const svgPath = join(process.cwd(), 'public', 'img', 'orbitalockupwhite.svg');
    const svg = readFileSync(svgPath, 'utf-8');
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch {
    return '';
  }
}

export default function DossiersPage({ searchParams }: PageProps) {
  const logoDataUri = readLogoDataUri();

  return (
    <AdminPage
      title="Generador de dossiers"
      subtitle="Omple les dades del client, selecciona els productes i genera el dossier personalitzat."
    >
      <DossierGeneratorClient
        products={ANIMACIO_PRODUCTS}
        logoDataUri={logoDataUri}
        leadId={searchParams?.leadId}
        initialNom={searchParams?.nom}
        initialEmail={searchParams?.email}
        initialTelefon={searchParams?.telefon}
        initialEmpresa={searchParams?.empresa}
        initialEventDesc={searchParams?.eventDesc}
      />
    </AdminPage>
  );
}

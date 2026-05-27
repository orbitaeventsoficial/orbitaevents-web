import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminPage } from '../components/AdminPage';
import { DossierGeneratorClient } from './DossierGeneratorClient';
import { ANIMACIO_PRODUCTS } from '@/lib/constants/animacio-products';
import { getAllDossiers } from '@/lib/services/dossierService';
import { formatDateShort } from '@/lib/constants';
import Link from 'next/link';
import { DossierListActions } from './DossierListActions';

export const metadata = { title: 'Dossiers' };

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

export default async function DossiersPage({ searchParams }: PageProps) {
  const logoDataUri = readLogoDataUri();
  const dossiers = await getAllDossiers(50);

  return (
    <AdminPage
      title="Dossiers"
      subtitle="Genera i gestiona els dossiers comercials per als clients."
    >
      {/* Llista de dossiers desats */}
      {dossiers.length > 0 && (
        <section className="dg__list-section">
          <h2 className="dg__section-title">Dossiers desats ({dossiers.length})</h2>
          <div className="dg__list">
            {dossiers.map((d) => {
              const productNames = ANIMACIO_PRODUCTS
                .filter((p) => d.productIds.includes(p.id))
                .map((p) => p.nom)
                .join(' · ');
              return (
                <div key={d.id} className="dg__list-row">
                  <div className="dg__list-info">
                    <span className="dg__list-nom">{d.nom}{d.empresa ? ` — ${d.empresa}` : ''}</span>
                    <span className="dg__list-meta">
                      {productNames || 'Sense productes'}
                      {' · '}
                      {formatDateShort(d.createdAt.toISOString())}
                    </span>
                    {d.sentAt && (
                      <span className="dg__list-sent">
                        Enviat {formatDateShort(d.sentAt.toISOString())} → {d.sentTo}
                      </span>
                    )}
                    {d.lead && (
                      <Link href={`/admin/leads/${d.lead.id}`} className="dg__list-lead">
                        Lead: {d.lead.name} ({d.lead.status})
                      </Link>
                    )}
                  </div>
                  <DossierListActions
                    dossierId={d.id}
                    email={d.email ?? undefined}
                    nom={d.nom}
                    productIds={d.productIds}
                    clientInfo={{
                      nom: d.nom,
                      empresa: d.empresa ?? undefined,
                      telefon: d.telefon ?? undefined,
                      email: d.email ?? undefined,
                      eventDesc: d.eventDesc ?? undefined,
                      salutacio: d.salutacio ?? undefined,
                    }}
                    alreadySent={!!d.sentAt}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Generador */}
      <section className="dg__gen-section">
        <h2 className="dg__section-title">Nou dossier</h2>
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
      </section>
    </AdminPage>
  );
}

import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminPage } from '../components/AdminPage';
import { DossierGeneratorClient } from './DossierGeneratorClient';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { getAllDossiers, getDeletedDossiers } from '@/lib/services/dossierService';
import {
  collaboratorProductToAnimacioProduct,
  listDossierCollaboratorProducts,
} from '@/lib/services/collaboratorProductService';
import { formatDateShort } from '@/lib/constants';
import Link from 'next/link';
import { DossierListActions } from './DossierListActions';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';

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
    const svgPath = join(process.cwd(), 'public', 'img', 'logoplanetatextdreta.svg');
    const svg = readFileSync(svgPath, 'utf-8');
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch {
    return '';
  }
}

type DossierRow = {
  id: string; nom: string; empresa?: string | null; productIds: string[];
  createdAt: Date | string; sentAt?: Date | string | null; sentTo?: string | null;
  email?: string | null; eventDesc?: string | null; telefon?: string | null;
  salutacio?: string | null; deletedAt?: Date | string | null;
  lead?: { id: string; name: string; status: string } | null;
};

export default async function DossiersPage({ searchParams }: PageProps) {
  const logoDataUri = readLogoDataUri();
  const [dossiers, deletedDossiers, animacioProducts, collaboratorProducts] = await Promise.all([
    getAllDossiers(50),
    getDeletedDossiers(),
    getAnimacioProducts('ca'),
    listDossierCollaboratorProducts(),
  ]) as [
    DossierRow[],
    DossierRow[],
    Awaited<ReturnType<typeof getAnimacioProducts>>,
    Awaited<ReturnType<typeof listDossierCollaboratorProducts>>,
  ];
  const allProducts = [
    ...animacioProducts,
    ...collaboratorProducts.map(collaboratorProductToAnimacioProduct),
  ];

  return (
    <AdminPage
      title="Dossiers"
      subtitle="Genera i gestiona els dossiers comercials per als clients."
    >
      {/* Generador */}
      <section className="dg__gen-section">
        <h2 className="dg__section-title">Nou dossier</h2>
        <DossierGeneratorClient
          products={allProducts}
          logoDataUri={logoDataUri}
          leadId={searchParams?.leadId}
          initialNom={searchParams?.nom}
          initialEmail={searchParams?.email}
          initialTelefon={searchParams?.telefon}
          initialEmpresa={searchParams?.empresa}
          initialEventDesc={searchParams?.eventDesc}
        />
      </section>

      {/* Llista de dossiers desats */}
      {dossiers.length > 0 && (
        <section className="dg__list-section">
          <h2 className="dg__section-title">Dossiers desats ({dossiers.length})</h2>
          <div className="dg__list">
            {dossiers.map((d) => {
              const productNames = allProducts
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
                      {formatDateShort(typeof d.createdAt === 'string' ? d.createdAt : d.createdAt.toISOString())}
                    </span>
                    {d.sentAt && (
                      <span className="dg__list-sent">
                        Enviat {formatDateShort(typeof d.sentAt === 'string' ? d.sentAt : d.sentAt.toISOString())} → {d.sentTo}
                      </span>
                    )}
                    {d.lead && (
                      <Link href={buildLeadWorkspaceHref(d.lead.id)} className="dg__list-lead">
                        Lead: {d.lead.name} ({d.lead.status})
                      </Link>
                    )}
                  </div>
                  <DossierListActions
                    dossierId={d.id}
                    email={d.email ?? undefined}
                    nom={d.nom}
                    productIds={d.productIds}
                    products={allProducts}
                    clientInfo={{
                      nom: d.nom,
                      empresa: d.empresa ?? undefined,
                      telefon: d.telefon ?? undefined,
                      email: d.email ?? undefined,
                      eventDesc: d.eventDesc ?? undefined,
                      salutacio: d.salutacio ?? undefined,
                    }}
                    alreadySent={!!d.sentAt}
                    logoDataUri={logoDataUri}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Paperera de dossiers (30 dies) */}
      {deletedDossiers.length > 0 && (
        <section className="dg__list-section">
          <h2 className="dg__section-title dg__section-title--trash">🗑 Paperera de dossiers ({deletedDossiers.length})</h2>
          <p className="dg__section-hint">Els dossiers eliminats es purgen automàticament als 30 dies.</p>
          <div className="dg__list">
            {deletedDossiers.map((d) => {
              const productNames = allProducts
                .filter((p) => d.productIds.includes(p.id))
                .map((p) => p.nom)
                .join(' · ');
              return (
                <div key={d.id} className="dg__list-row dg__list-row--deleted">
                  <div className="dg__list-info">
                    <span className="dg__list-nom">{d.nom}{d.empresa ? ` — ${d.empresa}` : ''}</span>
                    <span className="dg__list-meta">
                      {productNames || 'Sense productes'}
                      {' · '}
                      {d.deletedAt ? `Eliminat ${formatDateShort(typeof d.deletedAt === 'string' ? d.deletedAt : d.deletedAt.toISOString())}` : 'Eliminat'}
                    </span>
                  </div>
                  <DossierListActions
                    dossierId={d.id}
                    email={d.email ?? undefined}
                    nom={d.nom}
                    productIds={d.productIds}
                    products={allProducts}
                    clientInfo={{
                      nom: d.nom,
                      empresa: d.empresa ?? undefined,
                      telefon: d.telefon ?? undefined,
                      email: d.email ?? undefined,
                      eventDesc: d.eventDesc ?? undefined,
                      salutacio: d.salutacio ?? undefined,
                    }}
                    alreadySent={!!d.sentAt}
                    logoDataUri={logoDataUri}
                    isDeleted
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

    </AdminPage>
  );
}

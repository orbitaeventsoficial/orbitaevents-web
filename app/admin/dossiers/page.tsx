import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminPage } from '../components/AdminPage';
import { DossierGeneratorClient } from './DossierGeneratorClient';
import { ADMIN_DOSSIER_GENERATOR_COPY } from '@/lib/constants/admin';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { getDossierCopy, getOrbitaDossierProducts } from '@/lib/constants/dossier-copy';
import { getAllDossiers, getDeletedDossiers } from '@/lib/services/dossierService';
import { listLeadServiceLines } from '@/lib/services/leadServiceLineService';
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
    productIds?: string;
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

function toDossierProductId(id: string): string {
  return id.startsWith('collab:') ? id : `collab:${id}`;
}

async function resolveInitialProductIds(leadId?: string, explicitProductIds?: string): Promise<string | undefined> {
  if (explicitProductIds?.trim()) return explicitProductIds;
  if (!leadId) return undefined;
  const result = await listLeadServiceLines(leadId);
  const ids = (result.body.lines ?? [])
    .map((line: { collaboratorId?: string | null }) => line.collaboratorId)
    .filter((id): id is string => Boolean(id))
    .map(toDossierProductId);
  return ids.length > 0 ? Array.from(new Set(ids)).join(',') : undefined;
}

export default async function DossiersPage({ searchParams }: PageProps) {
  const logoDataUri = readLogoDataUri();
  const [dossiers, deletedDossiers, legacyAnimacioProducts, collaboratorProducts, orbitaProducts, dossierCopy, initialProductIds] = await Promise.all([
    getAllDossiers(50),
    getDeletedDossiers(),
    getAnimacioProducts('ca'),
    listDossierCollaboratorProducts(),
    getOrbitaDossierProducts('ca'),
    getDossierCopy('ca'),
    resolveInitialProductIds(searchParams?.leadId, searchParams?.productIds),
  ]) as [
    DossierRow[],
    DossierRow[],
    Awaited<ReturnType<typeof getAnimacioProducts>>,
    Awaited<ReturnType<typeof listDossierCollaboratorProducts>>,
    Awaited<ReturnType<typeof getOrbitaDossierProducts>>,
    Awaited<ReturnType<typeof getDossierCopy>>,
    string | undefined,
  ];
  const generatorProducts = [
    ...orbitaProducts,
    ...collaboratorProducts.map(collaboratorProductToAnimacioProduct),
  ];
  const lookupProducts = [
    ...generatorProducts,
    ...legacyAnimacioProducts,
  ];

  return (
    <AdminPage
      title="Dossiers"
      subtitle="Genera i gestiona els dossiers comercials per als clients."
    >
      {/* Generador */}
      <section className="dg__gen-section">
        <header className="dg__hero">
          <div>
            <span className="dg__hero-kicker">{ADMIN_DOSSIER_GENERATOR_COPY.page.kicker}</span>
            <h2 className="dg__hero-title">{ADMIN_DOSSIER_GENERATOR_COPY.page.title}</h2>
            <p className="dg__hero-copy">{ADMIN_DOSSIER_GENERATOR_COPY.page.description}</p>
          </div>
          <div className="dg__hero-rail" aria-label="Estat del generador">
            <span>{ADMIN_DOSSIER_GENERATOR_COPY.page.railCustomer}</span>
            <span>{generatorProducts.length} {ADMIN_DOSSIER_GENERATOR_COPY.page.railCatalog}</span>
            <span>{dossiers.length} {ADMIN_DOSSIER_GENERATOR_COPY.page.railSaved}</span>
          </div>
        </header>
        <DossierGeneratorClient
          products={generatorProducts}
          dossierCopy={dossierCopy}
          logoDataUri={logoDataUri}
          leadId={searchParams?.leadId}
          initialNom={searchParams?.nom}
          initialEmail={searchParams?.email}
          initialTelefon={searchParams?.telefon}
          initialEmpresa={searchParams?.empresa}
          initialEventDesc={searchParams?.eventDesc}
          initialProductIds={initialProductIds}
        />
      </section>

      {/* Llista de dossiers desats */}
      {dossiers.length > 0 && (
        <section className="dg__list-section">
          <h2 className="dg__section-title">Dossiers desats ({dossiers.length})</h2>
          <div className="dg__list">
            {dossiers.map((d) => {
              const productNames = lookupProducts
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
                    products={lookupProducts}
                    dossierCopy={dossierCopy}
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
              const productNames = lookupProducts
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
                    products={lookupProducts}
                    dossierCopy={dossierCopy}
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

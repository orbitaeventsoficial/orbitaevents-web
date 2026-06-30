// ─────────────────────────────────────────────────────────
// ✅ TANCAT CHARLIE — validat pel propietari (2026-06-15)
// Generador de dossiers comercials. Patró de referència admin:
// 100% tokens (--ax-*/--o-*), selectors html.admin-mode, copy
// centralitzat a ADMIN_DOSSIER_GENERATOR_COPY + messages.dossier.*,
// empty states + skeleton tokenitzat + a11y completa.
// ─────────────────────────────────────────────────────────
import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminPage, AdminSection } from '../components/AdminPage';
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
  // Bingo/Batalla Musical són productes de MASQUERADE (col·laborador), no propis:
  // surten via `collaboratorProducts`. (El #968 els havia afegit com a propis per
  // error; corregit al #969 — la causa real és que el seed #956 els va desactivar.)
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
      <AdminSection
        title={
          <span className="flex flex-col gap-1">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold-bright)]">{ADMIN_DOSSIER_GENERATOR_COPY.page.kicker}</span>
            <span>{ADMIN_DOSSIER_GENERATOR_COPY.page.title}</span>
          </span>
        }
        description={ADMIN_DOSSIER_GENERATOR_COPY.page.description}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2" aria-label="Estat del generador">
            <span className="ap-badge">{ADMIN_DOSSIER_GENERATOR_COPY.page.railCustomer}</span>
            <span className="ap-badge">{generatorProducts.length} {ADMIN_DOSSIER_GENERATOR_COPY.page.railCatalog}</span>
            <span className="ap-badge">{dossiers.length} {ADMIN_DOSSIER_GENERATOR_COPY.page.railSaved}</span>
          </div>
        }
      >
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
      </AdminSection>

      {/* Llista de dossiers desats */}
      {dossiers.length > 0 && (
        <AdminSection title={`Dossiers desats (${dossiers.length})`}>
          <div className="flex flex-col gap-2">
            {dossiers.map((d) => {
              const productNames = lookupProducts
                .filter((p) => d.productIds.includes(p.id))
                .map((p) => p.nom)
                .join(' · ');
              return (
                <div key={d.id} className="ap-card ap-card-body flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-base font-semibold text-[var(--t)]">{d.nom}{d.empresa ? ` — ${d.empresa}` : ''}</span>
                    <span className="text-xs text-[var(--t3)]">
                      {productNames || 'Sense productes'}
                      {' · '}
                      {formatDateShort(typeof d.createdAt === 'string' ? d.createdAt : d.createdAt.toISOString())}
                    </span>
                    {d.sentAt && (
                      <span className="text-xs text-[var(--gold-bright)]">
                        Enviat {formatDateShort(typeof d.sentAt === 'string' ? d.sentAt : d.sentAt.toISOString())} → {d.sentTo}
                      </span>
                    )}
                    {d.lead && (
                      <Link href={buildLeadWorkspaceHref(d.lead.id)} className="text-xs text-[var(--t3)] transition-colors hover:text-[var(--gold-bright)]">
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
        </AdminSection>
      )}

      {/* Paperera de dossiers (30 dies) */}
      {deletedDossiers.length > 0 && (
        <AdminSection
          title={`🗑 Paperera de dossiers (${deletedDossiers.length})`}
          description="Els dossiers eliminats es purgen automàticament als 30 dies."
        >
          <div className="flex flex-col gap-2">
            {deletedDossiers.map((d) => {
              const productNames = lookupProducts
                .filter((p) => d.productIds.includes(p.id))
                .map((p) => p.nom)
                .join(' · ');
              return (
                <div key={d.id} className="ap-card ap-card-body flex flex-wrap items-center justify-between gap-4 opacity-70">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-base font-semibold text-[var(--t)]">{d.nom}{d.empresa ? ` — ${d.empresa}` : ''}</span>
                    <span className="text-xs text-[var(--t3)]">
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
        </AdminSection>
      )}

    </AdminPage>
  );
}

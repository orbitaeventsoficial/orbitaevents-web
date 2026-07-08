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
import { getAllDossiers, getDeletedDossiers, getDossierLeadInitialData } from '@/lib/services/dossierService';
import {
  collaboratorProductToAnimacioProduct,
  listDossierCollaboratorProducts,
} from '@/lib/services/collaboratorProductService';
import { loadDossierDraftSuggestions } from '@/lib/services/dossierDraftSuggestionService';
import { formatDateShort } from '@/lib/constants';
import Link from 'next/link';
import { DossierListActions } from './DossierListActions';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import {
  hydrateDossierSnapshotProductImages,
  productsFromDossierLineSnapshot,
} from '@/lib/services/dossierSnapshotService';
import { DossierDraftCreateButton } from './DossierDraftCreateButton';

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
  mode?: string | null;
  lineSnapshot?: unknown;
  lead?: { id: string; name: string; status: string; customerId?: string | null; customerName?: string | null } | null;
};

function resolveInitialProductIds(explicitProductIds?: string): string | undefined {
  if (explicitProductIds?.trim()) return explicitProductIds;
  return undefined;
}

const DRAFT_SUGGESTION_TONE: Record<'ALTA' | 'MITJANA' | 'BAIXA', string> = {
  ALTA: 'admin-tone-border-danger',
  MITJANA: 'admin-tone-border-warning',
  BAIXA: 'admin-tone-border-info',
};

function formatDraftEventLabel(suggestion: Awaited<ReturnType<typeof loadDossierDraftSuggestions>>[number]): string {
  const copy = ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions;
  if (suggestion.daysUntilEvent === 0) return copy.eventToday;
  if (suggestion.daysUntilEvent === 1) return copy.eventTomorrow;
  if (suggestion.daysUntilEvent !== null) return `${suggestion.daysUntilEvent} ${copy.eventInDays}`;
  if (suggestion.eventDate) return formatDateShort(suggestion.eventDate.toISOString());
  return copy.eventNoDate;
}

export default async function DossiersPage({ searchParams }: PageProps) {
  const logoDataUri = readLogoDataUri();
  const [dossiers, deletedDossiers, legacyAnimacioProducts, collaboratorProducts, orbitaProducts, dossierCopy, leadInitialData, draftSuggestions] = await Promise.all([
    getAllDossiers(50),
    getDeletedDossiers(),
    getAnimacioProducts('ca'),
    listDossierCollaboratorProducts(),
    getOrbitaDossierProducts('ca'),
    getDossierCopy('ca'),
    getDossierLeadInitialData(searchParams?.leadId),
    loadDossierDraftSuggestions(3),
  ]) as [
    DossierRow[],
    DossierRow[],
    Awaited<ReturnType<typeof getAnimacioProducts>>,
    Awaited<ReturnType<typeof listDossierCollaboratorProducts>>,
    Awaited<ReturnType<typeof getOrbitaDossierProducts>>,
    Awaited<ReturnType<typeof getDossierCopy>>,
    Awaited<ReturnType<typeof getDossierLeadInitialData>>,
    Awaited<ReturnType<typeof loadDossierDraftSuggestions>>,
  ];
  const initialProductIds = resolveInitialProductIds(searchParams?.productIds);
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
      {draftSuggestions.length > 0 && (
        <AdminSection
          title={ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions.title}
          description={ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions.description}
          actions={<span className="ap-badge">{ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions.rail}</span>}
        >
          <div className="grid gap-2 lg:grid-cols-3">
            {draftSuggestions.map((suggestion) => (
              <div key={suggestion.leadId} className={`ap-card ap-card-body flex flex-col gap-3 border ${DRAFT_SUGGESTION_TONE[suggestion.band]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-[var(--t)]">{suggestion.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--t3)]">
                      <span className="ap-badge">{suggestion.status}</span>
                      <span>{formatDraftEventLabel(suggestion)}</span>
                      <span>{suggestion.serviceLinesCount} {ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions.serviceLinesLabel}</span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-[var(--gold-bright)]">
                    {ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions.scoreLabel} {suggestion.score}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestion.reasons.map((reason) => (
                    <span key={reason} className="ap-badge">{reason}</span>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <DossierDraftCreateButton
                    leadId={suggestion.leadId}
                    label={ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions.createDraftAction}
                  />
                  <Link href={suggestion.href} className="ap-btn ap-btn--primary ap-btn--xs">
                    {ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions.prepareAction}
                  </Link>
                  <Link href={buildLeadWorkspaceHref(suggestion.leadId)} className="ap-btn ap-btn--secondary ap-btn--xs">
                    {ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions.leadAction}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </AdminSection>
      )}

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
          leadId={leadInitialData?.id ?? searchParams?.leadId}
          initialNom={searchParams?.nom ?? leadInitialData?.nom}
          initialEmail={searchParams?.email ?? leadInitialData?.email}
          initialTelefon={searchParams?.telefon ?? leadInitialData?.telefon}
          initialEmpresa={searchParams?.empresa}
          initialEventDesc={searchParams?.eventDesc ?? leadInitialData?.eventDesc}
          initialTravelLocation={leadInitialData?.travelLocation}
          initialDistanceKm={leadInitialData?.distanceKm ?? null}
          initialTollsEur={leadInitialData?.tollsEur ?? null}
          initialProductIds={initialProductIds}
        />
      </AdminSection>

      {/* Llista de dossiers desats */}
      {dossiers.length > 0 && (
        <AdminSection title={`Dossiers desats (${dossiers.length})`}>
          <div className="flex flex-col gap-2">
            {dossiers.map((d) => {
              const snapshotProducts = hydrateDossierSnapshotProductImages(productsFromDossierLineSnapshot(d.lineSnapshot), lookupProducts);
              const resolvedProducts = snapshotProducts ?? lookupProducts.filter((p) => d.productIds.includes(p.id));
              const productNames = resolvedProducts.map((p) => p.nom).join(' · ');
              return (
                <article key={d.id} className="ap-card ap-card-body grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-base font-semibold leading-snug text-[var(--t)] sm:truncate">{d.nom}{d.empresa ? ` — ${d.empresa}` : ''}</span>
                    <span className="line-clamp-2 break-words text-xs leading-relaxed text-[var(--t3)]">
                      {productNames || 'Sense productes'}
                      {' · '}
                      {formatDateShort(typeof d.createdAt === 'string' ? d.createdAt : d.createdAt.toISOString())}
                    </span>
                    {d.sentAt && (
                      <span className="line-clamp-1 text-xs text-[var(--gold-bright)]">
                        Enviat {formatDateShort(typeof d.sentAt === 'string' ? d.sentAt : d.sentAt.toISOString())} → {d.sentTo}
                      </span>
                    )}
                    {d.mode === 'DRAFT' && !d.sentAt && (
                      <span className="text-xs text-[var(--gold-bright)]">
                        {ADMIN_DOSSIER_GENERATOR_COPY.draftSuggestions.draftBadge}
                      </span>
                    )}
                    {d.lead && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold uppercase tracking-[0.08em] text-[var(--t3)]">Origen</span>
                        <Link href={buildLeadWorkspaceHref(d.lead.id)} className="rounded-full border border-[var(--o-admin-line)] bg-[var(--sunk)] px-2 py-0.5 font-semibold text-[var(--t2)] no-underline transition-colors hover:text-[var(--gold-bright)]">
                          Entrada: {d.lead.name} ({d.lead.status})
                        </Link>
                        {d.lead.customerId && (
                          <Link href={buildCustomerHubHref(d.lead.customerId)} className="rounded-full border border-[var(--o-admin-line)] bg-[var(--sunk)] px-2 py-0.5 font-semibold text-[var(--t2)] no-underline transition-colors hover:text-[var(--gold-bright)]">
                            Client: {d.lead.customerName || d.nom}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  <DossierListActions
                    dossierId={d.id}
                    email={d.email ?? undefined}
                    nom={d.nom}
                    productIds={d.productIds}
                    products={lookupProducts}
                    snapshotProducts={snapshotProducts ?? undefined}
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
                </article>
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
              const snapshotProducts = hydrateDossierSnapshotProductImages(productsFromDossierLineSnapshot(d.lineSnapshot), lookupProducts);
              const resolvedProducts = snapshotProducts ?? lookupProducts.filter((p) => d.productIds.includes(p.id));
              const productNames = resolvedProducts.map((p) => p.nom).join(' · ');
              return (
                <article key={d.id} className="ap-card ap-card-body grid gap-4 opacity-70 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-base font-semibold leading-snug text-[var(--t)] sm:truncate">{d.nom}{d.empresa ? ` — ${d.empresa}` : ''}</span>
                    <span className="line-clamp-2 break-words text-xs leading-relaxed text-[var(--t3)]">
                      {productNames || 'Sense productes'}
                      {' · '}
                      {d.deletedAt ? `Eliminat ${formatDateShort(typeof d.deletedAt === 'string' ? d.deletedAt : d.deletedAt.toISOString())}` : 'Eliminat'}
                    </span>
                    {d.lead && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold uppercase tracking-[0.08em] text-[var(--t3)]">Origen</span>
                        <Link href={buildLeadWorkspaceHref(d.lead.id)} className="rounded-full border border-[var(--o-admin-line)] bg-[var(--sunk)] px-2 py-0.5 font-semibold text-[var(--t2)] no-underline transition-colors hover:text-[var(--gold-bright)]">
                          Entrada: {d.lead.name} ({d.lead.status})
                        </Link>
                        {d.lead.customerId && (
                          <Link href={buildCustomerHubHref(d.lead.customerId)} className="rounded-full border border-[var(--o-admin-line)] bg-[var(--sunk)] px-2 py-0.5 font-semibold text-[var(--t2)] no-underline transition-colors hover:text-[var(--gold-bright)]">
                            Client: {d.lead.customerName || d.nom}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  <DossierListActions
                    dossierId={d.id}
                    email={d.email ?? undefined}
                    nom={d.nom}
                    productIds={d.productIds}
                    products={lookupProducts}
                    snapshotProducts={snapshotProducts ?? undefined}
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
                </article>
              );
            })}
          </div>
        </AdminSection>
      )}

    </AdminPage>
  );
}

// ─────────────────────────────────────────────────────────
// ✅ TANCAT CHARLIE — validat pel propietari (2026-06-15)
// Generador de dossiers comercials. Patró de referència admin:
// 100% tokens (--ax-*/--o-*), selectors html.admin-mode, copy
// centralitzat a ADMIN_DOSSIER_GENERATOR_COPY + messages.dossier.*,
// empty states + skeleton tokenitzat + a11y completa.
// ─────────────────────────────────────────────────────────
import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminPage } from '../components/AdminPage';
import { DossierGeneratorClient } from './DossierGeneratorClient';
import { ADMIN_DOSSIER_GENERATOR_COPY } from '@/lib/constants/admin';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { getDossierCopy, getOrbitaDossierProducts } from '@/lib/constants/dossier-copy';
import {
  getAllDossiers,
  getDeletedDossiers,
  dossierLocaleOf,
  dossierLocaleForLead,
} from '@/lib/services/dossierService';
import { DOSSIER_LOCALES, type DossierLocale } from '@/lib/constants/dossier-locales';
import { listLeadServiceLines } from '@/lib/services/leadServiceLineService';
import type { DossierQuoteLine } from '@/lib/utils/dossier-html-builder';
import {
  collaboratorProductToAnimacioProduct,
  listDossierCollaboratorProducts,
} from '@/lib/services/collaboratorProductService';
import { formatDateShort } from '@/lib/constants';
import Link from 'next/link';
import { DossierListActions } from './DossierListActions';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { prisma } from '@/lib/prisma';

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
  lead?: { id: string; name: string; status: string; preferredLocale?: string | null } | null;
};

function toDossierProductId(id: string): string {
  return id.startsWith('collab:') ? id : `collab:${id}`;
}

/**
 * El bolo tal com està muntat a la fitxa. El pressupost del dossier ha de dir
 * el que el client pagarà de veritat, no els preus «des de» del catàleg.
 * Mateixa regla que el total de la fitxa: import × quantitat, i només les
 * línies que cobren (les de cost intern no li surten al client).
 */
async function resolveQuoteLines(leadId?: string): Promise<DossierQuoteLine[]> {
  if (!leadId) return [];
  const result = await listLeadServiceLines(leadId);
  return (result.body.lines ?? [])
    .map((line: { label: string; revenueAmount?: number | null; quantity?: number | null }) => ({
      label: line.label,
      amount: (line.revenueAmount ?? 0) * (line.quantity || 1),
    }))
    .filter((line) => line.amount > 0);
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

/* La població de l'esdeveniment, tal com el lead la té desada.
   El resum que arriba per l'adreça és text lliure —«2026-09-10 · 20:00-21:00 ·
   igualada · 45 pax»— i no és autoritat de res. La població viu al lead, en el
   seu camp, i és d'aquí que ha de sortir la distància. */
async function resolveLeadEventLocation(leadId?: string): Promise<string | undefined> {
  if (!leadId) return undefined;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { eventLocation: true },
  });
  return lead?.eventLocation?.trim() || undefined;
}

export default async function DossiersPage({ searchParams }: PageProps) {
  const logoDataUri = readLogoDataUri();
  // El dossier es fa en la llengua del client, i cada dossier de la llista pot
  // tenir la seva. Per això el catàleg i els textos es carreguen en les tres
  // llengües i després cadascú agafa la que li toca; abans tot estava clavat al
  // català i un client castellanoparlant rebia el dossier en català.
  const [dossiers, deletedDossiers, collaboratorProducts, byLocale, generatorLocale, initialProductIds, quoteLines, leadEventLocation] = await Promise.all([
    getAllDossiers(50),
    getDeletedDossiers(),
    listDossierCollaboratorProducts(),
    Promise.all(DOSSIER_LOCALES.map(async (locale) => [
      locale,
      {
        legacy: await getAnimacioProducts(locale),
        orbita: await getOrbitaDossierProducts(locale),
        copy: await getDossierCopy(locale),
      },
    ] as const)).then((entries) => Object.fromEntries(entries)),
    dossierLocaleForLead(searchParams?.leadId),
    resolveInitialProductIds(searchParams?.leadId, searchParams?.productIds),
    resolveQuoteLines(searchParams?.leadId),
    resolveLeadEventLocation(searchParams?.leadId),
  ]) as [
    DossierRow[],
    DossierRow[],
    Awaited<ReturnType<typeof listDossierCollaboratorProducts>>,
    Record<DossierLocale, {
      legacy: Awaited<ReturnType<typeof getAnimacioProducts>>;
      orbita: Awaited<ReturnType<typeof getOrbitaDossierProducts>>;
      copy: Awaited<ReturnType<typeof getDossierCopy>>;
    }>,
    DossierLocale,
    string | undefined,
    DossierQuoteLine[],
    string | undefined,
  ];

  const catalogFor = (locale: DossierLocale) => {
    const pack = byLocale[locale];
    const generator = [
      ...pack.orbita,
      ...collaboratorProducts.map(collaboratorProductToAnimacioProduct),
    ];
    return { copy: pack.copy, generator, lookup: [...generator, ...pack.legacy] };
  };
  // Bingo/Batalla Musical són productes de MASQUERADE (col·laborador), no propis:
  // surten via `collaboratorProducts`. (El #968 els havia afegit com a propis per
  // error; corregit al #969 — la causa real és que el seed #956 els va desactivar.)
  const generatorCatalog = catalogFor(generatorLocale);
  const generatorProducts = generatorCatalog.generator;

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
          dossierCopy={generatorCatalog.copy}
          locale={generatorLocale}
          quoteLines={quoteLines}
          logoDataUri={logoDataUri}
          leadId={searchParams?.leadId}
          initialNom={searchParams?.nom}
          initialEmail={searchParams?.email}
          initialTelefon={searchParams?.telefon}
          initialEmpresa={searchParams?.empresa}
          initialEventDesc={searchParams?.eventDesc}
          initialProductIds={initialProductIds}
          initialEventLocation={leadEventLocation}
        />
      </section>

      {/* Llista de dossiers desats */}
      {dossiers.length > 0 && (
        <section className="dg__list-section">
          <h2 className="dg__section-title">Dossiers desats ({dossiers.length})</h2>
          <div className="dg__list">
            {dossiers.map((d) => {
              const rowLocale = dossierLocaleOf(d.lead?.preferredLocale);
              const rowCatalog = catalogFor(rowLocale);
              const productNames = rowCatalog.lookup
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
                    alreadySent={!!d.sentAt}
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
              const rowLocale = dossierLocaleOf(d.lead?.preferredLocale);
              const rowCatalog = catalogFor(rowLocale);
              const productNames = rowCatalog.lookup
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
                    alreadySent={!!d.sentAt}
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

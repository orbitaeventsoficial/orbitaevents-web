import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { AdminPage, AdminSection } from '../../components/AdminPage';
import { ADMIN_PROTOCOL_VALIDATION_STYLE } from '@/lib/constants/admin';
import ProtocolValidationToggle from './ProtocolValidationToggle';
import {
  parseProtocolCanvis,
  parseProtocolSections,
  type ProtocolCanviMeta,
  type ProtocolCanviStatus,
  type ProtocolSectionMeta,
} from '@/lib/services/protocolCanvisService';
import { loadCanviValidations, summarizeValidations } from '@/lib/services/protocolValidationsService';
import {
  describeProtocolSectionEmptyState,
  describeProtocolValidationEmptyState,
  describeProtocolValidationFilter,
  describeProtocolPendingShortcut,
  describeProtocolValidationResults,
  describeProtocolSectionResults,
  filterProtocolCanvisByValidation,
  findFirstPendingProtocolCanvi,
  normalizeProtocolValidationFilter,
  shouldAutoOpenProtocolCanvi,
  summarizeProtocolValidationFilterCounts,
  summarizeProtocolValidationProgress,
} from '@/lib/services/protocolValidationViewerService';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<ProtocolCanviStatus, string> = {
  FET: 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-200',
  'EN MARXA': 'border-amber-500/40 bg-amber-500/[0.08] text-amber-200',
  PENDENT: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
  UNKNOWN: 'border-[var(--line)] bg-[var(--panel)] text-white/70',
};

const AUTHOR_STYLE: Record<string, string> = {
  claude: 'border-[var(--hair-gold)] bg-[var(--panel)] text-[var(--gold)]',
  codex: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
};

function getAuthorStyle(author: string): string {
  return AUTHOR_STYLE[author.toLowerCase()] ?? 'border-[var(--line)] bg-[var(--panel)] text-white/70';
}

async function readProtocolMarkdown(): Promise<string> {
  const canonicalPath = path.join(process.cwd(), 'docs', 'admin-protocol.md');
  const legacyPath = path.join(process.cwd(), 'docs', 'protocol-producte-admin-ca.md');
  const filePath = await fs.access(canonicalPath).then(() => canonicalPath).catch(() => legacyPath);
  return fs.readFile(filePath, 'utf-8');
}

export default async function AdminProtocolPage({
  searchParams,
}: {
  searchParams?: Promise<{ canvi?: string; q?: string; seccio?: string; validation?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const focus = params.canvi ? Number(params.canvi) : null;
  const query = (params.q ?? '').trim().toLowerCase();
  const focusSeccio = (params.seccio ?? '').trim();
  const validationFilter = normalizeProtocolValidationFilter(params.validation);
  const markdown = await readProtocolMarkdown();
  const allCanvis = parseProtocolCanvis(markdown);
  const allSections = parseProtocolSections(markdown);
  const validations = await loadCanviValidations();
  const validationSummary = summarizeValidations(allCanvis.length, validations, allCanvis.map((canvi) => canvi.n));

  const queryFiltered: ProtocolCanviMeta[] = query
    ? allCanvis.filter((canvi) => {
        const haystack = `${canvi.n} ${canvi.date} ${canvi.author} ${canvi.headline}`.toLowerCase();
        return haystack.includes(query);
      })
    : allCanvis;
  const validationFilterCounts = summarizeProtocolValidationFilterCounts(queryFiltered, validations);
  const validationProgress = summarizeProtocolValidationProgress(queryFiltered, validations);
  const firstPending = findFirstPendingProtocolCanvi(queryFiltered, validations);
  const pendingShortcut = describeProtocolPendingShortcut(firstPending, query);
  const filtered = filterProtocolCanvisByValidation(queryFiltered, validations, validationFilter);
  const validationFilterMeta = describeProtocolValidationFilter(validationFilter, query, filtered.length);
  const resultsMeta = describeProtocolValidationResults(validationFilter, query, filtered.length);
  const emptyStateMeta = describeProtocolValidationEmptyState(validationFilter, query);

  const filteredSections: ProtocolSectionMeta[] = query
    ? allSections.filter((section) => {
        const haystack = `${section.id} ${section.title}`.toLowerCase();
        return haystack.includes(query);
      })
    : allSections;
  const sectionResultsMeta = describeProtocolSectionResults(query, filteredSections.length);
  const sectionEmptyStateMeta = describeProtocolSectionEmptyState(query);

  const focusedSection: ProtocolSectionMeta | null = focusSeccio
    ? allSections.find((section) => section.id === focusSeccio) ?? null
    : null;

  const totalFet = allCanvis.filter((c) => c.status === 'FET').length;
  const lastDate = allCanvis[0]?.date ?? '—';

  return (
    <AdminPage
      title="Protocol — §9 Canvis registrats"
      subtitle="Història canònica del producte, llegida directament de docs/admin-protocol.md. Cada Canvi #N és aquí la font de veritat."
      back={{ href: '/admin/manual', label: 'Manual de possibilitats' }}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="admin-card-glass rounded-2xl border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Canvis registrats</p>
          <p className="mt-2 text-3xl font-bold">{allCanvis.length}</p>
          <p className="mt-1 text-xs opacity-60">{totalFet} FET · {allCanvis.length - totalFet} altres estats.</p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Seccions del protocol</p>
          <p className="mt-2 text-3xl font-bold">{allSections.length}</p>
          <p className="mt-1 text-xs opacity-60">§X.Y agrupades per àrea de producte.</p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Darrer canvi</p>
          <p className="mt-2 text-3xl font-bold">#{allCanvis[0]?.n ?? '—'}</p>
          <p className="mt-1 text-xs opacity-60">{lastDate} · {allCanvis[0]?.author ?? '—'}</p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Validats humans</p>
          <p className="mt-2 text-3xl font-bold">{validationSummary.validatedCount}</p>
          <p className="mt-1 text-xs opacity-60">
            {validationSummary.validatedPercent}% · {validationSummary.pendingCount} pendents.
          </p>
          <p className="mt-1 text-xs opacity-60">
            Vista actual: {validationProgress.label} · {validationProgress.percent}%.
          </p>
          <p className="mt-1 text-xs opacity-60">
            {firstPending ? `Següent pendent: #${firstPending.n} · ${firstPending.author}` : 'No queda cap pendent en aquesta vista.'}
          </p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Filtre actiu</p>
          <p className="mt-2 text-3xl font-bold">{filtered.length}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-50">
            {validationFilterMeta.label}
          </p>
          <p className="mt-1 text-xs opacity-60">{validationFilterMeta.description}</p>
        </div>
      </section>

      <AdminSection
        title="Cerca de canvis"
        description="Filtra per número, data, autor o text del titular. La cerca usa query string ?q=... per ser navegable des dels CTAs del manual."
      >
        <form method="get" className="flex flex-wrap gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Cerca per #462, claude, audit trail..."
            aria-label="Cercar al protocol"
            className="flex-1 min-w-[240px] ap-card px-3 py-2 text-sm placeholder:text-white/40 focus:border-amber-500/50 focus:outline-none"
          />
          <select
            name="validation"
            defaultValue={validationFilter}
            className="min-w-[180px] ap-card px-3 py-2 text-sm focus:border-amber-500/50 focus:outline-none"
          >
            <option value="all">Tots els canvis</option>
            <option value="validated">Només validats</option>
            <option value="pending">Només pendents</option>
          </select>
          <button type="submit" className="ap-btn-primary">Cercar</button>
          {query || validationFilter !== 'all' ? (
            <a href="/admin/docs/protocol" className="ap-btn-secondary">Netejar</a>
          ) : null}
        </form>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link
            href={`/admin/docs/protocol${query ? `?q=${encodeURIComponent(query)}` : ''}`}
            className={validationFilter === 'all' ? 'ap-btn-primary text-xs' : 'ap-btn-secondary text-xs'}
          >
            Tots · {validationFilterCounts.all}
          </Link>
          <Link
            href={`/admin/docs/protocol?validation=validated${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            className={validationFilter === 'validated' ? 'ap-btn-primary text-xs' : 'ap-btn-secondary text-xs'}
          >
            Validats · {validationFilterCounts.validated}
          </Link>
          <Link
            href={`/admin/docs/protocol?validation=pending${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            className={validationFilter === 'pending' ? 'ap-btn-primary text-xs' : 'ap-btn-secondary text-xs'}
          >
            Pendents · {validationFilterCounts.pending}
          </Link>
          {pendingShortcut.href ? (
            <Link
              href={pendingShortcut.href}
              className="ap-btn-secondary text-xs"
            >
              {pendingShortcut.label}
            </Link>
          ) : (
            <span className="rounded-full border border-white/10 px-3 py-2 text-xs opacity-60">
              {pendingShortcut.label}
            </span>
          )}
        </div>
      </AdminSection>

      {focusedSection ? (
        <AdminSection
          title={`§${focusedSection.id} — ${focusedSection.title}`}
          description="Secció oberta des d'un CTA del manual. Aquí veus el contingut canònic; el text complet és a docs/admin-protocol.md."
        >
          <div id={focusedSection.anchorId} className="rounded-2xl border border-amber-500/40 bg-amber-500/[0.04] p-4">
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed opacity-90">
              {focusedSection.body}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/admin/docs/protocol" className="ap-btn-secondary text-xs">Tornar a tot el protocol</Link>
              <Link href="/admin/manual" className="ap-btn-secondary text-xs">Manual de possibilitats</Link>
            </div>
          </div>
        </AdminSection>
      ) : (
        <AdminSection
          title={sectionResultsMeta.title}
          description={sectionResultsMeta.description}
        >
          {filteredSections.length === 0 ? (
            <div className="ap-card p-4">
              <p className="text-sm font-semibold">{sectionEmptyStateMeta.title}</p>
              <p className="mt-1 text-sm opacity-70">{sectionEmptyStateMeta.description}</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSections.map((section) => (
                <Link
                  key={section.anchorId}
                  href={`/admin/docs/protocol?seccio=${section.id}#${section.anchorId}`}
                  className="admin-card-glass flex flex-col gap-1 rounded-xl border border-white/10 p-3 transition hover:border-amber-500/40"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-50">§{section.id}</span>
                  <span className="text-sm font-bold leading-snug">{section.title}</span>
                </Link>
              ))}
            </div>
          )}
        </AdminSection>
      )}

      <AdminSection
        title={resultsMeta.title}
        description={resultsMeta.description}
      >
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="ap-card p-4">
              <p className="text-sm font-semibold">{emptyStateMeta.title}</p>
              <p className="mt-1 text-sm opacity-70">{emptyStateMeta.description}</p>
            </div>
          ) : (
            filtered.map((canvi) => {
              const isFocus = focus === canvi.n;
              const validation = validations.get(canvi.n) ?? null;
              return (
                <details
                  key={canvi.anchorId}
                  id={canvi.anchorId}
                  open={shouldAutoOpenProtocolCanvi(canvi.n, focus, validations, validationFilter)}
                  className={`admin-card-glass rounded-2xl border p-4 transition ${
                    isFocus ? 'border-amber-500/40 bg-amber-500/[0.04]' : 'border-white/10'
                  }`}
                >
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2 list-none">
                    <span className="text-base font-bold">Canvi #{canvi.n}</span>
                    <span className="text-xs opacity-60">{canvi.date}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${getAuthorStyle(canvi.author)}`}>
                      {canvi.author}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_STYLE[canvi.status]}`}>
                      {canvi.status}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        validation ? ADMIN_PROTOCOL_VALIDATION_STYLE.validated : ADMIN_PROTOCOL_VALIDATION_STYLE.pending
                      }`}
                    >
                      {validation ? 'Validat humà' : 'Pendent validació'}
                    </span>
                    <span className="basis-full text-sm font-semibold opacity-90 sm:basis-auto sm:flex-1 sm:text-right">
                      {canvi.headline}
                    </span>
                  </summary>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-black/30 p-3 text-xs leading-relaxed opacity-90">
                    {canvi.body}
                  </pre>
                  <ProtocolValidationToggle canviN={canvi.n} validation={validation} />
                </details>
              );
            })
          )}
        </div>
      </AdminSection>
    </AdminPage>
  );
}

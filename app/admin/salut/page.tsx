import Link from 'next/link';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import { ADMIN_SALUT_HELP, helpAttrs } from '../components/adminHelpContent';
import { AdminEmptyState, AdminKpi, AdminKpiRow, AdminPage, AdminSection } from '../components/AdminPage';
import { formatDateTimeFull } from '@/lib/constants';
import {
  ADMIN_SALUT_FOCUS_FILTER_OPTIONS,
  ADMIN_SALUT_STATUS_FILTER_OPTIONS,
  ADMIN_HEALTH_STATUS_TONE,
  ADMIN_HEALTH_STATUS_LABEL,
  ADMIN_HEALTH_STATUS_DOT,
  ADMIN_HEALTH_STATUS_ORDER,
} from '@/lib/constants/admin';
import { getAdminHealthSnapshot, type AdminHealthItem, type AdminHealthSection } from '@/lib/services/adminHealthService';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Salut — Òrbita Admin',
};

const STATUS_TONE = ADMIN_HEALTH_STATUS_TONE;
const STATUS_LABEL = ADMIN_HEALTH_STATUS_LABEL;
const STATUS_DOT = ADMIN_HEALTH_STATUS_DOT;
const STATUS_ORDER = ADMIN_HEALTH_STATUS_ORDER;

type StatusFilter = (typeof ADMIN_SALUT_STATUS_FILTER_OPTIONS)[number]['id'];
type FocusFilter = (typeof ADMIN_SALUT_FOCUS_FILTER_OPTIONS)[number]['id'];

type ItemGroup = {
  id: string;
  label: string;
  description: string;
  items: AdminHealthItem[];
};

type PriorityItem = {
  item: AdminHealthItem;
  sectionLabel: string;
  groupLabel: string;
};

type SalutSearchParams = {
  status?: string;
  focus?: string;
};

function getItemGroup(item: AdminHealthItem): ItemGroup['id'] {
  if (item.scope === 'catalog') {
    if (item.id.includes('inventory')) return 'inventory';
    if (item.id.includes('pack')) return 'packs';
    if (item.id.includes('extra')) return 'extras';
  }

  if (item.scope === 'operations') {
    if (item.id.includes('lead')) return 'leads';
    if (item.id.includes('booking')) return 'bookings';
    if (item.id.includes('task')) return 'tasks';
  }

  return 'general';
}

function sortHealthItems(items: AdminHealthItem[]): AdminHealthItem[] {
  return [...items].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;

    const countA = typeof a.count === 'number' ? a.count : -1;
    const countB = typeof b.count === 'number' ? b.count : -1;
    if (countA !== countB) return countB - countA;

    return a.title.localeCompare(b.title, 'ca');
  });
}

function groupSectionItems(section: AdminHealthSection): ItemGroup[] {
  const meta: Record<string, Omit<ItemGroup, 'items'>> = section.scope === 'catalog'
    ? {
        inventory: {
          id: 'inventory',
          label: 'Inventari',
          description: 'Disponibilitat real, cost intern i stock controlat.',
        },
        packs: {
          id: 'packs',
          label: 'Packs',
          description: 'Coherència de marge, equip base i rang comercial.',
        },
        extras: {
          id: 'extras',
          label: 'Extres',
          description: 'Cost, preu i rendibilitat dels complements venuts.',
        },
        general: {
          id: 'general',
          label: 'General',
          description: 'Lectura transversal del catàleg.',
        },
      }
    : section.scope === 'operations'
      ? {
          leads: {
            id: 'leads',
            label: 'Leads',
            description: 'Entrades comercials que convé moure abans que es refredin.',
          },
          bookings: {
            id: 'bookings',
            label: 'Reserves',
            description: 'Cobraments, preparació i seguiment de reserves actives.',
          },
          tasks: {
            id: 'tasks',
            label: 'Tasques',
            description: 'Punts pendents que poden encallar l’operativa del dia.',
          },
          general: {
            id: 'general',
            label: 'General',
            description: 'Vista transversal de l’operativa.',
          },
        }
      : {
          general: {
            id: 'general',
            label: section.label,
            description: section.description,
          },
        };

  const grouped = new Map<string, AdminHealthItem[]>();

  for (const item of section.items) {
    const groupId = getItemGroup(item);
    if (!grouped.has(groupId)) {
      grouped.set(groupId, []);
    }
    grouped.get(groupId)?.push(item);
  }

  return Array.from(grouped.entries()).map(([groupId, items]) => ({
    ...(meta[groupId] ?? meta.general),
    items: sortHealthItems(items),
  }));
}

function getStatusFilter(value?: string): StatusFilter {
  return ADMIN_SALUT_STATUS_FILTER_OPTIONS.some((option) => option.id === value) ? (value as StatusFilter) : 'all';
}

function getFocusFilter(value?: string): FocusFilter {
  return ADMIN_SALUT_FOCUS_FILTER_OPTIONS.some((option) => option.id === value) ? (value as FocusFilter) : 'all';
}

function buildFilterHref(status: StatusFilter, focus: FocusFilter) {
  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  if (focus !== 'all') params.set('focus', focus);
  const query = params.toString();
  return query ? `/admin/salut?${query}` : '/admin/salut';
}

function renderFilterChip(label: string, href: string, active: boolean) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-[var(--line)] bg-[var(--raised)] text-[var(--t)]'
          : 'border-[var(--line)] bg-[var(--raised)] text-[var(--t2)] hover:bg-[var(--raised)] hover:text-[var(--t2)]'
      }`}
    >
      {label}
    </Link>
  );
}

function buildPriorityItems(sections: AdminHealthSection[]): PriorityItem[] {
  return sections
    .flatMap((section) => {
      const groups = groupSectionItems(section);
      return groups.flatMap((group) =>
        group.items
          .filter((item) => item.status !== 'ok')
          .map((item) => ({ item, sectionLabel: section.label, groupLabel: group.label }))
      );
    })
    .sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.item.status] - STATUS_ORDER[b.item.status];
      if (statusDiff !== 0) return statusDiff;

      const countA = typeof a.item.count === 'number' ? a.item.count : -1;
      const countB = typeof b.item.count === 'number' ? b.item.count : -1;
      if (countA !== countB) return countB - countA;

      return a.item.title.localeCompare(b.item.title, 'ca');
    })
    .slice(0, 3);
}

function renderHealthCard(item: AdminHealthItem, sectionLabel: string) {
  return (
    <article
      key={item.id}
      className={`ap-card p-4 admin-card-glass ${STATUS_TONE[item.status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT[item.status]}`} />
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--t3)]">
              {STATUS_LABEL[item.status]}
            </p>
          </div>
          <h3 className="text-base font-semibold text-[var(--t)]">{item.title}</h3>
        </div>
        {typeof item.count === 'number' ? (
          <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--t2)]">
            {item.count}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3 text-sm text-[var(--t2)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--t3)]">Què passa</p>
          <p>{item.reason}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--t3)]">Per què importa</p>
          <p>{item.impact}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link href={item.href} className="ap-btn ap-btn--secondary text-sm">
          {item.actionLabel}
        </Link>
        <span className="text-xs text-[var(--t3)]">{sectionLabel}</span>
      </div>
    </article>
  );
}

export default async function SalutPage({ searchParams }: { searchParams?: Promise<SalutSearchParams> }) {
  const snapshot = await getAdminHealthSnapshot();
  const resolvedSearchParams = (await searchParams) ?? {};
  const activeStatus = getStatusFilter(resolvedSearchParams.status);
  const activeFocus = getFocusFilter(resolvedSearchParams.focus);

  const filteredSections = snapshot.sections
    .map((section) => {
      const filteredItems = section.items.filter((item) => {
        const statusMatch = activeStatus === 'all' || item.status === activeStatus;
        const focusMatch = activeFocus === 'all' || getItemGroup(item) === activeFocus;
        return statusMatch && focusMatch;
      });

      return {
        ...section,
        items: filteredItems,
        counts: {
          critical: filteredItems.filter((item) => item.status === 'critical').length,
          warning: filteredItems.filter((item) => item.status === 'warning').length,
          ok: filteredItems.filter((item) => item.status === 'ok').length,
        },
      };
    })
    .filter((section) => section.items.length > 0);

  const filteredSummary = {
    critical: filteredSections.reduce((sum, section) => sum + section.counts.critical, 0),
    warning: filteredSections.reduce((sum, section) => sum + section.counts.warning, 0),
    ok: filteredSections.reduce((sum, section) => sum + section.counts.ok, 0),
  };
  const hasActiveFilters = activeStatus !== 'all' || activeFocus !== 'all';
  const priorityItems = buildPriorityItems(filteredSections);
  const summary = hasActiveFilters ? filteredSummary : snapshot.summary;

  return (
    <AdminPage
      title="Salut"
      subtitle="Una sola vista per veure què està coix, per què importa i on convé actuar."
      kpis={(
        <AdminKpiRow>
          <AdminKpi label="Crítics" value={hasActiveFilters ? filteredSummary.critical : snapshot.summary.critical} tone="danger" href={buildFilterHref('critical', activeFocus)} tooltip="Problemes que requereixen acció immediata perquè poden afectar reserves, cobraments o operativa." />
          <AdminKpi label="Per revisar" value={hasActiveFilters ? filteredSummary.warning : snapshot.summary.warning} tone="warning" href={buildFilterHref('warning', activeFocus)} tooltip="Avisos que convé revisar aviat però no bloquegen res de forma immediata." />
          <AdminKpi label="Correctes" value={hasActiveFilters ? filteredSummary.ok : snapshot.summary.ok} tone="success" href={buildFilterHref('ok', activeFocus)} tooltip="Àrees del negoci que funcionen bé. Més verd, menys sorpreses." />
          <AdminKpi label="Últim càlcul" value={formatDateTimeFull(snapshot.generatedAt)} tone="info" tooltip="Data i hora de l'última anàlisi de salut. Es recalcula automàticament cada cop que obres la pàgina." />
        </AdminKpiRow>
      )}
    >
      <AdminHelpPanel
        title="Com llegir aquesta pantalla"
        description="Aquí no s’arregla tot. Aquí veus què convé atacar primer i a quina pantalla ho resoldràs."
        items={[
          {
            title: 'Vermell',
            body: 'Cal actuar perquè pot tocar diners, operativa o qualitat del sistema.',
          },
          {
            title: 'Ambre',
            body: 'No és un incendi, però convé revisar-ho abans que es faci gran.',
          },
          {
            title: 'Verd',
            body: 'Aquest bloc no mostra incidències obertes ara mateix.',
          },
        ]}
      />

      <section className="rounded-2xl border border-[var(--line)] p-4 admin-card-glass" {...helpAttrs(ADMIN_SALUT_HELP.filters)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--t2)]">Filtra el que vols veure</p>
            <p className="mt-1 text-sm text-[var(--t2)]">Pots quedar-te només amb crítics o anar directe a inventari, packs, extres, reserves o tasques.</p>
          </div>
          {hasActiveFilters ? (
            <Link href="/admin/salut" className="ap-btn ap-btn--secondary text-sm">
              Netejar filtres
            </Link>
          ) : null}
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--t3)]">Estat</p>
            <div className="flex flex-wrap gap-2">
              {ADMIN_SALUT_STATUS_FILTER_OPTIONS.map((option) => renderFilterChip(option.label, buildFilterHref(option.id, activeFocus), activeStatus === option.id))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--t3)]">Focus</p>
            <div className="flex flex-wrap gap-2">
              {ADMIN_SALUT_FOCUS_FILTER_OPTIONS.map((option) => renderFilterChip(option.label, buildFilterHref(activeStatus, option.id), activeFocus === option.id))}
            </div>
          </div>
        </div>
      </section>

      {priorityItems.length > 0 ? (
        <section className="rounded-2xl border border-[var(--line)] p-4 admin-card-glass" {...helpAttrs(ADMIN_SALUT_HELP.priorities)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--t3)]">Prioritat d’avui</p>
              <h2 className="ap-h2">Què convé atacar primer</h2>
              <p className="mt-1 text-sm text-[var(--t2)]">Lectura curta perquè no hagis d’escanejar tota la pantalla abans de decidir.</p>
            </div>
            <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--t2)]">{priorityItems.length} focus</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {priorityItems.map(({ item, sectionLabel, groupLabel }) => (
              <article key={item.id} className={`ap-card p-4 ${STATUS_TONE[item.status]}`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT[item.status]}`} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--t3)]">{STATUS_LABEL[item.status]}</p>
                </div>
                <p className="mt-3 text-base font-semibold text-[var(--t)]">{item.title}</p>
                <p className="mt-2 text-sm text-[var(--t2)]">{item.impact}</p>
                <p className="mt-3 text-xs text-[var(--t3)]">{sectionLabel} · {groupLabel}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link href={item.href} className="ap-btn ap-btn--secondary text-sm">{item.actionLabel}</Link>
                  {typeof item.count === 'number' ? (
                    <span className="rounded-full border border-[var(--line)] px-2 py-1 text-xs text-[var(--t2)]">{item.count}</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {filteredSections.length === 0 ? (
        <AdminEmptyState
          icon="🩺"
          title="Cap resultat amb aquest filtre"
          description="Prova un altre estat o neteja el focus per tornar a la vista completa."
        />
      ) : null}

      <div className="space-y-6">
        {filteredSections.map((section) => {
          const groups = groupSectionItems(section).filter((group) => group.items.length > 0);
          const hasSubgroups = groups.length > 1;

          return (
            <AdminSection
              key={section.scope}
              title={section.label}
              description={section.description}
              actions={(
                <div className="flex flex-wrap gap-2 text-xs text-[var(--t2)]">
                  <span>{section.counts.critical} crítics</span>
                  <span>{section.counts.warning} per revisar</span>
                  <span>{section.counts.ok} correctes</span>
                </div>
              )}
            >
              {hasSubgroups ? (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <section key={group.id} className="rounded-2xl border border-[var(--line)] p-4 admin-card-glass">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--t3)]">{section.label}</p>
                          <h3 className="text-base font-semibold text-[var(--t)]">{group.label}</h3>
                          <p className="mt-1 text-sm text-[var(--t2)]">{group.description}</p>
                        </div>
                        <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--t2)]">
                          {group.items.length}
                        </span>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        {group.items.map((item) => renderHealthCard(item, group.label))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {sortHealthItems(section.items).map((item) => renderHealthCard(item, section.label))}
                </div>
              )}
            </AdminSection>
          );
        })}
      </div>
    </AdminPage>
  );
}

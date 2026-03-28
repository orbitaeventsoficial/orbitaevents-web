import Link from 'next/link';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import { AdminEmptyState, AdminKpi, AdminKpiRow, AdminPage, AdminSection } from '../components/AdminPage';
import { formatDateTimeFull } from '@/lib/constants';
import { getAdminHealthSnapshot, type AdminHealthItem } from '@/lib/services/adminHealthService';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Salut — Òrbita Admin',
};

const STATUS_TONE: Record<AdminHealthItem['status'], string> = {
  critical: 'border-rose-500/20 bg-rose-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  ok: 'border-emerald-500/20 bg-emerald-500/5',
};

const STATUS_LABEL: Record<AdminHealthItem['status'], string> = {
  critical: 'Cal actuar',
  warning: 'Convé revisar',
  ok: 'Correcte',
};

const STATUS_DOT: Record<AdminHealthItem['status'], string> = {
  critical: 'bg-rose-400',
  warning: 'bg-amber-400',
  ok: 'bg-emerald-400',
};

export default async function SalutPage() {
  const snapshot = await getAdminHealthSnapshot();

  return (
    <AdminPage
      title="Salut"
      subtitle="Una sola vista per veure què està coix, per què importa i on convé actuar."
      kpis={(
        <AdminKpiRow>
          <AdminKpi label="Crítics" value={snapshot.summary.critical} tone="danger" href="/admin/salut" />
          <AdminKpi label="Per revisar" value={snapshot.summary.warning} tone="warning" href="/admin/salut" />
          <AdminKpi label="Correctes" value={snapshot.summary.ok} tone="success" href="/admin/salut" />
          <AdminKpi label="Últim càlcul" value={formatDateTimeFull(snapshot.generatedAt)} tone="info" />
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

      {snapshot.summary.total === 0 ? (
        <AdminEmptyState
          icon="🩺"
          title="Cap element de salut"
          description="No s’han pogut carregar avisos ni comprovacions."
        />
      ) : null}

      <div className="space-y-6">
        {snapshot.sections.map((section) => (
          <AdminSection
            key={section.scope}
            title={section.label}
            description={section.description}
            actions={(
              <div className="flex flex-wrap gap-2 text-xs text-white/60">
                <span>{section.counts.critical} crítics</span>
                <span>{section.counts.warning} per revisar</span>
                <span>{section.counts.ok} correctes</span>
              </div>
            )}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {section.items.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-4 admin-card-glass ${STATUS_TONE[item.status]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT[item.status]}`} />
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/55">
                          {STATUS_LABEL[item.status]}
                        </p>
                      </div>
                      <h3 className="text-base font-semibold text-white/90">{item.title}</h3>
                    </div>
                    {typeof item.count === 'number' ? (
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-white/70">
                        {item.count}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-white/72">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Què passa</p>
                      <p>{item.reason}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Per què importa</p>
                      <p>{item.impact}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Link href={item.href} className="ap-btn ap-btn--secondary text-sm">
                      {item.actionLabel}
                    </Link>
                    <span className="text-xs text-white/45">{section.label}</span>
                  </div>
                </article>
              ))}
            </div>
          </AdminSection>
        ))}
      </div>
    </AdminPage>
  );
}

'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatDateTimeFull, formatNumber } from '@/lib/constants';
import type { VisualAuditAtlas, VisualAuditRouteSummary } from '@/lib/services/visualAuditAtlasService';

function includesQuery(route: VisualAuditRouteSummary, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return [
    route.route,
    route.pattern,
    route.group,
    route.kind,
    route.failedCheckIds.join(' '),
  ].some((value) => value.toLowerCase().includes(q));
}

function statusClass(failedChecks: number): string {
  return failedChecks > 0 ? 'admin-tone-border-danger admin-tone-text-danger' : 'admin-tone-border-success admin-tone-text-success';
}

export default function VisualAuditClient({ atlas }: { atlas: VisualAuditAtlas }) {
  const [group, setGroup] = useState('Tots');
  const [query, setQuery] = useState('');

  const visibleRoutes = useMemo(() => atlas.routes.filter((route) => {
    const groupOk = group === 'Tots' || route.group === group;
    return groupOk && includesQuery(route, query);
  }), [atlas.routes, group, query]);

  if (!atlas.available) {
    return (
      <section className="ap-card p-4">
        <p className="font-mono text-xs uppercase text-[var(--gold)]">Baseline no disponible</p>
        <h2 className="mt-2 text-xl font-bold text-[var(--t)]">Encara no hi ha JSON local d'auditoria visual.</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--t2)]">
          Executa `pnpm run audit:visual:admin` i torna a obrir aquesta pantalla. La ruta busca el run a `.codex-captures/`.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="ap-card p-4">
          <p className="font-mono text-xs uppercase text-[var(--gold)]">Radiografia real</p>
          <h2 className="mt-2 text-lg font-bold text-[var(--t)]">{atlas.runId}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--t2)]">
            {formatNumber(atlas.summary.completedRenders)} renders i {formatNumber(atlas.summary.completedCaptures)} captures verificades contra {atlas.base || 'base local'}.
          </p>
          <p className="mt-3 text-xs text-[var(--t3)]">Generat {atlas.generatedAt ? formatDateTimeFull(atlas.generatedAt) : 'sense data'}.</p>
        </div>
        <div className="ap-card p-4">
          <p className="font-mono text-xs uppercase text-[var(--gold)]">Zenit visual</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-[var(--t2)]">
            {atlas.zenitPrinciples.slice(0, 4).map((principle) => (
              <li key={principle}>- {principle}</li>
            ))}
          </ul>
        </div>
        <div className="ap-card p-4">
          <p className="font-mono text-xs uppercase text-[var(--gold)]">Full de ruta</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--t2)]">
            Runtime net no vol dir disseny perfecte. Aquesta pantalla marca totes les rutes com a revisió humana pendent per poder fer V1 per òrgans.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {atlas.dimensions.map((dimension) => (
              <span key={dimension.id} className="ap-badge" title={dimension.title}>{dimension.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="ap-card p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <label>
            <span className="mb-1 block font-mono text-xs uppercase text-[var(--gold)]">Filtra ruta, òrgan o check</span>
            <input
              className="adm-input w-full"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex: bookings, dossiers, overflow, analytics..."
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={`ap-btn ap-btn--xs ${group === 'Tots' ? 'ap-btn--primary' : 'ap-btn--secondary'}`}
              onClick={() => setGroup('Tots')}
            >
              Tots
            </button>
            {atlas.organs.map((organ) => (
              <button
                key={organ.group}
                type="button"
                className={`ap-btn ap-btn--xs ${group === organ.group ? 'ap-btn--primary' : 'ap-btn--secondary'}`}
                onClick={() => setGroup(organ.group)}
              >
                {organ.group}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {atlas.organs.map((organ) => (
          <button
            key={organ.group}
            type="button"
            onClick={() => setGroup(organ.group)}
            className={`ap-btn ap-btn--secondary flex min-h-24 flex-col items-start justify-start text-left ${group === organ.group ? 'admin-tone-border-warning' : ''}`}
          >
            <span className="ap-kpi-label">{organ.group}</span>
            <span className="ap-kpi-value">{formatNumber(organ.routes)}</span>
            <span className="mt-1 block text-xs text-[var(--t3)]">
              {formatNumber(organ.captures)} captures · {organ.routesWithProblems === 0 ? 'runtime net' : `${organ.routesWithProblems} amb problemes`}
            </span>
          </button>
        ))}
      </section>

      {atlas.skipped.length > 0 && (
        <section className="ap-card p-3">
          <p className="font-mono text-xs uppercase text-[var(--gold)]">Omissions de dades</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--t2)]">
            {atlas.skipped.map((item) => (
              <span key={item.pattern} className="ap-badge admin-tone-border-warning">{item.pattern}: {item.reason}</span>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 2xl:grid-cols-2">
        {visibleRoutes.map((route) => (
          <article key={route.route} className={`ap-card p-4 ${route.failedChecks > 0 ? 'admin-tone-border-danger' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase text-[var(--gold)]">{route.group} · {route.kind}</p>
                <h2 className="mt-1 truncate text-lg font-bold text-[var(--t)]">{route.pattern}</h2>
                <p className="mt-1 truncate text-sm text-[var(--t3)]">{route.route}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <span className={`ap-badge ${statusClass(route.failedChecks)}`}>{route.runtimeStatus}</span>
                <span className="ap-badge admin-tone-border-warning">Revisió pendent</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {route.screenshots.map((shot) => (
                <a
                  key={`${route.route}-${shot.viewport}`}
                  href={shot.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group block no-underline"
                >
                  <span className="mb-1 block font-mono text-xs uppercase text-[var(--t3)]">{shot.viewport}</span>
                  <span className="block overflow-hidden rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--raised)]">
                    <img
                      src={shot.href}
                      alt={`Captura ${shot.viewport} de ${route.pattern}`}
                      loading="lazy"
                      className="aspect-[4/3] h-auto w-full object-cover object-top transition group-hover:opacity-80"
                    />
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-4 grid gap-2 text-xs text-[var(--t2)] sm:grid-cols-4">
              <span>Status HTTP: <strong className="text-[var(--t)]">{route.httpStatus ?? 'n/d'}</strong></span>
              <span>Max render: <strong className="text-[var(--t)]">{formatNumber(Math.round(route.maxElapsedMs))} ms</strong></span>
              <span>Altura max: <strong className="text-[var(--t)]">{formatNumber(route.maxScrollHeight)} px</strong></span>
              <span>Checks fallits: <strong className="text-[var(--t)]">{formatNumber(route.failedChecks)}</strong></span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {route.dimensions.map((dimension) => (
                  <span key={dimension.id} className="ap-badge" title={`${dimension.title}: pendent de revisió humana`}>{dimension.label}</span>
                ))}
              </div>
              <Link href={route.route} className="ap-btn ap-btn--secondary ap-btn--xs">Obrir ruta</Link>
            </div>
          </article>
        ))}
      </section>

      {visibleRoutes.length === 0 && (
        <section className="ap-card p-4 text-sm text-[var(--t2)]">
          Cap ruta coincideix amb el filtre actual.
        </section>
      )}
    </div>
  );
}

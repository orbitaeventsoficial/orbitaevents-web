'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatNumber } from '@/lib/constants';
import type { MasterAtlas, MasterAtlasModule } from '@/lib/services/masterAtlasService';

type TabKey = 'modules' | 'flow' | 'intervention';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'modules', label: 'Mòduls' },
  { key: 'flow', label: 'Flux complet' },
  { key: 'intervention', label: 'Com intervenir' },
];

const STATUS_BADGE: Record<MasterAtlasModule['status'], string> = {
  FORT: 'ap-badge ap-badge--success',
  EN_PROGRES: 'ap-badge ap-badge--warning',
  FRAGIL: 'ap-badge ap-badge--danger',
};

function includesQuery(values: Array<string | number | null | undefined>, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return values.some((value) => String(value ?? '').toLowerCase().includes(q));
}

function ModuleScore({ module }: { module: MasterAtlasModule }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={STATUS_BADGE[module.status]}>{module.status.replace('_', ' ')}</span>
      <span className="font-mono text-xs text-[var(--t3)]">{formatNumber(module.score)}/100</span>
      <span className="font-mono text-xs text-[var(--t3)]">{formatNumber(module.coverage.files)} fitxers</span>
      <span className="font-mono text-xs text-[var(--t3)]">{formatNumber(module.coverage.visualRoutes)} rutes visuals</span>
    </div>
  );
}

function MiniList({ title, items, max = 5 }: { title: string; items: string[]; max?: number }) {
  return (
    <div>
      <p className="mb-1 font-mono text-xs uppercase text-[var(--gold)]">{title}</p>
      <ul className="space-y-1 text-sm text-[var(--t2)]">
        {items.slice(0, max).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function ModuleCard({ module }: { module: MasterAtlasModule }) {
  const firstPending = module.nextMoves.find((move) => move.status !== 'FET');
  return (
    <article className="ap-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase text-[var(--gold)]">{module.id}</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--t)]">{module.title}</h2>
          <p className="mt-1 text-sm text-[var(--t2)]">{module.subtitle}</p>
        </div>
        <ModuleScore module={module} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4">
          <div>
            <p className="font-mono text-xs uppercase text-[var(--gold)]">Missió</p>
            <p className="mt-1 text-sm text-[var(--t2)]">{module.mission}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase text-[var(--gold)]">Pregunta del propietari</p>
            <p className="mt-1 text-sm text-[var(--t)]">{module.ownerQuestion}</p>
          </div>
          {firstPending && (
            <div className="ap-inline-alert ap-inline-alert--warning">
              <span className="font-semibold">Següent peça:</span> {firstPending.label}. {firstPending.why}
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MiniList title="No tocar a cegues" items={module.risks} max={4} />
          <MiniList title="Validació" items={module.validations} max={4} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-[var(--line)] p-3">
          <p className="mb-2 font-mono text-xs uppercase text-[var(--t3)]">Rutes</p>
          <div className="flex flex-wrap gap-1.5">
            {module.routes.slice(0, 8).map((route) => (
              <code key={route} className="rounded bg-[var(--panel2)] px-1.5 py-1 text-xs text-[var(--t2)]">{route}</code>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-[var(--line)] p-3">
          <p className="mb-2 font-mono text-xs uppercase text-[var(--t3)]">Fonts</p>
          <div className="flex flex-wrap gap-1.5">
            {module.sourceOfTruth.slice(0, 8).map((source) => (
              <code key={source} className="rounded bg-[var(--panel2)] px-1.5 py-1 text-xs text-[var(--t2)]">{source}</code>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-[var(--line)] p-3">
          <p className="mb-2 font-mono text-xs uppercase text-[var(--t3)]">Visual</p>
          <p className="text-sm text-[var(--t2)]">
            {formatNumber(module.coverage.visualRoutes)} ruta/es · {formatNumber(module.coverage.failedVisualChecks)} check/s fallit/s
          </p>
          {module.visualRoutes[0] && (
            <p className="mt-2 truncate font-mono text-xs text-[var(--t3)]">{module.visualRoutes[0].route}</p>
          )}
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer font-mono text-xs uppercase text-[var(--gold)]">Desplega cables i properes accions</summary>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--t)]">Fitxers detectats</p>
            <div className="max-h-56 overflow-auto rounded-md border border-[var(--line)]">
              {module.files.slice(0, 24).map((file) => (
                <div key={file.path} className="border-b border-[var(--line)] px-3 py-2 last:border-b-0">
                  <p className="truncate font-mono text-xs text-[var(--t)]">{file.path}</p>
                  <p className="text-xs text-[var(--t3)]">{formatNumber(file.lines)} línies · {formatNumber(file.functions)} símbols · {formatNumber(file.cables)} cables</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--t)]">Properes accions</p>
            <div className="space-y-2">
              {module.nextMoves.map((move) => (
                <div key={move.label} className="rounded-md border border-[var(--line)] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="ap-badge">{move.status}</span>
                    <span className="font-mono text-xs text-[var(--t3)]">Impacte {move.impact}</span>
                    <span className="font-mono text-xs text-[var(--t3)]">Esforç {move.effort}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--t)]">{move.label}</p>
                  <p className="mt-1 text-sm text-[var(--t2)]">{move.why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>
    </article>
  );
}

export default function MasterAtlasClient({ atlas }: { atlas: MasterAtlas }) {
  const [tab, setTab] = useState<TabKey>('modules');
  const [query, setQuery] = useState('');

  const modules = useMemo(() => atlas.modules.filter((module) => includesQuery([
    module.title,
    module.subtitle,
    module.mission,
    module.ownerQuestion,
    module.routes.join(' '),
    module.sourceOfTruth.join(' '),
    module.files.map((file) => file.path).join(' '),
    module.nextMoves.map((move) => `${move.label} ${move.why}`).join(' '),
  ], query)), [atlas.modules, query]);

  return (
    <div className="space-y-5">
      <div className="ap-card p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label>
            <span className="mb-1 block font-mono text-xs uppercase text-[var(--gold)]">Busca al Master</span>
            <input
              className="adm-input w-full"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Lead, marge, Masquerade, PDF, post-event, cash, welcome, visual..."
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`ap-btn ap-btn--xs ${tab === item.key ? 'ap-btn--primary' : 'ap-btn--secondary'}`}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'modules' && (
        <div className="space-y-4">
          {modules.map((module) => <ModuleCard key={module.id} module={module} />)}
        </div>
      )}

      {tab === 'flow' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="ap-card p-4">
            <h2 className="text-xl font-semibold text-[var(--t)]">Flux vertical complet</h2>
            <div className="mt-4 space-y-3">
              {['Comercial', 'Documents', 'Reserves', 'Economia', 'Partners', 'Post-event'].map((label, index) => (
                <div key={label} className="flex items-center gap-3 rounded-md border border-[var(--line)] p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--panel2)] font-mono text-xs text-[var(--gold)]">{index + 1}</span>
                  <span className="text-sm text-[var(--t)]">{label}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="ap-card p-4">
            <h2 className="text-xl font-semibold text-[var(--t)]">Principis que governen</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--t2)]">
              {atlas.principles.map((principle) => <li key={principle}>{principle}</li>)}
            </ul>
          </section>
        </div>
      )}

      {tab === 'intervention' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="ap-card p-4">
            <h2 className="text-xl font-semibold text-[var(--t)]">Gates abans de tocar</h2>
            <ol className="mt-4 space-y-2 text-sm text-[var(--t2)]">
              {atlas.gates.map((gate, index) => <li key={gate}>{index + 1}. {gate}</li>)}
            </ol>
          </section>
          <section className="ap-card p-4">
            <h2 className="text-xl font-semibold text-[var(--t)]">Portes de retorn</h2>
            <div className="mt-4 grid gap-2">
              <Link href="/admin/docs/electric-atlas" className="ap-btn ap-btn--secondary">Atles elèctric</Link>
              <Link href="/admin/docs/visual-audit" className="ap-btn ap-btn--secondary">Auditoria visual</Link>
              <Link href="/admin/control" className="ap-btn ap-btn--secondary">Control complet</Link>
              <Link href="/admin/studio" className="ap-btn ap-btn--secondary">Studio</Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

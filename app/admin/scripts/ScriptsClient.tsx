'use client';

import { useState, useMemo } from 'react';

interface ScriptInfo {
  name: string;
  file: string;
  command: string;
  category: 'seed' | 'sync' | 'check' | 'report' | 'fix' | 'audit';
  description: string;
  args?: string;
  danger?: boolean;
}

const SCRIPTS: ScriptInfo[] = [
  // ── SEED (dades inicials) ──
  {
    name: 'Seed complet',
    file: 'prisma/seed.ts',
    command: 'npx tsx prisma/seed.ts',
    category: 'seed',
    description: 'Insereix totes les dades inicials: settings, inventari, packs, extras, FAQs, traduccions, leads de prova i reserves de prova.',
  },
  {
    name: 'Seed plantilles email',
    file: 'prisma/seed-email-templates.ts',
    command: 'npx tsx prisma/seed-email-templates.ts',
    category: 'seed',
    description: 'Insereix les 24 plantilles email (8 tipus × 3 idiomes) a la BD. Upsert: si ja existeix, actualitza.',
  },
  {
    name: 'Seed blog',
    file: 'prisma/seed-blog.ts',
    command: 'npx tsx prisma/seed-blog.ts',
    category: 'seed',
    description: 'Insereix articles de blog de prova amb traduccions.',
  },

  // ── SYNC (sincronització) ──
  {
    name: 'Sync preu benzina MITECO',
    file: 'scripts/sync-fuel-price.ts',
    command: 'npx tsx scripts/sync-fuel-price.ts',
    category: 'sync',
    description: 'Consulta el preu real de la benzina via MITECO (mitjana Barcelona) i actualitza el cost per km del vehicle a la BD.',
  },
  {
    name: 'Sync packs → BD',
    file: 'scripts/sync-packs-to-db.ts',
    command: 'npx tsx scripts/sync-packs-to-db.ts',
    category: 'sync',
    description: 'Sincronitza la configuració de packs des del codi cap a la BD (Prisma).',
  },
  {
    name: 'Sync ressenyes Google',
    file: 'scripts/sync-reviews.mjs',
    command: 'node scripts/sync-reviews.mjs',
    category: 'sync',
    description: 'Obté les ressenyes de Google Business via SerpAPI i les desa a la BD.',
  },

  // ── CHECK (verificació) ──
  {
    name: 'Health check BD',
    file: 'scripts/health-check.ts',
    command: 'npx tsx scripts/health-check.ts',
    category: 'check',
    description: 'Verifica la integritat de la BD: connexió, comptadors, traduccions, settings crítiques, reserves sense pack, leads sense score.',
  },
  {
    name: 'Semàfor pagaments',
    file: 'scripts/check-payment-status.ts',
    command: 'npx tsx scripts/check-payment-status.ts',
    category: 'check',
    description: 'Mostra l\'estat de cobrament de totes les reserves actives amb semàfor: 🟢 tot cobrat, 🟡 falta resta, 🔴 res cobrat.',
  },
  {
    name: 'Monitor endpoints',
    file: 'scripts/monitor.ts',
    command: 'npx tsx scripts/monitor.ts',
    category: 'check',
    description: 'Health check dels endpoints principals: homepage, API, admin. Mesura temps de resposta.',
  },
  {
    name: 'Guard i18n packs',
    file: 'scripts/check-packs-i18n.ts',
    command: 'npx tsx scripts/check-packs-i18n.ts',
    category: 'check',
    description: 'Verifica que els packs no retornin claus tècniques al i18n (e.g. slugs en lloc de noms).',
  },

  // ── REPORT (informes) ──
  {
    name: 'Informe estadístiques',
    file: 'scripts/stats-report.ts',
    command: 'npx tsx scripts/stats-report.ts',
    category: 'report',
    description: 'Genera un resum del negoci: leads, reserves, finances, clients, distribució mensual i pròxims 7 dies.',
  },
  {
    name: 'Exportar backup JSON',
    file: 'scripts/export-backup.ts',
    command: 'npx tsx scripts/export-backup.ts',
    category: 'report',
    description: 'Exporta leads, reserves, clients, settings, plantilles, packs, extras i inventari a un JSON a la carpeta backup/.',
  },
  {
    name: 'Llistar preus packs',
    file: 'scripts/update-pack-prices.ts',
    command: 'npx tsx scripts/update-pack-prices.ts',
    category: 'report',
    description: 'Mostra els PVP actuals de tots els packs. Amb arguments, permet canviar el preu: npx tsx scripts/update-pack-prices.ts flash 300',
    args: '<slug> <preu>',
  },

  // ── FIX (correcció) ──
  {
    name: 'Recalcular scores leads',
    file: 'scripts/recalculate-scores.ts',
    command: 'npx tsx scripts/recalculate-scores.ts',
    category: 'fix',
    description: 'Recalcula el cachedScore de tots els leads actius (no LOST) basant-se en tipus event, data, convidats, pressupost i font.',
  },
  {
    name: 'Recalcular marges reserves',
    file: 'scripts/recalculate-margins.ts',
    command: 'npx tsx scripts/recalculate-margins.ts',
    category: 'fix',
    description: 'Recalcula IVA, total, dipòsit i import pendent de totes les reserves actives. Detecta anomalies financeres.',
  },
  {
    name: 'Netejar registres orfes',
    file: 'scripts/cleanup-orphans.ts',
    command: 'npx tsx scripts/cleanup-orphans.ts',
    category: 'fix',
    description: 'Detecta registres orfes (notes sense lead, activitats sense customer, etc). Dry-run per defecte, afegeix --fix per netejar.',
    args: '--fix',
  },
  {
    name: 'Reset plantilles email',
    file: 'scripts/reset-email-templates.ts',
    command: 'npx tsx scripts/reset-email-templates.ts',
    category: 'fix',
    description: 'Elimina les personalitzacions de plantilles email de la BD. Torna als defaults del codi. Es pot filtrar per slug.',
    args: '<slug>',
    danger: true,
  },
  {
    name: 'Actualitzar PVP pack',
    file: 'scripts/update-pack-prices.ts',
    command: 'npx tsx scripts/update-pack-prices.ts <slug> <preu>',
    category: 'fix',
    description: 'Canvia el preu base d\'un pack. Ex: npx tsx scripts/update-pack-prices.ts flash 300',
    args: '<slug> <preu>',
  },

  // ── CHECK (verificació) — nous ──
  {
    name: 'Leads estancats',
    file: 'scripts/check-stale-leads.ts',
    command: 'npx tsx scripts/check-stale-leads.ts',
    category: 'check',
    description: 'Detecta leads que necessiten atenció: sense contactar (>48h), sense seguiment (>7d), negociacions estancades (>14d), events propers sense confirmar.',
  },
  {
    name: 'Qualitat de dades',
    file: 'scripts/check-data-quality.ts',
    command: 'npx tsx scripts/check-data-quality.ts',
    category: 'check',
    description: 'Auditoria de qualitat: camps buits, emails duplicats, reserves amb data passada activa, inventari sobreutilitzat, settings buides.',
  },

  // ── REPORT (informes) — nous ──
  {
    name: 'Informe mensual',
    file: 'scripts/monthly-report.ts',
    command: 'npx tsx scripts/monthly-report.ts',
    category: 'report',
    description: 'Resum mes actual vs anterior: leads, reserves, ingressos, conversio, fonts. Accepta mes: npx tsx scripts/monthly-report.ts 2026-02',
    args: '<YYYY-MM>',
  },

  // ── AUDIT (auditoria) ──
  {
    name: 'Autofix master',
    file: 'scripts/autofix-master.ts',
    command: 'npx tsx scripts/autofix-master.ts',
    category: 'audit',
    description: 'Orquestrador que executa 5 autofix: system health, finances, CSS, GA4 i health check general.',
  },
  {
    name: 'Autofix finances',
    file: 'scripts/autofix-finance-health.ts',
    command: 'npx tsx scripts/autofix-finance-health.ts',
    category: 'audit',
    description: 'Verifica i corregeix configuració econòmica: pricing model, profitabilitat, cost engine.',
  },
  {
    name: 'Autofix sistema',
    file: 'scripts/autofix-system-health.ts',
    command: 'npx tsx scripts/autofix-system-health.ts',
    category: 'audit',
    description: 'Valida CSS admin, costos horaris inventari, marges packs, salut econòmica general.',
  },
  {
    name: 'Scan hardcoded',
    file: 'scripts/scan-hardcoded.js',
    command: 'node scripts/scan-hardcoded.js',
    category: 'audit',
    description: 'Detecta valors hardcoded a les traduccions: preus, anys, telèfons, km, URLs.',
  },
  {
    name: 'Scan i18n leaks',
    file: 'scripts/scan-i18n-leaks.mjs',
    command: 'node scripts/scan-i18n-leaks.mjs',
    category: 'audit',
    description: 'Detecta claus de traducció no resoltes a pàgines públiques (textos en cru tipus hero.title).',
  },
  {
    name: 'Smoke test i18n',
    file: 'scripts/smoke-i18n.mjs',
    command: 'node scripts/smoke-i18n.mjs',
    category: 'audit',
    description: 'Test ràpid i18n: verifica que les pàgines públiques no mostrin claus sense traduir.',
  },
  {
    name: 'Autofix theme CSS',
    file: 'scripts/admin-theme-autofix.mjs',
    command: 'node scripts/admin-theme-autofix.mjs',
    category: 'audit',
    description: 'Auto-fix colors Tailwind de l\'admin: canvia slate-* per white/opacity, arregla opacitats.',
  },
  {
    name: 'Auditoria visual',
    file: 'scripts/visual-audit.ts',
    command: 'npx tsx scripts/visual-audit.ts',
    category: 'audit',
    description: 'Captura screenshots de totes les pàgines públiques (Playwright). Útil per revisar canvis visuals.',
  },
];

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  seed: { label: 'Dades inicials', icon: '🌱', color: 'border-emerald-500/30 bg-emerald-500/5' },
  sync: { label: 'Sincronització', icon: '🔄', color: 'border-cyan-500/30 bg-cyan-500/5' },
  check: { label: 'Verificació', icon: '🔍', color: 'border-blue-500/30 bg-blue-500/5' },
  report: { label: 'Informes', icon: '📊', color: 'border-purple-500/30 bg-purple-500/5' },
  fix: { label: 'Correcció', icon: '🔧', color: 'border-amber-500/30 bg-amber-500/5' },
  audit: { label: 'Auditoria', icon: '🛡️', color: 'border-rose-500/30 bg-rose-500/5' },
};

export default function ScriptsClient() {
  const [filter, setFilter] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return SCRIPTS;
    return SCRIPTS.filter((s) => s.category === filter);
  }, [filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, ScriptInfo[]> = {};
    for (const s of filtered) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filtered]);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(CATEGORY_INFO).map(([key, info]) => {
          const count = SCRIPTS.filter((s) => s.category === key).length;
          const isActive = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(isActive ? null : key)}
              className={`rounded-2xl border p-3 text-left transition-all ${
                isActive ? info.color + ' ring-1 ring-white/20' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="text-lg">{info.icon}</div>
              <div className="text-xs font-semibold mt-1">{info.label}</div>
              <div className="text-lg font-bold">{count}</div>
            </button>
          );
        })}
      </div>

      {filter && (
        <button
          type="button"
          onClick={() => setFilter(null)}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Mostrar tots ({SCRIPTS.length})
        </button>
      )}

      {/* Llista agrupada */}
      {Object.entries(grouped).map(([cat, scripts]) => {
        const info = CATEGORY_INFO[cat];
        return (
          <div key={cat}>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/50 mb-3">
              <span>{info.icon}</span> {info.label}
            </h2>
            <div className="space-y-2">
              {scripts.map((s) => (
                <div
                  key={s.file + s.name}
                  className={`rounded-2xl border p-4 transition-all hover:bg-white/[0.02] ${s.danger ? 'border-rose-500/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{s.name}</span>
                        {s.danger && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border">
                            destructiu
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-1 leading-relaxed">{s.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="text-[11px] font-mono bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                          {s.command}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyCommand(s.command)}
                          className="text-[10px] px-2 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                          title="Copiar comanda"
                        >
                          {copiedCommand === s.command ? '✓ Copiat' : 'Copiar'}
                        </button>
                      </div>
                      {s.args && (
                        <div className="mt-1 text-[10px] text-white/30">
                          Arguments opcionals: <code className="text-white/40">{s.args}</code>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-white/20 font-mono flex-shrink-0">
                      {s.file}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Instruccions */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold mb-2">Com executar</h3>
        <ol className="text-xs text-white/50 space-y-1 list-decimal list-inside">
          <li>Obre un terminal a la carpeta del projecte</li>
          <li>Copia la comanda clicant el botó &quot;Copiar&quot;</li>
          <li>Enganxa i executa al terminal</li>
          <li>Els scripts amb <code className="">--fix</code> modifiquen dades — primer executa sense per veure el report</li>
        </ol>
      </div>
    </div>
  );
}

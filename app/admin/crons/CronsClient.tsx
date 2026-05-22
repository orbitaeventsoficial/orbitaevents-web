'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../components/ToastProvider';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { formatDateTimeFull } from '@/lib/constants';
import { ADMIN_CRON_HEALTH_CONFIG } from '@/lib/constants/admin';

interface CronInfo {
  id: string;
  label: string;
  frequency: string;
  lastRun: string | null;
  lastStatus: string | null;
  lastSummary: Record<string, unknown> | null;
  lastMessage: string | null;
  health: 'ok' | 'warning' | 'error' | 'unknown';
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ara mateix';
  if (minutes < 60) return `Fa ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Fa ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Fa ${days}d`;
}

function formatSummary(summary: Record<string, unknown> | null): string[] {
  if (!summary) return [];
  return Object.entries(summary).map(([key, value]) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
    return `${label}: ${value}`;
  });
}

export default function CronsClient() {
  const toast = useToast();
  const [crons, setCrons] = useState<CronInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCrons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/crons');
      if (!res.ok) throw new Error('Error carregant crons');
      const data = await res.json();
      setCrons(data.crons || []);
    } catch (err) {
      console.error('Error carregant llista de crons', err);
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCrons();
  }, [fetchCrons]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm" role="status">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Carregant estat dels crons...
      </div>
    );
  }

  const healthCounts = {
    ok: crons.filter((c) => c.health === 'ok').length,
    warning: crons.filter((c) => c.health === 'warning').length,
    error: crons.filter((c) => c.health === 'error').length,
    unknown: crons.filter((c) => c.health === 'unknown').length,
  };
  const delayedCrons = crons.filter((c) => c.health === 'warning');
  const failedCrons = crons.filter((c) => c.health === 'error');
  const neverRunCrons = crons.filter((c) => c.health === 'unknown');
  const systemItems = [
    `${healthCounts.ok} crons estan correctes ara mateix`,
    delayedCrons.length > 0 ? `${delayedCrons.length} crons van amb retard o fora de finestra` : '',
    failedCrons.length > 0 ? `${failedCrons.length} crons han fallat i poden estar bloquejant automatismes` : '',
    neverRunCrons.length > 0 ? `${neverRunCrons.length} crons encara no s'han executat mai` : '',
  ].filter(Boolean);
  const manualItems = [
    failedCrons[0] ? `Cal revisar ${failedCrons[0].label} perquè està en error` : '',
    delayedCrons[0] ? `Convé validar ${delayedCrons[0].label} perquè ja va tard` : '',
    neverRunCrons.length > 0 ? 'Hi ha processos sense primera execució registrada i això erosiona confiança operativa' : '',
    failedCrons.length === 0 && delayedCrons.length === 0 && neverRunCrons.length === 0
      ? 'Sense incidències manuals crítiques. El focus pot passar a observació i consistència.'
      : '',
  ].filter(Boolean);
  const nextStep =
    failedCrons[0]
      ? {
          title: `Atacar l'error de ${failedCrons[0].label}`,
          detail: failedCrons[0].lastMessage
            ? `L'últim error registrat diu: ${failedCrons[0].lastMessage}. El primer pas és obrir el cron i llegir el detall abans que altres automatismes quedin cecs.`
            : `Aquest cron està en error. El primer pas és obrir-lo i revisar el darrer estat abans que la incidència s'arrossegui.`,
          href: '/admin/crons',
          ctaLabel: 'Revisar cron en aquesta llista',
          secondaryAction: { href: '/admin/salut', label: 'Obrir Salut' },
        }
      : delayedCrons[0]
        ? {
            title: `Regularitzar el retard de ${delayedCrons[0].label}`,
            detail: `No hi ha error dur, però ${delayedCrons[0].label} ja surt fora de temps. El següent pas és confirmar si és retard puntual o símptoma sistèmic.`,
            href: '/admin/crons',
            ctaLabel: 'Revisar cron en aquesta llista',
            secondaryAction: { href: '/admin/salut', label: 'Obrir Salut' },
          }
        : neverRunCrons[0]
          ? {
              title: `Verificar la primera execució de ${neverRunCrons[0].label}`,
              detail: `Hi ha crons que encara no tenen rastre d'execució. Abans de donar-los per bons, cal confirmar que realment s'han desplegat i corren.`,
              href: '/admin/crons',
              ctaLabel: 'Revisar cron en aquesta llista',
              secondaryAction: { href: '/admin' , label: 'Tornar al dashboard' },
            }
          : {
              title: 'Mantenir observabilitat, no apagar focs',
              detail: 'No hi ha errors ni retards crítics. El millor següent pas és revisar periòdicament salut i assegurar que els automatismes continuen visibles.',
              href: '/admin/salut',
              ctaLabel: 'Obrir Salut',
              secondaryAction: { href: '/admin', label: 'Tornar al dashboard' },
            };

  return (
    <div className="space-y-4">
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: 'Què vigila el sistema',
          tone: failedCrons.length > 0 ? 'warning' : 'info',
          items: systemItems,
          emptyText: 'Sense senyals de cron rellevants ara mateix.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'On et cal intervenir',
          tone: failedCrons.length > 0 || delayedCrons.length > 0 || neverRunCrons.length > 0 ? 'warning' : 'success',
          items: manualItems,
          emptyText: 'Cap cron et reclama intervenció manual ara mateix.',
        }}
        nextStep={{
          eyebrow: 'Següent pas',
          ...nextStep,
        }}
      />

      {/* Resum */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wide text-white/50">Correctes</div>
          <div className="text-2xl sm:text-3xl font-bold">{healthCounts.ok}</div>
        </div>
        <div className="rounded-2xl border p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wide text-white/50">Retardats</div>
          <div className="text-2xl sm:text-3xl font-bold">{healthCounts.warning}</div>
        </div>
        <div className="rounded-2xl border p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wide text-white/50">Errors</div>
          <div className="text-2xl sm:text-3xl font-bold">{healthCounts.error}</div>
        </div>
        <div className="rounded-2xl border p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wide text-white/50">Mai executat</div>
          <div className="text-2xl sm:text-3xl font-bold text-white/30">{healthCounts.unknown}</div>
        </div>
      </div>

      {/* Llista de crons */}
      <div className="space-y-2">
        {crons.map((cron) => {
          const config = ADMIN_CRON_HEALTH_CONFIG[cron.health];
          const isExpanded = expandedId === cron.id;
          const summaryLines = formatSummary(cron.lastSummary);

          return (
            <button
              key={cron.id}
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : cron.id)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${config.bg}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-3 w-3 rounded-full flex-shrink-0 ${config.dot}`} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm sm:text-base truncate">
                      {cron.label}
                    </div>
                    <div className="text-xs text-white/50">
                      {cron.frequency}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-medium">
                      {config.label}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {cron.lastRun ? formatTimeAgo(cron.lastRun) : 'Mai'}
                    </div>
                  </div>
                  <span className={`text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/10 text-sm space-y-2" onClick={(e) => e.stopPropagation()}>
                  {cron.lastRun && (
                    <div className="flex gap-2">
                      <span className="text-white/40 w-24 flex-shrink-0">Últim run:</span>
                      <span>{formatDateTimeFull(cron.lastRun)}</span>
                    </div>
                  )}
                  {cron.lastStatus && (
                    <div className="flex gap-2">
                      <span className="text-white/40 w-24 flex-shrink-0">Estat:</span>
                      <span className={cron.lastStatus === 'ok' ? 'text-emerald-400' : 'text-rose-400'}>
                        {cron.lastStatus.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {cron.lastMessage && (
                    <div className="flex gap-2">
                      <span className="text-white/40 w-24 flex-shrink-0">Missatge:</span>
                      <span className="">{cron.lastMessage}</span>
                    </div>
                  )}
                  {summaryLines.length > 0 && (
                    <div>
                      <span className="text-white/40 text-xs">Resum:</span>
                      <div className="mt-1 grid gap-1 sm:grid-cols-2">
                        {summaryLines.map((line) => (
                          <div key={line} className="rounded-xl bg-white/5 px-2.5 py-1.5 text-xs">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Botó actualitzar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setLoading(true); fetchCrons(); }}
          className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:bg-white/10 active:scale-[0.98]"
        >
          Actualitzar
        </button>
      </div>
    </div>
  );
}



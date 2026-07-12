'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  PartyPopper,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { log } from '@/lib/logger';
import { AdminEmptyState, AdminPage } from '../components/AdminPage';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { EditorControlStrip } from '../components/EditorControlStrip';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

interface Stat {
  key: string;
  label: string;
  description: string;
  icon: string;
  value: number;
  fallback: number;
  calculated: number;
  isManual: boolean;
}

const STAT_ICON_MAP: Record<string, LucideIcon> = {
  party: PartyPopper,
  people: Users,
  calendar: CalendarDays,
  star: Star,
  sparkle: Sparkles,
};

function StatIcon({ icon }: { icon: string }) {
  const Icon = STAT_ICON_MAP[icon] ?? Sparkles;
  return (
    <span
      aria-hidden="true"
      data-stat-icon={icon}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--raised)]"
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} />
    </span>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingStat, setEditingStat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();
  const toast = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setFetchError(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetchWithCsrf('/api/admin/stats', { signal: controller.signal });
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setFetchError('La connexió ha trigat massa. Reintenta.');
      } else {
        setFetchError('Error carregant estadístiques.');
        log.error('Error loading stats:', error);
      }
    } finally {
      clearTimeout(tid);
      setLoading(false);
    }
  }

  function startEdit(stat: Stat) {
    setEditingStat(stat.key);
    setEditValue(stat.fallback.toString());
  }

  async function saveStat(key: string) {
    setSaving(true);
    try {
      const res = await fetchWithCsrf('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, fallback: parseFloat(editValue) }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data?.error || 'Error desant estadística');
      }

      await loadStats();
      setEditingStat(null);
      toast.success('Estadística desada');
    } catch (error) {
      log.error('Error saving stat:', error);
      toast.error(error instanceof Error ? error.message : 'Error desant estadística');
    } finally {
      setSaving(false);
    }
  }

  async function resetStat(key: string) {
    const ok = await confirm({ title: 'Resetar estadística', message: 'Resetar al valor calculat automàticament?', confirmLabel: 'Resetar', variant: 'warning' });
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetchWithCsrf('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, resetToCalculated: true }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data?.error || 'Error resetejant estadística');
      }

      await loadStats();
      toast.success('Estadística resetejada al valor automàtic');
    } catch (error) {
      log.error('Error resetting stat:', error);
      toast.error(error instanceof Error ? error.message : 'Error resetejant estadística');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <AdminPage title="Estadístiques" subtitle="Gestiona les estadístiques que es mostren al lloc web">
        <AdminEmptyState
          icon="⚠️"
          title={fetchError}
          action={
            <button type="button" onClick={() => { setLoading(true); loadStats(); }} className="ap-btn ap-btn--primary">
              Reintentar
            </button>
          }
        />
      </AdminPage>
    );
  }

  const manualStats = stats.filter(s => s.isManual).length;
  const automaticStats = stats.length - manualStats;
  const topManualStat =
    stats
      .filter((stat) => stat.isManual)
      .sort((left, right) => Math.abs(right.fallback - right.calculated) - Math.abs(left.fallback - left.calculated))[0] ?? null;
  const isEditing = editingStat !== null;
  const statusItems = [
    manualStats > 0
      ? `${manualStats} estadística${manualStats === 1 ? '' : 's'} dep${manualStats === 1 ? 'èn' : 'enen'} ara mateix d’un valor manual per sobre del càlcul automàtic.`
      : 'Tot el catàleg viu ara mateix en mode automàtic, sense overrides manuals actius.',
    topManualStat
      ? `La desviació manual més gran és a ${topManualStat.label}: ${topManualStat.fallback} en lloc de ${topManualStat.calculated}.`
      : 'No hi ha cap desajust manual rellevant per revisar abans de publicar canvis.',
    isEditing
      ? 'Hi ha una edició oberta: convé tancar-la o desar-la abans de saltar a una altra estadística.'
      : 'No hi ha cap sessió d’edició oberta; pots entrar directament a la xifra que vulguis governar.',
  ];
  const actionTitle = isEditing
    ? 'Tanca la sessió oberta abans de tocar una altra xifra'
    : manualStats > 0
      ? 'Revisa si els overrides manuals continuen tenint sentit'
      : 'Mantén el catàleg en mode automàtic i toca només el que canvia negoci';
  const actionDescription = isEditing
    ? 'La prioritat correcta és desar o cancel·lar l’edició activa. Un cop tancada, baixa a la llista i valida si aquella dada ha d’entrar manualment o tornar al càlcul viu.'
    : manualStats > 0
      ? 'Aquest espai és per corregir el missatge públic quan el càlcul no explica bé el negoci. Si un override ja no cal, torna’l a automàtic abans d’afegir-ne un altre.'
      : 'La millor disciplina aquí és no inventar números. Si el càlcul ja representa bé l’activitat real, baixa a la llista només quan hi hagi un motiu comercial clar per intervenir.';

  return (
    <AdminPage
      title="Estadístiques"
      subtitle="Gestiona les estadístiques que es mostren al lloc web"
    >
      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura pública',
          title: 'Què controla aquest espai',
          description: 'Aquí governes els números visibles de la web pública. El valor bo no és tenir moltes targetes, sinó saber si el que veu el client surt de dades reals o d’un override conscient.',
          stats: [
            { label: 'Stats', value: stats.length },
            { label: 'Automàtiques', value: automaticStats, tone: automaticStats > 0 ? 'success' : 'default' },
            { label: 'Manuals', value: manualStats, tone: manualStats > 0 ? 'warning' : 'default' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Com està la capa pública ara mateix',
          items: statusItems,
          stats: topManualStat
            ? [
                { label: 'Override principal', value: topManualStat.label, hint: `${topManualStat.fallback} manual vs ${topManualStat.calculated} automàtic`, tone: 'warning' },
              ]
            : undefined,
          tone: manualStats > 0 || isEditing ? 'warning' : 'success',
        }}
        action={{
          eyebrow: 'Acció principal',
          title: actionTitle,
          description: actionDescription,
          primaryAction: { href: '#stats-list', label: 'Anar a la llista' },
          secondaryAction: { href: '#stats-help', label: 'Veure criteri' },
          secondaryPills: isEditing
            ? ['Hi ha una edició oberta']
            : manualStats > 0
              ? ['Prioritza overrides manuals antics']
              : ['No cal tocar res si el càlcul ja és correcte'],
          tone: isEditing || manualStats > 0 ? 'warning' : 'success',
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="ap-card p-4">
          <div className="text-sm font-medium">Valors automàtics</div>
          <div className="mt-1 text-3xl font-bold">{automaticStats}</div>
          <div className="mt-1 text-xs">Calculats des de la BD</div>
        </div>
        <div className="ap-card p-4">
          <div className="text-sm font-medium">Valors manuals</div>
          <div className="mt-1 text-3xl font-bold">{manualStats}</div>
          <div className="mt-1 text-xs">Configurats manualment</div>
        </div>
      </div>

      {/* Stats List */}
      <div id="stats-list" className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={`border rounded-xl p-6 ${
              stat.isManual
                ? 'admin-tone-bg-warning admin-tone-border-warning'
                : 'bg-black/60 border-[var(--line)]'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <StatIcon icon={stat.icon} />
                <div>
                  <h3 className="font-semibold">{stat.label}</h3>
                  <p className="text-sm mt-0.5">{stat.description}</p>
                </div>
              </div>
              {stat.isManual && (
                <span className="px-2 py-1 text-xs rounded font-medium">
                  Manual
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-[var(--raised)] rounded-xl p-3">
                <div className="text-xs mb-1">Valor Actual</div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
              <div className="bg-[var(--raised)] rounded-xl p-3">
                <div className="text-xs mb-1">Valor Calculat</div>
                <div className="text-2xl font-bold">{stat.calculated}</div>
              </div>
              <div className="bg-[var(--raised)] rounded-xl p-3">
                <div className="text-xs mb-1">Valor Manual</div>
                <div className="text-2xl font-bold">
                  {stat.isManual ? stat.fallback : '—'}
                </div>
              </div>
            </div>

            {editingStat === stat.key ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-4 py-2 border border-[var(--line)] rounded-xl focus:ring-2"
                  step="0.1"
                />
                <button
                  onClick={() => saveStat(stat.key)}
                  disabled={saving}
                  type="button"
                  aria-busy={saving}
                  className="ap-btn ap-btn--primary"
                >
                  {saving ? 'Desant...' : 'Desar'}
                </button>
                <button
                  onClick={() => setEditingStat(null)}
                  type="button"
                  className="px-4 py-2 bg-[var(--raised)] rounded-xl font-medium hover:bg-[var(--raised)]"
                >
                  Cancel·lar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(stat)}
                  type="button"
                  className="flex-1 px-4 py-2 bg-[var(--raised)] border border-[var(--line)] rounded-xl font-medium hover:bg-[var(--raised)]"
                >
                  ✏️ Editar Valor Manual
                </button>
                {stat.isManual && (
                  <button
                    onClick={() => resetStat(stat.key)}
                    disabled={saving}
                    type="button"
                    aria-busy={saving}
                    className="px-4 py-2 border rounded-xl font-medium disabled:opacity-50"
                  >
                    🔄 Usar Valor Automàtic
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div id="stats-help" className="ap-card p-4">
        <h3 className="mb-2 text-sm font-semibold">ℹ️ Com funciona</h3>
        <ul className="space-y-1 text-sm">
          <li>• Els <strong>valors automàtics</strong> es calculen des de les reserves completades</li>
          <li>• Pots establir <strong>valors manuals</strong> si vols mostrar números diferents</li>
          <li>• Els valors manuals es prioritzen sobre els calculats</li>
          <li>• Pots restablir a automàtic en qualsevol moment</li>
        </ul>
      </div>
      <ConfirmDialog {...dialogProps} />
    </AdminPage>
  );
}



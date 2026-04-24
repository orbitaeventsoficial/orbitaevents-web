'use client';

import { useState, useEffect } from 'react';
import { log } from '@/lib/logger';
import { AdminEmptyState, AdminPage } from '../components/AdminPage';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

interface Feature {
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    setFetchError(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetchWithCsrf('/api/admin/features', { signal: controller.signal });
      const data = await res.json();
      if (data.ok) {
        setFeatures(data.features);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setFetchError('La connexió ha trigat massa. Reintenta.');
      } else {
        setFetchError('Error carregant funcionalitats.');
        log.error('Error loading features:', error);
      }
    } finally {
      clearTimeout(tid);
      setLoading(false);
    }
  }

  async function toggleFeature(key: string, enabled: boolean) {
    setSaving(key);
    try {
      const res = await fetchWithCsrf('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data?.error || 'Error actualitzant funcionalitat');
      }

      setFeatures((current) => current.map((feature) =>
        feature.key === key ? { ...feature, enabled } : feature
      ));
      toast.success(enabled ? 'Funcionalitat activada' : 'Funcionalitat desactivada');
    } catch (error) {
      log.error('Error toggling feature:', error);
      toast.error(error instanceof Error ? error.message : 'Error actualitzant funcionalitat');
    } finally {
      setSaving(null);
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
      <AdminPage title="Funcionalitats" subtitle="Activa o desactiva funcionalitats del web">
        <AdminEmptyState
          icon="⚠️"
          title={fetchError}
          action={
            <button type="button" onClick={() => { setLoading(true); loadFeatures(); }} className="ap-btn ap-btn--primary">
              Reintentar
            </button>
          }
        />
      </AdminPage>
    );
  }

  const activeCount = features.filter(f => f.enabled).length;
  const inactiveCount = features.length - activeCount;
  const firstDisabled = features.find((feature) => !feature.enabled);
  const firstEnabled = features.find((feature) => feature.enabled);
  const systemItems = [
    `${features.length} funcionalitats governades des d'aquest panell`,
    `${activeCount} actives i ${inactiveCount} desactivades ara mateix`,
    firstEnabled ? `La primera funcionalitat activa visible és ${firstEnabled.label}` : '',
    saving ? `Canvi en curs sobre ${features.find((feature) => feature.key === saving)?.label || saving}` : '',
  ].filter(Boolean);
  const manualItems = [
    inactiveCount > 0 ? `${inactiveCount} ${inactiveCount === 1 ? 'funcionalitat desactivada' : 'funcionalitats desactivades'} demanen criteri de producte` : '',
    firstDisabled ? `La següent peça desactivada és ${firstDisabled.label}` : '',
    saving ? 'Hi ha una mutació en curs; convé esperar abans d’encadenar més canvis' : '',
  ].filter(Boolean);
  const nextStep =
    saving
      ? {
          title: 'Deixar acabar el canvi abans de tocar res més',
          detail: 'Hi ha una funcionalitat canviant d’estat ara mateix. El primer pas és deixar tancar la mutació abans d’engegar una segona decisió de producte.',
          href: '/admin/features',
          ctaLabel: 'Esperar i revisar',
        }
      : firstDisabled
        ? {
            title: `Decidir si ${firstDisabled.label} ha d’entrar ja`,
            detail: `El panell no mostra un incendi tècnic; el següent pas útil és revisar la primera funcionalitat apagada i confirmar si continua sent una decisió vàlida de producte.`,
            href: '/admin/features',
            ctaLabel: 'Revisar funcionalitats',
          }
        : {
            title: 'Mantenir el catàleg estable, no canviar per inèrcia',
            detail: 'Tot el catàleg visible està actiu. Si no hi ha una decisió de negoci clara, el millor següent pas és mantenir estabilitat.',
            href: '/admin',
            ctaLabel: 'Tornar al panell',
          };

  return (
    <AdminPage title="Funcionalitats" subtitle="Activa o desactiva funcionalitats del web">
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: 'Què governa aquest catàleg',
          tone: inactiveCount > 0 ? 'warning' : 'info',
          items: systemItems,
          emptyText: 'Sense senyals rellevants al catàleg de funcionalitats.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'On et cal decidir',
          tone: manualItems.length > 0 ? 'warning' : 'success',
          items: manualItems,
          emptyText: 'Cap decisió manual urgent visible ara mateix.',
        }}
        nextStep={{
          eyebrow: 'Següent pas',
          ...nextStep,
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border admin-card-glass p-4">
          <div className="text-xs font-medium uppercase">Total funcionalitats</div>
          <div className="text-3xl font-bold mt-2">{features.length}</div>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
          <div className="text-xs font-medium uppercase">Actives</div>
          <div className="text-3xl font-bold mt-2">{activeCount}</div>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
              <div className="text-xs font-medium uppercase">Desactivades</div>
          <div className="text-3xl font-bold mt-2">{features.length - activeCount}</div>
        </div>
      </div>

      {/* Features List */}
      <div className="rounded-2xl border admin-card-glass p-6">
        <h2 className="text-lg font-semibold mb-4">Funcionalitats</h2>
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="border rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{feature.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium">{feature.label}</h3>
                  <p className="text-sm mt-0.5">{feature.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFeature(feature.key, !feature.enabled)}
                disabled={saving === feature.key}
                type="button"
                role="switch"
                aria-checked={feature.enabled}
                aria-busy={saving === feature.key}
                className={`admin-feature-toggle relative inline-flex h-9 min-w-[88px] items-center rounded-full border px-2 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                  feature.enabled
                    ? 'border-emerald-400/70 bg-emerald-500/85 text-emerald-950'
                    : 'border-rose-400/70 bg-rose-500/85 text-rose-950'
                } ${saving === feature.key ? 'opacity-60 cursor-wait' : ''}`}
              >
                <span className="pr-2">{feature.enabled ? 'ON' : 'OFF'}</span>
                <div
                  className={`pointer-events-none absolute left-1 top-1 h-7 w-7 rounded-full bg-white transition-transform ${
                    feature.enabled ? 'translate-x-[50px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminPage>
  );
}



'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  FileText,
  Gift,
  MessageCircle,
  SlidersHorizontal,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { log } from '@/lib/logger';
import { AdminEmptyState, AdminPage } from '../components/AdminPage';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

interface Feature {
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

const FEATURE_ICON_MAP: Record<string, LucideIcon> = {
  star: Star,
  calendar: CalendarDays,
  gift: Gift,
  chat: MessageCircle,
  note: FileText,
  controls: SlidersHorizontal,
};

function FeatureIcon({ icon }: { icon: string }) {
  const Icon = FEATURE_ICON_MAP[icon] ?? SlidersHorizontal;
  return (
    <span
      aria-hidden="true"
      data-feature-icon={icon}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--raised)]"
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} />
    </span>
  );
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

  return (
    <AdminPage title="Funcionalitats" subtitle="Activa o desactiva funcionalitats del web">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="ap-card p-4">
          <div className="text-xs font-medium uppercase">Total funcionalitats</div>
          <div className="text-3xl font-bold mt-2">{features.length}</div>
        </div>
        <div className="ap-card p-4">
          <div className="text-xs font-medium uppercase">Actives</div>
          <div className="text-3xl font-bold mt-2">{activeCount}</div>
        </div>
        <div className="ap-card p-4">
              <div className="text-xs font-medium uppercase">Desactivades</div>
          <div className="text-3xl font-bold mt-2">{features.length - activeCount}</div>
        </div>
      </div>

      {/* Features List */}
      <div className="ap-card p-6">
        <h2 className="ap-h2 mb-4">Funcionalitats</h2>
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="border rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-start gap-3 flex-1">
                <FeatureIcon icon={feature.icon} />
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
                className={`admin-feature-toggle relative inline-flex h-9 min-w-[88px] items-center rounded-full border px-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                  feature.enabled
                    ? 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
                    : 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger'
                } ${saving === feature.key ? 'opacity-60 cursor-wait' : ''}`}
              >
                <span className="pr-2">{feature.enabled ? 'ON' : 'OFF'}</span>
                <div
                  className={`pointer-events-none absolute left-1 top-1 h-7 w-7 rounded-full bg-[var(--o-admin-light)] transition-transform ${
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


'use client';

import { useState } from 'react';
import { log } from '@/lib/logger';
import { fetchWithCsrf } from '@/lib/csrf';
import { SITE_CONFIG } from '@/app/config/site-config';

const INPUT_CLASSES = 'ap-input px-3 py-2 text-sm';

export default function EmailConfigPanel() {
  const [config, setConfig] = useState<{ googleReviewUrl: string; postEventDelay: number; enablePostEvent: boolean; enableCanvas: boolean; enableLeadConfirmation: boolean; discountBase: number; discountPhoto: number; discountVideo: number; discountGoogle: number }>({
    googleReviewUrl: SITE_CONFIG.reviews.googleReviewUrl,
    postEventDelay: 1,
    enablePostEvent: true,
    enableCanvas: true,
    enableLeadConfirmation: true,
    discountBase: 5,
    discountPhoto: 5,
    discountVideo: 10,
    discountGoogle: 5,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetchWithCsrf('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailConfig: config }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Error desant la configuració');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      log.info('Configuració de correu desada correctament', { config });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconegut';
      setError(errorMessage);
      log.error('No s’ha pogut desar la configuració de correu', err, {
        context: { config },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border admin-card-glass" data-help-title="Configuració d'emails" data-help-desc="Ajusta la configuració base del sistema: Google Reviews, retard post-event, automatismes actius i percentatges de descompte.">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold">⚙️ Configuració</h2>
      </div>

      <div className="space-y-5 p-6">
        <div>
          <label htmlFor="ec-google-url" className="mb-1 block text-sm font-medium">
            URL Google Reviews
          </label>
          <input
            id="ec-google-url"
            type="text"
            value={config.googleReviewUrl}
            onChange={(e) => setConfig({ ...config, googleReviewUrl: e.target.value })}
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="ec-post-delay" className="mb-1 block text-sm font-medium">
            Dies de retard post-esdeveniment
          </label>
          <select
            id="ec-post-delay"
            value={config.postEventDelay}
            onChange={(e) => setConfig({ ...config, postEventDelay: Number(e.target.value) })}
            className={INPUT_CLASSES}
          >
            <option value={1}>1 dia</option>
            <option value={2}>2 dies</option>
            <option value={3}>3 dies</option>
          </select>
        </div>

        <div className="space-y-3" data-help-title="Automatismes actius" data-help-desc="Activa o desactiva els correus post-event, canvas amb descompte i confirmació d'entrada.">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={config.enablePostEvent}
              onChange={(e) => setConfig({ ...config, enablePostEvent: e.target.checked })}
              className="h-5 w-5 rounded"
            />
            <span className="text-sm">Correu post-esdeveniment automàtic</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={config.enableCanvas}
              onChange={(e) => setConfig({ ...config, enableCanvas: e.target.checked })}
              className="h-5 w-5 rounded"
            />
            <span className="text-sm">Correu de canvas + descompte</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={config.enableLeadConfirmation}
              onChange={(e) => setConfig({ ...config, enableLeadConfirmation: e.target.checked })}
              className="h-5 w-5 rounded"
            />
            <span className="text-sm">Confirmació d’entrada (al client)</span>
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Percentatges de descompte</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between rounded-xl border px-3 py-2">
              <span>Base:</span>
              <span className="font-bold">{config.discountBase}%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-3 py-2">
              <span>+Foto:</span>
              <span className="font-bold">{config.discountPhoto}%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-3 py-2">
              <span>+Video:</span>
              <span className="font-bold">{config.discountVideo}%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-3 py-2">
              <span>+Google:</span>
              <span className="font-bold">{config.discountGoogle}%</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border p-3 admin-tone-soft-danger admin-tone-border-danger" role="alert">
            <p className="text-sm admin-tone-text-danger">❌ {error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          type="button"
          aria-busy={saving}
          className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
            saved
              ? 'border admin-tone-soft-success admin-tone-border-success admin-tone-text-success'
              : saving
                ? 'border border-white/10 bg-white/5 text-white/30'
                : 'ap-btn ap-btn--primary justify-center'
          }`}
        >
          {saved ? '✅ Desat!' : saving ? 'Desant...' : '💾 Desa configuració'}
        </button>
      </div>
    </section>
  );
}

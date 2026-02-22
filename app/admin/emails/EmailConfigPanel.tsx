'use client';

import { useState } from 'react';
import { log } from '@/lib/logger';

export default function EmailConfigPanel() {
  const [config, setConfig] = useState({
    googleReviewUrl: 'https://g.page/r/CXcgbvANsXSzEBI/review',
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
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailConfig: config }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error desant la configuració");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      log.info('Configuració de correu desada correctament', { config });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconegut';
      setError(errorMessage);
      log.error('No s’ha pogut desar la configuració de correu', err, {
        context: { config }
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border backdrop-blur-sm overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="font-semibold">⚙️ Configuració</h2>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <label className="text-sm font-medium block mb-1">
            URL Google Reviews
          </label>
          <input
            type="text"
            value={config.googleReviewUrl}
            onChange={(e) => setConfig({ ...config, googleReviewUrl: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border focus:ring-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Dies de retard post-esdeveniment
          </label>
          <select
            value={config.postEventDelay}
            onChange={(e) => setConfig({ ...config, postEventDelay: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm rounded-xl border focus:ring-1"
          >
            <option value={1}>1 dia</option>
            <option value={2}>2 dies</option>
            <option value={3}>3 dies</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enablePostEvent}
              onChange={(e) => setConfig({ ...config, enablePostEvent: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm">Correu post-esdeveniment automàtic</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableCanvas}
              onChange={(e) => setConfig({ ...config, enableCanvas: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm">Correu de canvas + descompte</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableLeadConfirmation}
              onChange={(e) => setConfig({ ...config, enableLeadConfirmation: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm">Confirmació d’entrada (al client)</span>
          </label>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Percentatges de descompte</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg">
              <span>Base:</span>
              <span className="font-bold">{config.discountBase}%</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg">
              <span>+Foto:</span>
              <span className="font-bold">{config.discountPhoto}%</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg">
              <span>+Video:</span>
              <span className="font-bold">{config.discountVideo}%</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg">
              <span>+Google:</span>
              <span className="font-bold">{config.discountGoogle}%</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border" role="alert">
            <p className="text-sm">❌ {error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          type="button"
          aria-busy={saving}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
            saved
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : saving
              ? 'bg-slate-700/50 text-slate-500 border border-slate-600/50'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500'
          }`}
        >
          {saved ? '✅ Desat!' : saving ? 'Desant...' : '💾 Desa configuració'}
        </button>
      </div>
    </section>
  );
}


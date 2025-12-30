// app/admin/emails/EmailConfigPanel.tsx
'use client';

import { useState } from 'react';

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

  const handleSave = async () => {
    setSaving(true);
    // TODO: Implement save to database
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-semibold text-slate-900">⚙️ Configuracio</h2>
      </div>

      <div className="p-6 space-y-5">
        {/* Google Review URL */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">
            URL Google Reviews
          </label>
          <input
            type="text"
            value={config.googleReviewUrl}
            onChange={(e) => setConfig({ ...config, googleReviewUrl: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Post Event Delay */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">
            Dies delay post-event
          </label>
          <select
            value={config.postEventDelay}
            onChange={(e) => setConfig({ ...config, postEventDelay: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value={1}>1 dia</option>
            <option value={2}>2 dies</option>
            <option value={3}>3 dies</option>
          </select>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enablePostEvent}
              onChange={(e) => setConfig({ ...config, enablePostEvent: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-700">Email post-event automatic</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableCanvas}
              onChange={(e) => setConfig({ ...config, enableCanvas: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-700">Email canvas + descompte</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableLeadConfirmation}
              onChange={(e) => setConfig({ ...config, enableLeadConfirmation: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-700">Confirmacio lead (al client)</span>
          </label>
        </div>

        {/* Discounts */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Percentatges descompte</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded">
              <span>Base:</span>
              <span className="font-bold">{config.discountBase}%</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded">
              <span>+Foto:</span>
              <span className="font-bold">{config.discountPhoto}%</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded">
              <span>+Video:</span>
              <span className="font-bold">{config.discountVideo}%</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded">
              <span>+Google:</span>
              <span className="font-bold">{config.discountGoogle}%</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? 'bg-green-500 text-white'
              : saving
              ? 'bg-slate-200 text-slate-500'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {saved ? '✅ Guardat!' : saving ? 'Guardant...' : '💾 Guardar configuracio'}
        </button>
      </div>
    </section>
  );
}

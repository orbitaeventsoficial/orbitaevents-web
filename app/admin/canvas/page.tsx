// app/admin/canvas/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

const PRESETS = [
  { id: 'email', name: 'Email', width: 600, height: 400 },
  { id: 'instagram', name: 'Instagram Post', width: 1080, height: 1080 },
  { id: 'story', name: 'Story (IG/WA)', width: 1080, height: 1920 },
];

const EVENT_TYPES = [
  { id: 'WEDDING', name: '💍 Casament' },
  { id: 'BIRTHDAY', name: '🎂 Aniversari' },
  { id: 'CORPORATE', name: '🎯 Corporatiu' },
  { id: 'COMMUNION', name: '⛪ Comunió' },
  { id: 'BAPTISM', name: '👶 Bateig' },
  { id: 'event', name: '🎉 Event general' },
];

export default function CanvasGeneratorPage() {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discount: '15',
    eventType: 'event',
    photoUrl: '',
    preset: 'instagram',
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      name: formData.name || 'Client',
      code: formData.code || 'ORBITA15',
      discount: formData.discount,
      event: formData.eventType,
      preset: formData.preset,
    });
    if (formData.photoUrl) {
      params.append('photo', formData.photoUrl);
    }
    return `${baseUrl}/api/canvas/event-photo?${params.toString()}`;
  };

  const handlePreview = () => {
    setPreviewUrl(generateUrl());
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(generateUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const url = generateUrl();
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbita-${formData.name || 'promo'}-${formData.preset}.png`;
    link.click();
  };

  const selectedPreset = PRESETS.find(p => p.id === formData.preset);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">🎨 Generador de Canvas</h1>
        <p className="mt-1">
          Crea imatges promocionals amb foto de l&apos;event i codi de descompte
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="rounded-2xl shadow-sm border border-white/10 p-6">
          <h2 className="text-lg font-semibold mb-6">⚙️ Configuració</h2>

          <div className="space-y-5">
            {/* Nom client */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom del client
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Maria i Joan"
                className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2"
              />
            </div>

            {/* Codi descompte */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Codi de descompte
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="MARIA15-ABC"
                className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2 uppercase"
              />
            </div>

            {/* Percentatge */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Descompte (%)
              </label>
              <div className="flex gap-2">
                {['10', '15', '20', '25'].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setFormData({ ...formData, discount: pct })}
                    className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                      formData.discount === pct
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Tipus event */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipus d&apos;event
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* URL foto */}
            <div>
              <label className="block text-sm font-medium mb-1">
                URL de la foto de l&apos;event (opcional)
              </label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2"
              />
              <p className="text-xs mt-1">
                Deixa buit per usar fons gradient daurat
              </p>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Format de sortida
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setFormData({ ...formData, preset: preset.id })}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.preset === preset.id
                        ? 'border-amber-500 bg-amber-950/30'
                        : 'border-white/10 hover:border-white/10'
                    }`}
                  >
                    <span className="font-medium">{preset.name}</span>
                    <span className="block text-xs mt-0.5">
                      {preset.width}x{preset.height}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={handlePreview}
              className="flex-1 py-3 text-white font-medium rounded-xl transition-colors"
            >
              👁️ Previsualitzar
            </button>
            <button
              onClick={handleCopyUrl}
              className="px-4 py-3 bg-white/5 font-medium rounded-xl hover:bg-white/5 transition-colors"
            >
              {copied ? '✓ Copiat!' : '🔗 URL'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl shadow-sm border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">👁️ Previsualització</h2>
            {selectedPreset && (
              <span className="text-sm">
                {selectedPreset.width}x{selectedPreset.height}px
              </span>
            )}
          </div>

          <div 
            className="bg-white/5 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ 
              minHeight: '400px',
              aspectRatio: selectedPreset ? `${selectedPreset.width}/${selectedPreset.height}` : 'auto',
              maxHeight: '600px',
            }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-8">
                <span className="text-5xl mb-4 block">🖼️</span>
                <p>Clica &quot;Previsualitzar&quot; per veure el resultat</p>
              </div>
            )}
          </div>

          {/* Download button */}
          {previewUrl && (
            <div className="mt-6 space-y-3">
              <button
                onClick={handleDownload}
                className="w-full py-3 text-white font-medium rounded-xl transition-colors"
              >
                ⬇️ Descarregar imatge
              </button>
              
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-xs mb-1">URL directa:</p>
                <code className="text-xs break-all block">
                  {previewUrl.slice(0, 80)}...
                </code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help section */}
      <div className="mt-8 border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">💡 Com usar</h3>
        <ul className="text-sm space-y-2">
          <li>1. Omple les dades del client i el codi de descompte</li>
          <li>2. Afegeix la URL d&apos;una foto de l&apos;event (opcional)</li>
          <li>3. Selecciona el format segons on el vulguis compartir</li>
          <li>4. Descarrega la imatge o copia la URL per enviar per email</li>
        </ul>
      </div>
    </div>
  );
}







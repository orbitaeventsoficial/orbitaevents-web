'use client';

import { useState, useEffect } from 'react';

// Tipus de dades
interface TextItem {
  path: string;
  value: string;
  editable: boolean;
  category: string;
}

interface DbStat {
  key: string;
  value: string | number;
  label: string;
  source: string;
}

// Noms amigables per les categories
const CATEGORY_NAMES: Record<string, string> = {
  common: '🔘 Botons i Navegació',
  hero: '🏠 Pàgina Principal (Hero)',
  services: '🛠️ Serveis',
  guarantee: '✅ Garanties',
  finalCta: '📢 Crida a l\'Acció',
  contact: '📧 Contacte',
  footer: '🦶 Peu de Pàgina',
  testimonials: '💬 Testimonis',
  faq: '❓ FAQ',
  packs: '📦 Packs',
  offerModal: '🎁 Popup Oferta',
  urgency: '⏰ Urgència',
  stats: '📊 Estadístiques',
  reviews: '⭐ Reviews',
  configurator: '⚙️ Configurador',
  checkout: '🛒 Checkout',
};

export default function TextsAdminPage() {
  const [texts, setTexts] = useState<Record<string, TextItem[]>>({});
  const [dbStats, setDbStats] = useState<DbStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'editable' | 'readonly'>('editable');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar dades
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Carregar textos
      const textsRes = await fetch('/api/admin/texts');
      const textsData = await textsRes.json();
      if (textsData.ok) {
        setTexts(textsData.texts);
      }

      // Carregar stats de la BBDD
      const statsRes = await fetch('/api/admin/settings');
      const statsData = await statsRes.json();
      if (statsData.ok && statsData.settings) {
        setDbStats([
          { key: 'totalEvents', value: statsData.settings.totalEvents, label: 'Total Events', source: 'BBDD (auto)' },
          { key: 'avgRating', value: statsData.settings.avgRating, label: 'Valoració Mitjana', source: 'BBDD (auto)' },
          { key: 'totalReviews', value: statsData.settings.totalReviews, label: 'Total Ressenyes', source: 'BBDD (auto)' },
          { key: 'yearsExperience', value: statsData.settings.yearsExperience, label: 'Anys Experiència', source: 'BBDD (editable)' },
          { key: 'peopleDancing', value: statsData.settings.peopleDancing, label: 'Persones Ballant', source: 'BBDD (auto)' },
          { key: 'availableSaturdays', value: statsData.settings.availableSaturdays, label: 'Dissabtes Disponibles', source: 'BBDD (calendari)' },
        ]);
      }
    } catch (error) {
      console.error('Error carregant dades:', error);
      setMessage({ type: 'error', text: 'Error carregant dades' });
    }
    setLoading(false);
  }

  // Guardar canvis
  async function saveChanges() {
    if (Object.keys(changes).length === 0) {
      setMessage({ type: 'error', text: 'No hi ha canvis per guardar' });
      return;
    }

    setSaving(true);
    try {
      const updates = Object.entries(changes).map(([path, value]) => ({ path, value }));
      const res = await fetch('/api/admin/texts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();

      if (data.ok) {
        setMessage({ type: 'success', text: `✅ ${data.updated} textos actualitzats!` });
        setChanges({});
        loadData(); // Recarregar
      } else {
        setMessage({ type: 'error', text: data.error || 'Error guardant' });
      }
    } catch (error) {
      console.error('Error guardant:', error);
      setMessage({ type: 'error', text: 'Error guardant canvis' });
    }
    setSaving(false);
  }

  // Filtrar textos
  function getFilteredTexts(): Record<string, TextItem[]> {
    const filtered: Record<string, TextItem[]> = {};

    for (const [category, items] of Object.entries(texts)) {
      const filteredItems = items.filter(item => {
        // Filtre per editabilitat
        if (filter === 'editable' && !item.editable) return false;
        if (filter === 'readonly' && item.editable) return false;

        // Filtre per cerca
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            item.path.toLowerCase().includes(search) ||
            item.value.toLowerCase().includes(search)
          );
        }
        return true;
      });

      if (filteredItems.length > 0) {
        filtered[category] = filteredItems;
      }
    }

    return filtered;
  }

  // Actualitzar valor local
  function handleChange(path: string, value: string) {
    setChanges(prev => ({ ...prev, [path]: value }));
  }

  // Obtenir valor actual (canviat o original)
  function getCurrentValue(item: TextItem): string {
    return changes[item.path] ?? item.value;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const filteredTexts = getFilteredTexts();
  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📝 Textos de la Web</h1>
          <p className="text-slate-500 mt-1">
            Edita els textos en espanyol. Les traduccions es generen automàticament.
          </p>
        </div>

        {hasChanges && (
          <button
            onClick={saveChanges}
            disabled={saving}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Guardant...
              </>
            ) : (
              <>
                💾 Guardar {Object.keys(changes).length} canvis
              </>
            )}
          </button>
        )}
      </div>

      {/* Missatge */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats de la BBDD */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          📊 Dades Automàtiques (BBDD)
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Aquestes dades es calculen automàticament. NO les pots editar aquí.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {dbStats.map(stat => (
            <div
              key={stat.key}
              className="bg-white p-4 rounded-lg border border-slate-200"
            >
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.source}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('editable')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'editable'
                ? 'bg-green-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ✅ Editables
          </button>
          <button
            onClick={() => setFilter('readonly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'readonly'
                ? 'bg-slate-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔒 Només Lectura
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 Tots
          </button>
        </div>

        <input
          type="text"
          placeholder="Cerca textos..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>

      {/* Llegenda */}
      <div className="flex gap-6 text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          Editable (pots canviar)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-slate-300 rounded-full"></span>
          Bloquejat (només lectura)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
          Modificat (pendent de guardar)
        </div>
      </div>

      {/* Llista de textos per categoria */}
      <div className="space-y-6">
        {Object.entries(filteredTexts).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">
                {CATEGORY_NAMES[category] || category}
              </h3>
              <span className="text-sm text-slate-500">
                {items.filter(i => i.editable).length} editables / {items.length} total
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map(item => {
                const isChanged = changes[item.path] !== undefined;
                const currentValue = getCurrentValue(item);

                return (
                  <div
                    key={item.path}
                    className={`p-4 ${
                      !item.editable ? 'bg-slate-50/50' : ''
                    } ${isChanged ? 'bg-orange-50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Indicador d'estat */}
                      <div
                        className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          isChanged
                            ? 'bg-orange-500'
                            : item.editable
                            ? 'bg-green-500'
                            : 'bg-slate-300'
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        {/* Path */}
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {item.path}
                          </code>
                          {!item.editable && (
                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                              🔒 Bloquejat
                            </span>
                          )}
                          {isChanged && (
                            <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded">
                              ✏️ Modificat
                            </span>
                          )}
                        </div>

                        {/* Input o text */}
                        {item.editable ? (
                          <textarea
                            value={currentValue}
                            onChange={e => handleChange(item.path, e.target.value)}
                            rows={currentValue.length > 100 ? 3 : 1}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-slate-100 rounded-lg text-slate-600 text-sm">
                            {item.value}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Botó guardar flotant si hi ha canvis */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="px-8 py-4 bg-orange-500 text-white rounded-full font-bold shadow-lg hover:bg-orange-600 disabled:opacity-50 transition-all hover:scale-105"
          >
            {saving ? '⏳ Guardant...' : `💾 Guardar ${Object.keys(changes).length} canvis`}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';
import { log } from '@/lib/logger';

import { useState, useEffect, useMemo, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface TextNode {
  path: string;
  value: string;
  originalValue: string;
  section: string;
  subsection: string;
  isModified: boolean;
  isNew: boolean;
  characterCount: number;
  locale: 'es' | 'ca';
}

interface Section {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  paths: string[];
}

interface TranslationComparison {
  path: string;
  es: string;
  ca: string;
  hasTranslation: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE SECCIONES
// ═══════════════════════════════════════════════════════════════════════════

const SECTIONS: Section[] = [
  {
    id: 'hero',
    name: 'Hero Principal',
    icon: '🏠',
    description: 'Títulos, subtítulos y badges del hero',
    color: 'from-purple-500 to-pink-500',
    paths: ['hero.']
  },
  {
    id: 'nav',
    name: 'Navegación & Header',
    icon: '📱',
    description: 'Menú, navegación, selector de idioma',
    color: 'from-blue-500 to-cyan-500',
    paths: ['common.nav.', 'common.buttons.', 'common.breadcrumbs.']
  },
  {
    id: 'services',
    name: 'Servicios',
    icon: '🎯',
    description: 'Bodas, fiestas, corporativo, discomóvil',
    color: 'from-green-500 to-emerald-500',
    paths: ['services.', 'weddings.', 'parties.', 'fiestas.', 'corporativo.', 'discomovil.']
  },
  {
    id: 'packs',
    name: 'Packs & Precios',
    icon: '📦',
    description: 'Descripciones de packs, features, precios',
    color: 'from-orange-500 to-amber-500',
    paths: ['packs.', 'pricing.', 'configurator.']
  },
  {
    id: 'cta',
    name: 'CTAs & Garantías',
    icon: '✅',
    description: 'Llamadas a la acción, garantías, urgencia',
    color: 'from-red-500 to-rose-500',
    paths: ['guarantee.', 'finalCta.', 'cta.', 'urgency.', 'offerModal.']
  },
  {
    id: 'testimonials',
    name: 'Testimonios',
    icon: '💬',
    description: 'Reviews, opiniones, social proof',
    color: 'from-yellow-500 to-orange-500',
    paths: ['testimonials.', 'reviews.', 'opiniones.']
  },
  {
    id: 'faq',
    name: 'FAQ',
    icon: '❓',
    description: 'Preguntas frecuentes',
    color: 'from-indigo-500 to-purple-500',
    paths: ['faq.']
  },
  {
    id: 'contact',
    name: 'Contacto',
    icon: '📧',
    description: 'Formularios, validaciones, mensajes',
    color: 'from-teal-500 to-green-500',
    paths: ['contact.', 'common.validation.']
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: '🦶',
    description: 'Pie de página, enlaces legales',
    color: 'from-slate-500 to-zinc-500',
    paths: ['footer.', 'legal.']
  },
  {
    id: 'themes',
    name: 'Páginas Temáticas',
    icon: '🎃',
    description: 'Halloween, Món Màgic, temáticas especiales',
    color: 'from-purple-600 to-orange-500',
    paths: ['halloweenPage.', 'monMagic.', 'magicWorld.', 'sensorial.']
  },
  {
    id: 'meta',
    name: 'SEO & Meta',
    icon: '🔍',
    description: 'Títulos SEO, descripciones, OG tags',
    color: 'from-cyan-500 to-blue-500',
    paths: ['meta.', 'seo.']
  },
  {
    id: 'admin',
    name: 'Panel Admin',
    icon: '⚙️',
    description: 'Dashboard, bookings, leads, CRM',
    color: 'from-gray-600 to-gray-800',
    paths: ['admin.']
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '📸',
    description: 'Galería, eventos, proyectos',
    color: 'from-pink-500 to-rose-500',
    paths: ['portfolio.', 'gallery.']
  },
  {
    id: 'privacy',
    name: 'Privacidad & GDPR',
    icon: '🔒',
    description: 'RGPD, derechos, cookies',
    color: 'from-emerald-600 to-teal-600',
    paths: ['privacy.', 'gdpr.', 'cookies.', 'privacitat.']
  },
  {
    id: 'resources',
    name: 'Recursos',
    icon: '📁',
    description: 'Descargas, catálogos, PDFs',
    color: 'from-violet-500 to-purple-500',
    paths: ['resources.']
  },
  {
    id: 'common',
    name: 'Común & Sistema',
    icon: '🔧',
    description: 'Meses, errores, loader, genéricos',
    color: 'from-stone-500 to-neutral-600',
    paths: ['common.', 'loader.', 'error.']
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function TextManagerPage() {
  // Estados principales
  const [esTexts, setEsTexts] = useState<Record<string, string>>({});
  const [caTexts, setCaTexts] = useState<Record<string, string>>({});
  const [originalEsTexts, setOriginalEsTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados de UI
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'sections' | 'all' | 'search'>('sections');

  // Historial de cambios
  const [changeHistory, setChangeHistory] = useState<Array<{
    path: string;
    oldValue: string;
    newValue: string;
    timestamp: Date;
  }>>([]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGAR DATOS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadTexts();
  }, []);

  async function loadTexts() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/text-manager');
      const data = await response.json();
      
      if (data.ok) {
        setEsTexts(data.es);
        setCaTexts(data.ca);
        setOriginalEsTexts(data.es);
      } else {
        setError(data.error || 'Error cargando textos');
      }
    } catch (err) {
      setError('Error de conexión');
      log.error('Text manager error', err);
    }
    setLoading(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONES DE MODIFICACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  const handleTextChange = useCallback((path: string, value: string) => {
    setEsTexts(prev => {
      const newTexts = { ...prev, [path]: value };
      
      // Registrar en historial
      if (prev[path] !== value) {
        setChangeHistory(h => [...h, {
          path,
          oldValue: prev[path] || '',
          newValue: value,
          timestamp: new Date()
        }]);
      }
      
      return newTexts;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Encontrar solo los textos modificados
      const modifications: Record<string, string> = {};
      Object.entries(esTexts).forEach(([path, value]) => {
        if (value !== originalEsTexts[path]) {
          modifications[path] = value;
        }
      });

      if (Object.keys(modifications).length === 0) {
        setError('No hay cambios para guardar');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/admin/text-manager', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications, locale: 'es' })
      });

      const data = await response.json();

      if (data.ok) {
        setSuccess(`✅ ${data.updated} textos guardados correctamente`);
        setOriginalEsTexts({ ...esTexts });
        setChangeHistory([]);
      } else {
        setError(data.error || 'Error guardando');
      }
    } catch (err) {
      setError('Error de conexión al guardar');
      log.error('Text manager save error', err);
    }

    setSaving(false);
  };

  const handleRevert = (path: string) => {
    setEsTexts(prev => ({
      ...prev,
      [path]: originalEsTexts[path]
    }));
  };

  const handleRevertAll = () => {
    if (confirm('¿Revertir TODOS los cambios?')) {
      setEsTexts({ ...originalEsTexts });
      setChangeHistory([]);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁLCULOS Y FILTROS
  // ═══════════════════════════════════════════════════════════════════════════

  const getSection = useCallback((path: string): string => {
    for (const section of SECTIONS) {
      if (section.paths.some(p => path.startsWith(p) || path.split('.')[0] + '.' === p)) {
        return section.id;
      }
    }
    return 'common';
  }, []);

  const modifiedCount = useMemo(() => {
    return Object.entries(esTexts).filter(
      ([path, value]) => value !== originalEsTexts[path]
    ).length;
  }, [esTexts, originalEsTexts]);

  const filteredTexts = useMemo(() => {
    let texts = Object.entries(esTexts);

    // Filtrar por sección
    if (activeSection) {
      texts = texts.filter(([path]) => getSection(path) === activeSection);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      texts = texts.filter(([path, value]) =>
        path.toLowerCase().includes(term) ||
        value.toLowerCase().includes(term)
      );
    }

    // Filtrar solo modificados
    if (showOnlyModified) {
      texts = texts.filter(([path, value]) => value !== originalEsTexts[path]);
    }

    // Ordenar por path
    texts.sort((a, b) => a[0].localeCompare(b[0]));

    return texts;
  }, [esTexts, originalEsTexts, activeSection, searchTerm, showOnlyModified, getSection]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, { total: number; modified: number }> = {};
    
    SECTIONS.forEach(section => {
      counts[section.id] = { total: 0, modified: 0 };
    });

    Object.entries(esTexts).forEach(([path, value]) => {
      const sectionId = getSection(path);
      if (counts[sectionId]) {
        counts[sectionId].total++;
        if (value !== originalEsTexts[path]) {
          counts[sectionId].modified++;
        }
      }
    });

    return counts;
  }, [esTexts, originalEsTexts, getSection]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 text-lg">Cargando textos...</p>
          <p className="text-sm text-slate-400">Analizando estructura del JSON</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER FIJO */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-stone-50 border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Título */}
            <div>
              <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                📝 Text Manager PRO
              </h1>
              <p className="text-sm text-slate-500">
                {Object.keys(esTexts).length} textos · {modifiedCount} modificados
              </p>
            </div>

            {/* Buscador */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar textos... (path o contenido)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3">
              {/* Toggle modificados */}
              <button
                onClick={() => setShowOnlyModified(!showOnlyModified)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showOnlyModified
                    ? 'bg-orange-500 text-white'
                    : 'bg-stone-100 text-slate-600 hover:bg-stone-100'
                }`}
              >
                {showOnlyModified ? '✅ Solo modificados' : '📋 Mostrar todos'}
              </button>

              {/* Comparar idiomas */}
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showComparison
                    ? 'bg-blue-500 text-white'
                    : 'bg-stone-100 text-slate-600 hover:bg-stone-100'
                }`}
              >
                🌐 ES/CA
              </button>

              {/* Revertir todo */}
              {modifiedCount > 0 && (
                <button
                  onClick={handleRevertAll}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                >
                  ↩️ Revertir ({modifiedCount})
                </button>
              )}

              {/* Guardar */}
              <button
                onClick={handleSave}
                disabled={saving || modifiedCount === 0}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  modifiedCount > 0
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-stone-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Guardando...
                  </>
                ) : (
                  <>
                    💾 Guardar {modifiedCount > 0 && `(${modifiedCount})`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MENSAJES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(error || success) && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
              <span>❌ {error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center justify-between">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">✕</button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SIDEBAR - SECCIONES */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <aside className="w-72 flex-shrink-0">
            <div className="sticky top-28 space-y-2">
              {/* Mostrar todo */}
              <button
                onClick={() => setActiveSection(null)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  !activeSection
                    ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 shadow-lg'
                    : 'bg-stone-50 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">📁 Todas las secciones</span>
                  <span className="text-xs opacity-70">
                    {Object.keys(esTexts).length}
                  </span>
                </div>
              </button>

              {/* Secciones */}
              {SECTIONS.map(section => {
                const counts = sectionCounts[section.id] || { total: 0, modified: 0 };
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                        : 'bg-stone-50 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {section.icon} {section.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {counts.modified > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-stone-50/20' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {counts.modified}
                          </span>
                        )}
                        <span className={`text-xs ${isActive ? 'opacity-70' : 'text-slate-400'}`}>
                          {counts.total}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs mt-1 ${isActive ? 'opacity-70' : 'text-slate-400'}`}>
                      {section.description}
                    </p>
                  </button>
                );
              })}

              {/* Historial */}
              {changeHistory.length > 0 && (
                <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    📜 Historial ({changeHistory.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {changeHistory.slice(-10).reverse().map((change, i) => (
                      <div key={i} className="text-xs p-2 bg-slate-50 rounded-lg">
                        <code className="text-orange-600 break-all">
                          {change.path.split('.').slice(-2).join('.')}
                        </code>
                        <div className="text-slate-400 mt-1">
                          {change.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CONTENIDO PRINCIPAL */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <main className="flex-1 min-w-0">
            {/* Info de sección activa */}
            {activeSection && (
              <div className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${
                SECTIONS.find(s => s.id === activeSection)?.color || 'from-slate-500 to-slate-600'
              } text-slate-700`}>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {SECTIONS.find(s => s.id === activeSection)?.icon}
                  {SECTIONS.find(s => s.id === activeSection)?.name}
                </h2>
                <p className="opacity-80 mt-1">
                  {SECTIONS.find(s => s.id === activeSection)?.description}
                </p>
                <div className="mt-2 text-sm opacity-70">
                  {sectionCounts[activeSection]?.total} textos
                  {sectionCounts[activeSection]?.modified > 0 && (
                    <> · <strong>{sectionCounts[activeSection].modified} modificados</strong></>
                  )}
                </div>
              </div>
            )}

            {/* Lista de textos */}
            <div className="space-y-3">
              {filteredTexts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">🔍</div>
                  <p>No se encontraron textos</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-orange-500 hover:underline"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              ) : (
                filteredTexts.map(([path, value]) => {
                  const isModified = value !== originalEsTexts[path];
                  const caValue = caTexts[path];
                  
                  return (
                    <div
                      key={path}
                      className={`bg-stone-50 rounded-xl border transition-all ${
                        isModified
                          ? 'border-orange-300 shadow-md shadow-orange-100'
                          : 'border-stone-200 hover:border-stone-200'
                      }`}
                    >
                      <div className="p-4">
                        {/* Header del texto */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <code className="text-sm text-slate-500 break-all font-mono bg-stone-100 px-2 py-1 rounded">
                              {path}
                            </code>
                            {isModified && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                ✏️ Modificado
                              </span>
                            )}
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex items-center gap-2">
                            {isModified && (
                              <button
                                onClick={() => handleRevert(path)}
                                className="text-xs px-3 py-1 rounded-lg bg-stone-100 text-slate-600 hover:bg-stone-100 transition-colors"
                                title="Revertir cambios"
                              >
                                ↩️ Revertir
                              </button>
                            )}
                            <span className="text-xs text-slate-400">
                              {value.length} chars
                            </span>
                          </div>
                        </div>

                        {/* Editor de texto */}
                        <textarea
                          value={value}
                          onChange={(e) => handleTextChange(path, e.target.value)}
                          rows={value.length > 100 ? 3 : value.length > 50 ? 2 : 1}
                          className={`w-full px-4 py-3 rounded-lg border transition-all resize-none font-sans ${
                            isModified
                              ? 'border-orange-300 bg-orange-50/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                              : 'border-stone-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          }`}
                          placeholder="Texto vacío..."
                        />

                        {/* Comparación ES/CA */}
                        {showComparison && caValue && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                              <span className="font-semibold">🇪🇸 Català:</span>
                            </div>
                            <p className="text-sm text-blue-800">{caValue}</p>
                          </div>
                        )}

                        {/* Valor original si modificado */}
                        {isModified && (
                          <div className="mt-2 p-2 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-100">
                            <span className="font-medium">Original:</span>{' '}
                            <span className="italic">{originalEsTexts[path]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BOTÓN FLOTANTE DE GUARDAR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {modifiedCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Guardando...
              </>
            ) : (
              <>
                💾 Guardar {modifiedCount} cambios
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

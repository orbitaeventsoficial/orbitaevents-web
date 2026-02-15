'use client';
import { log } from '@/lib/logger';

import { useState, useEffect, useMemo, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
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
// CONFIGURACIÓ DE SECCIONS
// ═══════════════════════════════════════════════════════════════════════════

const SECTIONS: Section[] = [
  {
    id: 'hero',
    name: 'Hero Principal',
    icon: '🏠',
    description: 'Títols, subtítols i badges del hero',
    color: 'from-purple-500 to-pink-500',
    paths: ['hero.']
  },
  {
    id: 'nav',
    name: 'Navegació i capçalera',
    icon: '📱',
    description: 'Menú, navegació i selector d\'idioma',
    color: 'from-blue-500 to-cyan-500',
    paths: ['common.nav.', 'common.buttons.', 'common.breadcrumbs.']
  },
  {
    id: 'services',
    name: 'Serveis',
    icon: '🎯',
    description: 'Bodas, fiestas, corporativo, discomóvil',
    color: 'from-green-500 to-emerald-500',
    paths: ['services.', 'weddings.', 'parties.', 'fiestas.', 'corporativo.', 'discomovil.']
  },
  {
    id: 'packs',
    name: 'Packs i preus',
    icon: '📦',
    description: 'Descripciones de packs, features, precios',
    color: 'from-orange-500 to-amber-500',
    paths: ['packs.', 'pricing.', 'configurator.']
  },
  {
    id: 'cta',
    name: 'CTAs & Garantías',
    icon: '✅',
    description: 'Crides a l\'acció, garanties i urgència',
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
    name: 'Pàgines temàtiques',
    icon: '🎃',
    description: 'Halloween, Món Màgic, temáticas especiales',
    color: 'from-purple-600 to-orange-500',
    paths: ['halloweenPage.', 'monMagic.', 'magicWorld.', 'sensorial.']
  },
  {
    id: 'meta',
    name: 'SEO & Meta',
    icon: '🔍',
    description: 'Títols SEO, descripcions i etiquetes OG',
    color: 'from-cyan-500 to-blue-500',
    paths: ['meta.', 'seo.']
  },
  {
    id: 'admin',
    name: 'Panell admin',
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
    name: 'Comú i sistema',
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
  // Estats principals
  const [esTexts, setEsTexts] = useState<Record<string, string>>({});
  const [caTexts, setCaTexts] = useState<Record<string, string>>({});
  const [enTexts, setEnTexts] = useState<Record<string, string>>({});
  const [originalEsTexts, setOriginalEsTexts] = useState<Record<string, string>>({});
  const [originalCaTexts, setOriginalCaTexts] = useState<Record<string, string>>({});
  const [originalEnTexts, setOriginalEnTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estats de UI
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'sections' | 'all' | 'search'>('sections');
  const [activeLanguage, setActiveLanguage] = useState<'es' | 'ca' | 'en'>('es');

  // Historial de canvis
  const [changeHistory, setChangeHistory] = useState<Array<{
    path: string;
    oldValue: string;
    newValue: string;
    timestamp: Date;
  }>>([]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CARREGAR DADES
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
        setEnTexts(data.en || {});
        setOriginalEsTexts(data.es);
        setOriginalCaTexts(data.ca);
        setOriginalEnTexts(data.en || {});
      } else {
        setError(data.error || 'Error carregant textos');
      }
    } catch (err) {
      setError('Error de connexió');
      log.error('Text manager error', err);
    }
    setLoading(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONS DE MODIFICACIÓ
  // ═══════════════════════════════════════════════════════════════════════════

  const handleTextChange = useCallback((path: string, value: string, locale?: 'es' | 'ca' | 'en') => {
    const targetLocale = locale || activeLanguage;

    if (targetLocale === 'es') {
      setEsTexts(prev => {
        const newTexts = { ...prev, [path]: value };
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
    } else if (targetLocale === 'ca') {
      setCaTexts(prev => ({ ...prev, [path]: value }));
    } else if (targetLocale === 'en') {
      setEnTexts(prev => ({ ...prev, [path]: value }));
    }
  }, [activeLanguage]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Encontrar textos modificats (solo en el idioma activo)
      const modifications: Record<string, string> = {};

      if (activeLanguage === 'es') {
        Object.entries(esTexts).forEach(([path, value]) => {
          if (value !== originalEsTexts[path]) {
            modifications[path] = value;
          }
        });
      } else if (activeLanguage === 'ca') {
        Object.entries(caTexts).forEach(([path, value]) => {
          if (value !== originalCaTexts[path]) {
            modifications[path] = value;
          }
        });
      } else if (activeLanguage === 'en') {
        Object.entries(enTexts).forEach(([path, value]) => {
          if (value !== originalEnTexts[path]) {
            modifications[path] = value;
          }
        });
      }

      if (Object.keys(modifications).length === 0) {
        setError('No hi ha canvis per desar');
        setSaving(false);
        return;
      }

      // TRADUCCIÓN AUTOMÁTICA
      // Para cada texto modificado, traducir a los otros 2 idiomas
      const allModifications: Record<string, Record<string, string>> = {
        es: {},
        ca: {},
        en: {}
      };

      setSuccess('🔄 Traduciendo automáticamente...');

      for (const [path, text] of Object.entries(modifications)) {
        // Traducir el texto a los 3 idiomas
        const translateResponse = await fetch('/api/admin/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLanguages: ['es', 'ca', 'en'] })
        });

        const translateData = await translateResponse.json();

        if (translateData.ok && translateData.translations) {
          allModifications.es[path] = translateData.translations.es;
          allModifications.ca[path] = translateData.translations.ca;
          allModifications.en[path] = translateData.translations.en;
        } else {
          // Si falla la traducción, usar el texto original para todos
          allModifications.es[path] = text;
          allModifications.ca[path] = text;
          allModifications.en[path] = text;
        }
      }

      // Desar los 3 idiomas en paralelo
      const savePromises = [
        fetch('/api/admin/text-manager', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modifications: allModifications.es, locale: 'es' })
        }),
        fetch('/api/admin/text-manager', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modifications: allModifications.ca, locale: 'ca' })
        }),
        fetch('/api/admin/text-manager', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modifications: allModifications.en, locale: 'en' })
        })
      ];

      const responses = await Promise.all(savePromises);
      const results = await Promise.all(responses.map(r => r.json()));

      const allOk = results.every(r => r.ok);

      if (allOk) {
        // Actualizar los estados con las traducciones
        setEsTexts(prev => ({ ...prev, ...allModifications.es }));
        setCaTexts(prev => ({ ...prev, ...allModifications.ca }));
        setEnTexts(prev => ({ ...prev, ...allModifications.en }));

        setOriginalEsTexts(prev => ({ ...prev, ...allModifications.es }));
        setOriginalCaTexts(prev => ({ ...prev, ...allModifications.ca }));
        setOriginalEnTexts(prev => ({ ...prev, ...allModifications.en }));

        setSuccess(`✅ ${Object.keys(modifications).length} textos guardados y traducidos automáticamente a ES, CA y EN`);
        setChangeHistory([]);
      } else {
        setError('Error desant alguns idiomes');
      }
    } catch (err) {
      setError('Error de connexió en desar');
      log.error('Text manager save error', err);
    }

    setSaving(false);
  };

  const handleRevert = (path: string) => {
    if (activeLanguage === 'es') {
      setEsTexts(prev => ({ ...prev, [path]: originalEsTexts[path] }));
    } else if (activeLanguage === 'ca') {
      setCaTexts(prev => ({ ...prev, [path]: originalCaTexts[path] }));
    } else if (activeLanguage === 'en') {
      setEnTexts(prev => ({ ...prev, [path]: originalEnTexts[path] }));
    }
  };

  const handleRevertAll = () => {
    if (confirm('Vols revertir TOTS els canvis d\'aquest idioma?')) {
      if (activeLanguage === 'es') {
        setEsTexts({ ...originalEsTexts });
      } else if (activeLanguage === 'ca') {
        setCaTexts({ ...originalCaTexts });
      } else if (activeLanguage === 'en') {
        setEnTexts({ ...originalEnTexts });
      }
      setChangeHistory([]);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CÀLCULS I FILTRES
  // ═══════════════════════════════════════════════════════════════════════════

  const getSection = useCallback((path: string): string => {
    for (const section of SECTIONS) {
      if (section.paths.some(p => path.startsWith(p) || path.split('.')[0] + '.' === p)) {
        return section.id;
      }
    }
    return 'common';
  }, []);

  const currentTexts = useMemo(() => {
    if (activeLanguage === 'es') return esTexts;
    if (activeLanguage === 'ca') return caTexts;
    return enTexts;
  }, [activeLanguage, esTexts, caTexts, enTexts]);

  const originalTexts = useMemo(() => {
    if (activeLanguage === 'es') return originalEsTexts;
    if (activeLanguage === 'ca') return originalCaTexts;
    return originalEnTexts;
  }, [activeLanguage, originalEsTexts, originalCaTexts, originalEnTexts]);

  const modifiedCount = useMemo(() => {
    return Object.entries(currentTexts).filter(
      ([path, value]) => value !== originalTexts[path]
    ).length;
  }, [currentTexts, originalTexts]);

  const filteredTexts = useMemo(() => {
    let texts = Object.entries(currentTexts);

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

    // Filtrar solo modificats
    if (showOnlyModified) {
      texts = texts.filter(([path, value]) => value !== originalTexts[path]);
    }

    // Ordenar por path
    texts.sort((a, b) => a[0].localeCompare(b[0]));

    return texts;
  }, [currentTexts, originalTexts, activeSection, searchTerm, showOnlyModified, getSection]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, { total: number; modified: number }> = {};

    SECTIONS.forEach(section => {
      counts[section.id] = { total: 0, modified: 0 };
    });

    Object.entries(currentTexts).forEach(([path, value]) => {
      const sectionId = getSection(path);
      if (counts[sectionId]) {
        counts[sectionId].total++;
        if (value !== originalTexts[path]) {
          counts[sectionId].modified++;
        }
      }
    });

    return counts;
  }, [currentTexts, originalTexts, getSection]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-300 text-lg">Carregant textos...</p>
          <p className="text-sm text-slate-400">Analizando estructura del JSON</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER FIJO */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-slate-900/95 border-b border-slate-700/60 shadow-sm backdrop-blur">
        {/* TABS DE IDIOMA */}
        <div className="bg-gradient-to-r from-orange-50 to-rose-50 border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-300">🌐 Idioma MASTER (es tradueix automàticament):</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveLanguage('es')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      activeLanguage === 'es'
                        ? 'bg-orange-500 text-white shadow-lg scale-105'
                        : 'bg-slate-900/70 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    🇪🇸 Español
                  </button>
                  <button
                    onClick={() => setActiveLanguage('ca')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      activeLanguage === 'ca'
                        ? 'bg-orange-500 text-white shadow-lg scale-105'
                        : 'bg-slate-900/70 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    🏴 Català
                  </button>
                  <button
                    onClick={() => setActiveLanguage('en')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      activeLanguage === 'en'
                        ? 'bg-orange-500 text-white shadow-lg scale-105'
                        : 'bg-slate-900/70 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>
              <div className="text-xs text-slate-400 bg-slate-900/70 px-3 py-1.5 rounded-lg border border-orange-200">
                💡 Escriu en qualsevol idioma i es tradueix automàticament als 3
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Títol */}
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                📝 Text Manager PRO
              </h1>
              <p className="text-sm text-slate-400">
                {Object.keys(currentTexts).length} textos · {modifiedCount} modificats
              </p>
            </div>

            {/* Buscador */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cercar textos... (path o contenido)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-700/60 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3">
              {/* Toggle modificats */}
              <button
                onClick={() => setShowOnlyModified(!showOnlyModified)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showOnlyModified
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {showOnlyModified ? '✅ Solo modificats' : '📋 Mostrar todos'}
              </button>

              {/* Comparar idiomes */}
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showComparison
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🌐 ES/CA
              </button>

              {/* Revertir tot */}
              {modifiedCount > 0 && (
                <button
                  onClick={handleRevertAll}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/20 transition-all"
                >
                  ↩️ Revertir ({modifiedCount})
                </button>
              )}

              {/* Desar */}
              <button
                onClick={handleSave}
                disabled={saving || modifiedCount === 0}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  modifiedCount > 0
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Desant...
                  </>
                ) : (
                  <>
                    💾 Desar {modifiedCount > 0 && `(${modifiedCount})`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MISSATGES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(error || success) && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          {error && (
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-300 flex items-center justify-between" role="alert">
              <span>❌ {error}</span>
              <button
                onClick={() => setError(null)}
                type="button"
                aria-label="Tancar error"
                className="text-rose-300 hover:text-rose-200"
              >
                ✕
              </button>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 flex items-center justify-between" role="status" aria-live="polite">
              <span>{success}</span>
              <button
                onClick={() => setSuccess(null)}
                type="button"
                aria-label="Tancar confirmacio"
                className="text-emerald-300 hover:text-emerald-200"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SIDEBAR - SECCIONS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <aside className="w-72 flex-shrink-0">
            <div className="sticky top-28 space-y-2">
              {/* Mostrar tot */}
              <button
                onClick={() => setActiveSection(null)}
                type="button"
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  !activeSection
                    ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-100 shadow-lg'
                    : 'bg-slate-900/70 hover:bg-slate-900/60 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">📁 Totes les seccions</span>
                  <span className="text-xs opacity-70">
                    {Object.keys(esTexts).length}
                  </span>
                </div>
              </button>

              {/* Seccions */}
              {SECTIONS.map(section => {
                const counts = sectionCounts[section.id] || { total: 0, modified: 0 };
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    type="button"
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                        : 'bg-slate-900/70 hover:bg-slate-900/60 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {section.icon} {section.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {counts.modified > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20' : 'bg-orange-500/20 text-orange-300'
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
                <div className="mt-6 p-4 bg-slate-900/70 rounded-xl border border-slate-700/60">
                  <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    📜 Historial ({changeHistory.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {changeHistory.slice(-10).reverse().map((change, i) => (
                      <div key={i} className="text-xs p-2 bg-slate-900/60 rounded-lg">
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
          {/* CONTINGUT PRINCIPAL */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <main className="flex-1 min-w-0">
            {/* Info de secció activa */}
            {activeSection && (
              <div className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${
                SECTIONS.find(s => s.id === activeSection)?.color || 'from-slate-500 to-slate-600'
              } text-slate-100`}>
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
                    <> · <strong>{sectionCounts[activeSection].modified} modificats</strong></>
                  )}
                </div>
              </div>
            )}

            {/* Llista de textos */}
            <div className="space-y-3">
              {filteredTexts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">🔍</div>
                  <p>No s\'han trobat textos</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-orange-500 hover:underline"
                    >
                      Netejar cerca
                    </button>
                  )}
                </div>
              ) : (
                filteredTexts.map(([path, value]) => {
                  const isModified = value !== originalTexts[path];
                  const otherLangValues = {
                    es: esTexts[path],
                    ca: caTexts[path],
                    en: enTexts[path]
                  };
                  
                  return (
                    <div
                      key={path}
                      className={`bg-slate-900/70 rounded-xl border transition-all ${
                        isModified
                          ? 'border-orange-300 shadow-md shadow-orange-100'
                          : 'border-slate-700/60 hover:border-slate-700/60'
                      }`}
                    >
                      <div className="p-4">
                        {/* Capçalera del text */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <code className="text-sm text-slate-400 break-all font-mono bg-slate-800 px-2 py-1 rounded">
                              {path}
                            </code>
                            {isModified && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                ✏️ Modificat
                              </span>
                            )}
                          </div>
                          
                          {/* Accions */}
                          <div className="flex items-center gap-2">
                            {isModified && (
                              <button
                                onClick={() => handleRevert(path)}
                                className="text-xs px-3 py-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                                title="Revertir canvis"
                              >
                                ↩️ Revertir
                              </button>
                            )}
                            <span className="text-xs text-slate-400">
                              {value.length} caràcters
                            </span>
                          </div>
                        </div>

                        {/* Editor de text */}
                        <textarea
                          value={value}
                          onChange={(e) => handleTextChange(path, e.target.value)}
                          rows={value.length > 100 ? 3 : value.length > 50 ? 2 : 1}
                          className={`w-full px-4 py-3 rounded-lg border transition-all resize-none font-sans ${
                            isModified
                              ? 'border-orange-500/40 bg-orange-500/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                              : 'border-slate-700/60 bg-slate-900/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          }`}
                          placeholder="Text buit..."
                        />

                        {/* Comparació amb altres idiomes */}
                        {showComparison && (
                          <div className="mt-3 space-y-2">
                            {activeLanguage !== 'es' && otherLangValues.es && (
                              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10">
                                <div className="flex items-center gap-2 text-xs text-rose-300 mb-1">
                                  <span className="font-semibold">🇪🇸 Espanyol:</span>
                                </div>
                                <p className="text-sm text-rose-200">{otherLangValues.es}</p>
                              </div>
                            )}
                            {activeLanguage !== 'ca' && otherLangValues.ca && (
                              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                                <div className="flex items-center gap-2 text-xs text-blue-300 mb-1">
                                  <span className="font-semibold">🏴 Català:</span>
                                </div>
                                <p className="text-sm text-blue-200">{otherLangValues.ca}</p>
                              </div>
                            )}
                            {activeLanguage !== 'en' && otherLangValues.en && (
                              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                                <div className="flex items-center gap-2 text-xs text-emerald-300 mb-1">
                                  <span className="font-semibold">🇬🇧 English:</span>
                                </div>
                                <p className="text-sm text-emerald-200">{otherLangValues.en}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Valor original si modificat */}
                        {isModified && (
                          <div className="mt-2 p-2 rounded-lg text-xs text-slate-400 border border-slate-700 bg-slate-900/60">
                            <span className="font-medium">Original:</span>{' '}
                            <span className="italic">{originalTexts[path]}</span>
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
      {/* BOTÓ FLOTANT DE DESAR */}
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
                Desant...
              </>
            ) : (
              <>
                💾 Desar {modifiedCount} canvis
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}




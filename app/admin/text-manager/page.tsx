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
  locale: 'es' | 'ca' | 'en';
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

const LANGUAGE_META: Record<'ca' | 'es' | 'en', { label: string; icon: string }> = {
  ca: { label: 'Català', icon: '🏴' },
  es: { label: 'Castellà', icon: '🇪🇸' },
  en: { label: 'Anglès', icon: '🇬🇧' },
};

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
    description: 'Bodes, festes, corporatiu, discomòbil',
    color: 'from-green-500 to-emerald-500',
    paths: ['services.', 'weddings.', 'parties.', 'fiestas.', 'corporativo.', 'discomovil.']
  },
  {
    id: 'packs',
    name: 'Packs i preus',
    icon: '📦',
    description: 'Descripcions de packs, característiques i preus',
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
    name: 'Testimonis',
    icon: '💬',
    description: 'Ressenyes, opinions i prova social',
    color: 'from-yellow-500 to-orange-500',
    paths: ['testimonials.', 'reviews.', 'opiniones.']
  },
  {
    id: 'faq',
    name: 'FAQ',
    icon: '❓',
    description: 'Preguntes freqüents',
    color: 'from-indigo-500 to-purple-500',
    paths: ['faq.']
  },
  {
    id: 'contact',
    name: 'Contacte',
    icon: '📧',
    description: 'Formularis, validacions i missatges',
    color: 'from-teal-500 to-green-500',
    paths: ['contact.', 'common.validation.']
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: '🦶',
    description: 'Peu de pàgina i enllaços legals',
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
    description: 'Galeria, esdeveniments i projectes',
    color: 'from-pink-500 to-rose-500',
    paths: ['portfolio.', 'gallery.']
  },
  {
    id: 'privacy',
    name: 'Privacidad & GDPR',
    icon: '🔒',
    description: 'RGPD, drets i cookies',
    color: 'from-emerald-600 to-teal-600',
    paths: ['privacy.', 'gdpr.', 'cookies.', 'privacitat.']
  },
  {
    id: 'resources',
    name: 'Recursos',
    icon: '📁',
    description: 'Descàrregues, catàlegs i PDFs',
    color: 'from-violet-500 to-purple-500',
    paths: ['resources.']
  },
  {
    id: 'common',
    name: 'Comú i sistema',
    icon: '🔧',
    description: 'Mesos, errors, carregador i textos genèrics',
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

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

      const allModifications: Record<string, Record<string, string>> = { es: {}, ca: {}, en: {} };
      const modifiedEntries = Object.entries(modifications);
      const uniqueTexts = Array.from(
        new Set(modifiedEntries.map(([, text]) => text.trim()).filter(Boolean))
      );

      let translationsByText: Record<string, Record<string, string>> = {};
      if (uniqueTexts.length > 0) {
        const translateResponse = await fetch('/api/admin/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: uniqueTexts, targetLanguages: ['es', 'ca', 'en'] })
        });
        const translateData = await translateResponse.json().catch(() => ({}));
        if (translateResponse.ok && translateData?.ok) {
          translationsByText = translateData.translationsByText || {};
        }
      }

      for (const [path, text] of modifiedEntries) {
        const translated = translationsByText[text.trim()] || {};
        allModifications.es[path] = translated.es || text;
        allModifications.ca[path] = translated.ca || text;
        allModifications.en[path] = translated.en || text;
      }

      const responses = await Promise.all([
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
      ]);
      const results = await Promise.all(responses.map((r) => r.json().catch(() => ({}))));
      if (!results.every((r) => r.ok)) {
        setError('Error desant alguns idiomes');
        setSaving(false);
        return;
      }

      setEsTexts((prev) => ({ ...prev, ...allModifications.es }));
      setCaTexts((prev) => ({ ...prev, ...allModifications.ca }));
      setEnTexts((prev) => ({ ...prev, ...allModifications.en }));
      setOriginalEsTexts((prev) => ({ ...prev, ...allModifications.es }));
      setOriginalCaTexts((prev) => ({ ...prev, ...allModifications.ca }));
      setOriginalEnTexts((prev) => ({ ...prev, ...allModifications.en }));
      setSuccess(`✅ ${Object.keys(modifications).length} textos desats i traduïts a ES/CA/EN`);
      setChangeHistory([]);
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
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
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
  }, [currentTexts, originalTexts, activeSection, debouncedSearchTerm, showOnlyModified, getSection]);

  const renderTextCard = (path: string, value: string) => {
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
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <code className="text-sm break-all font-mono px-2 py-1 rounded">
                {path}
              </code>
              {isModified && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full">
                  ✏️ Modificat
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isModified && (
                <button
                  onClick={() => handleRevert(path)}
                  className="text-xs px-3 py-1 rounded-lg border transition-colors"
                  title="Revertir canvis"
                >
                  ↩️ Revertir
                </button>
              )}
              <span className="text-xs">
                {value.length} caràcters
              </span>
            </div>
          </div>

          <textarea
            value={value}
            onChange={(e) => handleTextChange(path, e.target.value)}
            rows={Math.min(12, Math.max(2, value.split('\n').length + 1))}
            className={`w-full px-4 py-3 rounded-lg border transition-all resize-y font-sans ${
              isModified
                ? 'border-orange-500/40 bg-orange-500/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                : 'border-slate-700/60 bg-slate-900/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }`}
            placeholder="Text buit..."
          />

          {showComparison && (
            <div className="mt-3 space-y-2">
              {activeLanguage !== 'es' && otherLangValues.es && (
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-semibold">🇪🇸 Espanyol:</span>
                  </div>
                  <p className="text-sm">{otherLangValues.es}</p>
                </div>
              )}
              {activeLanguage !== 'ca' && otherLangValues.ca && (
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-semibold">🏴 Català:</span>
                  </div>
                  <p className="text-sm">{otherLangValues.ca}</p>
                </div>
              )}
              {activeLanguage !== 'en' && otherLangValues.en && (
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-semibold">🇬🇧 Anglès:</span>
                  </div>
                  <p className="text-sm">{otherLangValues.en}</p>
                </div>
              )}
            </div>
          )}

          {isModified && (
            <div className="mt-2 p-2 rounded-lg text-xs border">
              <span className="font-medium">Original:</span>{' '}
              <span className="italic">{originalTexts[path]}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg">Carregant textos...</p>
          <p className="text-sm">Analitzant estructura del JSON</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER FIJO */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-14 lg:top-16 z-40 border-b shadow-sm backdrop-blur">
        {/* TABS DE IDIOMA */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">🌐 Idioma de treball:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveLanguage('es')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      activeLanguage === 'es'
                        ? 'bg-orange-500 text-white shadow-lg scale-105'
                        : 'bg-slate-900/70 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {LANGUAGE_META.es.icon} {LANGUAGE_META.es.label}
                  </button>
                  <button
                    onClick={() => setActiveLanguage('ca')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      activeLanguage === 'ca'
                        ? 'bg-orange-500 text-white shadow-lg scale-105'
                        : 'bg-slate-900/70 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {LANGUAGE_META.ca.icon} {LANGUAGE_META.ca.label}
                  </button>
                  <button
                    onClick={() => setActiveLanguage('en')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      activeLanguage === 'en'
                        ? 'bg-orange-500 text-white shadow-lg scale-105'
                        : 'bg-slate-900/70 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {LANGUAGE_META.en.icon} {LANGUAGE_META.en.label}
                  </button>
                </div>
              </div>
              <div className="text-xs px-3 py-1.5 rounded-lg border">
                💡 Estàs editant: {LANGUAGE_META[activeLanguage].label} · Auto-traducció ON
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Títol */}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                📝 Text Manager PRO
              </h1>
              <p className="text-sm">
                {Object.keys(currentTexts).length} textos · {modifiedCount} modificats
              </p>
            </div>

            {/* Buscador */}
            <div className="w-full lg:flex-1 lg:max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cercar textos... (path o contingut)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 rounded-xl border focus:ring-2 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  🔍
                </span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Toggle modificats */}
              <button
                onClick={() => setShowOnlyModified(!showOnlyModified)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showOnlyModified
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                    {showOnlyModified ? '✅ Només modificats' : '📋 Mostrar tots'}
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
                🌐 Comparar idiomes
              </button>


              {/* Revertir tot */}
              {modifiedCount > 0 && (
                <button
                  onClick={handleRevertAll}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
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
            <div className="p-4 rounded-xl border flex items-center justify-between" role="alert">
              <span>❌ {error}</span>
              <button
                onClick={() => setError(null)}
                type="button"
                aria-label="Tancar error"
                className=""
              >
                ✕
              </button>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl border flex items-center justify-between" role="status" aria-live="polite">
              <span>{success}</span>
              <button
                onClick={() => setSuccess(null)}
                type="button"
                aria-label="Tancar confirmacio"
                className=""
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-6 xl:flex-row">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SIDEBAR - SECCIONS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <aside className="w-full xl:w-72 xl:flex-shrink-0">
            <div className="space-y-2 xl:sticky xl:top-32">
              {/* Mostrar tot */}
              <button
                onClick={() => setActiveSection(null)}
                type="button"
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  !activeSection
                    ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/20 text-amber-100 border border-amber-400/40 shadow-lg'
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
                <div className="mt-6 p-4 rounded-xl border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    📜 Historial ({changeHistory.length})
                  </h3>
                  <div className="space-y-2">
                    {changeHistory.slice(-10).reverse().map((change, i) => (
                      <div key={i} className="text-xs p-2 rounded-lg">
                        <code className="break-all">
                          {change.path.split('.').slice(-2).join('.')}
                        </code>
                        <div className="mt-1">
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
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <p>No s\'han trobat textos</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 hover:underline"
                    >
                      Netejar cerca
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs">
                    <span>
                      Mostrant 1-{filteredTexts.length} de {filteredTexts.length}
                    </span>
                  </div>

                {filteredTexts.map(([path, value]) => renderTextCard(path, value))}
                </>
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
            className="px-8 py-4 text-white rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
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

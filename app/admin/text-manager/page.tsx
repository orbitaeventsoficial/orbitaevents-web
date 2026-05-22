'use client';
import { log } from '@/lib/logger';
import { formatTimeShort } from '@/lib/constants';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { fetchWithCsrf } from '@/lib/csrf';
import type { TextNode, Section, TranslationComparison } from './text-manager-config';
import { LANGUAGE_META, SECTIONS } from './text-manager-config';

type OwnerTone = 'info' | 'warning' | 'success';
type OwnerStripConfig = {
  system: {
    eyebrow: string;
    title: string;
    tone: OwnerTone;
    items: string[];
    emptyText: string;
  };
  manual: {
    eyebrow: string;
    title: string;
    tone: OwnerTone;
    items: string[];
    emptyText: string;
  };
  nextStep: {
    eyebrow: string;
    title: string;
    detail: string;
    href: string;
    ctaLabel: string;
  };
};

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
  const { confirm, dialogProps } = useConfirmDialog();

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
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetchWithCsrf('/api/admin/text-manager', { signal: controller.signal });
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
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('La connexió ha trigat massa. Reintenta.');
      } else {
        setError('Error de connexió');
        log.error('Text manager error', err);
      }
    } finally {
      clearTimeout(tid);
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
        const translateResponse = await fetchWithCsrf('/api/admin/translate', {
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
        fetchWithCsrf('/api/admin/text-manager', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modifications: allModifications.es, locale: 'es' })
        }),
        fetchWithCsrf('/api/admin/text-manager', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modifications: allModifications.ca, locale: 'ca' })
        }),
        fetchWithCsrf('/api/admin/text-manager', {
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

  const handleRevertAll = async () => {
    const ok = await confirm({ title: 'Revertir canvis', message: `Vols revertir TOTS els canvis de ${LANGUAGE_META[activeLanguage].label}?`, confirmLabel: 'Revertir', variant: 'warning' });
    if (!ok) return;
    if (activeLanguage === 'es') {
      setEsTexts({ ...originalEsTexts });
    } else if (activeLanguage === 'ca') {
      setCaTexts({ ...originalCaTexts });
    } else if (activeLanguage === 'en') {
      setEnTexts({ ...originalEnTexts });
    }
    setChangeHistory([]);
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
        className={`bg-black/70 rounded-xl border transition-all ${
          isModified
            ? 'border-orange-300 shadow-md shadow-orange-100'
            : 'admin-tone-border-neutral hover:admin-tone-border-neutral'
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
                  className="text-xs px-3 py-1 rounded-xl border transition-colors"
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
            className={`w-full px-4 py-3 rounded-xl border transition-all resize-y font-sans ${
              isModified
                ? 'border-orange-500/40 bg-orange-500/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                : 'admin-tone-border-neutral admin-tone-bg-neutral focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }`}
            placeholder="Text buit..."
          />

          {showComparison && (
            <div className="mt-3 space-y-2">
              {activeLanguage !== 'es' && otherLangValues.es && (
                <div className="p-3 rounded-xl border">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-semibold">🇪🇸 Espanyol:</span>
                  </div>
                  <p className="text-sm">{otherLangValues.es}</p>
                </div>
              )}
              {activeLanguage !== 'ca' && otherLangValues.ca && (
                <div className="p-3 rounded-xl border">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-semibold">🏴 Català:</span>
                  </div>
                  <p className="text-sm">{otherLangValues.ca}</p>
                </div>
              )}
              {activeLanguage !== 'en' && otherLangValues.en && (
                <div className="p-3 rounded-xl border">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-semibold">🇬🇧 Anglès:</span>
                  </div>
                  <p className="text-sm">{otherLangValues.en}</p>
                </div>
              )}
            </div>
          )}

          {isModified && (
            <div className="mt-2 p-2 rounded-xl text-xs border">
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

  const activeSectionMeta = useMemo(
    () => (activeSection ? SECTIONS.find((section) => section.id === activeSection) ?? null : null),
    [activeSection]
  );

  const strip = useMemo<OwnerStripConfig>(() => {
    const totalTexts = Object.keys(currentTexts).length;
    const modifiedSections = Object.values(sectionCounts).filter((section) => section.modified > 0).length;
    const visibleSectionTotal = activeSection ? sectionCounts[activeSection]?.total ?? 0 : SECTIONS.length;

    const systemItems: string[] = [];
    if (totalTexts > 0) {
      systemItems.push(`${totalTexts} textos carregats a ${LANGUAGE_META[activeLanguage].label}`);
    }
    if (activeSectionMeta) {
      systemItems.push(`${activeSectionMeta.icon} ${activeSectionMeta.name} · ${visibleSectionTotal} textos al focus`);
    } else {
      systemItems.push(`${SECTIONS.length} seccions disponibles al catàleg`);
    }
    if (filteredTexts.length !== totalTexts || debouncedSearchTerm || showOnlyModified) {
      systemItems.push(`${filteredTexts.length} textos visibles segons els filtres actuals`);
    }

    const manualItems: string[] = [];
    if (modifiedCount > 0) {
      manualItems.push(`${modifiedCount} ${modifiedCount === 1 ? 'text pendent de desar' : 'textos pendents de desar'}`);
    }
    if (modifiedSections > 0) {
      manualItems.push(`${modifiedSections} ${modifiedSections === 1 ? 'secció tocada' : 'seccions tocades'} en aquesta passada`);
    }
    if (debouncedSearchTerm) {
      manualItems.push(`Cerca activa: "${debouncedSearchTerm}"`);
    }
    if (showComparison) {
      manualItems.push('Comparació d’idiomes oberta per validar coherència');
    }
    if (showOnlyModified) {
      manualItems.push('Vista reduïda només a textos modificats');
    }
    if (changeHistory.length > 0) {
      manualItems.push(`${changeHistory.length} moviments al mini-historial de sessió`);
    }

    const nextStep =
      modifiedCount > 0
        ? {
            eyebrow: 'Següent pas · Tancar passada',
            title: `Desar ${modifiedCount} ${modifiedCount === 1 ? 'canvi pendent' : 'canvis pendents'}`,
            detail: showComparison
              ? 'La comparació ja és oberta. Valida coherència entre idiomes i desa abans d’obrir una altra secció.'
              : `Hi ha canvis vius a ${LANGUAGE_META[activeLanguage].label}. Abans d’obrir més fronts, valida el copy i desa aquesta passada.`,
            href: '#text-manager-save',
            ctaLabel: 'Anar a desar',
          }
        : debouncedSearchTerm
          ? {
              eyebrow: 'Següent pas · Afinar focus',
              title: 'Resoldre la cerca activa',
              detail: 'Tens una cerca oberta. Decideix si cal editar aquest bloc o neteja-la per tornar a navegació estructurada.',
              href: '#text-manager-search',
              ctaLabel: 'Revisar cerca',
            }
          : activeSectionMeta
            ? {
                eyebrow: 'Següent pas · Secció',
                title: `Entrar a ${activeSectionMeta.name}`,
                detail: `El focus actual ja està acotat. Revisa els ${visibleSectionTotal} textos de la secció i obre comparació només si hi ha dubte semàntic.`,
                href: '#text-manager-content',
                ctaLabel: 'Obrir contingut',
              }
            : {
                eyebrow: 'Següent pas',
                title: 'Triar el primer bloc a editar',
                detail: 'Sense canvis pendents ni cerca activa. El camí net és entrar per secció abans de tocar cap text del catàleg.',
                href: '#text-manager-sections',
                ctaLabel: 'Obrir seccions',
              };

    return {
      system: {
        eyebrow: 'Automàtic · Catàleg',
        title: totalTexts > 0 ? 'Catàleg editorial carregat' : 'Sense textos carregats',
        tone: totalTexts > 0 ? 'info' : 'warning',
        items: systemItems,
        emptyText: 'Sense catàleg visible al gestor.',
      },
      manual: {
        eyebrow: 'Manual · Sessió',
        title: manualItems.length === 0 ? 'Sessió neta' : `${manualItems.length} senyals de sessió`,
        tone: modifiedCount > 0 ? 'warning' : manualItems.length > 0 ? 'info' : 'success',
        items: manualItems,
        emptyText: 'Sense canvis pendents, filtres ni comparacions obertes.',
      },
      nextStep,
    };
  }, [
    activeLanguage,
    activeSection,
    activeSectionMeta,
    changeHistory.length,
    currentTexts,
    debouncedSearchTerm,
    filteredTexts.length,
    modifiedCount,
    sectionCounts,
    showComparison,
    showOnlyModified,
  ]);

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

  if (error && !Object.keys(esTexts).length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-amber-400 text-lg font-medium">{error}</p>
        <button type="button" onClick={loadTexts} className="ap-btn ap-btn--primary">Reintentar</button>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="text-sm font-semibold">🌐 Idioma de treball:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveLanguage('es')}
                    className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold transition-all ${
                      activeLanguage === 'es'
                        ? 'admin-tone-soft-warning admin-tone-text-warning admin-tone-border-warning scale-105 border'
                        : 'admin-tone-idle'
                    }`}
                  >
                    {LANGUAGE_META.es.icon} {LANGUAGE_META.es.label}
                  </button>
                  <button
                    onClick={() => setActiveLanguage('ca')}
                    className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold transition-all ${
                      activeLanguage === 'ca'
                        ? 'admin-tone-soft-warning admin-tone-text-warning admin-tone-border-warning scale-105 border'
                        : 'admin-tone-idle'
                    }`}
                  >
                    {LANGUAGE_META.ca.icon} {LANGUAGE_META.ca.label}
                  </button>
                  <button
                    onClick={() => setActiveLanguage('en')}
                    className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold transition-all ${
                      activeLanguage === 'en'
                        ? 'admin-tone-soft-warning admin-tone-text-warning admin-tone-border-warning scale-105 border'
                        : 'admin-tone-idle'
                    }`}
                  >
                    {LANGUAGE_META.en.icon} {LANGUAGE_META.en.label}
                  </button>
                </div>
              </div>
              <div className="text-xs px-3 py-1.5 rounded-xl border">
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
                  id="text-manager-search"
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
                    aria-label="Netejar cerca"
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
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  showOnlyModified
                    ? 'bg-orange-500 text-white'
                    : 'admin-tone-idle'
                }`}
              >
                    {showOnlyModified ? '✅ Només modificats' : '📋 Mostrar tots'}
              </button>

              {/* Comparar idiomes */}
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  showComparison
                    ? 'bg-blue-500 text-white'
                    : 'admin-tone-idle'
                }`}
              >
                🌐 Comparar idiomes
              </button>


              {/* Revertir tot */}
              {modifiedCount > 0 && (
                <button
                  onClick={handleRevertAll}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                >
                  ↩️ Revertir ({modifiedCount})
                </button>
              )}

              {/* Desar */}
              <button
                id="text-manager-save"
                onClick={handleSave}
                disabled={saving || modifiedCount === 0}
                className={`min-h-[44px] w-full rounded-xl px-6 py-2.5 font-bold transition-all flex items-center justify-center gap-2 sm:w-auto ${
                  modifiedCount > 0
                    ? 'ap-btn ap-btn--primary hover:scale-105'
                    : 'admin-tone-idle opacity-50 cursor-not-allowed'
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

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <AdminHelpPanel
          title="Com funciona"
          description="Aquí edites els textos que es veuen a la web. Quan deses, el sistema manté els idiomes alineats perquè no se t escapi cap incoherència."
          items={[
            {
              title: 'Seccions',
              body: 'Cada bloc reuneix textos d una part concreta de la web. Així saps on toques en cada moment.',
            },
            {
              title: 'Desar',
              body: 'Només es desa el que realment has canviat. Si no hi ha canvis, el botó queda aturat.',
            },
            {
              title: 'Comparar',
              body: 'La comparació et deixa veure els altres idiomes abans de publicar cap canvi.',
            },
          ]}
        />

        <OwnerControlStrip
          system={strip.system}
          manual={strip.manual}
          nextStep={strip.nextStep}
        />

        <section className="grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr]">
          <article className="rounded-2xl border admin-card-glass p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Sessió d’edició</p>
            <h2 className="mt-2 text-lg font-semibold text-white/90">Què tens obert ara mateix</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Idioma</p>
                <p className="mt-1 text-xl font-bold text-white">{LANGUAGE_META[activeLanguage].icon} {LANGUAGE_META[activeLanguage].label}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Canvis</p>
                <p className="mt-1 text-xl font-bold text-white">{modifiedCount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Visibles</p>
                <p className="mt-1 text-xl font-bold text-white">{filteredTexts.length}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Focus</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Què estàs tocant de veritat</h2>
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <p>{activeSectionMeta ? `${activeSectionMeta.icon} ${activeSectionMeta.name}` : 'Totes les seccions del catàleg de textos'}</p>
              <p>{debouncedSearchTerm ? `Cerca activa: “${debouncedSearchTerm}”` : 'Sense cerca activa. Estàs navegant per estructura, no per paraula clau.'}</p>
              <p>{showOnlyModified ? 'Vista reduïda només als textos modificats.' : 'Vista completa dels textos disponibles segons els filtres actuals.'}</p>
              <p>{showComparison ? 'La comparació d’idiomes està oberta per validar coherència abans de desar.' : 'La comparació d’idiomes està tancada; obre-la només quan et calgui contrast ràpid.'}</p>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Acció principal</p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {modifiedCount > 0 ? 'Acabar una passada neta i desar' : 'Trobar primer el bloc correcte'}
            </h2>
            <p className="mt-2 text-sm text-white/75">
              {modifiedCount > 0
                ? `Hi ha ${modifiedCount} canvis pendents en ${LANGUAGE_META[activeLanguage].label}. L’objectiu ara no és obrir més fronts, sinó validar coherència i tancar-los bé.`
                : 'Sense canvis pendents. El millor primer pas és entrar per secció o cercar el copy exacte abans d’editar.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80">
                Auto-traducció {modifiedCount > 0 ? 'preparada' : 'disponible'}
              </span>
              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80">
                {activeSectionMeta ? `${sectionCounts[activeSectionMeta.id]?.modified || 0} canvis dins del focus actual` : `${modifiedCount} canvis totals`}
              </span>
            </div>
          </article>
        </section>

        <div className="flex flex-col gap-6 xl:flex-row">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SIDEBAR - SECCIONS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <aside className="w-full xl:w-72 xl:flex-shrink-0">
            <div id="text-manager-sections" className="space-y-2 xl:sticky xl:top-32">
              {/* Mostrar tot */}
              <button
                onClick={() => setActiveSection(null)}
                type="button"
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  !activeSection
                    ? 'admin-tone-soft-warning admin-tone-text-warning admin-tone-border-warning border'
                    : 'ap-card hover:admin-tone-bg-neutral'
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
                        ? ` ${section.color} text-white shadow-lg`
                        : 'ap-card hover:admin-tone-bg-neutral'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {section.icon} {section.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {counts.modified > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20' : 'admin-tone-soft-warning admin-tone-text-warning'
                          }`}>
                            {counts.modified}
                          </span>
                        )}
                        <span className={`text-xs ${isActive ? 'opacity-70' : 'admin-tone-text-slate'}`}>
                          {counts.total}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs mt-1 ${isActive ? 'opacity-70' : 'admin-tone-text-slate'}`}>
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
                      <div key={i} className="text-xs p-2 rounded-xl">
                        <code className="break-all">
                          {change.path.split('.').slice(-2).join('.')}
                        </code>
                        <div className="mt-1">
                          {formatTimeShort(change.timestamp)}
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
            <div id="text-manager-content" />
            {/* Info de secció activa */}
            {activeSection && (
              <div className={`mb-6 p-4 rounded-xl  ${
                activeSectionMeta?.color || 'from-white/20 to-white/10'
              } text-white/90`}>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {activeSectionMeta?.icon}
                  {activeSectionMeta?.name}
                </h2>
                <p className="opacity-80 mt-1">
                  {activeSectionMeta?.description}
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
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

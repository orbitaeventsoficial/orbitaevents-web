'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { LANGUAGE_META, SECTIONS } from './text-manager-config';
import { log } from '@/lib/logger';

export default function TextManagerPage() {
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
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'es' | 'ca' | 'en'>('es');

  useEffect(() => { loadTexts(); }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  async function loadTexts() {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetchWithCsrf('/api/admin/text-manager', { signal: controller.signal });
      const data = await res.json();
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
        log.error('Text manager load error', err);
      }
    } finally {
      clearTimeout(tid);
      setLoading(false);
    }
  }

  const handleTextChange = useCallback((path: string, value: string) => {
    if (activeLanguage === 'es') setEsTexts(prev => ({ ...prev, [path]: value }));
    else if (activeLanguage === 'ca') setCaTexts(prev => ({ ...prev, [path]: value }));
    else setEnTexts(prev => ({ ...prev, [path]: value }));
  }, [activeLanguage]);

  const handleRevert = useCallback((path: string) => {
    if (activeLanguage === 'es') setEsTexts(prev => ({ ...prev, [path]: originalEsTexts[path] }));
    else if (activeLanguage === 'ca') setCaTexts(prev => ({ ...prev, [path]: originalCaTexts[path] }));
    else setEnTexts(prev => ({ ...prev, [path]: originalEnTexts[path] }));
  }, [activeLanguage, originalEsTexts, originalCaTexts, originalEnTexts]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const currentOrig = activeLanguage === 'es' ? originalEsTexts : activeLanguage === 'ca' ? originalCaTexts : originalEnTexts;
      const currentCurr = activeLanguage === 'es' ? esTexts : activeLanguage === 'ca' ? caTexts : enTexts;
      const modifications: Record<string, string> = {};
      for (const [path, value] of Object.entries(currentCurr)) {
        if (value !== currentOrig[path]) modifications[path] = value;
      }
      if (!Object.keys(modifications).length) { setError('No hi ha canvis per desar'); setSaving(false); return; }

      const allMods: Record<string, Record<string, string>> = { es: {}, ca: {}, en: {} };
      const uniqueTexts = [...new Set(Object.values(modifications).map(t => t.trim()).filter(Boolean))];
      let translationsByText: Record<string, Record<string, string>> = {};
      if (uniqueTexts.length > 0) {
        const tr = await fetchWithCsrf('/api/admin/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: uniqueTexts, targetLanguages: ['es', 'ca', 'en'] }),
        });
        const trData = await tr.json().catch(() => ({}));
        if (tr.ok && trData?.ok) translationsByText = trData.translationsByText || {};
      }
      for (const [path, text] of Object.entries(modifications)) {
        const t = translationsByText[text.trim()] || {};
        allMods.es[path] = t.es || text;
        allMods.ca[path] = t.ca || text;
        allMods.en[path] = t.en || text;
      }

      const results = await Promise.all(
        (['es', 'ca', 'en'] as const).map(locale =>
          fetchWithCsrf('/api/admin/text-manager', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modifications: allMods[locale], locale }),
          }).then(r => r.json().catch(() => ({})))
        )
      );
      if (!results.every(r => r.ok)) { setError('Error desant alguns idiomes'); setSaving(false); return; }

      setEsTexts(prev => ({ ...prev, ...allMods.es }));
      setCaTexts(prev => ({ ...prev, ...allMods.ca }));
      setEnTexts(prev => ({ ...prev, ...allMods.en }));
      setOriginalEsTexts(prev => ({ ...prev, ...allMods.es }));
      setOriginalCaTexts(prev => ({ ...prev, ...allMods.ca }));
      setOriginalEnTexts(prev => ({ ...prev, ...allMods.en }));
      setSuccess(`${Object.keys(modifications).length} textos desats`);
    } catch (err) {
      setError('Error de connexió en desar');
      log.error('Text manager save error', err);
    }
    setSaving(false);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  function formatPathSegment(seg: string): string {
    if (/^\d+$/.test(seg)) return `#${Number(seg) + 1}`;
    return seg.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatPathLabel(path: string): string {
    const parts = path.split('.');
    if (parts.length <= 1) return path;
    return parts.slice(1).map(formatPathSegment).join(' · ');
  }

  function getGroupKey(path: string): string {
    const parts = path.split('.');
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].includes('-')) return parts.slice(0, i + 1).join('.');
    }
    return parts.slice(0, Math.min(2, parts.length)).join('.');
  }

  function getGroupLabel(groupKey: string): string {
    const last = groupKey.split('.').at(-1) ?? groupKey;
    return last.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── Dades derivades ────────────────────────────────────────────────────────

  const currentTexts = useMemo(() =>
    activeLanguage === 'es' ? esTexts : activeLanguage === 'ca' ? caTexts : enTexts,
    [activeLanguage, esTexts, caTexts, enTexts]);

  const originalTexts = useMemo(() =>
    activeLanguage === 'es' ? originalEsTexts : activeLanguage === 'ca' ? originalCaTexts : originalEnTexts,
    [activeLanguage, originalEsTexts, originalCaTexts, originalEnTexts]);

  const modifiedCount = useMemo(() =>
    Object.entries(currentTexts).filter(([p, v]) => v !== originalTexts[p]).length,
    [currentTexts, originalTexts]);

  const getSection = useCallback((path: string) => {
    for (const s of SECTIONS) {
      if (s.paths.some(p => path.startsWith(p) || path.split('.')[0] + '.' === p)) return s.id;
    }
    return 'common';
  }, []);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, { total: number; modified: number }> = {};
    SECTIONS.forEach(s => { counts[s.id] = { total: 0, modified: 0 }; });
    Object.entries(currentTexts).forEach(([path, value]) => {
      const id = getSection(path);
      if (counts[id]) {
        counts[id].total++;
        if (value !== originalTexts[path]) counts[id].modified++;
      }
    });
    return counts;
  }, [currentTexts, originalTexts, getSection]);

  const activeSectionMeta = useMemo(() =>
    activeSection ? (SECTIONS.find(s => s.id === activeSection) ?? null) : null,
    [activeSection]);

  const filteredTexts = useMemo(() => {
    let texts = Object.entries(currentTexts);
    if (activeSection) texts = texts.filter(([p]) => getSection(p) === activeSection);
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      texts = texts.filter(([p, v]) => p.toLowerCase().includes(term) || v.toLowerCase().includes(term));
    }
    if (showOnlyModified) texts = texts.filter(([p, v]) => v !== originalTexts[p]);
    texts.sort((a, b) => a[0].localeCompare(b[0]));
    return texts;
  }, [currentTexts, originalTexts, activeSection, debouncedSearchTerm, showOnlyModified, getSection]);

  const groupedTexts = useMemo(() => {
    const groups = new Map<string, [string, string][]>();
    for (const entry of filteredTexts) {
      const key = getGroupKey(entry[0]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
    return Array.from(groups.entries()).map(([key, entries]) => ({ key, label: getGroupLabel(key), entries }));
  }, [filteredTexts]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--o-admin-canvas)]" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--line)] border-t-white/70 animate-spin" />
          <p className="text-sm text-[var(--t3)]">Carregant textos...</p>
        </div>
      </div>
    );
  }

  if (error && !Object.keys(esTexts).length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--o-admin-canvas)]" role="alert" aria-live="assertive">
        <p className="admin-tone-text-warning text-sm">{error}</p>
        <button type="button" onClick={loadTexts} className="ap-btn ap-btn--xs">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--o-admin-canvas)]">

      {/* HEADER */}
      <header className="shrink-0 border-b border-[var(--line)] bg-[var(--o-admin-canvas)]">
        <div className="flex items-center gap-3 px-5 h-14">
          <span className="text-xs font-bold text-[var(--t3)] uppercase tracking-[0.18em] shrink-0">Gestor de textos</span>
          <div className="w-px h-4 bg-[var(--o-admin-fill-4)] shrink-0" />

          <div className="flex items-center rounded-lg border border-[var(--line)] overflow-hidden shrink-0 bg-[var(--o-admin-fill-1)]">
            {(['ca', 'es', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`px-4 h-8 text-xs font-semibold transition-all border-r border-[var(--line)] last:border-r-0 ${
                  activeLanguage === lang ? 'bg-[var(--raised)] text-[var(--t)]' : 'text-[var(--t3)] hover:text-[var(--t2)] adm-row-hover'
                }`}
              >
                {LANGUAGE_META[lang].label}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-sm">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per clau o text..."
              className="w-full h-8 px-3 rounded-lg text-xs text-[var(--t2)] placeholder-white/20 outline-none border border-[var(--line)] transition-colors focus:border-[var(--line)] bg-[var(--panel)]"
            />
          </div>

          <button
            onClick={() => setShowOnlyModified(v => !v)}
            className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-medium border transition-all shrink-0 ${
              showOnlyModified
                ? 'admin-tone-bg-warning admin-tone-border-warning admin-tone-text-warning'
                : 'bg-[var(--o-admin-fill-1)] border-[var(--line)] text-[var(--t3)] hover:text-[var(--t3)] hover:border-[var(--line)]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${showOnlyModified ? 'bg-[var(--o-warning)]' : 'bg-[var(--t3)]'}`} />
            Modificats
            {modifiedCount > 0 && <span className="opacity-60">({modifiedCount})</span>}
          </button>

          <div className="flex-1" />

          <button
            onClick={handleSave}
            disabled={saving || modifiedCount === 0}
            className={`ap-btn shrink-0 ${
              modifiedCount > 0
                ? 'ap-btn--primary admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
                : ''
            }`}
          >
            {saving ? 'Desant...' : 'Desar'}
          </button>
        </div>
      </header>

      {/* MISSATGES */}
      {(error || success) && (
        <div className="px-4 pt-3">
          {error && (
            <div role="alert" aria-live="assertive" className="flex items-center justify-between px-4 py-2.5 rounded-lg border admin-tone-border-danger admin-tone-bg-danger text-sm admin-tone-text-danger">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="admin-tone-text-danger opacity-60 hover:opacity-100 ml-4">✕</button>
            </div>
          )}
          {success && (
            <div role="status" aria-live="polite" className="flex items-center justify-between px-4 py-2.5 rounded-lg border admin-tone-border-success admin-tone-bg-success text-sm admin-tone-text-success">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="admin-tone-text-success opacity-60 hover:opacity-100 ml-4">✕</button>
            </div>
          )}
        </div>
      )}

      {/* COS */}
      <div className="flex flex-1 min-h-0">

        {/* SIDEBAR */}
        <aside className="w-64 shrink-0 border-r border-[var(--line)] overflow-y-scroll">
          <div className="p-2 space-y-0.5">
            <button
              onClick={() => setActiveSection(null)}
              type="button"
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                !activeSection ? 'bg-[var(--raised)] text-[var(--t)]' : 'text-[var(--t3)] hover:text-[var(--t2)] adm-row-hover'
              }`}
            >
              <span>Totes</span>
              <span className="text-xs opacity-50">{Object.keys(currentTexts).length}</span>
            </button>
            <div className="my-2 h-px bg-[var(--o-admin-fill-3)]" />
            {SECTIONS.map(section => {
              const counts = sectionCounts[section.id] || { total: 0, modified: 0 };
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between gap-2 ${
                    isActive ? 'bg-[var(--raised)] text-[var(--t)]' : 'text-[var(--t3)] hover:text-[var(--t2)] adm-row-hover'
                  }`}
                >
                  <span className="leading-snug"><span className="mr-1.5 opacity-70">{section.icon}</span>{section.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {counts.modified > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--o-warning)]" />}
                    <span className="text-xs opacity-40">{counts.total}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CONTINGUT */}
        <main className="flex-1 min-w-0 overflow-y-scroll">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
            {activeSectionMeta && (
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-[var(--t2)]">{activeSectionMeta.name}</h2>
                <p className="text-xs text-[var(--t3)] mt-0.5">{activeSectionMeta.description} · {sectionCounts[activeSection!]?.total || 0} textos</p>
              </div>
            )}
            {filteredTexts.length === 0 ? (
              <div className="py-16 text-center text-[var(--t3)] text-sm">Cap text trobat</div>
            ) : groupedTexts.map(({ key, label, entries }) => {
              const groupModified = entries.some(([p, v]) => v !== originalTexts[p]);
              return (
                <div
                  key={key}
                  className={`rounded-xl border transition-all ${groupModified ? 'admin-tone-border-warning admin-tone-bg-warning' : 'border-[var(--line)] bg-[var(--raised)]'}`}
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--line)]">
                    <span className="text-sm font-semibold text-[var(--t2)]">{label}</span>
                    <span className="text-xs text-[var(--t3)]">{entries.length} camps</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {entries.map(([path, value]) => {
                      const isModified = value !== originalTexts[path];
                      return (
                        <div key={path} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <div className="min-w-0 flex-1">
                              <span className={`text-xs font-medium ${isModified ? 'admin-tone-text-warning' : 'text-[var(--t3)]'}`}>{formatPathLabel(path)}</span>
                              <span className="text-xs text-[var(--t3)] font-mono ml-2">{path}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isModified && (
                                <button onClick={() => handleRevert(path)} className="text-xs text-[var(--t3)] hover:text-[var(--t2)] transition-colors">
                                  Revertir
                                </button>
                              )}
                              <span className="text-xs text-[var(--t3)]">{value.length}</span>
                            </div>
                          </div>
                          <textarea
                            value={value}
                            onChange={(e) => handleTextChange(path, e.target.value)}
                            rows={Math.min(20, Math.max(2, Math.ceil(value.length / 65), value.split('\n').length + 1))}
                            className={`w-full px-3 py-2 rounded-lg text-sm text-[var(--t2)] placeholder-white/20 resize-y outline-none transition-all border ${
                              isModified
                                ? 'admin-tone-bg-warning admin-tone-border-warning'
                                : 'bg-[var(--o-admin-fill-1)] border-[var(--line)] focus:border-[var(--line)]'
                            }`}
                            placeholder="Buit..."
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

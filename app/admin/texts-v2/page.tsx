'use client';

// ═══════════════════════════════════════════════════════════════════════════
// EDITOR DE TEXTOS BRUTAL v2.0
// ═══════════════════════════════════════════════════════════════════════════
// 
// Característiques:
// - Organitzat per SECCIONS (Hero, Serveis, Testimonis...)
// - Edició simultània CA + ES
// - Cerca global
// - Preview en temps real
// - Autoguardat
//
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface SectionConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface TextEntry {
  path: string;
  caValue: string;
  esValue: string;
  section: string;
}

interface SectionData {
  config: SectionConfig;
  texts: TextEntry[];
}

interface Change {
  path: string;
  caValue: string;
  esValue: string;
  originalCa: string;
  originalEs: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TextsEditorPage() {
  // State
  const [sections, setSections] = useState<Record<string, SectionData>>({});
  const [sectionsConfig, setSectionsConfig] = useState<SectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [changes, setChanges] = useState<Record<string, Change>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set());

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchTerm 
        ? `/api/admin/texts-json?search=${encodeURIComponent(searchTerm)}`
        : '/api/admin/texts-json';
        
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.ok) {
        setSections(data.sections);
        setSectionsConfig(data.sectionsConfig);
        
        // Seleccionar primera secció si no hi ha cap activa
        if (!activeSection && Object.keys(data.sections).length > 0) {
          setActiveSection(Object.keys(data.sections)[0]);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Error carregant dades' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error de connexió' });
    }
    setLoading(false);
  }, [searchTerm, activeSection]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANGE HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  const handleChange = (path: string, field: 'caValue' | 'esValue', value: string, original: TextEntry) => {
    setChanges(prev => {
      const existing = prev[path];
      const newChange: Change = {
        path,
        caValue: field === 'caValue' ? value : (existing?.caValue ?? original.caValue),
        esValue: field === 'esValue' ? value : (existing?.esValue ?? original.esValue),
        originalCa: original.caValue,
        originalEs: original.esValue
      };
      
      // Si els valors són iguals als originals, eliminar el canvi
      if (newChange.caValue === newChange.originalCa && newChange.esValue === newChange.originalEs) {
        const { [path]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [path]: newChange };
    });
  };

  const getCurrentValue = (text: TextEntry, field: 'caValue' | 'esValue'): string => {
    const change = changes[text.path];
    if (change) {
      return field === 'caValue' ? change.caValue : change.esValue;
    }
    return text[field];
  };

  const isChanged = (path: string): boolean => {
    return path in changes;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const saveChanges = async () => {
    if (Object.keys(changes).length === 0) {
      setMessage({ type: 'info', text: 'No hi ha canvis per guardar' });
      return;
    }

    setSaving(true);
    try {
      const updates = Object.values(changes).map(change => ({
        path: change.path,
        caValue: change.caValue,
        esValue: change.esValue
      }));

      const res = await fetch('/api/admin/texts-json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      const data = await res.json();

      if (data.ok) {
        setMessage({ type: 'success', text: `✅ ${data.updated} textos guardats!` });
        setChanges({});
        loadData(); // Recarregar
      } else {
        setMessage({ type: 'error', text: data.error || 'Error guardant' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error de connexió' });
    }
    setSaving(false);
  };

  const discardChanges = () => {
    if (confirm('Segur que vols descartar tots els canvis?')) {
      setChanges({});
      setMessage({ type: 'info', text: 'Canvis descartats' });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const changesCount = Object.keys(changes).length;
  const activeData = activeSection ? sections[activeSection] : null;

  if (loading && Object.keys(sections).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-slate-500">Carregant textos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER FIX */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Títol */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                📝 Editor de Textos
                {changesCount > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-sm rounded-full animate-pulse">
                    {changesCount} canvis
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500">
                Edita els textos de la web en català i espanyol simultàniament
              </p>
            </div>

            {/* Accions */}
            <div className="flex items-center gap-3">
              {/* Cerca */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cercar textos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>
              </div>

              {/* Botons */}
              {changesCount > 0 && (
                <>
                  <button
                    onClick={discardChanges}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Guardant...
                      </>
                    ) : (
                      <>
                        💾 Guardar tot
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Missatge */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-3 rounded-lg flex items-center justify-between ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                  message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                <span>{message.text}</span>
                <button onClick={() => setMessage(null)} className="text-lg font-bold opacity-50 hover:opacity-100">
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SIDEBAR - SECCIONS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-32 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Seccions</h2>
              </div>
              <nav className="p-2">
                {sectionsConfig.map(section => {
                  const data = sections[section.id];
                  const hasTexts = data && data.texts.length > 0;
                  const hasChanges = data?.texts.some(t => isChanged(t.path));
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => hasTexts && setActiveSection(section.id)}
                      disabled={!hasTexts}
                      className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-all ${
                        activeSection === section.id
                          ? 'bg-orange-500 text-white'
                          : hasTexts
                          ? 'hover:bg-slate-100 text-slate-700'
                          : 'opacity-40 cursor-not-allowed text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{section.emoji}</span>
                          <span className="font-medium">{section.name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          {hasChanges && (
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                          )}
                          {hasTexts && (
                            <span className={`text-xs ${activeSection === section.id ? 'text-white/70' : 'text-slate-400'}`}>
                              {data.texts.length}
                            </span>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* CONTINGUT PRINCIPAL */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex-1">
            {activeData ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Header de secció */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <span className="text-2xl">{activeData.config.emoji}</span>
                    {activeData.config.name}
                  </h2>
                  <p className="text-slate-500 mt-1">{activeData.config.description}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600">
                      {activeData.texts.length} textos
                    </span>
                    {activeData.texts.filter(t => isChanged(t.path)).length > 0 && (
                      <span className="px-3 py-1 bg-orange-100 rounded-full text-orange-600">
                        {activeData.texts.filter(t => isChanged(t.path)).length} modificats
                      </span>
                    )}
                  </div>
                </div>

                {/* Llista de textos */}
                <div className="divide-y divide-slate-100">
                  {activeData.texts.map(text => {
                    const changed = isChanged(text.path);
                    const isExpanded = expandedTexts.has(text.path);
                    const isLongText = text.caValue.length > 100 || text.esValue.length > 100;
                    
                    return (
                      <div
                        key={text.path}
                        className={`p-4 ${changed ? 'bg-orange-50/50' : 'hover:bg-slate-50'} transition-colors`}
                      >
                        {/* Path i indicador */}
                        <div className="flex items-center justify-between mb-3">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                            {text.path}
                          </code>
                          <div className="flex items-center gap-2">
                            {changed && (
                              <span className="text-xs px-2 py-0.5 bg-orange-200 text-orange-700 rounded">
                                ✏️ Modificat
                              </span>
                            )}
                            {isLongText && (
                              <button
                                onClick={() => {
                                  const newSet = new Set(expandedTexts);
                                  if (isExpanded) {
                                    newSet.delete(text.path);
                                  } else {
                                    newSet.add(text.path);
                                  }
                                  setExpandedTexts(newSet);
                                }}
                                className="text-xs text-slate-500 hover:text-slate-700"
                              >
                                {isExpanded ? '⬆️ Col·lapsar' : '⬇️ Expandir'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Camps d'edició */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Català */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              🇪🇸 Català
                            </label>
                            <textarea
                              value={getCurrentValue(text, 'caValue')}
                              onChange={e => handleChange(text.path, 'caValue', e.target.value, text)}
                              rows={isExpanded ? 6 : (isLongText ? 2 : 1)}
                              className={`w-full px-3 py-2 border rounded-lg resize-none focus:ring-1 focus:ring-orange-500 transition-all ${
                                changed ? 'border-orange-300 bg-white' : 'border-slate-200'
                              }`}
                            />
                          </div>

                          {/* Espanyol */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              🇪🇸 Español
                            </label>
                            <textarea
                              value={getCurrentValue(text, 'esValue')}
                              onChange={e => handleChange(text.path, 'esValue', e.target.value, text)}
                              rows={isExpanded ? 6 : (isLongText ? 2 : 1)}
                              className={`w-full px-3 py-2 border rounded-lg resize-none focus:ring-1 focus:ring-orange-500 transition-all ${
                                changed ? 'border-orange-300 bg-white' : 'border-slate-200'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Selecciona una secció
                </h3>
                <p className="text-slate-500">
                  Tria una secció del menú esquerre per començar a editar els textos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FLOATING SAVE BUTTON */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {changesCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={saveChanges}
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 transition-all flex items-center gap-3"
            >
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Guardant...
                </>
              ) : (
                <>
                  💾 Guardar {changesCount} {changesCount === 1 ? 'canvi' : 'canvis'}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

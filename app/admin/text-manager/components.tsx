'use client';
import { log } from '@/lib/logger';

import { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Stats Dashboard
// ═══════════════════════════════════════════════════════════════════════════

interface StatsProps {
  totalTexts: number;
  modifiedCount: number;
  sectionCounts: Record<string, { total: number; modified: number }>;
}

export function TextStats({ totalTexts, modifiedCount, sectionCounts }: StatsProps) {
  const sections = Object.entries(sectionCounts)
    .filter(([_, counts]) => counts.total > 0)
    .sort((a, b) => b[1].total - a[1].total);

  const topSections = sections.slice(0, 5);
  const maxCount = Math.max(...sections.map(([_, c]) => c.total));

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
      <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        📊 Estadísticas de Contenido
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl">
          <div className="text-3xl font-bold">{totalTexts}</div>
          <div className="text-sm opacity-80">Textos totales</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-rose-500 text-white p-4 rounded-xl">
          <div className="text-3xl font-bold">{modifiedCount}</div>
          <div className="text-sm opacity-80">Modificados</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-xl">
          <div className="text-3xl font-bold">{sections.length}</div>
          <div className="text-sm opacity-80">Secciones activas</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-xl">
          <div className="text-3xl font-bold">
            {modifiedCount > 0 ? Math.round((modifiedCount / totalTexts) * 100) : 0}%
          </div>
          <div className="text-sm opacity-80">Cambios pendientes</div>
        </div>
      </div>

      {/* Top secciones */}
      <h4 className="text-sm font-semibold text-slate-600 mb-3">
        Secciones con más contenido
      </h4>
      <div className="space-y-2">
        {topSections.map(([id, counts]) => (
          <div key={id} className="flex items-center gap-3">
            <div className="w-20 text-sm text-slate-600 truncate">{id}</div>
            <div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-rose-400 rounded-full transition-all"
                style={{ width: `${(counts.total / maxCount) * 100}%` }}
              />
            </div>
            <div className="w-16 text-right text-sm font-medium text-slate-700">
              {counts.total}
              {counts.modified > 0 && (
                <span className="text-orange-500 ml-1">(+{counts.modified})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Herramientas de Importación/Exportación
// ═══════════════════════════════════════════════════════════════════════════

interface ToolsProps {
  onRefresh: () => void;
  onExport: () => void;
  onImport: (data: Record<string, string>) => void;
  onSync: () => void;
}

export function TextTools({ onRefresh, onExport, onImport, onSync }: ToolsProps) {
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      const data = JSON.parse(content);
      onImport(data);
    } catch (error) {
      log.error('Error importing:', error);
      alert('Error importando archivo. Asegúrate de que es un JSON válido.');
    }
    setImporting(false);
    e.target.value = '';
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/text-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      });
      const data = await response.json();
      
      if (data.ok) {
        alert(`Sincronización completada.\n\nFaltan en CA: ${data.missingInCa.length} claves\nFaltan en ES: ${data.missingInEs.length} claves`);
        onSync();
      }
    } catch (error) {
      log.error('Error syncing:', error);
    }
    setSyncing(false);
  };

  const handleRestore = async (locale: 'es' | 'ca') => {
    if (!confirm(`¿Restaurar ${locale.toUpperCase()}.json desde el último backup?`)) return;

    try {
      const response = await fetch('/api/admin/text-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', locale })
      });
      const data = await response.json();
      
      if (data.ok) {
        alert(`Restaurado ${locale}.json correctamente`);
        onRefresh();
      } else {
        alert(data.error || 'Error restaurando');
      }
    } catch (error) {
      log.error('Error restoring:', error);
    }
  };

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
      <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        🛠️ Herramientas
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Refrescar */}
        <button
          onClick={onRefresh}
          className="p-4 bg-slate-50 hover:bg-stone-100 rounded-xl transition-all flex flex-col items-center gap-2 text-center"
        >
          <span className="text-2xl">🔄</span>
          <span className="text-sm font-medium text-slate-700">Refrescar</span>
        </button>

        {/* Exportar */}
        <button
          onClick={onExport}
          className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all flex flex-col items-center gap-2 text-center"
        >
          <span className="text-2xl">📥</span>
          <span className="text-sm font-medium text-blue-700">Exportar JSON</span>
        </button>

        {/* Importar */}
        <label className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all flex flex-col items-center gap-2 text-center cursor-pointer">
          <span className="text-2xl">{importing ? '⏳' : '📤'}</span>
          <span className="text-sm font-medium text-green-700">
            {importing ? 'Importando...' : 'Importar JSON'}
          </span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
            disabled={importing}
          />
        </label>

        {/* Sincronizar idiomas */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all flex flex-col items-center gap-2 text-center disabled:opacity-50"
        >
          <span className="text-2xl">{syncing ? '⏳' : '🌐'}</span>
          <span className="text-sm font-medium text-purple-700">
            {syncing ? 'Sincronizando...' : 'Sync ES↔CA'}
          </span>
        </button>
      </div>

      {/* Restaurar backups */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-sm text-slate-500 mb-3">Restaurar desde backup:</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleRestore('es')}
            className="px-4 py-2 text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
          >
            ↩️ Restaurar ES
          </button>
          <button
            onClick={() => handleRestore('ca')}
            className="px-4 py-2 text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
          >
            ↩️ Restaurar CA
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Búsqueda Avanzada
// ═══════════════════════════════════════════════════════════════════════════

interface SearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  resultCount: number;
  filters: {
    showModified: boolean;
    showComparison: boolean;
    section: string | null;
  };
  onFilterChange: (key: string, value: boolean | string | null) => void;
  sections: Array<{ id: string; name: string; icon: string }>;
}

export function AdvancedSearch({
  searchTerm,
  onSearchChange,
  resultCount,
  filters,
  onFilterChange,
  sections
}: SearchProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 p-4">
      {/* Barra de búsqueda principal */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por path o contenido... (ej: hero.title, boda, garantía)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-3 pl-11 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${
            showFilters || Object.values(filters).some(v => v)
              ? 'bg-orange-500 text-white'
              : 'bg-stone-100 text-slate-600 hover:bg-stone-100'
          }`}
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Filtros</span>
        </button>

        <div className="text-sm text-slate-500 whitespace-nowrap">
          {resultCount} resultados
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-wrap gap-3">
            {/* Solo modificados */}
            <button
              onClick={() => onFilterChange('showModified', !filters.showModified)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filters.showModified
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 text-slate-600 hover:bg-stone-100'
              }`}
            >
              ✏️ Solo modificados
            </button>

            {/* Comparación ES/CA */}
            <button
              onClick={() => onFilterChange('showComparison', !filters.showComparison)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filters.showComparison
                  ? 'bg-blue-500 text-white'
                  : 'bg-stone-100 text-slate-600 hover:bg-stone-100'
              }`}
            >
              🌐 Mostrar ES/CA
            </button>

            {/* Limpiar filtros */}
            {(filters.showModified || filters.showComparison || filters.section) && (
              <button
                onClick={() => {
                  onFilterChange('showModified', false);
                  onFilterChange('showComparison', false);
                  onFilterChange('section', null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          {/* Selector de sección */}
          <div>
            <label className="block text-sm text-slate-600 mb-2">
              Filtrar por sección:
            </label>
            <select
              value={filters.section || ''}
              onChange={(e) => onFilterChange('section', e.target.value || null)}
              className="w-full md:w-auto px-4 py-2 rounded-lg border border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Todas las secciones</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.icon} {section.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Editor de Texto Individual
// ═══════════════════════════════════════════════════════════════════════════

interface TextEditorProps {
  path: string;
  value: string;
  originalValue: string;
  caValue?: string;
  onChange: (value: string) => void;
  onRevert: () => void;
  showComparison: boolean;
  searchTerm?: string;
}

export function TextEditor({
  path,
  value,
  originalValue,
  caValue,
  onChange,
  onRevert,
  showComparison,
  searchTerm
}: TextEditorProps) {
  const isModified = value !== originalValue;
  const [isExpanded, setIsExpanded] = useState(false);

  // Highlight de búsqueda
  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
      ) : part
    );
  };

  return (
    <div
      className={`bg-stone-50 rounded-xl border transition-all ${
        isModified
          ? 'border-orange-300 shadow-md shadow-orange-100'
          : 'border-stone-200 hover:border-stone-200'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm text-slate-500 break-all font-mono bg-stone-100 px-2 py-1 rounded">
                {highlightText(path)}
              </code>
              {isModified && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                  ✏️ Modificado
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isModified && (
              <button
                onClick={onRevert}
                className="text-xs px-3 py-1 rounded-lg bg-stone-100 text-slate-600 hover:bg-stone-100 transition-colors"
              >
                ↩️ Revertir
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs px-3 py-1 rounded-lg bg-stone-100 text-slate-600 hover:bg-stone-100 transition-colors"
            >
              {isExpanded ? '▲ Colapsar' : '▼ Expandir'}
            </button>
            <span className="text-xs text-slate-400 tabular-nums">
              {value.length} chars
            </span>
          </div>
        </div>

        {/* Editor */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={isExpanded ? 6 : value.length > 100 ? 3 : value.length > 50 ? 2 : 1}
          className={`w-full px-4 py-3 rounded-lg border transition-all resize-none font-sans ${
            isModified
              ? 'border-orange-300 bg-orange-50/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              : 'border-stone-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
          }`}
          placeholder="Texto vacío..."
        />

        {/* Comparación ES/CA */}
        {showComparison && caValue !== undefined && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
              <span className="font-semibold">🇪🇸 Català:</span>
              {caValue === value && (
                <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                  ⚠️ Igual que ES
                </span>
              )}
              {!caValue && (
                <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded">
                  ❌ Sin traducción
                </span>
              )}
            </div>
            <p className="text-sm text-blue-800">{caValue || '(vacío)'}</p>
          </div>
        )}

        {/* Valor original */}
        {isModified && (
          <div className="mt-2 p-2 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-100">
            <span className="font-medium">Original:</span>{' '}
            <span className="italic">{originalValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Bulk Actions
// ═══════════════════════════════════════════════════════════════════════════

interface BulkActionsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkRevert: () => void;
  onBulkDelete: () => void;
}

export function BulkActions({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBulkRevert,
  onBulkDelete
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-stone-50 text-slate-700 px-6 py-3 rounded-full shadow-xl flex items-center gap-4">
        <span className="text-sm">
          <strong>{selectedCount}</strong> seleccionados
        </span>
        <div className="h-4 w-px bg-stone-200" />
        <button
          onClick={onSelectAll}
          className="text-sm hover:text-orange-400 transition-colors"
        >
          Seleccionar todo
        </button>
        <button
          onClick={onDeselectAll}
          className="text-sm hover:text-orange-400 transition-colors"
        >
          Deseleccionar
        </button>
        <div className="h-4 w-px bg-stone-200" />
        <button
          onClick={onBulkRevert}
          className="text-sm bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-full transition-colors"
        >
          ↩️ Revertir
        </button>
      </div>
    </div>
  );
}

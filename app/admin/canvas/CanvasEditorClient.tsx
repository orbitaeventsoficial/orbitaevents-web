'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { OwnerControlStrip } from '@/app/admin/components/OwnerControlStrip';
import { useToast } from '@/app/admin/components/ToastProvider';
import { CANVAS_COLOR_OPTIONS } from '@/lib/constants';
import { ADMIN_CANVAS_PRESET_SIZES, ADMIN_CANVAS_TEMPLATES } from '@/lib/constants/admin';
import { log } from '@/lib/logger';

// --- Types ------------------------------------------------------------------

type ElementType = 'text' | 'shape' | 'image';

interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  // Text
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  // Shape
  shapeType?: 'rect' | 'circle' | 'line';
  fill?: string;
  borderRadius?: number;
  // Image
  imageUrl?: string;
}

interface CanvasTemplate {
  name: string;
  width: number;
  height: number;
  bg: string;
  elements: CanvasElement[];
}

type PresetSize = 'story' | 'post' | 'landscape';
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

// --- Constants --------------------------------------------------------------

const PRESET_SIZES: Record<PresetSize, { width: number; height: number; label: string }> = ADMIN_CANVAS_PRESET_SIZES;

const TEMPLATES: CanvasTemplate[] = ADMIN_CANVAS_TEMPLATES.map((template) => ({
  ...template,
  elements: template.elements.map((element) => ({ ...element })),
}));


let nextId = 100;
function genId() { return `el-${nextId++}`; }

// --- Component --------------------------------------------------------------

export default function CanvasEditorClient() {
  const toast = useToast();
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1920 });
  const [canvasBg, setCanvasBg] = useState('linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startW: number; startH: number; startX: number; startY: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = elements.find(e => e.id === selectedId) || null;
  const activePreset = useMemo(
    () =>
      (Object.keys(PRESET_SIZES) as PresetSize[]).find(
        (preset) =>
          PRESET_SIZES[preset].width === canvasSize.width &&
          PRESET_SIZES[preset].height === canvasSize.height,
      ) ?? null,
    [canvasSize.height, canvasSize.width],
  );
  const selectedTemplateName = useMemo(
    () =>
      TEMPLATES.find(
        (template) =>
          template.width === canvasSize.width &&
          template.height === canvasSize.height &&
          template.bg === canvasBg &&
          template.elements.length === elements.length,
      )?.name ?? null,
    [canvasBg, canvasSize.height, canvasSize.width, elements.length],
  );
  const strip = useMemo<OwnerStripConfig>(() => {
    const textCount = elements.filter((element) => element.type === 'text').length;
    const shapeCount = elements.filter((element) => element.type === 'shape').length;

    const systemItems: string[] = [
      `${canvasSize.width}×${canvasSize.height}px${activePreset ? ` · ${PRESET_SIZES[activePreset].label}` : ''}`,
      `${elements.length} ${elements.length === 1 ? 'element' : 'elements'} · ${textCount} text · ${shapeCount} formes`,
    ];
    if (selectedTemplateName) {
      systemItems.push(`Base carregada: ${selectedTemplateName}`);
    }

    const manualItems: string[] = [];
    if (selected) {
      manualItems.push(`Element seleccionat: ${selected.type === 'text' ? 'text' : selected.type === 'shape' ? 'forma' : 'imatge'}`);
    }
    if (dragging) {
      manualItems.push('Hi ha un element en moviment');
    }
    if (resizing) {
      manualItems.push('Hi ha un element redimensionant-se');
    }
    if (exporting) {
      manualItems.push('Exportació PNG en curs');
    }
    if (elements.length === 0) {
      manualItems.push('Canvas buit, pendent de crear la primera peça');
    }

    const nextStep =
      exporting
        ? {
            eyebrow: 'Següent pas · Exportació',
            title: 'Esperar que acabi l’exportació',
            detail: 'El canvas s’està renderitzant a PNG. No obris un altre front fins que acabi la descàrrega.',
            href: '#canvas-toolbar',
            ctaLabel: 'Veure toolbar',
          }
        : elements.length === 0
          ? {
              eyebrow: 'Següent pas · Primera peça',
              title: 'Carregar plantilla o afegir text',
              detail: 'El canvas és buit. El camí net és carregar una plantilla o crear el primer element abans d’ajustar propietats.',
              href: '#canvas-templates',
              ctaLabel: 'Obrir plantilles',
            }
          : selected
            ? {
                eyebrow: 'Següent pas · Ajust fi',
                title: 'Editar l’element seleccionat',
                detail: 'Ja tens focus actiu. Ajusta posició, mida, color o copy abans d’exportar la peça.',
                href: '#canvas-properties',
                ctaLabel: 'Obrir propietats',
              }
            : {
                eyebrow: 'Següent pas',
                title: 'Seleccionar capa o exportar',
                detail: 'La composició ja és viva. Pots seleccionar una capa per polir-la o exportar directament el PNG.',
                href: '#canvas-layers',
                ctaLabel: 'Obrir capes',
              };

    return {
      system: {
        eyebrow: 'Automàtic · Composició',
        title: elements.length > 0 ? 'Canvas en construcció' : 'Canvas buit',
        tone: elements.length > 0 ? 'info' : 'warning',
        items: systemItems,
        emptyText: 'Sense configuració visible al canvas.',
      },
      manual: {
        eyebrow: 'Manual · Sessió',
        title: manualItems.length === 0 ? 'Cap tensió manual' : `${manualItems.length} senyals de sessió`,
        tone: exporting || dragging || resizing ? 'warning' : manualItems.length > 0 ? 'info' : 'success',
        items: manualItems,
        emptyText: 'Sense selecció, moviments ni exportació en curs.',
      },
      nextStep,
    };
  }, [
    activePreset,
    canvasSize.height,
    canvasSize.width,
    dragging,
    elements,
    exporting,
    resizing,
    selected,
    selectedTemplateName,
  ]);

  // Scale canvas to fit viewport
  const CANVAS_MAX_H = 700;
  const scale = Math.min(CANVAS_MAX_H / canvasSize.height, 500 / canvasSize.width);

  // --- Template loading ---------------------------------------------------

  function loadTemplate(tpl: CanvasTemplate) {
    setCanvasSize({ width: tpl.width, height: tpl.height });
    setCanvasBg(tpl.bg);
    setElements(tpl.elements.map(e => ({ ...e })));
    setSelectedId(null);
  }

  function setPresetSize(preset: PresetSize) {
    const s = PRESET_SIZES[preset];
    setCanvasSize({ width: s.width, height: s.height });
  }

  // --- Element CRUD -------------------------------------------------------

  function addText() {
    const el: CanvasElement = {
      id: genId(), type: 'text',
      x: 80, y: canvasSize.height / 2 - 40, width: canvasSize.width - 160, height: 80,
      text: 'Text nou', fontSize: 48, fontWeight: 'normal', color: '#ffffff', textAlign: 'center',
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  }

  function addShape(shapeType: 'rect' | 'circle' | 'line') {
    const el: CanvasElement = {
      id: genId(), type: 'shape',
      x: canvasSize.width / 2 - 150, y: canvasSize.height / 2 - (shapeType === 'line' ? 2 : 75),
      width: 300, height: shapeType === 'line' ? 4 : 150,
      shapeType, fill: '#06b6d4', borderRadius: shapeType === 'circle' ? 999 : 0,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    setElements(prev => prev.filter(e => e.id !== selectedId));
    setSelectedId(null);
  }

  function duplicateSelected() {
    if (!selected) return;
    const dup = { ...selected, id: genId(), x: selected.x + 20, y: selected.y + 20 };
    setElements(prev => [...prev, dup]);
    setSelectedId(dup.id);
  }

  function moveLayer(dir: 'up' | 'down') {
    if (!selectedId) return;
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === selectedId);
      if (idx < 0) return prev;
      const newIdx = dir === 'up' ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  function updateElement(id: string, patch: Partial<CanvasElement>) {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }

  // --- Drag & Drop -------------------------------------------------------

  const handlePointerDown = useCallback((e: React.PointerEvent, elId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(elId);
    const el = elements.find(el => el.id === elId);
    if (!el) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const offsetX = (e.clientX - rect.left) / scale - el.x;
    const offsetY = (e.clientY - rect.top) / scale - el.y;
    setDragging({ id: elId, offsetX, offsetY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [elements, scale]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round((e.clientX - rect.left) / scale - dragging.offsetX);
      const y = Math.round((e.clientY - rect.top) / scale - dragging.offsetY);
      updateElement(dragging.id, { x, y });
    }
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / scale;
      const dy = (e.clientY - resizing.startY) / scale;
      updateElement(resizing.id, {
        width: Math.max(20, Math.round(resizing.startW + dx)),
        height: Math.max(10, Math.round(resizing.startH + dy)),
      });
    }
  }, [dragging, resizing, scale]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const handleResizeStart = useCallback((e: React.PointerEvent, elId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(el => el.id === elId);
    if (!el) return;
    setResizing({ id: elId, startW: el.width, startH: el.height, startX: e.clientX, startY: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [elements]);

  // --- Keyboard shortcuts -------------------------------------------------

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); e.preventDefault(); }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { duplicateSelected(); e.preventDefault(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // --- Export -------------------------------------------------------------

  async function exportPng() {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        w: String(canvasSize.width),
        h: String(canvasSize.height),
        bg: canvasBg,
        elements: JSON.stringify(elements),
      });
      const res = await fetch(`/api/canvas/custom?${params}`);
      if (!res.ok) throw new Error('Error generant imatge');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbita-canvas-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      log.error('Error exportant canvas', error);
      toast.error(error instanceof Error ? error.message : 'Error exportant la imatge');
    } finally {
      setExporting(false);
    }
  }

  // --- Render element -----------------------------------------------------

  function renderElement(el: CanvasElement) {
    const isSelected = el.id === selectedId;
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: el.x * scale,
      top: el.y * scale,
      width: el.width * scale,
      height: el.height * scale,
      cursor: dragging?.id === el.id ? 'grabbing' : 'grab',
      outline: isSelected ? '2px solid #06b6d4' : 'none',
      outlineOffset: 2,
      zIndex: isSelected ? 50 : undefined,
    };

    if (el.type === 'text') {
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            fontSize: (el.fontSize || 48) * scale,
            fontWeight: el.fontWeight || 'normal',
            color: el.color || '#fff',
            textAlign: el.textAlign || 'left',
            lineHeight: 1.1,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: 'center',
            justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
            userSelect: 'none',
          }}
          onPointerDown={e => handlePointerDown(e, el.id)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {el.text}
          {isSelected && (
            <div
              style={{ position: 'absolute', right: -4, bottom: -4, width: 10, height: 10, background: '#06b6d4', cursor: 'nwse-resize', borderRadius: 2 }}
              onPointerDown={e => handleResizeStart(e, el.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          )}
        </div>
      );
    }

    if (el.type === 'shape') {
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            backgroundColor: el.fill || '#06b6d4',
            borderRadius: el.shapeType === 'circle' ? '50%' : (el.borderRadius || 0) * scale,
          }}
          onPointerDown={e => handlePointerDown(e, el.id)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {isSelected && (
            <div
              style={{ position: 'absolute', right: -4, bottom: -4, width: 10, height: 10, background: '#06b6d4', cursor: 'nwse-resize', borderRadius: 2 }}
              onPointerDown={e => handleResizeStart(e, el.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          )}
        </div>
      );
    }

    return null;
  }

  // --- UI -----------------------------------------------------------------

  return (
    <div className="space-y-6">
      <OwnerControlStrip
        system={strip.system}
        manual={strip.manual}
        nextStep={strip.nextStep}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
      {/* LEFT - Canvas */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div id="canvas-toolbar" className="mb-4 flex flex-wrap gap-2">
          <button onClick={addText} className="ap-btn ap-btn--secondary min-h-[40px] text-sm">+ Text</button>
          <button onClick={() => addShape('rect')} className="ap-btn ap-btn--secondary min-h-[40px] text-sm">+ Rectangle</button>
          <button onClick={() => addShape('circle')} className="ap-btn ap-btn--secondary min-h-[40px] text-sm">+ Cercle</button>
          <button onClick={() => addShape('line')} className="ap-btn ap-btn--secondary min-h-[40px] text-sm">+ Línia</button>
          <div className="mx-1 hidden w-px bg-white/10 sm:block" />
          {selectedId && (
            <>
              <button onClick={duplicateSelected} className="ap-btn ap-btn--secondary min-h-[40px] text-sm">Duplicar</button>
              <button onClick={() => moveLayer('up')} className="ap-btn ap-btn--secondary min-h-[40px] text-sm">Pujar Capa</button>
              <button onClick={() => moveLayer('down')} className="ap-btn ap-btn--secondary min-h-[40px] text-sm">Baixar Capa</button>
              <button onClick={deleteSelected} className="ap-btn min-h-[40px] text-sm admin-tone-soft-danger admin-tone-border-danger admin-tone-text-danger">Eliminar</button>
            </>
          )}
          <div className="hidden flex-1 sm:block" />
          <button
            onClick={exportPng}
            disabled={exporting}
            className="ap-btn ap-btn--primary min-h-[44px] w-full text-sm disabled:opacity-50 sm:ml-auto sm:w-auto"
          >
            {exporting ? 'Exportant...' : 'Descarregar PNG'}
          </button>
        </div>

        {/* Canvas area */}
        <div
          className="relative mx-auto max-w-full overflow-hidden rounded-xl border admin-card-glass"
          style={{
            width: canvasSize.width * scale,
            height: canvasSize.height * scale,
            background: canvasBg,
          }}
          ref={canvasRef}
          onClick={() => setSelectedId(null)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {elements.map(renderElement)}
        </div>

        <p className="mt-2 text-center text-xs">
          {canvasSize.width}×{canvasSize.height}px · {elements.length} elements · Arrossega per moure, cantonada per redimensionar
        </p>
      </div>

      {/* RIGHT - Panel */}
      <div className="w-full lg:w-72 space-y-4">
        {/* Templates */}
        <div id="canvas-templates" className="rounded-xl border p-4 admin-card-glass">
          <h3 className="mb-3 text-sm font-medium">Plantilles</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.name}
                onClick={() => loadTemplate(tpl)}
                className="rounded-xl border px-3 py-2 text-left text-xs transition-colors admin-tone-idle"
              >
                {tpl.name}
                <span className="block text-[10px]">{tpl.width}×{tpl.height}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas size */}
        <div className="rounded-xl border p-4 admin-card-glass">
          <h3 className="mb-3 text-sm font-medium">Mida</h3>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            {(Object.keys(PRESET_SIZES) as PresetSize[]).map(k => (
              <button
                key={k}
                onClick={() => setPresetSize(k)}
                className={`min-h-[40px] flex-1 rounded-xl border px-2 py-1.5 text-xs ${
                  canvasSize.width === PRESET_SIZES[k].width && canvasSize.height === PRESET_SIZES[k].height
                    ? 'border admin-tone-soft-info admin-tone-border-info admin-tone-text-info'
                    : 'border admin-tone-idle'
                }`}
              >
                {PRESET_SIZES[k].label}
              </button>
            ))}
          </div>
          <label className="mb-1 block text-xs">Fons</label>
          <input
            type="text"
            value={canvasBg}
            onChange={e => setCanvasBg(e.target.value)}
            className="ap-input px-3 py-1.5 text-xs"
            placeholder="#0a0a0a o linear-gradient(...)"
          />
        </div>

        {/* Element properties */}
        {selected && (
          <div id="canvas-properties" className="rounded-xl border p-4 admin-card-glass">
            <h3 className="mb-3 text-sm font-medium">
              Propietats - {selected.type === 'text' ? 'Text' : selected.type === 'shape' ? 'Forma' : 'Imatge'}
            </h3>

            {/* Position */}
                <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-0.5 block text-[10px]">X</label>
                <input type="number" min={0} value={selected.x} onChange={e => updateElement(selected.id, { x: +e.target.value })}
                  className="ap-input px-2 py-1 text-xs" />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px]">Y</label>
                <input type="number" min={0} value={selected.y} onChange={e => updateElement(selected.id, { y: +e.target.value })}
                  className="ap-input px-2 py-1 text-xs" />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px]">Ample</label>
                <input type="number" value={selected.width} onChange={e => updateElement(selected.id, { width: +e.target.value })} min={10}
                  className="ap-input px-2 py-1 text-xs" />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px]">Alt</label>
                <input type="number" value={selected.height} onChange={e => updateElement(selected.id, { height: +e.target.value })} min={10}
                  className="ap-input px-2 py-1 text-xs" />
              </div>
            </div>

            {/* Text properties */}
            {selected.type === 'text' && (
              <>
                <label className="mb-0.5 block text-[10px]">Text</label>
                <textarea
                  value={selected.text || ''}
                  onChange={e => updateElement(selected.id, { text: e.target.value })}
                  rows={3}
                  className="ap-input mb-2 resize-none px-2 py-1.5 text-xs"
                />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="mb-0.5 block text-[10px]">Mida</label>
                    <input type="number" value={selected.fontSize || 48} onChange={e => updateElement(selected.id, { fontSize: +e.target.value })} min={8} max={300}
                      className="ap-input px-2 py-1 text-xs" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px]">Pes</label>
                    <select value={selected.fontWeight || 'normal'} onChange={e => updateElement(selected.id, { fontWeight: e.target.value })}
                      className="ap-input px-2 py-1 text-xs" aria-label="Pes de la font">
                      <option value="normal">Normal</option>
                      <option value="bold">Negreta</option>
                    </select>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="mb-0.5 block text-[10px]">Alineació</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['left', 'center', 'right'] as const).map(a => (
                      <button key={a} onClick={() => updateElement(selected.id, { textAlign: a })}
                        className={`flex-1 rounded-lg border px-2 py-1 text-xs ${selected.textAlign === a ? 'admin-tone-soft-info admin-tone-border-info admin-tone-text-info' : 'admin-tone-idle'}`}>
                        {a === 'left' ? 'Esq.' : a === 'center' ? 'Centre' : 'Dreta'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Color */}
            <label className="mb-0.5 block text-[10px]">
              {selected.type === 'text' ? 'Color text' : 'Color fons'}
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {CANVAS_COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => updateElement(selected.id, selected.type === 'text' ? { color: c } : { fill: c })}
                  className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c,
                    borderColor: (selected.type === 'text' ? selected.color : selected.fill) === c ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <input
              type="text"
              value={(selected.type === 'text' ? selected.color : selected.fill) || ''}
              onChange={e => updateElement(selected.id, selected.type === 'text' ? { color: e.target.value } : { fill: e.target.value })}
              className="ap-input px-2 py-1 text-xs"
              placeholder="#ffffff o rgba(...)"
            />

            {/* Border radius for shapes */}
            {selected.type === 'shape' && selected.shapeType === 'rect' && (
              <div className="mt-2">
                <label className="mb-0.5 block text-[10px]">Cantonades</label>
                <input type="number" value={selected.borderRadius || 0} onChange={e => updateElement(selected.id, { borderRadius: +e.target.value })} min={0}
                  className="ap-input px-2 py-1 text-xs" />
              </div>
            )}
          </div>
        )}

        {/* Layers */}
        <div id="canvas-layers" className="rounded-xl border p-4 admin-card-glass">
          <h3 className="mb-3 text-sm font-medium">Capes ({elements.length})</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...elements].reverse().map(el => (
              <button
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs truncate ${
                  el.id === selectedId ? 'admin-tone-soft-info admin-tone-border-info admin-tone-text-info' : 'admin-tone-idle'
                }`}
              >
                {el.type === 'text' ? `T: ${(el.text || '').slice(0, 25)}` : `Forma: ${el.shapeType || 'forma'}`}
              </button>
            ))}
            {elements.length === 0 && <p className="text-xs">Sense elements</p>}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

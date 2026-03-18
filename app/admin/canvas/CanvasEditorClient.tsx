'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Constants ──────────────────────────────────────────────────────────────

const PRESET_SIZES: Record<PresetSize, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: 'Story (9:16)' },
  post: { width: 1080, height: 1080, label: 'Post (1:1)' },
  landscape: { width: 1920, height: 1080, label: 'Horitzontal (16:9)' },
};

const TEMPLATES: CanvasTemplate[] = [
  {
    name: 'Promo Event',
    width: 1080,
    height: 1920,
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    elements: [
      { id: 't1', type: 'shape', x: 0, y: 0, width: 1080, height: 1920, shapeType: 'rect', fill: 'rgba(6,182,212,0.08)' },
      { id: 't2', type: 'text', x: 80, y: 200, width: 920, height: 120, text: 'ORBITA EVENTS', fontSize: 72, fontWeight: 'bold', color: '#06b6d4', textAlign: 'center' },
      { id: 't3', type: 'text', x: 80, y: 400, width: 920, height: 200, text: 'El teu event\ncom mai l\'has\nimaginat', fontSize: 96, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      { id: 't4', type: 'shape', x: 390, y: 700, width: 300, height: 4, shapeType: 'rect', fill: '#06b6d4', borderRadius: 2 },
      { id: 't5', type: 'text', x: 80, y: 780, width: 920, height: 100, text: 'DJ · Il·luminació · So Professional', fontSize: 36, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
      { id: 't6', type: 'shape', x: 240, y: 1400, width: 600, height: 80, shapeType: 'rect', fill: '#06b6d4', borderRadius: 40 },
      { id: 't7', type: 'text', x: 240, y: 1415, width: 600, height: 50, text: 'RESERVA ARA', fontSize: 32, fontWeight: 'bold', color: '#000000', textAlign: 'center' },
      { id: 't8', type: 'text', x: 80, y: 1700, width: 920, height: 40, text: 'www.orbitaevents.com', fontSize: 28, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
    ],
  },
  {
    name: 'Oferta Flash',
    width: 1080,
    height: 1080,
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1c1917 100%)',
    elements: [
      { id: 'o1', type: 'text', x: 80, y: 80, width: 920, height: 60, text: 'OFERTA LIMITADA', fontSize: 36, fontWeight: 'bold', color: '#f97316', textAlign: 'center' },
      { id: 'o2', type: 'text', x: 80, y: 250, width: 920, height: 200, text: '-15%', fontSize: 200, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      { id: 'o3', type: 'text', x: 80, y: 500, width: 920, height: 80, text: 'en tots els packs', fontSize: 48, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
      { id: 'o4', type: 'shape', x: 340, y: 640, width: 400, height: 4, shapeType: 'rect', fill: '#f97316', borderRadius: 2 },
      { id: 'o5', type: 'text', x: 80, y: 700, width: 920, height: 60, text: 'Codi: FLASH15', fontSize: 40, fontWeight: 'bold', color: '#f97316', textAlign: 'center' },
      { id: 'o6', type: 'text', x: 80, y: 820, width: 920, height: 50, text: 'Vàlid fins diumenge', fontSize: 32, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
      { id: 'o7', type: 'text', x: 80, y: 960, width: 920, height: 40, text: 'ORBITA EVENTS · orbitaevents.com', fontSize: 24, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
    ],
  },
  {
    name: 'Testimoni',
    width: 1080,
    height: 1920,
    bg: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
    elements: [
      { id: 'r1', type: 'text', x: 80, y: 200, width: 920, height: 60, text: '★★★★★', fontSize: 56, color: '#eab308', textAlign: 'center' },
      { id: 'r2', type: 'text', x: 100, y: 400, width: 880, height: 400, text: '"La millor festa de\nla nostra vida.\nGràcies Òrbita!"', fontSize: 56, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      { id: 'r3', type: 'shape', x: 440, y: 900, width: 200, height: 4, shapeType: 'rect', fill: 'rgba(255,255,255,0.2)', borderRadius: 2 },
      { id: 'r4', type: 'text', x: 80, y: 970, width: 920, height: 50, text: '— Maria i Joan, Boda 2026', fontSize: 32, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
      { id: 'r5', type: 'text', x: 80, y: 1600, width: 920, height: 60, text: 'ORBITA EVENTS', fontSize: 40, fontWeight: 'bold', color: '#06b6d4', textAlign: 'center' },
      { id: 'r6', type: 'text', x: 80, y: 1700, width: 920, height: 40, text: 'Reserva el teu event · orbitaevents.com', fontSize: 24, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
    ],
  },
  {
    name: 'Buit',
    width: 1080,
    height: 1080,
    bg: '#0a0a0a',
    elements: [],
  },
];

const COLORS = ['#ffffff', '#06b6d4', '#f97316', '#eab308', '#22c55e', '#ec4899', '#a855f7', '#ef4444', '#000000', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)'];

let nextId = 100;
function genId() { return `el-${nextId++}`; }

// ─── Component ──────────────────────────────────────────────────────────────

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

  // Scale canvas to fit viewport
  const CANVAS_MAX_H = 700;
  const scale = Math.min(CANVAS_MAX_H / canvasSize.height, 500 / canvasSize.width);

  // ─── Template loading ───────────────────────────────────────────────────

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

  // ─── Element CRUD ───────────────────────────────────────────────────────

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

  // ─── Drag & Drop ───────────────────────────────────────────────────────

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

  // ─── Keyboard shortcuts ─────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); e.preventDefault(); }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { duplicateSelected(); e.preventDefault(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ─── Export ─────────────────────────────────────────────────────────────

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
    } catch {
      console.error('Error exportant canvas');
      toast.error('Error exportant la imatge');
    } finally {
      setExporting(false);
    }
  }

  // ─── Render element ─────────────────────────────────────────────────────

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

  // ─── UI ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT — Canvas */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={addText} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">+ Text</button>
          <button onClick={() => addShape('rect')} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">+ Rectangle</button>
          <button onClick={() => addShape('circle')} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">+ Cercle</button>
          <button onClick={() => addShape('line')} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">+ Línia</button>
          <div className="w-px bg-white/10 mx-1" />
          {selectedId && (
            <>
              <button onClick={duplicateSelected} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">Duplicar</button>
              <button onClick={() => moveLayer('up')} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">↑ Capa</button>
              <button onClick={() => moveLayer('down')} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">↓ Capa</button>
              <button onClick={deleteSelected} className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm">Eliminar</button>
            </>
          )}
          <div className="flex-1" />
          <button
            onClick={exportPng}
            disabled={exporting}
            className="px-4 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium disabled:opacity-50"
          >
            {exporting ? 'Exportant...' : 'Descarregar PNG'}
          </button>
        </div>

        {/* Canvas area */}
        <div
          className="relative overflow-hidden rounded-xl border border-white/10 mx-auto"
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

        <p className="text-white/30 text-xs mt-2 text-center">
          {canvasSize.width}×{canvasSize.height}px · {elements.length} elements · Arrossega per moure, cantonada per redimensionar
        </p>
      </div>

      {/* RIGHT — Panel */}
      <div className="w-full lg:w-72 space-y-4">
        {/* Templates */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-white/70 text-sm font-medium mb-3">Plantilles</h3>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.name}
                onClick={() => loadTemplate(tpl)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 text-xs text-left"
              >
                {tpl.name}
                <span className="block text-white/30 text-[10px]">{tpl.width}×{tpl.height}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas size */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-white/70 text-sm font-medium mb-3">Mida</h3>
          <div className="flex gap-2 mb-3">
            {(Object.keys(PRESET_SIZES) as PresetSize[]).map(k => (
              <button
                key={k}
                onClick={() => setPresetSize(k)}
                className={`flex-1 px-2 py-1.5 rounded-xl text-xs border ${
                  canvasSize.width === PRESET_SIZES[k].width && canvasSize.height === PRESET_SIZES[k].height
                    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                {PRESET_SIZES[k].label}
              </button>
            ))}
          </div>
          <label className="block text-white/40 text-xs mb-1">Fons</label>
          <input
            type="text"
            value={canvasBg}
            onChange={e => setCanvasBg(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            placeholder="#0a0a0a o linear-gradient(...)"
          />
        </div>

        {/* Element properties */}
        {selected && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-white/70 text-sm font-medium mb-3">
              Propietats — {selected.type === 'text' ? 'Text' : selected.type === 'shape' ? 'Forma' : 'Imatge'}
            </h3>

            {/* Position */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-white/40 text-[10px] mb-0.5">X</label>
                <input type="number" value={selected.x} onChange={e => updateElement(selected.id, { x: +e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:ring-1 focus:ring-cyan-500/50" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] mb-0.5">Y</label>
                <input type="number" value={selected.y} onChange={e => updateElement(selected.id, { y: +e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:ring-1 focus:ring-cyan-500/50" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] mb-0.5">Ample</label>
                <input type="number" value={selected.width} onChange={e => updateElement(selected.id, { width: +e.target.value })} min={10}
                  className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:ring-1 focus:ring-cyan-500/50" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] mb-0.5">Alt</label>
                <input type="number" value={selected.height} onChange={e => updateElement(selected.id, { height: +e.target.value })} min={10}
                  className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:ring-1 focus:ring-cyan-500/50" />
              </div>
            </div>

            {/* Text properties */}
            {selected.type === 'text' && (
              <>
                <label className="block text-white/40 text-[10px] mb-0.5">Text</label>
                <textarea
                  value={selected.text || ''}
                  onChange={e => updateElement(selected.id, { text: e.target.value })}
                  rows={3}
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs mb-2 resize-none focus:ring-1 focus:ring-cyan-500/50"
                />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-white/40 text-[10px] mb-0.5">Mida</label>
                    <input type="number" value={selected.fontSize || 48} onChange={e => updateElement(selected.id, { fontSize: +e.target.value })} min={8} max={300}
                      className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:ring-1 focus:ring-cyan-500/50" />
                  </div>
                  <div>
                    <label className="block text-white/40 text-[10px] mb-0.5">Pes</label>
                    <select value={selected.fontWeight || 'normal'} onChange={e => updateElement(selected.id, { fontWeight: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:ring-1 focus:ring-cyan-500/50" aria-label="Pes de la font">
                      <option value="normal">Normal</option>
                      <option value="bold">Negreta</option>
                    </select>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-white/40 text-[10px] mb-0.5">Alineació</label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map(a => (
                      <button key={a} onClick={() => updateElement(selected.id, { textAlign: a })}
                        className={`flex-1 px-2 py-1 rounded-lg text-xs ${selected.textAlign === a ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                        {a === 'left' ? '◁' : a === 'center' ? '◈' : '▷'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Color */}
            <label className="block text-white/40 text-[10px] mb-0.5">
              {selected.type === 'text' ? 'Color text' : 'Color fons'}
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {COLORS.map(c => (
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
              className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:ring-1 focus:ring-cyan-500/50"
              placeholder="#ffffff o rgba(...)"
            />

            {/* Border radius for shapes */}
            {selected.type === 'shape' && selected.shapeType === 'rect' && (
              <div className="mt-2">
                <label className="block text-white/40 text-[10px] mb-0.5">Cantonades</label>
                <input type="number" value={selected.borderRadius || 0} onChange={e => updateElement(selected.id, { borderRadius: +e.target.value })} min={0}
                  className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:ring-1 focus:ring-cyan-500/50" />
              </div>
            )}
          </div>
        )}

        {/* Layers */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-white/70 text-sm font-medium mb-3">Capes ({elements.length})</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...elements].reverse().map(el => (
              <button
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs truncate ${
                  el.id === selectedId ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:bg-white/5'
                }`}
              >
                {el.type === 'text' ? `T: ${(el.text || '').slice(0, 25)}` : `■ ${el.shapeType || 'forma'}`}
              </button>
            ))}
            {elements.length === 0 && <p className="text-white/30 text-xs">Sense elements</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

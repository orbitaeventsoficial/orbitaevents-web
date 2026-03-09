'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS DE BLOCS
// ═══════════════════════════════════════════════════════════════════════════

type BlockType = 'heading' | 'text' | 'button' | 'info_table' | 'highlight' | 'divider' | 'image';

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, string>;
}

const BLOCK_CATALOG: { type: BlockType; label: string; icon: string; category: string }[] = [
  { type: 'heading', label: 'Títol', icon: 'H', category: 'text' },
  { type: 'text', label: 'Text', icon: '¶', category: 'text' },
  { type: 'button', label: 'Botó CTA', icon: '▶', category: 'action' },
  { type: 'info_table', label: 'Taula info', icon: '☰', category: 'data' },
  { type: 'highlight', label: 'Destacat', icon: '◆', category: 'data' },
  { type: 'divider', label: 'Separador', icon: '—', category: 'layout' },
];

function createBlock(type: BlockType): Block {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const defaults: Record<BlockType, Record<string, string>> = {
    heading: { text: 'Hola {{clientName}}! 🎉', size: '26' },
    text: { text: 'Escriu el teu text aquí. Pots usar {{variables}} per personalitzar.' },
    button: { text: 'Acció principal', url: '{{reviewUrl}}', color: '#06b6d4' },
    info_table: { rows: 'Referència:#{{reference}}\nData:{{eventDate}}\nServei:{{packName}}' },
    highlight: { text: '{{depositAmount}} €', subtitle: 'Import pendent', color: '#06b6d4' },
    divider: {},
    image: { url: '', alt: 'Imatge' },
  };
  return { id, type, data: defaults[type] || {} };
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOC → HTML
// ═══════════════════════════════════════════════════════════════════════════

function blockToHtml(block: Block): string {
  switch (block.type) {
    case 'heading':
      return `<div style="font-size:${block.data.size || 26}px;font-weight:800;color:#ffffff;line-height:1.3;">${block.data.text || ''}</div>`;
    case 'text':
      return `<div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">${(block.data.text || '').replace(/\n/g, '<br>')}</div>`;
    case 'button':
      return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;"><tr><td style="background:linear-gradient(135deg,${block.data.color || '#06b6d4'},#3b82f6);border-radius:12px;padding:14px 28px;"><a href="${block.data.url || '#'}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.3px;display:inline-block;">${block.data.text || 'Botó'}</a></td></tr></table>`;
    case 'info_table': {
      const rows = (block.data.rows || '').split('\n').filter(Boolean).map((row) => {
        const [label, ...rest] = row.split(':');
        const value = rest.join(':');
        return `<tr><td style="padding:10px 14px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.4);border-bottom:1px solid rgba(255,255,255,0.04);width:140px;">${label}</td><td style="padding:10px 14px;font-size:14px;font-weight:600;color:#e5e5e5;border-bottom:1px solid rgba(255,255,255,0.04);">${value}</td></tr>`;
      }).join('');
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">${rows}</table>`;
    }
    case 'highlight':
      return `<div style="margin:24px 0;padding:20px;background:rgba(${hexToRgb(block.data.color || '#06b6d4')},0.08);border:1px solid rgba(${hexToRgb(block.data.color || '#06b6d4')},0.15);border-radius:12px;text-align:center;"><div style="font-size:32px;font-weight:900;color:${block.data.color || '#06b6d4'};">${block.data.text || ''}</div>${block.data.subtitle ? `<div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,0.5);">${block.data.subtitle}</div>` : ''}</div>`;
    case 'divider':
      return '<div style="margin:24px 0;border-top:1px solid rgba(255,255,255,0.06);"></div>';
    default:
      return '';
  }
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `${r},${g},${b}`;
}

function blocksToFullHtml(blocks: Block[]): string {
  const content = blocks.map(blockToHtml).join('\n');
  return `<!doctype html>
<html lang="ca">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#e5e5e5;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0c1220 100%);padding:28px 32px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr>
<td style="width:52px;vertical-align:middle;"><div style="width:44px;height:44px;background:linear-gradient(135deg,#06b6d4,#3b82f6);border-radius:12px;text-align:center;line-height:44px;font-size:22px;font-weight:900;color:#fff;">Ò</div></td>
<td style="vertical-align:middle;"><div style="font-size:18px;font-weight:800;letter-spacing:0.3px;color:#ffffff;">Òrbita Events</div><div style="margin-top:3px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.45);">DJ · Esdeveniments · Festa</div></td>
</tr>
</table>
</td></tr>
<tr><td style="padding:32px;">
${content}
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);">
<div style="font-size:13px;color:rgba(255,255,255,0.5);">Gràcies per confiar en nosaltres.</div>
<div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,0.3);">📞 623 15 28 60 · ✉ info@orbitaevents.com · 🌐 orbitaevents.com</div>
<div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,0.2);">© ${new Date().getFullYear()} Òrbita Events · Granollers, Barcelona</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSE HTML → BLOCS (per carregar templates existents)
// ═══════════════════════════════════════════════════════════════════════════

function htmlToBlocks(html: string): Block[] {
  // Si no hi ha HTML, retornar blocs per defecte
  if (!html || html.length < 50) {
    return [createBlock('heading'), createBlock('text')];
  }
  // Simplificat: un sol bloc text amb el contingut
  return [{ id: 'imported', type: 'text' as BlockType, data: { text: 'Plantilla importada — edita els blocs a la dreta' } }];
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function TemplateEditorClient({
  slug,
  initialLocale,
}: {
  slug: string;
  initialLocale: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [locale, setLocale] = useState(initialLocale);
  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [variables, setVariables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedBlockType, setDraggedBlockType] = useState<BlockType | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${slug}?locale=${locale}`);
      if (!res.ok) throw new Error('Error carregant');
      const data = await res.json();

      setSubject(data.resolved?.subject || '');
      setVariables(data.template?.variables ? JSON.parse(data.template.variables) : []);

      if (data.template?.bodyHtml) {
        setBlocks(htmlToBlocks(data.template.bodyHtml));
      } else {
        // Carregar defaults com a blocs bàsics
        setBlocks([createBlock('heading'), createBlock('text')]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [slug, locale, toast]);

  useEffect(() => { loadTemplate(); }, [loadTemplate]);

  // Actualitzar preview
  useEffect(() => {
    if (previewRef.current) {
      const html = blocksToFullHtml(blocks);
      previewRef.current.srcdoc = html;
    }
  }, [blocks]);

  const saveTemplate = async () => {
    setSaving(true);
    try {
      const bodyHtml = blocksToFullHtml(blocks);
      const res = await fetchWithCsrf('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, locale, subject, bodyHtml }),
      });
      if (!res.ok) throw new Error('Error guardant');
      toast.success('Plantilla guardada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: BlockType, atIndex?: number) => {
    const block = createBlock(type);
    setBlocks((prev) => {
      const next = [...prev];
      const idx = atIndex !== undefined ? atIndex : next.length;
      next.splice(idx, 0, block);
      return next;
    });
    setSelectedBlockId(block.id);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (fromIdx: number, toIdx: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx > fromIdx ? toIdx - 1 : toIdx, 0, moved);
      return next;
    });
  };

  const updateBlockData = (id: string, field: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, [field]: value } } : b))
    );
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm" role="status">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Carregant plantilla...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra superior: locale + subject + guardar */}
      <div className="flex flex-col gap-3 rounded-2xl border admin-card-glass p-4 sm:flex-row sm:items-end">
        <div className="flex gap-2">
          {['ca', 'es', 'en'].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => { setLocale(l); router.push(`/admin/email-templates/${slug}?locale=${l}`); }}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
                l === locale ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <label htmlFor="subject" className="block text-xs font-medium mb-1">Assumpte</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={saveTemplate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-500 disabled:opacity-50 active:scale-[0.98]"
        >
          {saving ? 'Guardant...' : 'Guardar'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_1fr]">
        {/* Columna 1: Catàleg de blocs (drag source) */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Blocs disponibles</h3>
          <div className="space-y-1.5">
            {BLOCK_CATALOG.map((cat) => (
              <div
                key={cat.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', cat.type);
                  e.dataTransfer.effectAllowed = 'copy';
                  setDraggedBlockType(cat.type);
                }}
                onDragEnd={() => setDraggedBlockType(null)}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 cursor-grab active:cursor-grabbing transition-all hover:bg-white/10 hover:border-white/20"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">
                  {cat.icon}
                </span>
                <div>
                  <div className="text-sm font-medium">{cat.label}</div>
                  <div className="text-[10px] text-white/30">{cat.category}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Variables disponibles */}
          {variables.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">Variables</h3>
              <div className="flex flex-wrap gap-1">
                {variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`{{${v}}}`);
                      toast.success(`{{${v}}} copiat!`);
                    }}
                    className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                    title={`Clic per copiar {{${v}}}`}
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna 2: Blocs de l'email (drop zone + reorder) */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Contingut de l&apos;email</h3>
          <div
            className="min-h-[400px] rounded-2xl border border-dashed border-white/10 p-3 space-y-1"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = draggedBlockType ? 'copy' : 'move'; }}
            onDrop={(e) => {
              e.preventDefault();
              const type = e.dataTransfer.getData('text/plain');
              if (type && BLOCK_CATALOG.some((c) => c.type === type)) {
                addBlock(type as BlockType, dropTarget ?? undefined);
              }
              setDropTarget(null);
              setDraggedBlockType(null);
            }}
          >
            {blocks.length === 0 && (
              <div className="flex items-center justify-center h-48 text-sm text-white/20">
                Arrossega blocs aquí per construir l&apos;email
              </div>
            )}
            {blocks.map((block, idx) => {
              const catInfo = BLOCK_CATALOG.find((c) => c.type === block.type);
              const isSelected = selectedBlockId === block.id;

              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('block-id', block.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedBlockId(block.id);
                  }}
                  onDragEnd={() => setDraggedBlockId(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedBlockId && draggedBlockId !== block.id) {
                      setDropTarget(idx);
                    }
                  }}
                  onDrop={(e) => {
                    const sourceId = e.dataTransfer.getData('block-id');
                    if (sourceId) {
                      e.stopPropagation();
                      const fromIdx = blocks.findIndex((b) => b.id === sourceId);
                      if (fromIdx !== -1) moveBlock(fromIdx, idx);
                    }
                    setDropTarget(null);
                    setDraggedBlockId(null);
                  }}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={[
                    'group flex items-center gap-2 rounded-xl border p-2.5 cursor-grab active:cursor-grabbing transition-all',
                    isSelected ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20',
                    dropTarget === idx ? 'border-t-2 border-t-amber-400' : '',
                  ].join(' ')}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold flex-shrink-0">
                    {catInfo?.icon || '?'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{catInfo?.label}</div>
                    <div className="text-[10px] text-white/30 truncate">
                      {block.data.text || block.data.rows?.split('\n')[0] || block.type}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-xs text-rose-400 hover:bg-rose-500/10 transition-all"
                    aria-label="Eliminar bloc"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna 3: Preview + editor del bloc seleccionat */}
        <div className="space-y-3">
          {/* Editor del bloc seleccionat */}
          {selectedBlock && (
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                Editar: {BLOCK_CATALOG.find((c) => c.type === selectedBlock.type)?.label}
              </h3>

              {(selectedBlock.type === 'heading' || selectedBlock.type === 'text' || selectedBlock.type === 'button' || selectedBlock.type === 'highlight') && (
                <div>
                  <label className="block text-xs font-medium mb-1">Text</label>
                  {selectedBlock.type === 'text' ? (
                    <textarea
                      value={selectedBlock.data.text || ''}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'text', e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50"
                    />
                  ) : (
                    <input
                      type="text"
                      value={selectedBlock.data.text || ''}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'text', e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50"
                    />
                  )}
                </div>
              )}

              {selectedBlock.type === 'heading' && (
                <div>
                  <label className="block text-xs font-medium mb-1">Mida (px)</label>
                  <input
                    type="number"
                    value={selectedBlock.data.size || '26'}
                    onChange={(e) => updateBlockData(selectedBlock.id, 'size', e.target.value)}
                    min={14}
                    max={48}
                    className="w-24 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>
              )}

              {selectedBlock.type === 'button' && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">URL</label>
                    <input
                      type="text"
                      value={selectedBlock.data.url || ''}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'url', e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedBlock.data.color || '#06b6d4'}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'color', e.target.value)}
                      className="h-10 w-20 rounded-xl border border-white/20 bg-white/5"
                    />
                  </div>
                </>
              )}

              {selectedBlock.type === 'info_table' && (
                <div>
                  <label className="block text-xs font-medium mb-1">Files (una per línia, format Label:Valor)</label>
                  <textarea
                    value={selectedBlock.data.rows || ''}
                    onChange={(e) => updateBlockData(selectedBlock.id, 'rows', e.target.value)}
                    rows={6}
                    placeholder="Referència:#{{reference}}\nData:{{eventDate}}"
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>
              )}

              {selectedBlock.type === 'highlight' && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">Subtítol</label>
                    <input
                      type="text"
                      value={selectedBlock.data.subtitle || ''}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'subtitle', e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Color accent</label>
                    <input
                      type="color"
                      value={selectedBlock.data.color || '#06b6d4'}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'color', e.target.value)}
                      className="h-10 w-20 rounded-xl border border-white/20 bg-white/5"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="rounded-2xl border overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 text-xs font-semibold uppercase tracking-wide text-white/40">
              Preview
            </div>
            <iframe
              ref={previewRef}
              title="Preview email"
              className="w-full bg-[#0a0a0a]"
              style={{ height: '500px', border: 'none' }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

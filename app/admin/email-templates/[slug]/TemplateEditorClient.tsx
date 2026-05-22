'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { buildEmailTemplateHref } from '@/lib/admin/emailTemplateWorkspaceHref';
import { SITE_CONFIG } from '@/app/config/site-config';
import { EditorControlStrip } from '../../components/EditorControlStrip';
import SortableList from '../../components/SortableList';
import { useToast } from '../../components/ToastProvider';
import { SUPPORTED_LOCALES } from '@/lib/constants';

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

function blockToHtml(block: Block): string {
  switch (block.type) {
    case 'heading':
      return `<div style="font-size:${block.data.size || 26}px;font-weight:800;color:#ffffff;line-height:1.3;">${block.data.text || ''}</div>`;
    case 'text':
      return `<div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">${(block.data.text || '').replace(/\n/g, '<br>')}</div>`;
    case 'button':
      return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;"><tr><td style="background:linear-gradient(135deg,${block.data.color || '#06b6d4'},#3b82f6);border-radius:12px;padding:14px 28px;"><a href="${block.data.url || '#'}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.3px;display:inline-block;">${block.data.text || 'Botó'}</a></td></tr></table>`;
    case 'info_table': {
      const rows = (block.data.rows || '')
        .split('\n')
        .filter(Boolean)
        .map((row) => {
          const [label, ...rest] = row.split(':');
          const value = rest.join(':');
          return `<tr><td style="padding:10px 14px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.4);border-bottom:1px solid rgba(255,255,255,0.04);width:140px;">${label}</td><td style="padding:10px 14px;font-size:14px;font-weight:600;color:#e5e5e5;border-bottom:1px solid rgba(255,255,255,0.04);">${value}</td></tr>`;
        })
        .join('');
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
<div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,0.3);">📞 ${SITE_CONFIG.business.phoneDisplay} · ✉ ${SITE_CONFIG.business.email} · 🌐 orbitaevents.com</div>
<div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,0.2);">© ${new Date().getFullYear()} ${SITE_CONFIG.business.name} · ${SITE_CONFIG.business.address.city}, ${SITE_CONFIG.business.address.region}</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function htmlToBlocks(html: string): Block[] {
  if (!html || html.length < 50) {
    return [createBlock('heading'), createBlock('text')];
  }
  return [{ id: 'imported', type: 'text' as BlockType, data: { text: 'Plantilla importada — edita els blocs a la dreta' } }];
}

function getLocaleTabClass(isActive: boolean) {
  return isActive ? 'ap-tab ap-tab--active' : 'ap-tab ap-tab--idle';
}

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
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [translating, setTranslating] = useState(false);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/email-templates/${slug}?locale=${locale}`);
      if (!res.ok) throw new Error('Error carregant');
      const data = await res.json();

      setSubject(data.resolved?.subject || '');
      setVariables(data.template?.variables ? JSON.parse(data.template.variables) : []);

      if (data.template?.bodyHtml) {
        setBlocks(htmlToBlocks(data.template.bodyHtml));
      } else {
        setBlocks([createBlock('heading'), createBlock('text')]);
      }
    } catch (err) {
      console.error('Error carregant plantilla email', err);
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [slug, locale, toast]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.srcdoc = blocksToFullHtml(blocks);
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
      if (!res.ok) throw new Error('Error desant');
      toast.success('Plantilla desada!');
    } catch (err) {
      console.error('Error desant plantilla email', err);
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

  const updateBlockData = (id: string, field: string, value: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, [field]: value } } : b)));
  };

  const autoTranslateFromCa = async () => {
    if (locale === 'ca') {
      toast.error('Ja estàs en català');
      return;
    }
    setTranslating(true);
    try {
      const caRes = await fetchWithCsrf(`/api/admin/email-templates/${slug}?locale=ca`);
      if (!caRes.ok) throw new Error("No s'ha trobat la plantilla en català");
      const caData = await caRes.json();
      const caSubject = caData.resolved?.subject || '';
      const caBlocks = caData.template?.bodyHtml ? htmlToBlocks(caData.template.bodyHtml) : [];

      const textsToTranslate: string[] = [];
      if (caSubject) textsToTranslate.push(caSubject);
      for (const block of caBlocks) {
        if (block.data.text) textsToTranslate.push(block.data.text);
        if (block.data.subtitle) textsToTranslate.push(block.data.subtitle);
      }
      const currentTexts: string[] = [];
      if (subject) currentTexts.push(subject);
      for (const block of blocks) {
        if (block.data.text) currentTexts.push(block.data.text);
        if (block.data.subtitle) currentTexts.push(block.data.subtitle);
      }
      const allTexts = [...new Set([...textsToTranslate, ...currentTexts])].filter(Boolean);

      if (allTexts.length === 0) {
        toast.error('No hi ha contingut per traduir');
        return;
      }

      const trRes = await fetchWithCsrf('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: allTexts, targetLanguages: [locale] }),
      });
      const trData = await trRes.json().catch(() => ({}));
      if (!trRes.ok || !trData?.ok) throw new Error('Error de traducció');

      const map = trData.translationsByText as Record<string, Record<string, string>>;
      const t = (text: string) => map[text]?.[locale] || text;

      if (subject) setSubject(t(subject));
      setBlocks((prev) =>
        prev.map((block) => ({
          ...block,
          data: {
            ...block.data,
            ...(block.data.text ? { text: t(block.data.text) } : {}),
            ...(block.data.subtitle ? { subtitle: t(block.data.subtitle) } : {}),
          },
        }))
      );

      toast.success(`Traduït a ${locale.toUpperCase()} automàticament`);
    } catch (err) {
      console.error('Error traduint plantilla email automàticament', err);
      toast.error(err instanceof Error ? err.message : 'Error traduint');
    } finally {
      setTranslating(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const hasSubject = subject.trim().length > 0;
  const hasBlocks = blocks.length > 0;
  const translatedLocaleReady = locale === 'ca' || hasBlocks;
  const selectedBlockLabel = selectedBlock
    ? BLOCK_CATALOG.find((catalogBlock) => catalogBlock.type === selectedBlock.type)?.label || selectedBlock.type
    : 'Cap';
  const actionTitle = loading
    ? 'Esperar la càrrega abans d’editar la plantilla'
    : saving
      ? 'Deixar que la plantilla es desi correctament'
      : !hasSubject || !hasBlocks
        ? 'Completar primer la base mínima de la plantilla'
        : translating
          ? 'Deixar acabar la traducció abans de seguir'
          : 'Refinar blocs, variables i preview abans de sortir';
  const actionDescription = loading
    ? 'Sense la plantilla carregada no toca intervenir sobre blocs ni idioma a cegues.'
    : saving
      ? 'Ara mateix el sistema està persistint l’assumpte i el cos HTML de la plantilla.'
      : !hasSubject || !hasBlocks
        ? 'El retorn més alt ara és assegurar assumpte i estructura mínima abans de perfilar el detall visual.'
        : translating
          ? 'La sessió està traduint contingut i convé no duplicar canvis fins que acabi.'
          : 'Amb la base completa, el següent pas bo és revisar consistència de blocs, variables i preview abans de desar.';

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm admin-tone-text-neutral" role="status">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Carregant plantilla...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura',
          title: 'Quin estat té ara mateix la plantilla',
          tone: loading ? 'default' : !hasSubject || !hasBlocks ? 'warning' : 'success',
          stats: [
            { label: 'Idioma', value: locale.toUpperCase(), hint: 'sessió activa' },
            { label: 'Blocs', value: blocks.length, tone: hasBlocks ? 'success' : 'warning', hint: 'cos visible' },
            { label: 'Variables', value: variables.length, hint: 'slots disponibles' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé revisar abans de desar',
          tone: loading ? 'default' : saving || translating || !hasSubject || !hasBlocks ? 'warning' : 'info',
          items: [
            hasSubject ? 'La plantilla ja té assumpte editable en aquest idioma.' : 'Encara falta l’assumpte de la plantilla.',
            hasBlocks
              ? `Hi ha ${blocks.length} blocs actius i el bloc seleccionat ara és: ${selectedBlockLabel}.`
              : 'Encara no hi ha estructura de blocs carregada per a aquesta plantilla.',
            translating
              ? `S’està traduint contingut cap a ${locale.toUpperCase()}.`
              : translatedLocaleReady
                ? `La sessió de ${locale.toUpperCase()} està operativa per editar i previsualitzar.`
                : `La sessió de ${locale.toUpperCase()} encara necessita base per treballar-la amb criteri.`,
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: actionTitle,
          description: actionDescription,
          tone: saving || translating || !hasSubject || !hasBlocks ? 'warning' : 'success',
          secondaryPills: [
            hasSubject ? 'Assumpte OK' : 'Assumpte pendent',
            selectedBlock ? selectedBlockLabel : 'Sense selecció',
          ],
        }}
      />

      <div className="ap-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-end">
        <div className="ap-tabs-nav">
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLocale(l);
                router.push(buildEmailTemplateHref(slug, l));
              }}
              className={getLocaleTabClass(l === locale)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <label htmlFor="subject" className="mb-1 block text-xs font-medium admin-tone-text-neutral">Assumpte</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="ap-input w-full px-3 py-2 text-sm"
          />
        </div>
        {locale !== 'ca' && (
          <button
            type="button"
            disabled={translating}
            onClick={autoTranslateFromCa}
            className="ap-btn ap-btn--secondary"
          >
            {translating ? 'Traduint...' : `Traduir des del CA -> ${locale.toUpperCase()}`}
          </button>
        )}
        <button type="button" disabled={saving} onClick={saveTemplate} className="ap-btn ap-btn--primary">
          {saving ? 'Desant...' : 'Desa'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_1fr]">
        <div className="space-y-3">
          <div className="ap-card rounded-2xl p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide admin-tone-text-neutral">Blocs disponibles</h3>
            <div className="space-y-1.5">
              {BLOCK_CATALOG.map((cat) => (
                <div
                  key={cat.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', cat.type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragEnd={() => {}}
                  className="admin-tone-idle flex cursor-grab items-center gap-3 rounded-xl border p-3 transition-all hover:admin-tone-bg-neutral active:cursor-grabbing"
                >
                  <span className="admin-tone-bg-neutral flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
                    {cat.icon}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{cat.label}</div>
                    <div className="text-[10px] admin-tone-text-slate">{cat.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {variables.length > 0 && (
            <div className="ap-card rounded-2xl p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide admin-tone-text-neutral">Variables</h3>
              <div className="flex flex-wrap gap-1">
                {variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`{{${v}}}`);
                        toast.success(`{{${v}}} copiat!`);
                      } catch (err) {
                        console.error('Error copiant variable al portapapers', err);
                        toast.error("No s'ha pogut copiar la variable");
                      }
                    }}
                    className="ap-badge font-mono text-[10px]"
                    title={`Clic per copiar {{${v}}}`}
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide admin-tone-text-neutral">Contingut de l'email</h3>
          <SortableList
            items={blocks}
            keyFn={(b) => b.id}
            onReorder={setBlocks}
            onExternalDrop={(data, idx) => {
              if (BLOCK_CATALOG.some((c) => c.type === data)) {
                addBlock(data as BlockType, idx);
              }
            }}
            acceptExternalType="text/plain"
            className="min-h-[400px] space-y-1 rounded-2xl border border-dashed p-3 admin-tone-border-neutral admin-tone-bg-neutral"
            placeholderHeight={44}
            renderItem={(block, _idx, { isDragging }) => {
              const catInfo = BLOCK_CATALOG.find((c) => c.type === block.type);
              const isSelected = selectedBlockId === block.id;
              return (
                <div
                  onClick={() => setSelectedBlockId(block.id)}
                  className={[
                    'group flex cursor-grab items-center gap-2 rounded-xl border p-2.5 transition-all active:cursor-grabbing',
                    isSelected ? 'admin-tone-border-info admin-tone-bg-info' : 'admin-tone-idle hover:admin-tone-bg-neutral',
                    isDragging ? 'opacity-40' : '',
                  ].join(' ')}
                >
                  <span className="admin-tone-bg-neutral flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                    {catInfo?.icon || '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{catInfo?.label}</div>
                    <div className="truncate text-[10px] admin-tone-text-slate">
                      {block.data.text || block.data.rows?.split('\n')[0] || block.type}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBlock(block.id);
                    }}
                    className="rounded-lg p-1 text-xs transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Eliminar bloc"
                  >
                    ✕
                  </button>
                </div>
              );
            }}
          />
        </div>

        <div className="space-y-3">
          {selectedBlock && (
            <div className="ap-card space-y-3 rounded-2xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide admin-tone-text-neutral">
                Editar: {BLOCK_CATALOG.find((c) => c.type === selectedBlock.type)?.label}
              </h3>

              {(selectedBlock.type === 'heading' || selectedBlock.type === 'text' || selectedBlock.type === 'button' || selectedBlock.type === 'highlight') && (
                <div>
                  <label className="mb-1 block text-xs font-medium admin-tone-text-neutral">Text</label>
                  {selectedBlock.type === 'text' ? (
                    <textarea
                      value={selectedBlock.data.text || ''}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'text', e.target.value)}
                      rows={4}
                      className="ap-input w-full px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={selectedBlock.data.text || ''}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'text', e.target.value)}
                      className="ap-input w-full px-3 py-2 text-sm"
                    />
                  )}
                </div>
              )}

              {selectedBlock.type === 'heading' && (
                <div>
                  <label className="mb-1 block text-xs font-medium admin-tone-text-neutral">Mida (px)</label>
                  <input
                    type="number"
                    value={selectedBlock.data.size || '26'}
                    onChange={(e) => updateBlockData(selectedBlock.id, 'size', e.target.value)}
                    min={14}
                    max={48}
                    className="ap-input w-24 px-3 py-2 text-sm"
                  />
                </div>
              )}

              {selectedBlock.type === 'button' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium admin-tone-text-neutral">URL</label>
                    <input
                      type="text"
                      value={selectedBlock.data.url || ''}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'url', e.target.value)}
                      className="ap-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium admin-tone-text-neutral">Color</label>
                    <input
                      type="color"
                      value={selectedBlock.data.color || '#06b6d4'}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'color', e.target.value)}
                      className="ap-input h-10 w-20 rounded-xl p-1"
                    />
                  </div>
                </>
              )}

              {selectedBlock.type === 'info_table' && (
                <div>
                  <label className="mb-1 block text-xs font-medium admin-tone-text-neutral">Files (una per línia, format Label:Valor)</label>
                  <textarea
                    value={selectedBlock.data.rows || ''}
                    onChange={(e) => updateBlockData(selectedBlock.id, 'rows', e.target.value)}
                    rows={6}
                    placeholder="Referència:#{{reference}}&#10;Data:{{eventDate}}"
                    className="ap-input w-full px-3 py-2 font-mono text-xs"
                  />
                </div>
              )}

              {selectedBlock.type === 'highlight' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium admin-tone-text-neutral">Subtítol</label>
                    <input
                      type="text"
                      value={selectedBlock.data.subtitle || ''}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'subtitle', e.target.value)}
                      className="ap-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium admin-tone-text-neutral">Color accent</label>
                    <input
                      type="color"
                      value={selectedBlock.data.color || '#06b6d4'}
                      onChange={(e) => updateBlockData(selectedBlock.id, 'color', e.target.value)}
                      className="ap-input h-10 w-20 rounded-xl p-1"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="ap-card overflow-hidden rounded-2xl p-0">
            <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide admin-tone-border-neutral admin-tone-text-slate">
              Preview
            </div>
            <iframe
              ref={previewRef}
              title="Preview email"
              className="w-full admin-tone-bg-neutral"
              style={{ height: '500px', border: 'none' }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

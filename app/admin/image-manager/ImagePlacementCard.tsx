'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import type { ImagePlacementDefinition } from './image-manager-config';

export type ImageManagerAssetClient = {
  id: string;
  src: string;
  alt?: string;
  path?: string;
  label?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  sortOrder: number;
  updatedAt?: string;
};

export type PlacementKind = 'single' | 'collection' | 'brand';

export type PlacementRow = ImagePlacementDefinition & {
  kind: PlacementKind;
  override: {
    mode: 'auto' | 'manual';
    kind: PlacementKind;
    src?: string;
    alt?: string;
    updatedAt?: string;
    itemCount: number;
    items: ImageManagerAssetClient[];
  };
};

interface Props {
  placement: PlacementRow;
  onReload: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml';

export default function ImagePlacementCard({ placement, onReload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editAlt, setEditAlt] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCollection = placement.kind === 'collection';
  const items = useMemo(() => placement.override.items || [], [placement.override.items]);
  const hasItems = items.length > 0;

  const handleUpload = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setLocalError('Fitxer massa gran (maxim 10 MB)');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setLocalError('Nomes es permeten imatges');
      return;
    }

    setLocalError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', placement.key);
      if (!isCollection) formData.append('replace', '1');

      const res = await fetchWithCsrf('/api/admin/image-manager', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.ok) {
        log.error('Error pujant imatge', data.error);
        setLocalError(typeof data.error === 'string' ? data.error : 'No s ha pogut pujar la imatge');
        return;
      }
      onReload();
    } catch (err) {
      log.error('Error pujant imatge', err);
      setLocalError('Error pujant imatge');
    } finally {
      setUploading(false);
    }
  }, [placement.key, isCollection, onReload]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleUpload(file);
  }, [handleUpload]);

  const handleDelete = useCallback(async (assetId?: string) => {
    try {
      await fetchWithCsrf('/api/admin/image-manager', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: placement.key, assetId }),
      });
      setLocalError(null);
      onReload();
    } catch (err) {
      log.error('Error eliminant asset', err);
      setLocalError('Error eliminant asset');
    }
  }, [placement.key, onReload]);

  const handleSetAuto = useCallback(async () => {
    try {
      await fetchWithCsrf('/api/admin/image-manager', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications: { [placement.key]: { mode: 'auto' } } }),
      });
      setLocalError(null);
      onReload();
    } catch (err) {
      log.error('Error canviant a auto', err);
      setLocalError('Error tornant a mode automatic');
    }
  }, [placement.key, onReload]);

  const handleSaveAlt = useCallback(async (assetId: string, alt: string) => {
    try {
      const body = isCollection
        ? { modifications: { [placement.key]: { mode: 'manual', items: [{ id: assetId, alt }] } } }
        : { modifications: { [placement.key]: { mode: 'manual', alt } } };
      await fetchWithCsrf('/api/admin/image-manager', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setEditAlt(null);
      setLocalError(null);
      onReload();
    } catch (err) {
      log.error('Error desant alt', err);
      setLocalError('Error desant l alt');
    }
  }, [placement.key, isCollection, onReload]);

  const handleMoveItem = useCallback(async (assetId: string, direction: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === assetId);
    if (idx < 0) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const reordered = items.map((item, i) => {
      if (i === idx) return { id: item.id, sortOrder: targetIdx };
      if (i === targetIdx) return { id: item.id, sortOrder: idx };
      return { id: item.id, sortOrder: i };
    });

    try {
      await fetchWithCsrf('/api/admin/image-manager', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: placement.key, items: reordered }),
      });
      setLocalError(null);
      onReload();
    } catch (err) {
      log.error('Error reordenant', err);
      setLocalError('Error reordenant la colleccio');
    }
  }, [placement.key, items, onReload]);

  const dropzoneClasses = `
    relative flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed
    transition-colors
    ${dragOver ? 'border-amber-400 bg-amber-500/10' : 'border-[var(--line)] bg-[var(--sunk)] hover:border-[var(--line)]'}
    ${isCollection && hasItems ? 'h-28' : 'h-40'}
  `;

  return (
    <article className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="ap-h2 text-[var(--t)]">{placement.label}</h2>
          <p className="mt-1 text-sm text-[var(--t2)]">{placement.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--t3)]">
            <span className="rounded-full border border-[var(--line)] px-3 py-1">{placement.key}</span>
            <span className="rounded-full border border-[var(--line)] px-3 py-1">{placement.kind}</span>
            <span className={`rounded-full px-3 py-1 ${hasItems ? 'border border-amber-400/30 bg-amber-500/10 text-amber-300' : 'border border-[var(--line)] text-[var(--t3)]'}`}>
              {hasItems ? `manual · ${items.length} asset${items.length > 1 ? 's' : ''}` : 'auto'}
            </span>
          </div>
        </div>
        {hasItems && (
          <button
            type="button"
            onClick={handleSetAuto}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--t2)] hover:bg-[var(--raised)]"
          >
            Tornar a auto
          </button>
        )}
      </div>

      {isCollection && hasItems && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, idx) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--sunk)]">
              <div className="relative h-32">
                <Image
                  src={item.src}
                  alt={item.alt || placement.label}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-1">
                  {idx > 0 && (
                    <button type="button" onClick={() => handleMoveItem(item.id, -1)} className="rounded px-1.5 py-0.5 text-xs text-[var(--t3)] hover:bg-[var(--raised)]" aria-label="Moure amunt">
                      â†
                    </button>
                  )}
                  {idx < items.length - 1 && (
                    <button type="button" onClick={() => handleMoveItem(item.id, 1)} className="rounded px-1.5 py-0.5 text-xs text-[var(--t3)] hover:bg-[var(--raised)]" aria-label="Moure avall">
                      â†’
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditAlt(editAlt === item.id ? null : item.id)}
                    className="rounded px-1.5 py-0.5 text-xs text-[var(--t3)] hover:bg-[var(--raised)]"
                    aria-label="Editar alt"
                  >
                    alt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded px-1.5 py-0.5 text-xs text-red-400/70 hover:bg-red-500/10"
                    aria-label="Eliminar"
                  >
                    âœ•
                  </button>
                </div>
              </div>
              {editAlt === item.id && (
                <AltEditor
                  initial={item.alt || ''}
                  onSave={(alt) => handleSaveAlt(item.id, alt)}
                  onCancel={() => setEditAlt(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {!isCollection && hasItems && (
        <div className="mb-4 grid gap-4 lg:grid-cols-[180px_1fr]">
          <div className="relative h-40 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--sunk)]">
            <Image
              src={items[0].src}
              alt={items[0].alt || placement.label}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => handleDelete()}
              className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
              aria-label="Eliminar imatge"
            >
              âœ•
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-xs text-[var(--t3)]">
              {items[0].mimeType && <span className="mr-3">{items[0].mimeType}</span>}
              {items[0].width && items[0].height && <span className="mr-3">{items[0].width}×{items[0].height}</span>}
              {items[0].sizeBytes && <span>{Math.round(items[0].sizeBytes / 1024)} KB</span>}
            </div>
            <label className="block space-y-1 text-sm text-[var(--t2)]">
              <span>Alt text</span>
              <div className="flex gap-2">
                <input
                  defaultValue={items[0].alt || ''}
                  placeholder="Text alternatiu"
                  className="flex-1 rounded-2xl border border-[var(--line)] bg-[var(--sunk)] px-4 py-2.5 text-sm text-[var(--t)] outline-none placeholder:text-[var(--t3)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveAlt(items[0].id, (e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                    if (input) handleSaveAlt(items[0].id, input.value);
                  }}
                  className="rounded-2xl border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--t2)] hover:bg-[var(--raised)]"
                >
                  Desar
                </button>
              </div>
            </label>
          </div>
        </div>
      )}

      {localError && (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {localError}
        </div>
      )}

      <div
        className={dropzoneClasses}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Pujar imatge per ${placement.label}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_IMAGES}
          onChange={onFileSelect}
          className="hidden"
          aria-hidden="true"
        />
        {uploading ? (
          <span className="text-sm text-amber-300 animate-pulse">Pujant i processant...</span>
        ) : (
          <span className="text-sm text-[var(--t3)]">
            {hasItems && isCollection
              ? 'Arrossega o clica per afegir una imatge'
              : hasItems
                ? 'Arrossega o clica per substituir'
                : 'Arrossega o clica per pujar una imatge'}
          </span>
        )}
      </div>
    </article>
  );
}

function AltEditor({ initial, onSave, onCancel }: { initial: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex gap-1 border-t border-[var(--line)] p-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Alt text"
        className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--sunk)] px-2 py-1 text-xs text-[var(--t)] outline-none placeholder:text-[var(--t3)]"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(value);
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button type="button" onClick={() => onSave(value)} className="rounded px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">
        OK
      </button>
    </div>
  );
}

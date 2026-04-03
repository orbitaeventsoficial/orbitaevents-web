'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';

/**
 * SortableList — Component drag & drop reutilitzable
 * ===================================================
 * Usa classes CSS globals de admin-theme.css:
 *   .admin-drag-placeholder  — silueta lluminosa (color corporatiu)
 *   [data-dragging="true"]   — element arrossegat (transparent)
 *   .admin-drag-item         — transició suau dels elements
 *   .admin-drag-inserted     — animació d'entrada
 *
 * Props:
 *   items: T[]                    — llista d'elements
 *   keyFn: (item) => string      — clau única per cada element
 *   renderItem: (item, idx, opts) => ReactNode — render de cada element
 *   onReorder: (items) => void   — callback quan es reordena
 *   onExternalDrop?: (data, idx) => void — callback per drops externs
 *   acceptExternalType?: string  — tipus de dataTransfer acceptat
 *   className?: string           — classe del contenidor
 *   itemClassName?: string       — classe base per cada item
 *   placeholderHeight?: number   — alçada del placeholder (px)
 */

interface SortableListProps<T> {
  items: T[];
  keyFn: (item: T) => string;
  renderItem: (item: T, index: number, opts: { isDragging: boolean; isOver: boolean }) => ReactNode;
  onReorder: (items: T[]) => void;
  onExternalDrop?: (data: string, insertIndex: number) => void;
  acceptExternalType?: string;
  className?: string;
  itemClassName?: string;
  placeholderHeight?: number;
}

export default function SortableList<T>({
  items,
  keyFn,
  renderItem,
  onReorder,
  onExternalDrop,
  acceptExternalType,
  className = '',
  itemClassName = '',
  placeholderHeight = 48,
}: SortableListProps<T>) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [insertedKey, setInsertedKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('sortable-idx', String(idx));
    setDragIdx(idx);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const hasSortable = e.dataTransfer.types.includes('sortable-idx');
    const hasExternal = acceptExternalType && e.dataTransfer.types.includes('text/plain');
    if (!hasSortable && !hasExternal) return;
    e.dataTransfer.dropEffect = hasSortable ? 'move' : 'copy';
    setOverIdx(idx);
  }, [acceptExternalType]);

  const handleDrop = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();

    const sortableIdx = e.dataTransfer.getData('sortable-idx');
    if (sortableIdx !== '') {
      const fromIdx = parseInt(sortableIdx, 10);
      if (fromIdx !== idx && !isNaN(fromIdx)) {
        const next = [...items];
        const [moved] = next.splice(fromIdx, 1);
        const insertAt = idx > fromIdx ? idx - 1 : idx;
        next.splice(insertAt, 0, moved);
        onReorder(next);
        setInsertedKey(keyFn(moved));
        setTimeout(() => setInsertedKey(null), 300);
      }
    } else if (onExternalDrop) {
      const data = e.dataTransfer.getData('text/plain');
      if (data) {
        onExternalDrop(data, idx);
      }
    }

    setDragIdx(null);
    setOverIdx(null);
  }, [items, keyFn, onReorder, onExternalDrop]);

  // Drop al final de la llista
  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const hasSortable = e.dataTransfer.types.includes('sortable-idx');
    const hasExternal = acceptExternalType && e.dataTransfer.types.includes('text/plain');
    if (!hasSortable && !hasExternal) return;
    e.dataTransfer.dropEffect = hasSortable ? 'move' : 'copy';
    // Només si no estem sobre cap item
    if (overIdx === null) {
      setOverIdx(items.length);
    }
  }, [acceptExternalType, overIdx, items.length]);

  const handleContainerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const sortableIdx = e.dataTransfer.getData('sortable-idx');
    if (sortableIdx !== '') {
      const fromIdx = parseInt(sortableIdx, 10);
      if (!isNaN(fromIdx)) {
        const next = [...items];
        const [moved] = next.splice(fromIdx, 1);
        next.push(moved);
        onReorder(next);
        setInsertedKey(keyFn(moved));
        setTimeout(() => setInsertedKey(null), 300);
      }
    } else if (onExternalDrop) {
      const data = e.dataTransfer.getData('text/plain');
      if (data) onExternalDrop(data, items.length);
    }
    setDragIdx(null);
    setOverIdx(null);
  }, [items, keyFn, onReorder, onExternalDrop]);

  return (
    <div
      ref={containerRef}
      className={className}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      onDragLeave={() => setOverIdx(null)}
    >
      {items.map((item, idx) => {
        const key = keyFn(item);
        const isDragging = dragIdx === idx;
        const isOver = overIdx === idx;
        const isInserted = insertedKey === key;

        return (
          <div key={key}>
            {/* Placeholder SOBRE l'element */}
            {isOver && dragIdx !== idx && dragIdx !== idx - 1 && (
              <div
                className="admin-drag-placeholder"
                style={{ height: placeholderHeight }}
              />
            )}
            <div
              draggable
              aria-roledescription="element ordenable"
              aria-label={`Element ${idx + 1} de ${items.length} — arrossega per reordenar`}
              data-dragging={isDragging || undefined}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              className={[
                'admin-drag-item',
                isInserted ? 'admin-drag-inserted' : '',
                itemClassName,
              ].join(' ')}
            >
              {renderItem(item, idx, { isDragging, isOver })}
            </div>
          </div>
        );
      })}

      {/* Placeholder al final */}
      {overIdx === items.length && dragIdx !== items.length - 1 && (
        <div
          className="admin-drag-placeholder"
          style={{ height: placeholderHeight }}
        />
      )}

      {/* Zona buida */}
      {items.length === 0 && (
        <div className="admin-drag-placeholder flex items-center justify-center text-sm" style={{ height: 100, opacity: 0.5 }}>
          Arrossega elements aquí
        </div>
      )}
    </div>
  );
}

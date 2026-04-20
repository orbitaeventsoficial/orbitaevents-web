'use client';

/**
 * PipelineBoard<T> — Component genèric de kanban amb drag & drop
 * ==============================================================
 * Extrau la lògica comuna de LeadPipelineView i BookingPipelineView:
 *   - Grid de columnes amb drop zones
 *   - Estat de drag intern (draggingId, dragOverStatus)
 *   - Header de columna (label + count)
 *   - Placeholder de drop + empty state
 *   - Loading spinner
 *   - Windowing/virtualització zero-dependency per columnes llargues
 */

import {
  useState,
  useCallback,
  useMemo,
  Fragment,
  useEffect,
  useRef,
  type ReactNode,
  type DragEvent,
  type MutableRefObject,
} from 'react';
import { ADMIN_SHARED_HELP, helpAttrs } from './adminHelpContent';

export interface PipelineColumnDef {
  status: string;
  label: string;
  toneClass?: string;
}

export interface PipelineColumn<T> extends PipelineColumnDef {
  items: T[];
}

export interface PipelineCardContext {
  isUpdating: boolean;
  isDragging: boolean;
  statusIndex: number;
  columnCount: number;
  dragHandlers: {
    draggable: boolean;
    onDragStart: (e: DragEvent) => void;
    onDragEnd: () => void;
    'data-dragging'?: true;
  };
}

interface PipelineBoardProps<T> {
  columnsDef: PipelineColumnDef[];
  items: T[];
  getId: (item: T) => string;
  getStatus: (item: T) => string;
  updatingId: string | null;
  onMoveStatus: (itemId: string, newStatus: string) => void;
  renderCard: (item: T, ctx: PipelineCardContext) => ReactNode;
  renderColumnHeaderExtra?: (col: PipelineColumn<T>, colIndex: number, total: number) => ReactNode;
  renderEmptyColumn?: (col: PipelineColumnDef) => ReactNode;
  gridClassName?: string;
  columnClassName?: string;
  columnBodyClassName?: string;
  dropText?: string;
  loading?: boolean;
  boardRef?: MutableRefObject<HTMLDivElement | null>;
  onBoardScroll?: () => void;
  maxVisiblePerColumn?: number;
  virtualizeColumns?: boolean;
  estimatedItemHeight?: number;
  overscanCount?: number;
}

type ColumnViewportState = {
  scrollTop: number;
  height: number;
};

export default function PipelineBoard<T>({
  columnsDef,
  items,
  getId,
  getStatus,
  updatingId,
  onMoveStatus,
  renderCard,
  renderColumnHeaderExtra,
  renderEmptyColumn,
  gridClassName = 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3',
  columnClassName = '',
  columnBodyClassName = 'max-h-[68vh] overflow-y-auto overscroll-contain',
  dropText = 'Deixa anar aquí',
  loading = false,
  boardRef,
  onBoardScroll,
  maxVisiblePerColumn = 30,
  virtualizeColumns = false,
  estimatedItemHeight = 168,
  overscanCount = 3,
}: PipelineBoardProps<T>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
  const [columnViewport, setColumnViewport] = useState<Record<string, ColumnViewportState>>({});
  const columnBodyRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const columns = useMemo<PipelineColumn<T>[]>(
    () => columnsDef.map((def) => ({
      ...def,
      items: items.filter((item) => getStatus(item) === def.status),
    })),
    [columnsDef, items, getStatus],
  );

  const syncColumnHeight = useCallback((status: string) => {
    const element = columnBodyRefs.current[status];
    if (!element) return;
    setColumnViewport((prev) => ({
      ...prev,
      [status]: {
        scrollTop: prev[status]?.scrollTop ?? 0,
        height: element.clientHeight,
      },
    }));
  }, []);

  useEffect(() => {
    columns.forEach((column) => syncColumnHeight(column.status));
  }, [columns, syncColumnHeight]);

  useEffect(() => {
    const handleResize = () => {
      columns.forEach((column) => syncColumnHeight(column.status));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columns, syncColumnHeight]);

  const handleDrop = useCallback((targetStatus: string) => {
    if (!draggingId) return;
    const item = items.find((i) => getId(i) === draggingId);
    setDragOverStatus(null);
    setDraggingId(null);
    if (!item || getStatus(item) === targetStatus) return;
    onMoveStatus(draggingId, targetStatus);
  }, [draggingId, items, getId, getStatus, onMoveStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div ref={(el) => { if (boardRef) boardRef.current = el; }} onScroll={onBoardScroll} className={gridClassName} {...helpAttrs(ADMIN_SHARED_HELP.pipelineBoard)}>
      {columns.map((col, colIndex) => {
        const isExpanded = expandedColumns.has(col.status);
        const visibleItems = isExpanded ? col.items : col.items.slice(0, maxVisiblePerColumn);
        const hiddenCount = col.items.length - visibleItems.length;
        const viewport = columnViewport[col.status];
        const shouldVirtualize = virtualizeColumns && visibleItems.length > 24 && (viewport?.height ?? 0) > 0;
        const startIndex = shouldVirtualize
          ? Math.max(0, Math.floor((viewport?.scrollTop ?? 0) / estimatedItemHeight) - overscanCount)
          : 0;
        const visibleCount = shouldVirtualize
          ? Math.ceil((viewport?.height ?? 0) / estimatedItemHeight) + (overscanCount * 2)
          : visibleItems.length;
        const endIndex = shouldVirtualize
          ? Math.min(visibleItems.length, startIndex + visibleCount)
          : visibleItems.length;
        const renderedItems = shouldVirtualize ? visibleItems.slice(startIndex, endIndex) : visibleItems;
        const topSpacerHeight = shouldVirtualize ? startIndex * estimatedItemHeight : 0;
        const bottomSpacerHeight = shouldVirtualize ? Math.max(0, (visibleItems.length - endIndex) * estimatedItemHeight) : 0;

        return (
          <div
            key={col.status}
            data-pipeline-column={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDragOverStatus(col.status);
            }}
            onDragLeave={() => {
              if (dragOverStatus === col.status) setDragOverStatus(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(col.status);
            }}
            className={[
              'flex min-h-[320px] flex-col rounded-2xl border transition-all',
              col.toneClass,
              columnClassName,
              dragOverStatus === col.status ? 'admin-drop-active' : '',
            ].filter(Boolean).join(' ')}
          >
            <div className="border-b px-3 py-2.5">
              <div className="flex items-center justify-between">
                <h3 className="truncate text-sm font-semibold">{col.label}</h3>
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold">
                  {col.items.length}
                </span>
              </div>
              {renderColumnHeaderExtra?.(col, colIndex, columns.length)}
            </div>

            <div
              ref={(el) => {
                columnBodyRefs.current[col.status] = el;
              }}
              onScroll={(e) => {
                const target = e.currentTarget;
                setColumnViewport((prev) => ({
                  ...prev,
                  [col.status]: {
                    scrollTop: target.scrollTop,
                    height: target.clientHeight,
                  },
                }));
              }}
              className={['flex-1 p-2', columnBodyClassName].filter(Boolean).join(' ')}
            >
              <div className="space-y-2">
                {dragOverStatus === col.status && (
                  <div className="admin-drag-placeholder rounded-xl px-2 py-3 text-center text-[10px]">
                    {dropText}
                  </div>
                )}
                {col.items.length === 0 && dragOverStatus !== col.status && (
                  renderEmptyColumn
                    ? renderEmptyColumn(col)
                    : <div className="rounded-xl border border-dashed p-4 text-center text-xs">Cap element</div>
                )}
                {topSpacerHeight > 0 && <div aria-hidden="true" style={{ height: topSpacerHeight }} />}
                {renderedItems.map((item) => {
                  const itemId = getId(item);
                  const isDragging = draggingId === itemId;
                  const isUpdating = updatingId === itemId;

                  return (
                    <Fragment key={itemId}>
                      {renderCard(item, {
                        isUpdating,
                        isDragging,
                        statusIndex: colIndex,
                        columnCount: columns.length,
                        dragHandlers: {
                          draggable: !isUpdating,
                          onDragStart: (e: DragEvent) => {
                            e.dataTransfer.setData('text/plain', itemId);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingId(itemId);
                          },
                          onDragEnd: () => {
                            setDraggingId(null);
                            setDragOverStatus(null);
                          },
                          ...(isDragging ? { 'data-dragging': true as const } : {}),
                        },
                      })}
                    </Fragment>
                  );
                })}
                {bottomSpacerHeight > 0 && <div aria-hidden="true" style={{ height: bottomSpacerHeight }} />}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedColumns((prev) => {
                      const next = new Set(prev);
                      next.add(col.status);
                      return next;
                    })}
                    className="w-full rounded-xl border border-dashed px-2 py-2.5 text-[11px] font-medium transition-colors hover:brightness-110"
                  >
                    Mostrar {hiddenCount} més
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

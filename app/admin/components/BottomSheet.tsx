'use client';

/**
 * BottomSheet.tsx
 *
 * Bottom sheet universal para admin móvil
 * - Drag to dismiss
 * - Snap points (25%, 50%, 90%)
 * - Backdrop blur
 */

import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Percentages of screen height (e.g., [25, 50, 90])
  initialSnap?: number; // Index of initial snap point
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [50, 90],
  initialSnap = 0,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  // Calculate snap point heights
  const getSnapHeight = useCallback(
    (snapIndex: number) => {
      if (typeof window === 'undefined') return 0;
      const percentage = snapPoints[snapIndex] || snapPoints[0];
      return window.innerHeight * (percentage / 100);
    },
    [snapPoints]
  );

  // Opacity based on drag
  const backdropOpacity = useTransform(
    y,
    [0, getSnapHeight(initialSnap)],
    [0.6, 0]
  );

  // Handle drag end with snap points
  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const velocity = info.velocity.y;
      const offset = info.offset.y;

      // Fast swipe down = close
      if (velocity > 500 || offset > 200) {
        onClose();
        return;
      }

      // Snap to closest point
      const currentY = y.get();
      const windowHeight = window.innerHeight;
      const currentPercentage = ((windowHeight - currentY) / windowHeight) * 100;

      let closestSnap = snapPoints[0];
      let closestDiff = Math.abs(currentPercentage - snapPoints[0]);

      for (const snap of snapPoints) {
        const diff = Math.abs(currentPercentage - snap);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestSnap = snap;
        }
      }

      // If dragged below minimum, close
      if (currentPercentage < snapPoints[0] * 0.5) {
        onClose();
        return;
      }

      // Animate to snap point
      y.set(windowHeight * (1 - closestSnap / 100));
    },
    [onClose, snapPoints, y]
  );

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset y when opening
  useEffect(() => {
    if (isOpen) {
      y.set(0);
    }
  }, [isOpen, y]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ opacity: backdropOpacity }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="fixed left-0 right-0 bottom-0 z-50 bg-zinc-900 rounded-t-3xl shadow-2xl max-h-[95vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ y, height: `${snapPoints[Math.max(snapPoints.length - 1, 0)]}vh` }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Handle */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(100% - 60px)' }}>
              <div className="px-5 py-4 pb-safe">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANTES COMUNES
// ═══════════════════════════════════════════════════════════════════════════

// Filter sheet
export function FilterSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filtres"
      snapPoints={[60, 90]}
    >
      {children}
    </BottomSheet>
  );
}

// Actions sheet
export function ActionsSheet({
  isOpen,
  onClose,
  title = 'Accions',
  actions,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }>;
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      snapPoints={[40]}
    >
      <div className="space-y-2">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              action.variant === 'danger'
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-white hover:bg-white/5'
            }`}
          >
            {action.icon && <span className="text-xl">{action.icon}</span>}
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

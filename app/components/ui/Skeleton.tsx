/**
 * SKELETON LOADING COMPONENT
 * Components per mostrar placeholders mentre es carrega contingut
 */

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'none';
}

export default function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 ${roundedClasses[rounded]} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

// Variants comunes
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => `skeleton-line-${i}`).map((lineId, i) => (
        <Skeleton
          key={lineId}
          height={16}
          className={i === lines - 1 ? 'w-2/3' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-2xl bg-bg-surface border border-border ${className}`} aria-hidden="true">
      <Skeleton height={200} className="w-full mb-4" rounded="xl" />
      <Skeleton height={24} className="w-3/4 mb-2" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <Skeleton width={size} height={size} rounded="full" />;
}

export function SkeletonStats() {
  return (
    <div className="flex gap-4" aria-hidden="true">
      {['stat-1', 'stat-2', 'stat-3'].map((statId) => (
        <div key={statId} className="flex-1 p-4 rounded-xl bg-bg-surface/50 border border-border">
          <Skeleton height={32} className="w-1/2 mb-2" />
          <Skeleton height={16} className="w-3/4" />
        </div>
      ))}
    </div>
  );
}

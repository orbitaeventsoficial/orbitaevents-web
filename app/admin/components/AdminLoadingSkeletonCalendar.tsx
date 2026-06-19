const COLS = 7;
const ROWS = 5;

export default function AdminLoadingSkeletonCalendar() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Top bar: month title + nav + view toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 ap-card" />
          <div className="h-7 w-36 rounded-lg bg-white/[0.03]" />
          <div className="h-8 w-8 ap-card" />
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-14 ap-card" />
          <div className="h-8 w-20 ap-card" />
          <div className="h-8 w-20 ap-card" />
          <div className="h-8 w-16 ap-card" />
        </div>
      </div>

      {/* Day headers */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 gap-px overflow-x-auto">
          {Array.from({ length: COLS }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-white/[0.03]" />
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 gap-px overflow-x-auto">
          {Array.from({ length: COLS * ROWS }).map((_, i) => (
            <div
              key={i}
              className="h-20 ap-card p-1.5"
            >
              <div className="h-5 w-5 rounded-full bg-white/[0.04]" />
              {i % 4 === 0 && (
                <div className="mt-1 h-4 w-full rounded bg-white/[0.04]" />
              )}
              {i % 7 === 2 && (
                <div className="mt-1 h-4 w-3/4 rounded bg-white/[0.04]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

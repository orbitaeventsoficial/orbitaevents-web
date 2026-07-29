/**
 * Skeleton per a pàgines de llista (leads, bookings, clientes).
 * Replica: capçalera + filter bar + 8 files de taula.
 */
export default function AdminLoadingSkeletonList() {
  return (
    <div className="animate-pulse space-y-5">
      {/* Pipeline suggestions placeholder */}
      <div className="h-20 ap-card" />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="h-9 flex-1 max-w-xs rounded-xl bg-[var(--o-admin-fill-2)]" />
        <div className="h-9 w-28 rounded-xl bg-[var(--o-admin-fill-2)]" />
        <div className="h-9 w-28 rounded-xl bg-[var(--o-admin-fill-2)]" />
        <div className="h-9 w-28 rounded-xl bg-[var(--o-admin-fill-2)]" />
      </div>

      {/* Table */}
      <div className="ap-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[var(--line)] px-4 py-3">
          {[60, 120, 80, 100, 80, 80].map((w, i) => (
            <div key={i} className="h-3 rounded bg-[var(--o-admin-fill-3)]" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--line)] px-4 py-3"
          >
            {[60, 120, 80, 100, 80, 80].map((w, j) => (
              <div
                key={j}
                className="h-3 rounded bg-[var(--o-admin-fill-1)]"
                style={{ width: j === 1 ? w + 20 : w }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

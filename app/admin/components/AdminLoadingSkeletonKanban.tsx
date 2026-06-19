const COLUMNS = [
  { cards: 3 },
  { cards: 4 },
  { cards: 2 },
  { cards: 3 },
];

export default function AdminLoadingSkeletonKanban() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2">
        <div className="h-9 w-48 ap-card" />
        <div className="h-9 w-32 ap-card" />
        <div className="ml-auto flex gap-1">
          <div className="h-9 w-24 ap-card" />
          <div className="h-9 w-20 ap-card" />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col, ci) => (
          <div key={ci} className="space-y-3 ap-card p-3">
            {/* Column header */}
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-[var(--o-admin-fill-3)]" />
              <div className="h-5 w-6 rounded-full bg-[var(--o-admin-fill-2)]" />
            </div>
            {/* Cards */}
            {Array.from({ length: col.cards }).map((_, ki) => (
              <div key={ki} className="ap-card p-3 space-y-2">
                <div className="h-3.5 w-full rounded bg-[var(--o-admin-fill-3)]" />
                <div className="h-3 w-2/3 rounded bg-[var(--o-admin-fill-2)]" />
                <div className="flex gap-1.5 pt-0.5">
                  <div className="h-5 w-14 rounded-full bg-[var(--o-admin-fill-2)]" />
                  <div className="h-5 w-10 rounded-full bg-[var(--o-admin-fill-2)]" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

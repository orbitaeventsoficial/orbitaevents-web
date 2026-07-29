export default function InventoryLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded" />
          <div className="h-4 w-64 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-xl" />
          <div className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-48 rounded-2xl border border-[var(--line)]" />
        ))}
      </div>
    </div>
  );
}

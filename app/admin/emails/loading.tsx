export default function EmailsLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded" />
        <div className="h-4 w-72 rounded" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-[var(--line)]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-[var(--line)]" />
        <div className="h-64 rounded-2xl border border-[var(--line)]" />
      </div>
    </div>
  );
}

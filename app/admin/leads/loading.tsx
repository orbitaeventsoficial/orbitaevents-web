export default function LeadsLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-slate-700/50" />
          <div className="h-4 w-64 rounded bg-slate-700/30" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-xl bg-slate-700/50" />
          <div className="h-9 w-28 rounded-xl bg-slate-700/50" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-white/10 bg-slate-950/60" />
        ))}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-slate-700/50" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 rounded-xl border border-white/10 bg-slate-950/60" />
        ))}
      </div>
    </div>
  );
}

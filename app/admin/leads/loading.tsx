export default function LeadsLoading() {
  return (
    <div className="animate-pulse space-y-4 px-1 pb-24 sm:space-y-6 sm:px-0 sm:pb-8">
      <div className="flex items-center justify-start gap-2">
        <div className="h-7 w-12 rounded bg-slate-700/40" />
        <div className="h-8 w-28 rounded-xl bg-slate-700/50" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-2">
            <div className="h-8 rounded bg-slate-700/40" />
            <div className="mt-2 space-y-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="h-20 rounded-xl border border-slate-700/30 bg-slate-900/40" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

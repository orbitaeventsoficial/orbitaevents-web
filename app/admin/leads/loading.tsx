export default function LeadsLoading() {
  return (
    <div className="animate-pulse space-y-4 px-1 pb-24 sm:space-y-6 sm:px-0 sm:pb-8">
      <div className="flex items-center justify-start gap-2">
        <div className="h-7 w-12 rounded bg-white/5" />
        <div className="h-8 w-28 rounded-xl bg-white/5" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 p-2">
            <div className="h-8 rounded bg-white/5" />
            <div className="mt-2 space-y-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="h-20 rounded-xl border border-white/10 bg-white/5" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

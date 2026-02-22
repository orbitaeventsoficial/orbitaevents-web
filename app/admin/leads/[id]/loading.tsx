export default function LeadDetailLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-white/5" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-white/5" />
          <div className="h-4 w-32 rounded bg-white/5" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="h-56 rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-40 rounded-2xl border border-white/10 bg-white/5" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-24 rounded-lg bg-white/5" />
            ))}
          </div>
          <div className="h-96 rounded-2xl border border-white/10 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

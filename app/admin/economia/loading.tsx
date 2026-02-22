export default function EconomiaLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="rounded-2xl border border-white/10 p-6">
        <div className="h-8 w-40 rounded" />
        <div className="mt-2 h-4 w-72 rounded" />
      </div>
      <div className="flex gap-1 rounded-2xl border border-white/10 p-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-11 flex-1 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-1 h-48 rounded-2xl border border-white/10" />
        <div className="lg:col-span-4 grid gap-3 grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-white/10" />
          ))}
        </div>
      </div>
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-white/10" />
        ))}
      </div>
    </div>
  );
}

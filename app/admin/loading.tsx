export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-white/5" />
          <div className="h-4 w-56 rounded-lg bg-white/5" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-white/5" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/5" />
        ))}
      </div>

      <div className="h-72 rounded-2xl border border-white/10 bg-white/5" />
      <div className="h-72 rounded-2xl border border-white/10 bg-white/5" />
    </div>
  );
}

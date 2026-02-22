export default function ClientsLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded bg-white/5" />
          <div className="h-4 w-64 rounded bg-white/5" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-white/5" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-xl bg-white/5" />
        <div className="h-10 w-24 rounded-xl bg-white/5" />
      </div>
      <div className="rounded-2xl border border-white/10 p-1">
        <div className="space-y-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}

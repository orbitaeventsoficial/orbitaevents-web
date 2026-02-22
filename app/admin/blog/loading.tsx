export default function BlogAdminLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded bg-white/5" />
          <div className="h-4 w-48 rounded bg-white/5" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-white/5" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-3">
            <div className="h-36 rounded-xl bg-white/5" />
            <div className="h-5 w-3/4 rounded bg-white/5" />
            <div className="h-4 w-1/2 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

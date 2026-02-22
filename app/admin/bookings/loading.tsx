export default function BookingsLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded" />
          <div className="h-4 w-56 rounded" />
        </div>
        <div className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-white/10" />
        ))}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 p-1">
        <div className="space-y-1">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CalendarLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded bg-white/5" />
          <div className="h-4 w-48 rounded bg-white/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-lg bg-white/5" />
          <div className="h-9 w-28 rounded-lg bg-white/5" />
          <div className="h-9 w-9 rounded-lg bg-white/5" />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`h-${i}`} className="h-8 rounded bg-white/5" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}

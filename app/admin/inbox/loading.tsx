export default function InboxLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-white/5" />
        <div className="h-4 w-56 rounded bg-white/5" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-1 rounded-2xl border border-white/10 p-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 h-[32rem]" />
      </div>
    </div>
  );
}

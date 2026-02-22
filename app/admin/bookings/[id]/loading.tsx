export default function BookingDetailLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-white/5" />
        <div className="space-y-2">
          <div className="h-7 w-52 rounded bg-white/5" />
          <div className="h-4 w-36 rounded bg-white/5" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="h-48 rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-36 rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-28 rounded-2xl border border-white/10 bg-white/5" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-48 rounded-2xl border border-white/10 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

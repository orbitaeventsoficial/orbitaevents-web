export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-white/5" />
        <div className="h-4 w-64 rounded bg-white/5" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="h-5 w-36 rounded bg-white/5" />
            <div className="h-10 w-full rounded-xl bg-white/5" />
            <div className="h-10 w-full rounded-xl bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

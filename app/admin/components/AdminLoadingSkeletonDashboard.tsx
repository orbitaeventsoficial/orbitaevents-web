export default function AdminLoadingSkeletonDashboard() {
  return (
    <div className="animate-pulse space-y-5">
      {/* OwnerControlStrip placeholder */}
      <div className="h-14 rounded-2xl border border-white/10 bg-white/[0.03]" />

      {/* KPI row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>

      {/* Panels row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-40 rounded-2xl border border-white/10 bg-white/[0.03]" />
        <div className="h-40 rounded-2xl border border-white/10 bg-white/[0.03]" />
        <div className="h-40 rounded-2xl border border-white/10 bg-white/[0.03]" />
      </div>

      {/* Chart */}
      <div className="h-56 rounded-2xl border border-white/10 bg-white/[0.03]" />

      {/* Two panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 rounded-2xl border border-white/10 bg-white/[0.03]" />
        <div className="h-48 rounded-2xl border border-white/10 bg-white/[0.03]" />
      </div>
    </div>
  );
}

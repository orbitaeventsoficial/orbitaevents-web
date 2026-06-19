export default function AdminLoadingSkeletonDashboard() {
  return (
    <div className="animate-pulse space-y-5">
      {/* KPI row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 ap-card" />
        ))}
      </div>

      {/* Panels row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-40 ap-card" />
        <div className="h-40 ap-card" />
        <div className="h-40 ap-card" />
      </div>

      {/* Chart */}
      <div className="h-56 ap-card" />

      {/* Two panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 ap-card" />
        <div className="h-48 ap-card" />
      </div>
    </div>
  );
}

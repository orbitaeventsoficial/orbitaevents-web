export default function AdminLoadingSkeletonDetail() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Page header: name + badge + actions */}
      <div className="flex items-start justify-between gap-4 pb-1">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 rounded bg-white/[0.05]" />
            <div className="h-5 w-16 rounded-full bg-white/[0.05]" />
          </div>
          <div className="h-8 w-56 rounded-lg bg-white/[0.05]" />
          <div className="h-3.5 w-48 rounded bg-white/[0.04]" />
        </div>
        <div className="flex shrink-0 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 ap-card" />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.07] pb-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-28 rounded-t-lg bg-white/[0.03]" />
        ))}
      </div>

      {/* Two-column content */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Main */}
        <div className="lg:col-span-8 space-y-4">
          <div className="ap-card p-5 space-y-3">
            <div className="h-5 w-1/3 rounded bg-white/[0.05]" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 ap-card" />
              ))}
            </div>
          </div>
          <div className="ap-card p-5 space-y-3">
            <div className="h-5 w-1/4 rounded bg-white/[0.05]" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 ap-card" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="ap-card p-4 space-y-3">
            <div className="h-4 w-1/2 rounded bg-white/[0.05]" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 ap-card" />
              ))}
            </div>
          </div>
          <div className="ap-card p-4 space-y-2">
            <div className="h-4 w-1/3 rounded bg-white/[0.05]" />
            {[1, 2].map((i) => (
              <div key={i} className="h-16 ap-card" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoadingSkeletonInbox() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Two-panel layout */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Left: email list */}
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          {/* Toolbar */}
          <div className="flex gap-2 pb-1">
            <div className="h-8 flex-1 rounded-lg bg-white/[0.04]" />
            <div className="h-8 w-8 rounded-lg bg-white/[0.04]" />
          </div>
          {/* Email rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-2.5 rounded-xl p-2.5">
              <div className="h-9 w-9 shrink-0 rounded-full bg-white/[0.05]" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 rounded bg-white/[0.05]" />
                  <div className="h-3 w-10 rounded bg-white/[0.04]" />
                </div>
                <div className="h-3 w-full rounded bg-white/[0.04]" />
                <div className="h-3 w-2/3 rounded bg-white/[0.03]" />
              </div>
            </div>
          ))}
        </div>

        {/* Right: email reader */}
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          {/* From / subject */}
          <div className="space-y-2 border-b border-white/[0.06] pb-4">
            <div className="h-6 w-2/3 rounded-lg bg-white/[0.05]" />
            <div className="flex gap-3">
              <div className="h-4 w-16 rounded bg-white/[0.04]" />
              <div className="h-4 w-48 rounded bg-white/[0.04]" />
            </div>
            <div className="flex gap-3">
              <div className="h-4 w-16 rounded bg-white/[0.04]" />
              <div className="h-4 w-36 rounded bg-white/[0.04]" />
            </div>
          </div>

          {/* Body */}
          <div className="space-y-3">
            {[80, 100, 65, 90, 55, 75].map((w, i) => (
              <div key={i} className={`h-3.5 rounded bg-white/[0.04]`} style={{ width: `${w}%` }} />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <div className="h-9 w-24 rounded-xl border border-white/10 bg-white/[0.03]" />
            <div className="h-9 w-20 rounded-xl border border-white/10 bg-white/[0.03]" />
          </div>
        </div>
      </div>
    </div>
  );
}

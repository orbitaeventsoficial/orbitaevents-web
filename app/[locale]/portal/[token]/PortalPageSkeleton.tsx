export default function PortalPageSkeleton() {
  return (
    <div
      className="min-h-screen animate-pulse pb-24 portal-shell-bg"
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Back link */}
        <div className="mb-6 h-3.5 w-14 rounded bg-white/[0.04]" />
        {/* Section label */}
        <div className="mb-2 h-3 w-20 rounded bg-white/[0.06]" />
        {/* Title */}
        <div className="mb-2 h-8 w-52 rounded-lg bg-white/[0.06]" />
        {/* Reference */}
        <div className="mb-8 h-3.5 w-36 rounded bg-white/[0.03]" />
        {/* Content blocks */}
        <div className="space-y-4">
          <div className="h-32 rounded-2xl border border-white/[0.07] bg-white/[0.025]" />
          <div className="h-28 rounded-2xl border border-white/[0.07] bg-white/[0.025]" />
          <div className="h-20 rounded-2xl border border-white/[0.07] bg-white/[0.025]" />
        </div>
      </div>
    </div>
  );
}

export default function PortalHubLoading() {
  return (
    <div
      className="min-h-screen animate-pulse pb-24 portal-shell-bg"
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Brand pill */}
        <div className="mb-6 flex justify-center">
          <div className="h-6 w-32 rounded-full bg-white/[0.04]" />
        </div>
        {/* Hero */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-4 w-52 rounded bg-white/[0.06]" />
          <div className="h-10 w-72 rounded-lg bg-white/[0.06]" />
          <div className="h-3.5 w-44 rounded bg-white/[0.03]" />
        </div>
        {/* Event info strip */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          <div className="h-4 w-40 rounded bg-white/[0.04]" />
          <div className="h-4 w-32 rounded bg-white/[0.04]" />
          <div className="h-4 w-24 rounded bg-white/[0.04]" />
        </div>
        {/* Progress bar */}
        <div className="mb-8 h-20 rounded-2xl border border-white/[0.07] bg-white/[0.025]" />
        {/* Section cards */}
        <div className="space-y-4">
          <div className="h-40 rounded-2xl border border-white/[0.07] bg-white/[0.025]" />
          <div className="h-32 rounded-2xl border border-white/[0.07] bg-white/[0.025]" />
          <div className="h-32 rounded-2xl border border-white/[0.07] bg-white/[0.025]" />
        </div>
      </div>
    </div>
  );
}

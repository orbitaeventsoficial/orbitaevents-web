/**
 * Loading state per la pàgina del Customer Hub
 * Es mostra mentre es carrega el contingut asíncron
 */
export default function CustomerHubLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header skeleton */}
      <header className="sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 space-y-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 rounded" />
                <div className="h-5 w-20 rounded-full" />
              </div>
              <div className="h-7 w-48 rounded" />
              <div className="h-4 w-64 rounded" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-24 rounded-lg" />
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl" />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 w-28 rounded-lg" />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pb-6 lg:grid-cols-12">
        {/* Main panel */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border p-5">
            <div className="h-6 w-1/3 rounded" />
            <div className="mt-2 h-4 w-2/3 rounded" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5">
            <div className="h-6 w-1/4 rounded" />
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border p-4">
            <div className="h-5 w-1/2 rounded" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

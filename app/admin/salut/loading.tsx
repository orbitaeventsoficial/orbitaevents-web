export default function SalutLoading() {
  return (
    <div className="space-y-6">
      <div className="ap-card p-6">
        <div className="h-7 w-28 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-white/5" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="ap-card p-5">
            <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-8 w-24 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="ap-card p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-5 w-48 animate-pulse rounded bg-white/5" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

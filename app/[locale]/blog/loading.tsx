export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] pt-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Title skeleton */}
        <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse mb-8" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/5 overflow-hidden animate-pulse">
              <div className="h-48 bg-white/10" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-20 bg-white/10 rounded" />
                <div className="h-6 w-full bg-white/10 rounded" />
                <div className="h-4 w-3/4 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ServiciosLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] pt-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Title skeleton */}
        <div className="h-10 w-72 bg-white/5 rounded-xl animate-pulse mb-4 mx-auto" />
        <div className="h-5 w-96 max-w-full bg-white/5 rounded-lg animate-pulse mb-12 mx-auto" />

        {/* Services grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/5 overflow-hidden animate-pulse">
              <div className="h-56 bg-white/10" />
              <div className="p-6 space-y-3">
                <div className="h-7 w-48 bg-white/10 rounded" />
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-2/3 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

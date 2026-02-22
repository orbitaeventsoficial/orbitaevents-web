/**
 * Generic admin loading skeleton.
 * Usage: export { default } from '../components/AdminLoadingSkeleton';
 */
export default function AdminLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded bg-white/5" />
        <div className="h-4 w-72 rounded bg-white/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-white/10 bg-white/5" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-white/10 bg-white/5" />
    </div>
  );
}

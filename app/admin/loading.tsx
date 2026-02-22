export default function AdminLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg" />
          <div className="h-4 w-56 rounded-lg" />
        </div>
        <div className="h-9 w-28 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="h-24 rounded-2xl border" />
        <div className="h-24 rounded-2xl border" />
        <div className="h-24 rounded-2xl border" />
        <div className="h-24 rounded-2xl border" />
      </div>

      <div className="rounded-2xl border h-72" />
      <div className="rounded-2xl border h-72" />
    </div>
  );
}

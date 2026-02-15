export default function CustomerHubLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
      <div className="h-28 animate-pulse rounded-2xl border border-slate-700/60 bg-slate-900/60" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-[520px] animate-pulse rounded-2xl border border-slate-700/60 bg-slate-900/60 lg:col-span-8" />
        <div className="h-[520px] animate-pulse rounded-2xl border border-slate-700/60 bg-slate-900/60 lg:col-span-4" />
      </div>
    </div>
  );
}


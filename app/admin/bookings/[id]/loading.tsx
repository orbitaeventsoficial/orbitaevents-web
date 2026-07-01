export default function BookingDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--ax-canvas)] text-[var(--t2)]">
      <div className="flex animate-pulse flex-col gap-3 px-4 py-6">
        <div className="h-3.5 w-1/4 rounded-[var(--o-r-sm)] bg-[var(--ax-fill-3)]" />
        <div className="h-3.5 w-[55%] rounded-[var(--o-r-sm)] bg-[var(--ax-fill-3)]" />
        <div className="h-3.5 w-4/5 rounded-[var(--o-r-sm)] bg-[var(--ax-fill-3)]" />
      </div>
    </div>
  );
}

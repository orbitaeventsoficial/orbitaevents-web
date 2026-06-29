export function AdminHelpLegend({ title, body }: { title: string; body: string }) {
  return (
    <div className="ap-card p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--t3)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--t2)]">{body}</p>
    </div>
  );
}

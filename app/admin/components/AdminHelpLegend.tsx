export function AdminHelpLegend({ title, body }: { title: string; body: string }) {
  return (
    <div className="ap-card p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{title}</p>
      <p className="mt-1 text-sm text-white/68">{body}</p>
    </div>
  );
}

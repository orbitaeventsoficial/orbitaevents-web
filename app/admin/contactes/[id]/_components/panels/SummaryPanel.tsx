import type { CustomerHubDTO } from '@/lib/customer-hub/dto';

export default function SummaryPanel({ data }: { data: CustomerHubDTO }) {
  const nextTask = data.tasks.find((task) => !task.done);

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <h2 className="text-lg font-semibold text-slate-100">Resum operatiu</h2>
      <p className="mt-1 text-sm text-slate-400">Fitxa principal del client amb l’estat real.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card label="Pressupostos" value={String(data.proposals.length)} />
        <Card label="Reserves" value={String(data.bookings.length)} />
        <Card label="Tasques obertes" value={String(data.tasks.filter((t) => !t.done).length)} />
        <Card label="Comunicacions" value={String(data.messages.length)} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-950/50 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-400">Pròxima acció</p>
        <p className="mt-1 text-sm text-slate-100">
          {nextTask ? nextTask.title : 'Sense tasques pendents. Crea la següent acció.'}
        </p>
      </div>
    </section>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}


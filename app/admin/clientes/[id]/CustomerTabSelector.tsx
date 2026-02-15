'use client';

import { useRouter } from 'next/navigation';

type TabKey = 'resumen' | 'presupuestos' | 'reservas' | 'comunicaciones' | 'tareas' | 'leads' | 'notas';

const TAB_LABELS: Record<TabKey, string> = {
  resumen: 'Resumen',
  presupuestos: 'Presupuestos',
  reservas: 'Reservas',
  comunicaciones: 'Comunicaciones',
  tareas: 'Tareas',
  leads: 'Leads',
  notas: 'Notas/Docs',
};

export default function CustomerTabSelector({
  customerId,
  currentTab,
}: {
  customerId: string;
  currentTab: TabKey;
}) {
  const router = useRouter();
  return (
    <label className="block sm:hidden">
      <span className="mb-1 block text-xs text-slate-400">Vista de la ficha</span>
      <select
        value={currentTab}
        onChange={(e) => router.push(`/admin/clientes/${customerId}?tab=${e.target.value}`)}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
      >
        {Object.entries(TAB_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

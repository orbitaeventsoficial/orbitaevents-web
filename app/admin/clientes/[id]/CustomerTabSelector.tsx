'use client';

import { useRouter } from 'next/navigation';

type TabKey = 'resumen' | 'presupuestos' | 'reservas' | 'comunicaciones' | 'tareas' | 'leads' | 'notas';

const TAB_LABELS: Record<TabKey, string> = {
  resumen: 'Resum',
  presupuestos: 'Pressupostos',
  reservas: 'Reserves',
  comunicaciones: 'Comunicacions',
  tareas: 'Tasques',
  leads: 'Entrades',
  notas: 'Notes/Docs',
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
      <span className="mb-1 block text-xs">Vista de la fitxa</span>
      <select
        value={currentTab}
        onChange={(e) => router.push(`/admin/clientes/${customerId}?tab=${e.target.value}`)}
        className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm"
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

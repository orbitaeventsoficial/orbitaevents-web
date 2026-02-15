import Link from 'next/link';
import PresupuestoPdfStudio from './PresupuestoPdfStudio';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Editor PDF Presupuestos | Orbita Admin',
};

export default function PresupuestosPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-sm">
        <Link href="/admin/settings" className="text-sm text-slate-300 hover:text-slate-100">
          ← Volver a configuración
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">Editor avanzado de presupuesto PDF</h1>
        <p className="mt-1 text-sm text-slate-300">
          Personaliza cliente, pack, extras, descuentos y texto para generar el PDF al momento.
        </p>
      </header>

      <PresupuestoPdfStudio />
    </div>
  );
}

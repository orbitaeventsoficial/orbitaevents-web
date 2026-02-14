import Link from 'next/link';
import QuoteTemplateEditor from './QuoteTemplateEditor';
import { getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';

export const dynamic = 'force-dynamic';

export default async function QuoteTemplateSettingsPage() {
  const template = await getQuoteTemplateSettings();

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <Link href="/admin/settings" className="text-sm text-slate-500 hover:text-slate-700">
          ← Volver a configuración
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-800">Plantilla de presupuestos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Define el texto del presupuesto, condiciones y copia interna. Esta plantilla se usa en
          preview y en emails enviados al cliente.
        </p>
      </header>

      <QuoteTemplateEditor initial={template} />
    </div>
  );
}

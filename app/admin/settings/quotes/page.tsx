import Link from 'next/link';
import QuoteTemplateEditor from './QuoteTemplateEditor';
import { DEFAULT_QUOTE_TEMPLATE, getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';

export const dynamic = 'force-dynamic';

export default async function QuoteTemplateSettingsPage() {
  let template = DEFAULT_QUOTE_TEMPLATE;
  let usingFallback = false;
  try {
    template = await getQuoteTemplateSettings();
  } catch {
    usingFallback = true;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm" style={{ color: '#111111' }}>
        <Link href="/admin/settings" className="text-sm !text-[#111111] hover:opacity-80">
          ← Volver a configuración
        </Link>
        <h1 className="mt-2 text-2xl font-semibold !text-[#111111]">Plantilla de presupuestos</h1>
        <p className="mt-1 text-sm !text-[#111111]">
          Define el texto del presupuesto, condiciones y copia interna. Esta plantilla se usa en
          preview y en emails enviados al cliente.
        </p>
        {usingFallback ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No se pudo cargar la configuración guardada. Se muestran valores por defecto.
          </p>
        ) : null}
      </header>

      <QuoteTemplateEditor initial={template} />
    </div>
  );
}

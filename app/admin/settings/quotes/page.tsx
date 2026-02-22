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
      <header className="rounded-2xl border p-6 shadow-sm">
        <Link href="/admin/settings" className="text-sm">
          ← Tornar a configuració
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Plantilla de pressupostos</h1>
        <p className="mt-1 text-sm">
          Defineix el text del pressupost, condicions i còpia interna. Aquesta plantilla s&apos;usa a
          la previsualització i als emails enviats al client.
        </p>
        {usingFallback ? (
          <p className="mt-3 rounded-xl border px-3 py-2 text-sm">
            No s&apos;ha pogut carregar la configuració guardada. Es mostren valors per defecte.
          </p>
        ) : null}
      </header>

      <QuoteTemplateEditor initial={template} />
    </div>
  );
}

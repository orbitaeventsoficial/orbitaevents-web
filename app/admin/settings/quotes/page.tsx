import QuoteTemplateEditor from './QuoteTemplateEditor';
import { DEFAULT_QUOTE_TEMPLATE, getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';
import { AdminPage } from '../../components/AdminPage';

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
    <AdminPage
      title="Plantilla de pressupostos"
      subtitle="Defineix el text del pressupost, condicions i còpia interna. Aquesta plantilla s'usa a la previsualització i als emails enviats al client."
      back={{ href: '/admin/settings', label: 'Configuració' }}
      alert={usingFallback ? (
        <p className="rounded-xl border px-3 py-2 text-sm">
          No s&apos;ha pogut carregar la configuració guardada. Es mostren valors per defecte.
        </p>
      ) : undefined}
    >
      <QuoteTemplateEditor initial={template} />
    </AdminPage>
  );
}

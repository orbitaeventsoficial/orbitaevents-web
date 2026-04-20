import QuoteTemplateEditor from './QuoteTemplateEditor';
import { DEFAULT_QUOTE_TEMPLATE, getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';
import { EditorControlStrip } from '../../components/EditorControlStrip';
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
      <EditorControlStrip
        overview={{
          eyebrow: 'Plantilla viva',
          title: 'Què controla aquest editor',
          stats: [
            { label: 'Validesa', value: template.validityDays, hint: 'dies' },
            { label: 'Condicions', value: template.conditions.length, hint: 'línies actives' },
            { label: 'Còpia interna', value: template.sendAdminCopy ? 'Activa' : 'Desactivada', tone: template.sendAdminCopy ? 'success' : 'default' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé vigilar abans de tocar res',
          items: [
            'Aquest text afecta tant la previsualització del pressupost com l’email que rep el client.',
            template.sendAdminCopy ? `La còpia interna s'envia a ${template.adminCopyEmail || 'l’adreça configurada'}.` : 'La còpia interna automàtica està desactivada.',
            usingFallback ? 'Ara mateix estàs treballant sobre valors per defecte, no sobre la configuració guardada.' : 'Estàs editant la configuració guardada actualment.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: 'Polir el missatge, no només omplir camps',
          description: 'El millor retorn aquí sol ser revisar validesa, condicions i CTA perquè el pressupost tanqui millor sense afegir fricció ni soroll intern.',
          secondaryPills: [`Títol actual: ${template.introTitle}`, `CTA: ${template.ctaTitle}`],
        }}
      />

      <QuoteTemplateEditor initial={template} />
    </AdminPage>
  );
}

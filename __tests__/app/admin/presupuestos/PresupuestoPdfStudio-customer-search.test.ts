import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('PresupuestoPdfStudio customer search guard', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/presupuestos/PresupuestoPdfStudio.tsx'), 'utf8');
  const previewSource = readFileSync(join(process.cwd(), 'app/admin/presupuestos/StudioPreview.tsx'), 'utf8');
  const utilsSource = readFileSync(join(process.cwd(), 'app/admin/presupuestos/studio-utils.ts'), 'utf8');
  const pageSource = readFileSync(join(process.cwd(), 'app/admin/presupuestos/page.tsx'), 'utf8');
  const adminConstantsSource = readFileSync(join(process.cwd(), 'lib/constants/admin.ts'), 'utf8');
  const proposalAdminServiceSource = readFileSync(join(process.cwd(), 'lib/services/proposalAdminService.ts'), 'utf8');
  const nextConfigSource = readFileSync(join(process.cwd(), 'next.config.mjs'), 'utf8');

  it('no tracta una fallada de cerca de clients com a zero resultats', () => {
    const start = source.indexOf('// --- Customer search autocomplete');
    const end = source.indexOf('function selectCustomer');
    const searchBlock = source.slice(start, end);

    expect(source).toContain('const CUSTOMER_SEARCH_ERROR =');
    expect(searchBlock).toContain('throw new Error(data.error || data.message || CUSTOMER_SEARCH_ERROR);');
    expect(searchBlock).toContain('setCustomerSearchError(error instanceof Error ? error.message : CUSTOMER_SEARCH_ERROR);');
    expect(source).toContain('customerSearchError && (');
    expect(source).toContain('role="alert"');
    expect(source).toContain('!customerSearchError && customerResults.length === 0');
    expect(searchBlock).not.toContain("} catch (error) { log.error('Error cercant clients', error); }");
  });

  it('no confirma una proposta enviada si el marcatge backend falla', () => {
    const start = source.indexOf('async function sendQuoteEmail');
    const end = source.indexOf('function onLogoChange');
    const sendBlock = source.slice(start, end);

    expect(source).toContain('function readStudioMutationError');
    expect(sendBlock).toContain('const markSentResponse = await fetchWithCsrf(`/api/admin/proposals/${targetProposalId}/send`, { method: \'POST\' });');
    expect(sendBlock).toContain('const markSentData = await markSentResponse.json().catch(() => ({})) as StudioMutationPayload;');
    expect(sendBlock).toContain('if (!markSentResponse.ok || markSentData.ok === false) {');
    expect(sendBlock).toContain('throw new Error(readStudioMutationError(markSentData, "No s\'ha pogut marcar la proposta com enviada"));');
    expect(sendBlock).not.toMatch(/^\s*await fetchWithCsrf\(`\/api\/admin\/proposals\/\$\{targetProposalId\}\/send`, \{ method: 'POST' \}\);/m);
  });

  it('permet seleccionar si el pressupost aplica IVA i desa els camps fiscals coherents', () => {
    const start = source.indexOf('const [invoiceRequired');
    const end = source.indexOf('async function buildPdf', start);
    const fiscalBlock = source.slice(start, end);

    expect(source).toContain("import { DEPOSIT_PERCENT, roundMoney, calcVatAmount, calcVatRate } from '@/lib/constants/pricing';");
    expect(source).toContain('const [invoiceRequired, setInvoiceRequired] = useState(true);');
    expect(source).toContain('<option value="invoice">Aplicar IVA {calcVatRate(true)}%</option>');
    expect(source).toContain('<option value="no-invoice">Sense IVA aplicat</option>');
    expect(fiscalBlock).toContain('const vatRate = useMemo(() => calcVatRate(invoiceRequired), [invoiceRequired]);');
    expect(fiscalBlock).toContain('const vatAmount = useMemo(() => calcVatAmount(taxableBase, invoiceRequired), [taxableBase, invoiceRequired]);');
    expect(fiscalBlock).toContain('vatRate,');
    expect(fiscalBlock).toContain('vatAmount,');
    expect(fiscalBlock).toContain('total,');
    expect(fiscalBlock).not.toContain('VAT_RATE_INVOICE');
  });

  it('manté transport visible i un visor PDF real al lateral', () => {
    expect(utilsSource).toContain("export type SectionId = 'config' | 'client' | 'brand' | 'transport'");
    expect(adminConstantsSource).toContain("transport: 'Transport'");
    expect(adminConstantsSource).toContain("'config', 'client', 'transport', 'brand'");
    expect(adminConstantsSource).toContain('ADMIN_PDF_STUDIO_DEFAULT_COLLAPSED_SECTIONS');
    expect(utilsSource).toContain('DEFAULT_COLLAPSED_SECTIONS');
    expect(source).toContain('DEFAULT_COLLAPSED_SECTIONS.filter((id) => id !== \'pack\' && id !== \'extras-custom\')');
    expect(source).toContain("case 'transport':");
    expect(source).toContain('Km anada+tornada');
    expect(source).toContain('Peatges');
    expect(source).toContain('travelTollsEur');
    expect(source).toContain('transportBudget = useMemo');
    expect(source).toContain("tollsEur: travelTollsEur");
    expect(source).toContain('async function previewPdf()');
    expect(source).toContain("doc.output('blob') as Blob");
    expect(source).toContain('<iframe');
    expect(source).toContain('Previsualització PDF');
    expect(source).toContain('Obrir en pestanya');
    expect(source).toContain('admin-quote-studio-form order-2');
    expect(source).toContain('admin-quote-studio-side order-1');
    expect(source).toContain('min-h-40');
    expect(source).toContain('sm:min-h-64');
  });

  it('centralitza les accions del PDF al visor i no duplica el preview al final del formulari', () => {
    const finalActionsStart = source.indexOf('admin-quote-actions rounded-xl');
    const sideStart = source.indexOf('admin-quote-studio-side order-1');
    const finalActionsBlock = source.slice(finalActionsStart, sideStart);

    const previewStart = source.indexOf('admin-quote-pdf-preview rounded-2xl');
    const previewEnd = source.indexOf('<StudioPreview', previewStart);
    const previewBlock = source.slice(previewStart, previewEnd);

    expect(finalActionsBlock).not.toContain('onClick={previewPdf}');
    expect(finalActionsBlock).not.toContain('onClick={downloadPdf}');
    expect(finalActionsBlock).not.toContain('onClick={printPdf}');
    expect(finalActionsBlock).not.toContain('onClick={sendQuoteEmail}');
    expect(finalActionsBlock).toContain('onClick={clearDraft}');
    expect(previewBlock).toContain('onClick={previewPdf}');
    expect(previewBlock).toContain('onClick={downloadPdf}');
    expect(previewBlock).toContain('onClick={printPdf}');
    expect(previewBlock).toContain('onClick={sendQuoteEmail}');
    expect(previewBlock).toContain('Obrir en pestanya');
    expect(previewBlock).toContain('documentMessageIsPositive');
  });

  it('hereta km i peatges del lead quan el pressupost s’obre des de leads', () => {
    expect(utilsSource).toContain('initialDistanceKm?: number;');
    expect(utilsSource).toContain('initialTollsEur?: number;');
    expect(utilsSource).toContain('initialEventType?: ServiceSlug;');
    expect(utilsSource).toContain('initialPreferLeadPrefill?: boolean;');
    expect(utilsSource).toContain('export function inferStudioServiceFromLead');
    expect(pageSource).toContain("import { inferStudioServiceFromLead } from './studio-utils';");
    expect(pageSource).toContain('distanceKm: true');
    expect(pageSource).toContain('tollsEur: true');
    expect(pageSource).toContain('const editorCustomer = customer || leadForEditor?.customer || null;');
    expect(pageSource).toContain('const initialEventType = inferStudioServiceFromLead({');
    expect(pageSource).toContain('const implicitLeadDraft = !explicitProposalId && resolvedLeadId');
    expect(pageSource).toContain("where: { leadId: resolvedLeadId, status: 'DRAFT' }");
    expect(pageSource).toContain('const editorProposalId = explicitProposalId || implicitLeadDraft?.id || \'\';');
    expect(pageSource).toContain('initialEventType={initialEventType}');
    expect(pageSource).toContain('initialProposalId={editorProposalId}');
    expect(pageSource).toContain('initialPreferLeadPrefill={preferLeadPrefill}');
    expect(pageSource).toContain('initialDistanceKm={leadForEditor?.distanceKm ?? undefined}');
    expect(pageSource).toContain('initialTollsEur={leadForEditor?.tollsEur ?? undefined}');
    expect(source).toContain('initialDistanceKm = 0');
    expect(source).toContain('initialTollsEur = 0');
    expect(source).toContain("initialEventType = 'bodas'");
    expect(source).toContain('initialPreferLeadPrefill = false');
    expect(source).toContain('deriveStudioDurationHours({');
    expect(source).toContain('eventSchedule: initialEventSchedule,');
    expect(source).toContain('eventSchedule: leadEventSchedule || nonEmptyString(snap.event?.schedule),');
    expect(source).toContain('useState<ServiceSlug>(initialEventType)');
    expect(source).toContain('if (!initialProposalId || !draftLoaded || initialPreferLeadPrefill) return;');
    expect(source).toContain('useState(() => Math.max(0, Number(initialDistanceKm) || 0))');
    expect(source).toContain('useState(() => Math.max(0, Number(initialTollsEur) || 0))');
    expect(source).not.toContain("setTravelKm(0);\n      setDistanceMessage('No s\\'ha pogut calcular la ruta. Cost de desplaçament: 0 €.')");
  });

  it('quan edita un proposalId resol el lead vinculat i rehidrata snapshots antics buits', () => {
    expect(pageSource).toContain('const proposalForEditor = proposalId');
    expect(pageSource).toContain('select: { customerId: true, leadId: true }');
    expect(pageSource).toContain("const resolvedLeadId = leadId || proposalForEditor?.leadId || '';");
    expect(pageSource).toContain('initialLeadId={resolvedLeadId}');

    expect(source).toContain('type StudioSnapshotLike = {');
    expect(source).toContain('type StudioProposalLeadPayload = {');
    expect(source).toContain('function hasSnapshotExtras');
    expect(source).toContain('const proposalLead = data?.proposal?.lead as StudioProposalLeadPayload | null | undefined;');
    expect(source).toContain('const linkedLeadId = initialLeadId || nonEmptyString(data?.proposal?.leadId) || nonEmptyString(proposalLead?.id) || \'\';');
    expect(source).toContain('const shouldHydrateLeadLines = Boolean(linkedLeadId && resolvedLeadCustomExtras.length > 0 && !hasSnapshotExtras(snap));');
    expect(source).toContain('else if (leadDistanceKm > 0) setTravelKm(Math.max(0, Number(leadDistanceKm) || 0));');
    expect(source).toContain('else if (leadEventLocation) setEventLocation(leadEventLocation);');
    expect(source).toContain('if (shouldHydrateLeadLines && leadGuests > 0) setGuests(leadGuests);');
    expect(source).toContain('setPackName(\'Bolo configurat al lead\');');
    expect(source).toContain('setCustomExtras(resolvedLeadCustomExtras);');
    expect(source).toContain('const hasCommercialAmount = basePrice > 0 || extrasPrice > 0;');
    expect(source).toContain("const packWarn = !hasCommercialAmount ? 'Indica preu o serveis'");
    expect(source).toContain('serviceItems={[');
    expect(previewSource).toContain('serviceItems: string[];');
    expect(previewSource).toContain('Serveis');
    expect(proposalAdminServiceSource).toContain('serviceLines: {');
    expect(proposalAdminServiceSource).toContain('distanceKm: true');
    expect(proposalAdminServiceSource).toContain('tollsEur: true');
  });

  it('permet el PDF blob del visor sense relaxar qui pot emmarcar la pagina', () => {
    expect(nextConfigSource).toContain("\"frame-src 'self' blob:");
    expect(nextConfigSource).toContain("\"frame-ancestors 'none'\"");
    expect(nextConfigSource).toContain('h.value.replace("frame-ancestors \'none\'", "frame-ancestors \'self\'")');
  });
});

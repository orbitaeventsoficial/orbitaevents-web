import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('PresupuestoPdfStudio customer search guard', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/presupuestos/PresupuestoPdfStudio.tsx'), 'utf8');

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
});

import { EXTRAS, getPacksByService, type ExtraDefinition, type ServiceSlug } from '@/app/config/packs-config';
import { EVENT_TYPE_DOCUMENT_LABELS } from '@/lib/constants';
import { generateContractPDF, generateQuotePDF, type QuoteData } from '@/lib/pdf-utils';
import { PDF_PREVIEW_PLACEHOLDER } from '@/lib/constants/pdfDocuments';
import { VAT_RATE_INVOICE, calcDeposit, calcVatAmount, roundMoney } from '@/lib/constants/pricing';
import { getCompanyConfig, getDefaultCancellationPolicy, getDefaultTermsAndConditions } from '@/lib/services/contractService';
import { generateInvoicePDF, type InvoiceLineItem, type InvoicePdfData } from '@/lib/services/invoicePdfService';
import { DEFAULT_QUOTE_TEMPLATE } from '@/lib/services/quoteTemplateService';
import { resolvePackI18nKey } from '@/lib/pack-i18n';

type SupportedLocale = 'ca' | 'es' | 'en';

function resolveLocale(value: string): SupportedLocale {
  return value === 'es' || value === 'en' ? value : 'ca';
}

function getCanonicalPreviewScenario(locale: SupportedLocale = 'ca') {
  const eventType: ServiceSlug = 'bodas';
  const packs = getPacksByService(eventType);
  const pack = packs.find((item) => item.popular) || packs[0];
  if (!pack) throw new Error('No hi ha packs canònics disponibles per previsualitzar PDFs');

  const compatibleExtras = EXTRAS.filter((extra) => {
    const compatible = !extra.compatibleWith || extra.compatibleWith.includes(eventType);
    return compatible && extra.enabled !== false && typeof extra.price === 'number';
  });
  const extrasPrice = compatibleExtras.reduce((total, extra) => total + (extra.price || 0), 0);
  const subtotal = pack.priceValue + extrasPrice;
  const vatAmount = calcVatAmount(subtotal, true);
  const totalWithVat = roundMoney(subtotal + vatAmount);
  const depositAmount = calcDeposit(totalWithVat);
  const remainingAmount = roundMoney(totalWithVat - depositAmount);
  const guests = pack.capacidadMinima && pack.capacidadMaxima
    ? Math.round((pack.capacidadMinima + pack.capacidadMaxima) / 2)
    : 0;

  return {
    locale,
    eventType,
    eventTypeLabel: EVENT_TYPE_DOCUMENT_LABELS.WEDDING,
    pack,
    extras: compatibleExtras,
    extrasPrice,
    subtotal,
    vatAmount,
    totalWithVat,
    totalWithoutVat: subtotal,
    depositAmount,
    remainingAmount,
    guests,
    issueDate: new Date(),
  };
}

function buildQuoteData(locale: SupportedLocale): QuoteData {
  const scenario = getCanonicalPreviewScenario(locale);
  return {
    reference: PDF_PREVIEW_PLACEHOLDER,
    eventType: scenario.eventType,
    pack: scenario.pack,
    date: PDF_PREVIEW_PLACEHOLDER,
    issueDate: PDF_PREVIEW_PLACEHOLDER,
    eventSchedule: PDF_PREVIEW_PLACEHOLDER,
    eventLocation: PDF_PREVIEW_PLACEHOLDER,
    guests: scenario.guests,
    extras: scenario.extras.map((extra) => extra.name),
    extrasCatalog: scenario.extras as ExtraDefinition[],
    basePrice: scenario.pack.priceValue,
    extrasPrice: scenario.extrasPrice,
    discount: 0,
    discountReason: '',
    total: scenario.totalWithoutVat,
    clientName: PDF_PREVIEW_PLACEHOLDER,
    clientEmail: PDF_PREVIEW_PLACEHOLDER,
    clientPhone: PDF_PREVIEW_PLACEHOLDER,
    validityDays: DEFAULT_QUOTE_TEMPLATE.validityDays,
    conditions: DEFAULT_QUOTE_TEMPLATE.conditions,
  };
}

export async function renderCanonicalQuotePreview(locale: SupportedLocale = 'ca'): Promise<Buffer> {
  const doc = await generateQuotePDF(buildQuoteData(resolveLocale(locale)), resolveLocale(locale));
  return Buffer.from(doc.output('arraybuffer'));
}

export async function renderCanonicalContractPreview(locale: SupportedLocale = 'ca'): Promise<Buffer> {
  const scenario = getCanonicalPreviewScenario(resolveLocale(locale));
  const company = await getCompanyConfig();
  const doc = await generateContractPDF({
    contractReference: PDF_PREVIEW_PLACEHOLDER,
    contractDate: PDF_PREVIEW_PLACEHOLDER,
    companyName: company.name,
    companyLegalName: company.legalName,
    companyNIF: company.nif,
    companyAddress: company.address,
    companyIBAN: company.iban,
    companyPhone: company.phone,
    companyEmail: company.email,
    clientName: PDF_PREVIEW_PLACEHOLDER,
    clientNIF: PDF_PREVIEW_PLACEHOLDER,
    clientAddress: PDF_PREVIEW_PLACEHOLDER,
    clientEmail: PDF_PREVIEW_PLACEHOLDER,
    clientPhone: PDF_PREVIEW_PLACEHOLDER,
    eventType: scenario.eventTypeLabel,
    eventDate: PDF_PREVIEW_PLACEHOLDER,
    eventTime: PDF_PREVIEW_PLACEHOLDER,
    eventEndTime: PDF_PREVIEW_PLACEHOLDER,
    eventLocation: PDF_PREVIEW_PLACEHOLDER,
    guestCount: scenario.guests,
    packName: scenario.pack.name,
    packPrice: scenario.pack.priceValue,
    djHours: scenario.pack.durationHours,
    extras: scenario.extras.map((extra) => ({ name: extra.name, price: extra.price || 0, quantity: 1 })),
    subtotal: scenario.subtotal,
    discount: 0,
    vatRate: VAT_RATE_INVOICE,
    vatAmount: scenario.vatAmount,
    total: scenario.totalWithVat,
    depositAmount: scenario.depositAmount,
    depositDueDate: PDF_PREVIEW_PLACEHOLDER,
    finalPaymentDue: PDF_PREVIEW_PLACEHOLDER,
    cancellationPolicy: getDefaultCancellationPolicy(scenario.locale),
    additionalClauses: getDefaultTermsAndConditions(scenario.locale),
  }, scenario.locale);
  return Buffer.from(doc.output('arraybuffer'));
}

export async function renderCanonicalInvoicePreview(locale: SupportedLocale = 'ca'): Promise<Buffer> {
  const scenario = getCanonicalPreviewScenario(resolveLocale(locale));
  const company = await getCompanyConfig();
  const lines: InvoiceLineItem[] = [{
    description: resolvePackI18nKey(scenario.pack.name, scenario.locale) || scenario.pack.name,
    quantity: 1,
    unitPrice: scenario.pack.priceValue,
    total: scenario.pack.priceValue,
  }];
  for (const extra of scenario.extras) {
    lines.push({
      description: resolvePackI18nKey(extra.name, scenario.locale) || extra.name,
      quantity: 1,
      unitPrice: extra.price || 0,
      total: extra.price || 0,
    });
  }

  const data: InvoicePdfData = {
    invoiceNumber: PDF_PREVIEW_PLACEHOLDER,
    issueDate: PDF_PREVIEW_PLACEHOLDER,
    dueDate: PDF_PREVIEW_PLACEHOLDER,
    companyName: company.name,
    companyNIF: company.nif,
    companyAddress: company.address,
    companyEmail: company.email,
    companyPhone: company.phone,
    companyIBAN: company.iban,
    clientName: PDF_PREVIEW_PLACEHOLDER,
    clientNIF: PDF_PREVIEW_PLACEHOLDER,
    clientAddress: PDF_PREVIEW_PLACEHOLDER,
    clientEmail: PDF_PREVIEW_PLACEHOLDER,
    clientPhone: PDF_PREVIEW_PLACEHOLDER,
    eventType: scenario.eventTypeLabel,
    eventDate: PDF_PREVIEW_PLACEHOLDER,
    eventLocation: PDF_PREVIEW_PLACEHOLDER,
    lines,
    subtotal: scenario.subtotal,
    vatRate: VAT_RATE_INVOICE,
    vatAmount: scenario.vatAmount,
    total: scenario.totalWithVat,
    depositAmount: scenario.depositAmount,
    depositPaid: false,
    remainingAmount: scenario.remainingAmount,
    remainingPaid: false,
  };
  const doc = await generateInvoicePDF(data, scenario.locale);
  return Buffer.from(doc.output('arraybuffer'));
}

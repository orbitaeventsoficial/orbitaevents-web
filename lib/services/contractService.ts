/**
 * Contract Service — Cicle de vida de contractes
 *
 * Genera contractes PDF des de propostes acceptades,
 * envia per email i gestiona estats (DRAFT→SENT→SIGNED).
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { SITE_CONFIG } from '@/app/config/site-config';
import { EMAIL_CONTACT } from '@/lib/constants/email';
import { INCLUDED_TRAVEL_KM } from '@/lib/services/travelCost';
import { generateContractPDF, type ContractPdfData } from '@/lib/pdf-utils';
import { type ContractData } from '@/lib/services/documentService';
import { log } from '@/lib/logger';
import { recordLeadContractCancelled, recordLeadContractSent, recordLeadContractSigned } from '@/lib/services/leadActivityService';
import { DOCUMENT_ADMIN_LOG_ACTIONS, recordDocumentAdminLog } from '@/lib/services/documentAuditTrailService';
import { uploadFile } from '@/lib/storage';

export async function getCompanyConfig() {
  const settings = await prisma.setting.findMany({
    where: { category: 'company' },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));
  return {
    name: map.get('company.name') || 'Òrbita Events',
    legalName: map.get('company.legalName') || process.env.COMPANY_LEGAL_NAME || 'Carles Ros Oliveras',
    nif: map.get('company.nif') || process.env.COMPANY_NIF || '',
    address: [map.get('company.address'), map.get('company.city'), map.get('company.postalCode')].filter(Boolean).join(', ') || 'Granollers, Barcelona',
    iban: map.get('company.iban') || process.env.COMPANY_IBAN || '',
    phone: EMAIL_CONTACT.phone,
    email: EMAIL_CONTACT.email,
  };
}

import type { Locale as SupportedLocale } from '@/i18n';

type ContractTrace = {
  proposalId: string;
  proposalReference: string;
  customerId: string | null;
  leadId: string | null;
  bookingId: string | null;
  total: number;
  locale: string;
};

export type ContractLineSnapshot = {
  name: string;
  price: number;
  quantity: number;
};

export type ContractDocumentSnapshot = {
  version: 1;
  createdAt: string;
  contractDate: string;
  contractReference: string;
  locale: string;
  company: {
    name: string;
    legalName: string;
    nif: string;
    address: string;
    iban: string;
    phone: string;
    email: string;
  };
  client: {
    name: string;
    nif: string | null;
    email: string;
    phone: string | null;
  };
  event: {
    type: string;
    date: string;
    time: string | null;
    endTime: string | null;
    location: string;
    guestCount: number;
  };
  pack: {
    name: string;
    price: number;
    djHours: number;
  };
  extras: ContractLineSnapshot[];
  serviceLines: ContractLineSnapshot[];
  totals: {
    subtotal: number;
    discount: number;
    vatRate: number;
    vatAmount: number;
    total: number;
    depositAmount: number;
    depositDueDate: string;
    finalPaymentDue: string;
  };
  terms: {
    cancellationPolicy: string;
    additionalClauses: string;
  };
  trace: ContractTrace;
};

function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `CTR-${year}-${timestamp}`;
}

export function getDefaultCancellationPolicy(locale: SupportedLocale = 'ca'): string {
  const policies: Record<SupportedLocale, string> = {
    ca: [
      '1. Cancel·lació amb més de 60 dies d\'antelació: es retorna el 100% de l\'aval.',
      '2. Cancel·lació entre 30 i 60 dies: es retorna el 50% de l\'aval.',
      '3. Cancel·lació amb menys de 30 dies: l\'aval no és reemborsable.',
      '4. Cancel·lació per part del prestador: es retorna el 100% de tots els pagaments rebuts.',
      '5. Canvi de data: es pot reprogramar sense cost si es fa amb un mínim de 30 dies, subjecte a disponibilitat.',
    ].join('\n'),
    es: [
      '1. Cancelación con más de 60 días de antelación: se devuelve el 100% de la señal.',
      '2. Cancelación entre 30 y 60 días: se devuelve el 50% de la señal.',
      '3. Cancelación con menos de 30 días: la señal no es reembolsable.',
      '4. Cancelación por parte del prestador: se devuelve el 100% de todos los pagos recibidos.',
      '5. Cambio de fecha: se puede reprogramar sin coste si se hace con un mínimo de 30 días, sujeto a disponibilidad.',
    ].join('\n'),
    en: [
      '1. Cancellation more than 60 days in advance: 100% deposit refund.',
      '2. Cancellation between 30 and 60 days: 50% deposit refund.',
      '3. Cancellation less than 30 days: deposit is non-refundable.',
      '4. Cancellation by the provider: 100% refund of all payments received.',
      '5. Date change: can be rescheduled at no cost if done at least 30 days in advance, subject to availability.',
    ].join('\n'),
  };
  return policies[locale];
}

export function getDefaultTermsAndConditions(locale: SupportedLocale = 'ca'): string {
  const terms: Record<SupportedLocale, string> = {
    ca: [
      `Reserva: La data queda confirmada amb el pagament del 30% d'aval.`,
      `Pagament final: El 70% restant s'abona 7 dies abans de l'esdeveniment.`,
      `Desplaçament: Inclòs fins a ${INCLUDED_TRAVEL_KM / 2} km des de Granollers. Per a distàncies superiors, s'aplicarà un suplement per desplaçament.`,
      `Hores extres: Si l'esdeveniment s'allarga més del temps contractat, es facturaran al preu d'hora extra indicat al pack.`,
      `Equip tècnic: L'equip de so, il·luminació i efectes especials és propietat d'Òrbita Events. El client es compromet a garantir un espai adequat i segur per a la instal·lació.`,
      `Responsabilitat per danys: El client és responsable de qualsevol dany causat a l'equip tècnic per part dels convidats o per condicions inadequades del lloc (humitat, pluja sense cobertura, etc.).`,
      `Alimentació: Per a esdeveniments de més de 6 hores, el client proporcionarà un àpat per al DJ/tècnic.`,
      `Soroll: El client és responsable d'obtenir els permisos necessaris i de complir amb les ordenances municipals de soroll. El prestador ajustarà el volum segons la normativa vigent.`,
      `Reserva de data: Un cop enviat el pressupost, la data queda reservada durant 48 hores sense necessitat de pagament. Si transcorregut aquest termini no s'ha formalitzat la reserva amb el pagament del 30% d'aval, la data quedarà lliure i es podrà assignar a un altre client.`,
      `Propietat intel·lectual: Les fotografies i vídeos realitzats durant els esdeveniments podran ser utilitzats per Òrbita Events amb fins promocionals, llevat d'indicació expressa en contrari per part del client.`,
    ].join('\n'),
    es: [
      `Reserva: La fecha queda confirmada con el pago del 30% de señal.`,
      `Pago final: El 70% restante se abona 7 días antes del evento.`,
      `Desplazamiento: Incluido hasta ${INCLUDED_TRAVEL_KM / 2} km desde Granollers. Para distancias superiores, se aplicará un suplemento por desplazamiento.`,
      `Horas extras: Si el evento se extiende más del tiempo contratado, se facturarán al precio de hora extra indicado en el pack.`,
      `Equipo técnico: El equipo de sonido, iluminación y efectos especiales es propiedad de Òrbita Events. El cliente se compromete a garantizar un espacio adecuado y seguro para la instalación.`,
      `Responsabilidad por daños: El cliente es responsable de cualquier daño causado al equipo técnico por parte de los invitados o por condiciones inadecuadas del lugar.`,
      `Alimentación: Para eventos de más de 6 horas, el cliente proporcionará una comida para el DJ/técnico.`,
      `Ruido: El cliente es responsable de obtener los permisos necesarios y de cumplir con las ordenanzas municipales de ruido.`,
      `Reserva de fecha: Una vez enviado el presupuesto, la fecha queda reservada durante 48 horas sin necesidad de pago. Si transcurrido este plazo no se ha formalizado la reserva con el pago del 30% de señal, la fecha quedará libre y podrá asignarse a otro cliente.`,
      `Propiedad intelectual: Las fotografías y vídeos realizados durante los eventos podrán ser utilizados por Òrbita Events con fines promocionales, salvo indicación expresa en contrario por parte del cliente.`,
    ].join('\n'),
    en: [
      `Booking: The date is confirmed upon payment of the 30% deposit.`,
      `Final payment: The remaining 70% is due 7 days before the event.`,
      `Travel: Included up to ${INCLUDED_TRAVEL_KM / 2} km from Granollers. A surcharge applies for greater distances.`,
      `Extra hours: If the event extends beyond the contracted time, extra hours will be billed at the rate indicated in the package.`,
      `Technical equipment: Sound, lighting and special effects equipment is property of Òrbita Events. The client commits to providing a safe and adequate space for setup.`,
      `Damage liability: The client is responsible for any damage to technical equipment caused by guests or inadequate venue conditions.`,
      `Catering: For events longer than 6 hours, the client will provide a meal for the DJ/technician.`,
      `Noise: The client is responsible for obtaining necessary permits and complying with local noise regulations.`,
      `Date reservation: Once the quote is sent, the date is reserved for 48 hours at no cost. If the booking is not confirmed with the 30% deposit payment within this period, the date will become available and may be assigned to another client.`,
      `Intellectual property: Photographs and videos taken during events may be used by Òrbita Events for promotional purposes, unless expressly indicated otherwise by the client.`,
    ].join('\n'),
  };
  return terms[locale];
}

function cleanJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cleanString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function cleanNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function cleanNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : fallback;
}

function cleanDate(value: unknown, fallback: Date | string): Date {
  const date = value instanceof Date ? value : new Date(String(value ?? ''));
  if (Number.isFinite(date.getTime())) return date;
  const fallbackDate = fallback instanceof Date ? fallback : new Date(fallback);
  return Number.isFinite(fallbackDate.getTime()) ? fallbackDate : new Date(0);
}

function isoFromPdfDateInput(value: Date | string): string {
  return cleanDate(value, new Date(0)).toISOString();
}

function toPrismaJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function cleanLines(value: unknown): ContractLineSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((line) => {
      if (!line || typeof line !== 'object') return null;
      const raw = line as Record<string, unknown>;
      const name = cleanString(raw.name).trim();
      if (!name) return null;
      return {
        name,
        price: cleanNumber(raw.price),
        quantity: cleanNumber(raw.quantity, 1) || 1,
      };
    })
    .filter((line): line is ContractLineSnapshot => Boolean(line));
}

export function readContractDocumentSnapshot(snapshot: unknown): ContractDocumentSnapshot | null {
  const root = cleanJsonRecord(snapshot);
  const raw = cleanJsonRecord(root.contractSnapshot);
  if (raw.version !== 1) return null;

  const company = cleanJsonRecord(raw.company);
  const client = cleanJsonRecord(raw.client);
  const event = cleanJsonRecord(raw.event);
  const pack = cleanJsonRecord(raw.pack);
  const totals = cleanJsonRecord(raw.totals);
  const terms = cleanJsonRecord(raw.terms);
  const trace = cleanJsonRecord(raw.trace);
  const contractReference = cleanString(raw.contractReference).trim();
  if (!contractReference) return null;

  return {
    version: 1,
    createdAt: cleanString(raw.createdAt, new Date(0).toISOString()),
    contractDate: cleanString(raw.contractDate, cleanString(raw.createdAt, new Date(0).toISOString())),
    contractReference,
    locale: cleanString(raw.locale, 'ca'),
    company: {
      name: cleanString(company.name),
      legalName: cleanString(company.legalName),
      nif: cleanString(company.nif),
      address: cleanString(company.address),
      iban: cleanString(company.iban),
      phone: cleanString(company.phone),
      email: cleanString(company.email),
    },
    client: {
      name: cleanString(client.name),
      nif: cleanNullableString(client.nif),
      email: cleanString(client.email),
      phone: cleanNullableString(client.phone),
    },
    event: {
      type: cleanString(event.type, 'OTHER'),
      date: cleanString(event.date, new Date(0).toISOString()),
      time: cleanNullableString(event.time),
      endTime: cleanNullableString(event.endTime),
      location: cleanString(event.location),
      guestCount: cleanNumber(event.guestCount),
    },
    pack: {
      name: cleanString(pack.name),
      price: cleanNumber(pack.price),
      djHours: cleanNumber(pack.djHours),
    },
    extras: cleanLines(raw.extras),
    serviceLines: cleanLines(raw.serviceLines),
    totals: {
      subtotal: cleanNumber(totals.subtotal),
      discount: cleanNumber(totals.discount),
      vatRate: cleanNumber(totals.vatRate),
      vatAmount: cleanNumber(totals.vatAmount),
      total: cleanNumber(totals.total),
      depositAmount: cleanNumber(totals.depositAmount),
      depositDueDate: cleanString(totals.depositDueDate, new Date(0).toISOString()),
      finalPaymentDue: cleanString(totals.finalPaymentDue, new Date(0).toISOString()),
    },
    terms: {
      cancellationPolicy: cleanString(terms.cancellationPolicy),
      additionalClauses: cleanString(terms.additionalClauses),
    },
    trace: {
      proposalId: cleanString(trace.proposalId),
      proposalReference: cleanString(trace.proposalReference),
      customerId: cleanNullableString(trace.customerId),
      leadId: cleanNullableString(trace.leadId),
      bookingId: cleanNullableString(trace.bookingId),
      total: cleanNumber(trace.total),
      locale: cleanString(trace.locale, cleanString(raw.locale, 'ca')),
    },
  };
}

export function buildContractDocumentSnapshot(input: {
  pdfData: ContractPdfData;
  trace: ContractTrace;
  createdAt?: Date;
}): ContractDocumentSnapshot {
  const createdAt = input.createdAt ?? new Date();
  const data = input.pdfData;
  return {
    version: 1,
    createdAt: createdAt.toISOString(),
    contractDate: isoFromPdfDateInput(data.contractDate),
    contractReference: data.contractReference,
    locale: input.trace.locale,
    company: {
      name: data.companyName,
      legalName: data.companyLegalName,
      nif: data.companyNIF,
      address: data.companyAddress,
      iban: data.companyIBAN,
      phone: data.companyPhone,
      email: data.companyEmail,
    },
    client: {
      name: data.clientName,
      nif: data.clientNIF ?? null,
      email: data.clientEmail,
      phone: data.clientPhone ?? null,
    },
    event: {
      type: data.eventType,
      date: isoFromPdfDateInput(data.eventDate),
      time: data.eventTime ?? null,
      endTime: data.eventEndTime ?? null,
      location: data.eventLocation,
      guestCount: data.guestCount,
    },
    pack: {
      name: data.packName,
      price: data.packPrice,
      djHours: data.djHours,
    },
    extras: data.extras ?? [],
    serviceLines: data.serviceLines ?? [],
    totals: {
      subtotal: data.subtotal,
      discount: data.discount,
      vatRate: data.vatRate,
      vatAmount: data.vatAmount,
      total: data.total,
      depositAmount: data.depositAmount,
      depositDueDate: isoFromPdfDateInput(data.depositDueDate),
      finalPaymentDue: isoFromPdfDateInput(data.finalPaymentDue),
    },
    terms: {
      cancellationPolicy: data.cancellationPolicy,
      additionalClauses: data.additionalClauses ?? '',
    },
    trace: input.trace,
  };
}

export function mergeContractDocumentSnapshot(
  snapshot: unknown,
  contractSnapshot: ContractDocumentSnapshot,
): Record<string, unknown> {
  return {
    ...cleanJsonRecord(snapshot),
    contractSnapshot,
  };
}

function contractSnapshotToPdfData(
  snapshot: ContractDocumentSnapshot,
  fallback: ContractPdfData,
): ContractPdfData {
  return {
    ...fallback,
    contractReference: snapshot.contractReference,
    contractDate: cleanDate(snapshot.contractDate, fallback.contractDate),
    companyName: snapshot.company.name || fallback.companyName,
    companyLegalName: snapshot.company.legalName || fallback.companyLegalName,
    companyNIF: snapshot.company.nif || fallback.companyNIF,
    companyAddress: snapshot.company.address || fallback.companyAddress,
    companyIBAN: snapshot.company.iban || fallback.companyIBAN,
    companyPhone: snapshot.company.phone || fallback.companyPhone,
    companyEmail: snapshot.company.email || fallback.companyEmail,
    clientName: snapshot.client.name || fallback.clientName,
    clientNIF: snapshot.client.nif ?? fallback.clientNIF,
    clientEmail: snapshot.client.email || fallback.clientEmail,
    clientPhone: snapshot.client.phone ?? fallback.clientPhone,
    eventType: snapshot.event.type || fallback.eventType,
    eventDate: cleanDate(snapshot.event.date, fallback.eventDate),
    eventTime: snapshot.event.time ?? fallback.eventTime,
    eventEndTime: snapshot.event.endTime ?? fallback.eventEndTime,
    eventLocation: snapshot.event.location || fallback.eventLocation,
    guestCount: snapshot.event.guestCount,
    packName: snapshot.pack.name || fallback.packName,
    packPrice: snapshot.pack.price,
    djHours: snapshot.pack.djHours,
    extras: snapshot.extras,
    serviceLines: snapshot.serviceLines,
    subtotal: snapshot.totals.subtotal,
    discount: snapshot.totals.discount,
    vatRate: snapshot.totals.vatRate,
    vatAmount: snapshot.totals.vatAmount,
    total: snapshot.totals.total,
    depositAmount: snapshot.totals.depositAmount,
    depositDueDate: cleanDate(snapshot.totals.depositDueDate, fallback.depositDueDate),
    finalPaymentDue: cleanDate(snapshot.totals.finalPaymentDue, fallback.finalPaymentDue),
    cancellationPolicy: snapshot.terms.cancellationPolicy || fallback.cancellationPolicy,
    additionalClauses: snapshot.terms.additionalClauses || fallback.additionalClauses,
  };
}

export async function renderContractPDF(proposalId: string): Promise<{
  contractReference: string;
  pdfBuffer: Buffer;
  depositAmount: number;
  depositDueDate: Date;
  finalPaymentDue: Date;
  cancellationPolicy: string;
  additionalClauses: string;
  trace: ContractTrace;
  contractSnapshot: ContractDocumentSnapshot;
  proposalSnapshot: Record<string, unknown>;
}> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: {
      customer: true,
      booking: { include: { pack: { include: { translations: true } }, extras: { include: { extra: { include: { translations: true } } } }, serviceLines: { orderBy: { sortOrder: 'asc' } } } },
    },
  });
  if (!proposal.customer) {
    throw new Error('Aquest pressupost no té client assignat. Vincula un client abans de generar el contracte.');
  }

  if (proposal.status !== 'ACCEPTED') {
    throw new Error('Només es pot generar un contracte d\'una proposta acceptada');
  }

  const locale = (proposal.locale || 'ca') as SupportedLocale;
  const contractReference = proposal.contractReference || generateContractNumber();

  const snapshot = (proposal.snapshot || {}) as Record<string, unknown>;
  const eventDate = proposal.booking?.eventDate || new Date(snapshot.eventDate as string || Date.now());
  const depositAmount = proposal.depositAmount ?? Math.round(proposal.total * 0.3 * 100) / 100;

  const now = new Date();
  const thirtyBefore = new Date(eventDate);
  thirtyBefore.setDate(thirtyBefore.getDate() - 30);
  const sevenFromNow = new Date(now);
  sevenFromNow.setDate(sevenFromNow.getDate() + 7);
  const candidateDeposit = thirtyBefore < sevenFromNow ? thirtyBefore : sevenFromNow;
  const depositDueDate = proposal.depositDueDate || (candidateDeposit < now ? sevenFromNow : candidateDeposit);

  let finalPaymentDue = proposal.finalPaymentDue || new Date(eventDate);
  if (!proposal.finalPaymentDue) {
    finalPaymentDue = new Date(eventDate);
    finalPaymentDue.setDate(finalPaymentDue.getDate() - 7);
    if (finalPaymentDue < depositDueDate) finalPaymentDue = new Date(depositDueDate);
    if (finalPaymentDue < now) finalPaymentDue = sevenFromNow;
  }

  const cancellationPolicy = proposal.cancellationPolicy || getDefaultCancellationPolicy(locale);
  const additionalClauses = proposal.additionalClauses || getDefaultTermsAndConditions(locale);

  const company = await getCompanyConfig();
  const packTranslation = proposal.booking?.pack?.translations?.find(t => t.locale === locale)
    || proposal.booking?.pack?.translations?.[0];
  const packName = (snapshot.packName as string) || packTranslation?.name || proposal.booking?.pack?.slug || '';

  const extras = proposal.booking?.extras?.map(be => {
    const extraTranslation = be.extra.translations?.find(t => t.locale === locale)
      || be.extra.translations?.[0];
    return {
      name: extraTranslation?.name || be.extra.slug,
      price: be.price,
      quantity: be.quantity,
    };
  });

  // Línies de servei fora de pack (animació, DJ extra, tècnic...). Al contracte
  // només hi va l'import de venda (revenueAmount), mai el cost intern.
  const serviceLines = proposal.booking?.serviceLines
    ?.filter(line => (line.revenueAmount || 0) > 0)
    .map(line => ({
      name: line.label,
      price: line.revenueAmount || 0,
      quantity: line.quantity || 1,
    }));

  const trace: ContractTrace = {
    proposalId: proposal.id,
    proposalReference: proposal.reference,
    customerId: proposal.customerId,
    leadId: proposal.leadId,
    bookingId: proposal.bookingId,
    total: proposal.total,
    locale,
  };

  const livePdfData: ContractPdfData = {
    contractReference,
    contractDate: now,
    companyName: company.name,
    companyLegalName: company.legalName,
    companyNIF: company.nif,
    companyAddress: company.address,
    companyIBAN: company.iban,
    companyPhone: company.phone,
    companyEmail: company.email,
    clientName: proposal.customer.name,
    clientNIF: proposal.customer.dni || undefined,
    clientAddress: undefined,
    clientEmail: proposal.customer.email,
    clientPhone: proposal.customer.phone || undefined,
    eventType: (snapshot.eventType as string) || proposal.booking?.eventType || 'OTHER',
    eventDate,
    eventTime: (snapshot.eventTime as string) || proposal.booking?.eventStartTime || undefined,
    eventEndTime: (snapshot.eventEndTime as string) || proposal.booking?.eventEndTime || undefined,
    eventLocation: (snapshot.eventLocation as string) || proposal.booking?.eventLocation || '',
    guestCount: (snapshot.guestCount as number) || proposal.booking?.guestCount || 0,
    packName,
    packPrice: (snapshot.packPrice as number) || proposal.booking?.pack?.price || 0,
    djHours: (snapshot.djHours as number) || proposal.booking?.pack?.djHours || 0,
    extras,
    serviceLines,
    subtotal: proposal.subtotal,
    discount: proposal.discount,
    vatRate: proposal.vatRate,
    vatAmount: proposal.vatAmount,
    total: proposal.total,
    depositAmount,
    depositDueDate,
    finalPaymentDue,
    cancellationPolicy,
    additionalClauses,
    signedBy: proposal.contractSignedBy || undefined,
    signedAt: proposal.contractSignedAt || undefined,
    signatureBlob: proposal.contractSignatureBlob || undefined,
    signatureIp: proposal.contractSignatureIp || undefined,
  };

  const existingContractSnapshot = readContractDocumentSnapshot(proposal.snapshot);
  const contractSnapshot = existingContractSnapshot ?? buildContractDocumentSnapshot({
    pdfData: livePdfData,
    trace,
    createdAt: now,
  });
  const pdfData = existingContractSnapshot
    ? contractSnapshotToPdfData(existingContractSnapshot, livePdfData)
    : livePdfData;

  const pdfDoc = await generateContractPDF(pdfData, locale);
  const pdfArrayBuffer = pdfDoc.output('arraybuffer');
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  const renderedDepositDueDate = cleanDate(pdfData.depositDueDate, depositDueDate);
  const renderedFinalPaymentDue = cleanDate(pdfData.finalPaymentDue, finalPaymentDue);

  return {
    contractReference: pdfData.contractReference,
    pdfBuffer,
    depositAmount: pdfData.depositAmount,
    depositDueDate: renderedDepositDueDate,
    finalPaymentDue: renderedFinalPaymentDue,
    cancellationPolicy: pdfData.cancellationPolicy,
    additionalClauses: pdfData.additionalClauses || '',
    trace,
    contractSnapshot,
    proposalSnapshot: mergeContractDocumentSnapshot(proposal.snapshot, contractSnapshot),
  };
}

export async function generateContractFromProposal(proposalId: string): Promise<{ contractReference: string; pdfBuffer: Buffer; }> {
  const result = await renderContractPDF(proposalId);

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      contractReference: result.contractReference,
      contractStatus: 'DRAFT',
      depositAmount: result.depositAmount,
      depositDueDate: result.depositDueDate,
      finalPaymentDue: result.finalPaymentDue,
      cancellationPolicy: result.cancellationPolicy,
      additionalClauses: result.additionalClauses,
      snapshot: toPrismaJson(result.proposalSnapshot),
    },
  });

  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.CONTRACT_GENERATED,
    entity: 'proposal',
    entityId: proposalId,
    details: {
      documentType: 'CONTRACT',
      source: 'admin_contract_generate',
      reference: result.contractReference,
      contractReference: result.contractReference,
      contractStatus: 'DRAFT',
      depositAmount: result.depositAmount,
      depositDueDate: result.depositDueDate.toISOString(),
      finalPaymentDue: result.finalPaymentDue.toISOString(),
      ...result.trace,
    },
  });

  log.info(`Contracte generat: ${result.contractReference} per proposta ${proposalId}`);
  return { contractReference: result.contractReference, pdfBuffer: result.pdfBuffer };
}

export async function sendContract(proposalId: string): Promise<void> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: { customer: true },
  });

  if (!proposal.customer) {
    throw new Error('Aquest pressupost no té client assignat. Vincula un client abans d\'enviar el contracte.');
  }
  if (!proposal.contractReference || !proposal.contractStatus) {
    throw new Error('Cal generar el contracte primer');
  }
  if (proposal.contractStatus === 'SIGNED') {
    throw new Error('El contracte ja està signat');
  }

  const rendered = await renderContractPDF(proposalId);
  const { pdfBuffer } = rendered;
  const { sendEmail } = await import('@/lib/email');

  const locale = (proposal.locale || 'ca') as SupportedLocale;
  const subjects: Record<SupportedLocale, string> = {
    ca: `Contracte ${proposal.contractReference} — Òrbita Events`,
    es: `Contrato ${proposal.contractReference} — Òrbita Events`,
    en: `Contract ${proposal.contractReference} — Òrbita Events`,
  };

  const bodies: Record<SupportedLocale, string> = {
    ca: `<p>Hola ${proposal.customer.name},</p><p>T'enviem el contracte de serveis per al teu esdeveniment. Si us plau, revisa'l i confirma'ns que tot és correcte.</p><p>Un cop estiguis d'acord, pots procedir amb el pagament de l'aval per confirmar la reserva.</p><p>Qualsevol dubte, no dubtis a contactar-nos.</p><p>Gràcies per confiar en Òrbita Events!</p>`,
    es: `<p>Hola ${proposal.customer.name},</p><p>Te enviamos el contrato de servicios para tu evento. Por favor, revísalo y confírmanos que todo está correcto.</p><p>Una vez estés de acuerdo, puedes proceder con el pago de la señal para confirmar la reserva.</p><p>Cualquier duda, no dudes en contactarnos.</p><p>¡Gracias por confiar en Òrbita Events!</p>`,
    en: `<p>Hello ${proposal.customer.name},</p><p>Please find attached the service agreement for your event. Please review it and confirm everything is correct.</p><p>Once you agree, you can proceed with the deposit payment to confirm the booking.</p><p>If you have any questions, don't hesitate to reach out.</p><p>Thank you for choosing Òrbita Events!</p>`,
  };

  await sendEmail({
    to: proposal.customer.email,
    subject: subjects[locale],
    html: bodies[locale],
    attachments: [{ filename: `contracte-${proposal.contractReference}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  });

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      contractStatus: 'SENT',
      contractSentAt: new Date(),
      snapshot: toPrismaJson(rendered.proposalSnapshot),
    },
  });

  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.CONTRACT_SENT,
    entity: 'proposal',
    entityId: proposalId,
    details: {
      documentType: 'CONTRACT',
      source: 'admin_contract_send',
      reference: proposal.contractReference,
      contractReference: proposal.contractReference,
      contractStatus: 'SENT',
      proposalId: proposal.id,
      proposalReference: proposal.reference,
      customerId: proposal.customerId,
      leadId: proposal.leadId,
      bookingId: proposal.bookingId,
      total: proposal.total,
      locale: proposal.locale,
      to: proposal.customer.email,
    },
  });

  if (proposal.leadId) {
    await recordLeadContractSent({
      leadId: proposal.leadId,
      contractReference: proposal.contractReference,
      to: proposal.customer.email,
    });

    await prisma.leadDocument.create({
      data: {
        leadId: proposal.leadId,
        type: 'CONTRACT',
        source: 'AUTO',
        title: `Contracte ${proposal.contractReference}`,
        fileUrl: proposal.contractPdfUrl || '',
      },
    });
  }

  log.info(`Contracte enviat: ${proposal.contractReference} a ${proposal.customer.email}`);
}

export async function generateSignedContractPdf(proposalId: string): Promise<{ contractPdfUrl: string; contractPdfKey: string }> {
  const { contractReference, pdfBuffer, trace, proposalSnapshot } = await renderContractPDF(proposalId);
  const safeReference = contractReference.replace(/[^A-Za-z0-9_-]/g, '-');
  const contractPdfKey = `contracts/${proposalId}/${safeReference}-signed.pdf`;
  const uploaded = await uploadFile(contractPdfKey, pdfBuffer);

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      contractPdfUrl: uploaded.publicUrl,
      contractPdfKey: uploaded.path,
      snapshot: toPrismaJson(proposalSnapshot),
    },
  });

  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.CONTRACT_SIGNED_PDF_GENERATED,
    entity: 'proposal',
    entityId: proposalId,
    details: {
      documentType: 'CONTRACT',
      source: 'contract_signature_pdf',
      reference: contractReference,
      contractReference,
      contractPdfUrl: uploaded.publicUrl,
      contractPdfKey: uploaded.path,
      ...trace,
    },
  });

  log.info(`PDF signat generat: ${contractReference} per proposta ${proposalId}`);
  return { contractPdfUrl: uploaded.publicUrl, contractPdfKey: uploaded.path };
}

export async function markContractSigned(proposalId: string, signedBy: string): Promise<void> {
  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { id: proposalId } });

  if (!proposal.contractReference) {
    throw new Error('No hi ha contracte generat per aquesta proposta');
  }
  if (proposal.contractStatus === 'SIGNED') {
    throw new Error('El contracte ja està signat');
  }
  if (proposal.contractStatus === 'CANCELLED') {
    throw new Error('No es pot signar un contracte cancel·lat');
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      contractStatus: 'SIGNED',
      contractSignedAt: new Date(),
      contractSignedBy: signedBy,
    },
  });

  if (proposal.leadId && proposal.contractReference) {
    await recordLeadContractSigned({
      leadId: proposal.leadId,
      contractReference: proposal.contractReference,
      signedBy,
      source: 'admin',
    });
  }

  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.CONTRACT_SIGNED,
    entity: 'proposal',
    entityId: proposalId,
    details: {
      documentType: 'CONTRACT',
      source: 'admin_contract_sign',
      reference: proposal.contractReference,
      contractReference: proposal.contractReference,
      contractStatus: 'SIGNED',
      proposalId: proposal.id,
      proposalReference: proposal.reference,
      customerId: proposal.customerId,
      leadId: proposal.leadId,
      bookingId: proposal.bookingId,
      total: proposal.total,
      locale: proposal.locale,
      signedBy,
    },
  });

  log.info(`Contracte signat: ${proposal.contractReference} per ${signedBy}`);
}

export async function cancelContract(proposalId: string) {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    select: {
      id: true,
      reference: true,
      customerId: true,
      leadId: true,
      bookingId: true,
      total: true,
      locale: true,
      contractStatus: true,
      contractReference: true,
    },
  });

  if (!proposal.contractStatus || !proposal.contractReference) {
    return { status: 400, body: { ok: false, error: 'No hi ha contracte generat' } };
  }
  if (proposal.contractStatus === 'SIGNED') {
    return { status: 400, body: { ok: false, error: 'No es pot cancel·lar un contracte ja signat' } };
  }
  if (proposal.contractStatus === 'CANCELLED') {
    return { status: 400, body: { ok: false, error: 'El contracte ja està cancel·lat' } };
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { contractStatus: 'CANCELLED' },
  });

  log.info(`Contracte cancel·lat: ${proposal.contractReference}`);

  if (proposal.leadId) {
    await recordLeadContractCancelled({
      leadId: proposal.leadId,
      contractReference: proposal.contractReference,
    });
  }

  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.CONTRACT_CANCELLED,
    entity: 'proposal',
    entityId: proposalId,
    details: {
      documentType: 'CONTRACT',
      source: 'admin_contract_cancel',
      reference: proposal.contractReference,
      contractReference: proposal.contractReference,
      contractStatus: 'CANCELLED',
      proposalId: proposal.id,
      proposalReference: proposal.reference,
      customerId: proposal.customerId,
      leadId: proposal.leadId,
      bookingId: proposal.bookingId,
      total: proposal.total,
      locale: proposal.locale,
    },
  });

  return { status: 200, body: { ok: true, status: 'CANCELLED' } };
}

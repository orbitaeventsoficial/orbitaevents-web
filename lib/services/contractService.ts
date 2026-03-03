/**
 * Contract Service — Cicle de vida de contractes
 *
 * Genera contractes PDF des de propostes acceptades,
 * envia per email i gestiona estats (DRAFT→SENT→SIGNED).
 */

import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/app/config/site-config';
import { INCLUDED_TRAVEL_KM } from '@/lib/services/travelCost';
import { generateContractPDF, type ContractPdfData } from '@/lib/pdf-utils';
import { generateContractNumber, type ContractData } from '@/lib/services/documentService';
import { log } from '@/lib/logger';

// ============================================
// COMPANY CONFIG (carrega de Settings DB amb fallback)
// ============================================

async function getCompanyConfig() {
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
    phone: SITE_CONFIG.business.phoneDisplay || SITE_CONFIG.business.phone,
    email: SITE_CONFIG.business.email,
  };
}

// ============================================
// DEFAULT TERMS & CONDITIONS
// ============================================

type SupportedLocale = 'ca' | 'es' | 'en';

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
    ].join('\n'),
  };
  return terms[locale];
}

// ============================================
// RENDER CONTRACT PDF (lectura pura — no modifica BD)
// ============================================

async function renderContractPDF(proposalId: string): Promise<{
  contractReference: string;
  pdfBuffer: Buffer;
  depositAmount: number;
  depositDueDate: Date;
  finalPaymentDue: Date;
  cancellationPolicy: string;
  additionalClauses: string;
}> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: {
      customer: true,
      booking: { include: { pack: { include: { translations: true } }, extras: { include: { extra: { include: { translations: true } } } } } },
    },
  });

  if (proposal.status !== 'ACCEPTED') {
    throw new Error('Només es pot generar un contracte d\'una proposta acceptada');
  }

  const locale = (proposal.locale || 'ca') as SupportedLocale;
  const contractReference = proposal.contractReference || generateContractNumber();

  const snapshot = (proposal.snapshot || {}) as Record<string, unknown>;
  const eventDate = proposal.booking?.eventDate || new Date(snapshot.eventDate as string || Date.now());
  const depositAmount = proposal.depositAmount ?? Math.round(proposal.total * 0.3 * 100) / 100;

  // Deposit due: 7 dies des d'ara o 30 dies abans de l'event (el que vingui primer, però mai al passat)
  const now = new Date();
  const thirtyBefore = new Date(eventDate);
  thirtyBefore.setDate(thirtyBefore.getDate() - 30);
  const sevenFromNow = new Date(now);
  sevenFromNow.setDate(sevenFromNow.getDate() + 7);
  const candidateDeposit = thirtyBefore < sevenFromNow ? thirtyBefore : sevenFromNow;
  const depositDueDate = proposal.depositDueDate || (candidateDeposit < now ? sevenFromNow : candidateDeposit);

  // Final payment: 7 dies abans de l'event (mai abans del depositDueDate ni al passat)
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

  // Pack name: usar traduccions, no slug
  const packTranslation = proposal.booking?.pack?.translations?.find(t => t.locale === locale)
    || proposal.booking?.pack?.translations?.[0];
  const packName = (snapshot.packName as string) || packTranslation?.name || proposal.booking?.pack?.slug || '';

  // Extras: usar traduccions, no slugs
  const extras = proposal.booking?.extras?.map(be => {
    const extraTranslation = be.extra.translations?.find(t => t.locale === locale)
      || be.extra.translations?.[0];
    return {
      name: extraTranslation?.name || be.extra.slug,
      price: be.price,
      quantity: be.quantity,
    };
  });

  const pdfData: ContractPdfData = {
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
  };

  const pdfDoc = await generateContractPDF(pdfData, locale);
  const pdfArrayBuffer = pdfDoc.output('arraybuffer');
  const pdfBuffer = Buffer.from(pdfArrayBuffer);

  return { contractReference, pdfBuffer, depositAmount, depositDueDate, finalPaymentDue, cancellationPolicy, additionalClauses };
}

// ============================================
// GENERATE CONTRACT FROM PROPOSAL (primera vegada)
// ============================================

export async function generateContractFromProposal(proposalId: string): Promise<{
  contractReference: string;
  pdfBuffer: Buffer;
}> {
  const result = await renderContractPDF(proposalId);

  // Només persistim si és la primera generació
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
    },
  });

  log.info(`Contracte generat: ${result.contractReference} per proposta ${proposalId}`);

  return { contractReference: result.contractReference, pdfBuffer: result.pdfBuffer };
}

// ============================================
// SEND CONTRACT BY EMAIL
// ============================================

export async function sendContract(proposalId: string): Promise<void> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: { customer: true },
  });

  if (!proposal.contractReference || !proposal.contractStatus) {
    throw new Error('Cal generar el contracte primer');
  }

  if (proposal.contractStatus === 'SIGNED') {
    throw new Error('El contracte ja està signat');
  }

  // Renderitzar PDF sense modificar BD
  const { pdfBuffer } = await renderContractPDF(proposalId);

  // Lazy import email to avoid circular deps
  const { sendEmail } = await import('@/lib/email');

  const locale = (proposal.locale || 'ca') as SupportedLocale;
  const subjects: Record<SupportedLocale, string> = {
    ca: `Contracte ${proposal.contractReference} — Òrbita Events`,
    es: `Contrato ${proposal.contractReference} — Òrbita Events`,
    en: `Contract ${proposal.contractReference} — Òrbita Events`,
  };

  const bodies: Record<SupportedLocale, string> = {
    ca: `<p>Hola ${proposal.customer.name},</p>
<p>T'enviem el contracte de serveis per al teu esdeveniment. Si us plau, revisa'l i confirma'ns que tot és correcte.</p>
<p>Un cop estiguis d'acord, pots procedir amb el pagament de l'aval per confirmar la reserva.</p>
<p>Qualsevol dubte, no dubtis a contactar-nos.</p>
<p>Gràcies per confiar en Òrbita Events!</p>`,
    es: `<p>Hola ${proposal.customer.name},</p>
<p>Te enviamos el contrato de servicios para tu evento. Por favor, revísalo y confírmanos que todo está correcto.</p>
<p>Una vez estés de acuerdo, puedes proceder con el pago de la señal para confirmar la reserva.</p>
<p>Cualquier duda, no dudes en contactarnos.</p>
<p>¡Gracias por confiar en Òrbita Events!</p>`,
    en: `<p>Hello ${proposal.customer.name},</p>
<p>Please find attached the service agreement for your event. Please review it and confirm everything is correct.</p>
<p>Once you agree, you can proceed with the deposit payment to confirm the booking.</p>
<p>If you have any questions, don't hesitate to reach out.</p>
<p>Thank you for choosing Òrbita Events!</p>`,
  };

  await sendEmail({
    to: proposal.customer.email,
    subject: subjects[locale],
    html: bodies[locale],
    attachments: [
      {
        filename: `contracte-${proposal.contractReference}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      contractStatus: 'SENT',
      contractSentAt: new Date(),
    },
  });

  // Log activity on lead if linked
  if (proposal.leadId) {
    await prisma.leadActivity.create({
      data: {
        leadId: proposal.leadId,
        type: 'DOCUMENT',
        title: 'Contracte enviat',
        description: `Contracte ${proposal.contractReference} enviat per email a ${proposal.customer.email}`,
      },
    });

    // Also create LeadDocument
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

// ============================================
// MARK CONTRACT AS SIGNED
// ============================================

export async function markContractSigned(
  proposalId: string,
  signedBy: string
): Promise<void> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
  });

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

  log.info(`Contracte signat: ${proposal.contractReference} per ${signedBy}`);
}

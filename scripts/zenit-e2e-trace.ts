import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

// This script creates tagged E2E data. Keep external integrations disabled.
process.env.HOLDED_ENABLED = 'false';
process.env.SMTP_HOST = '';
process.env.SMTP_PORT = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

type Check = {
  area: string;
  ok: boolean;
  detail?: unknown;
};

type Report = {
  stamp: string;
  outputDir: string;
  created: Record<string, unknown>;
  checks: Check[];
  warnings: string[];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateAtUtcMidnight(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function asEventType(value: unknown): string {
  const raw = String(value || '').toUpperCase();
  const valid = new Set([
    'WEDDING',
    'BIRTHDAY',
    'CORPORATE',
    'COMMUNION',
    'BAPTISM',
    'GRADUATION',
    'ANNIVERSARY',
    'PRIVATE_PARTY',
    'OTHER',
  ]);
  return valid.has(raw) ? raw : 'OTHER';
}

function record(report: Report, area: string, ok: boolean, detail?: unknown) {
  report.checks.push({ area, ok, detail });
}

async function main() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const outputDir = path.join(process.cwd(), '.codex-captures', 'zenit-e2e-1850', stamp);
  const report: Report = {
    stamp,
    outputDir,
    created: {},
    checks: [],
    warnings: [],
  };
  await mkdir(outputDir, { recursive: true });

  const [
    { prisma },
    { persistContactLead },
    { createAdminLead },
    { extractLeadDataFromText },
    { importLeadFromInboxMessage },
    { replaceLeadServiceLines, syncLeadBingoAssistantForGuests },
    { collaboratorProductToAnimacioProduct, listDossierCollaboratorProducts },
    {
      DOSSIER_DJ_CONTINUATION_PRODUCT_ID,
      DOSSIER_DJ_PRODUCT_ID,
      buildDossierProductsForSelection,
      productIdsFromDossierServiceLines,
      productToDossierServiceLine,
    },
    { buildDossierLineSnapshot },
    { DJ_CONTINUATION_HOUR_PRICE, DJ_FIRST_HOUR_PRICE, countProductCrewMembers },
    { computeBoloTransport, calculateTravelCostBreakdown, buildTravelMealAllowanceLines },
    { CUSTOM_BOOKING_PACK_MARKER },
    { createBookingFromInput },
    { assignBookingInventory },
    { applyBookingStatusSideEffects },
    { createAdminProposal, reassignProposalOwner },
    { createInvoiceFromBooking },
    { createAdminDeliveryNoteFromBooking, generateAdminDeliveryNotePdf, updateAdminDeliveryNoteStatus },
    { findPortalAccessByRawToken, issueClientPortalAccess },
    { getClientPortalDeliveryNoteDocument },
    { createAdminPostEventReport },
    { computeBookingFinancialSummary },
    { PROFITABILITY_MODEL_DEFAULTS },
    { getEffectiveVehicleCostPerKm },
  ] = await Promise.all([
    import('@/lib/prisma'),
    import('@/lib/services/contactLeadCaptureService'),
    import('@/lib/services/leadAdminService'),
    import('@/lib/services/leadTextExtractionService'),
    import('@/lib/services/inboxLeadImportService'),
    import('@/lib/services/leadServiceLineService'),
    import('@/lib/services/collaboratorProductService'),
    import('@/lib/services/dossierProductMappingService'),
    import('@/lib/services/dossierSnapshotService'),
    import('@/lib/constants/orbita-services'),
    import('@/lib/services/travelLaborCost'),
    import('@/lib/constants/pricing'),
    import('@/lib/services/bookingCreationService'),
    import('@/lib/services/bookingInventoryService'),
    import('@/lib/services/bookingStatusTransitionService'),
    import('@/lib/services/proposalAdminService'),
    import('@/lib/services/invoiceService'),
    import('@/lib/services/deliveryNoteAdminService'),
    import('@/lib/services/clientPortalAccess'),
    import('@/lib/clientPortalInvoice'),
    import('@/lib/services/postEventReportAdminService'),
    import('@/lib/services/costEngine'),
    import('@/lib/constants/admin'),
    import('@/lib/services/fuelReferenceService'),
  ]);

  async function findFreeEventDate(): Promise<string> {
    for (let i = 30; i < 390; i += 1) {
      const iso = toIsoDate(addDays(new Date(), i));
      const date = dateAtUtcMidnight(iso);
      const [availability, booking] = await Promise.all([
        prisma.availability.findUnique({ where: { date }, select: { id: true, status: true } }),
        prisma.booking.findFirst({ where: { eventDate: date, status: { not: 'CANCELLED' } }, select: { id: true } }),
      ]);
      if (!availability && !booking) return iso;
    }
    throw new Error('No free event date found for Zenit E2E');
  }

  async function transitionBooking(bookingId: string, newStatus: 'CONFIRMED' | 'COMPLETED') {
    const existing = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
    await applyBookingStatusSideEffects({
      bookingId,
      oldStatus: existing.status,
      newStatus,
      existing: {
        guestCount: existing.guestCount || 0,
        eventType: existing.eventType,
        eventDate: existing.eventDate,
        eventLocation: existing.eventLocation,
        eventStartTime: existing.eventStartTime,
        eventEndTime: existing.eventEndTime,
        reference: existing.reference,
        preferredLocale: existing.preferredLocale,
        clientEmail: existing.clientEmail,
        clientName: existing.clientName,
      },
      portalTrigger: 'zenit-e2e-trace',
    });
    await prisma.booking.update({ where: { id: bookingId }, data: { status: newStatus } });
  }

  const eventDate = await findFreeEventDate();
  const emailBase = `zenit.e2e.${stamp}`;
  const publicEmail = `${emailBase}.config@example.test`;
  const phone = '+34999000000';

  const publicLeadResult = await persistContactLead({
    name: `ZENIT E2E Config ${stamp}`,
    clientEmail: publicEmail,
    clientPhone: phone,
    eventType: 'PRIVATE_PARTY',
    eventDate,
    eventLocation: 'Cornella de Llobregat',
    eventStartTime: '20:30',
    eventEndTime: '23:30',
    guestCount: 96,
    estimatedPrice: 0,
    message: 'ZENIT E2E entrada configurador: Bingo + DJ + col·laboradors + transport.',
    source: 'CONFIGURATOR',
    preferredLocale: 'ca',
    updateNote: 'ZENIT E2E actualitzat via configurador.',
    createNote: 'ZENIT E2E creat via configurador.',
    landingPage: '/configurador',
  });
  const primaryLeadId = publicLeadResult.leadId;
  if (!primaryLeadId) throw new Error('Contact lead was not persisted');
  report.created.primaryLeadId = primaryLeadId;

  const whatsappText = `Hola, soc ZENIT WhatsApp ${stamp}. Vull Bingo Musical a Girona el ${eventDate} de 19:00 a 22:00 per 85 persones. Tel ${phone}.`;
  const extractedWhatsApp = extractLeadDataFromText(whatsappText);
  const whatsappLead = await createAdminLead({
    name: extractedWhatsApp.name || `ZENIT E2E WhatsApp ${stamp}`,
    email: `${emailBase}.whatsapp@example.test`,
    phone,
    eventType: asEventType(extractedWhatsApp.eventType) as any,
    eventDate,
    eventStartTime: '19:00',
    eventEndTime: '22:00',
    eventLocation: extractedWhatsApp.eventLocation || 'Girona',
    guestCount: Number(extractedWhatsApp.guestCount || 85),
    message: whatsappText,
    source: 'WHATSAPP',
    status: 'CONTACTED',
  });
  report.created.whatsappLeadId = whatsappLead.lead.id;

  try {
    const mailLead = await importLeadFromInboxMessage(Number(`9${stamp.slice(-6)}`), {
      fromAddress: `${emailBase}.mail@example.test`,
      fromName: `ZENIT E2E Mail ${stamp}`,
      subject: `ZENIT E2E pressupost ${stamp}`,
      bodyText: `Necessito pressupost per animacio adults i bingo el ${eventDate}, 110 persones, Tarragona, de 18:00 a 22:00.`,
    });
    report.created.mailImport = mailLead.body;
    record(report, 'entrada.mail.import', mailLead.status >= 200 && mailLead.status < 300, mailLead.body);
  } catch (error) {
    report.warnings.push(`Mail import fallback failed: ${error instanceof Error ? error.message : String(error)}`);
    const fallbackMailLead = await createAdminLead({
      name: `ZENIT E2E Mail ${stamp}`,
      email: `${emailBase}.mail@example.test`,
      phone,
      eventType: 'PRIVATE_PARTY',
      eventDate,
      eventStartTime: '18:00',
      eventEndTime: '22:00',
      eventLocation: 'Tarragona',
      guestCount: 110,
      message: 'Fallback local per entrada mail ZENIT E2E.',
      source: 'OTHER',
      status: 'NEW',
    });
    report.created.mailLeadId = fallbackMailLead.lead.id;
    record(report, 'entrada.mail.fallback', true, { leadId: fallbackMailLead.lead.id });
  }

  const adminLead = await createAdminLead({
    name: `ZENIT E2E Admin ${stamp}`,
    email: `${emailBase}.admin@example.test`,
    phone,
    eventType: 'CORPORATE',
    eventDate,
    eventStartTime: '17:00',
    eventEndTime: '21:00',
    eventLocation: 'Barcelona',
    guestCount: 70,
    message: 'Entrada creada manualment des admin per Zenit E2E.',
    source: 'OTHER',
    status: 'NEW',
  });
  report.created.adminLeadId = adminLead.lead.id;

  const [leadBeforeLines, collaboratorRows, dossierCollaboratorProducts] = await Promise.all([
    prisma.lead.findUniqueOrThrow({
      where: { id: primaryLeadId },
      select: { id: true, name: true, email: true, phone: true, customerId: true },
    }),
    prisma.collaboratorProduct.findMany({
      where: { isActive: true, visibleInBooking: true },
      include: { collaborator: { select: { id: true, name: true, company: true, roles: true } } },
      orderBy: [{ collaboratorId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    }),
    listDossierCollaboratorProducts(),
  ]);
  report.created.customerId = leadBeforeLines.customerId;
  record(report, 'entrada.configurador.customer', Boolean(leadBeforeLines.customerId), leadBeforeLines);
  record(report, 'collaboradors.productes.actius', collaboratorRows.length > 0, collaboratorRows.map((p) => ({
    id: p.id,
    name: p.name,
    collaboratorId: p.collaboratorId,
    sellPrice: p.sellPrice,
    costPrice: p.costPrice,
    imageUrl: p.imageUrl,
  })));

  const orbitaProducts = [
    {
      id: DOSSIER_DJ_PRODUCT_ID,
      nom: 'DJ Orbita',
      descripcio: ['Sessio musical amb equip propi.'],
      inclou: ['DJ i equip de so.'],
      priceFrom: DJ_FIRST_HOUR_PRICE,
      categoria: 'DJ',
      image: '/img/portfolio/discomovil/discomovil-01.avif',
    },
    {
      id: DOSSIER_DJ_CONTINUATION_PRODUCT_ID,
      nom: 'DJ hora amb equip muntat',
      descripcio: ['Continuacio DJ amb equip ja muntat.'],
      inclou: ['Hora addicional.'],
      priceFrom: DJ_CONTINUATION_HOUR_PRICE,
      categoria: 'DJ',
      image: '/img/portfolio/discomovil/discomovil-01.avif',
    },
  ];
  const dossierProducts = [
    ...orbitaProducts,
    ...dossierCollaboratorProducts.map(collaboratorProductToAnimacioProduct),
  ];
  const dossierIdentityMisses = dossierCollaboratorProducts
    .map(collaboratorProductToAnimacioProduct)
    .map((product) => {
      const line = productToDossierServiceLine(product, 1);
      const mapped = productIdsFromDossierServiceLines([line], dossierProducts);
      return { productId: product.id, name: product.nom, mapped, ok: mapped.includes(product.id) };
    })
    .filter((item) => !item.ok);
  record(report, 'dossier.collaborator.identity.all-visible', dossierIdentityMisses.length === 0, dossierIdentityMisses);

  const missingDossierImages = dossierCollaboratorProducts
    .filter((p) => !p.imageUrl)
    .map((p) => ({ id: p.id, name: p.nom, collaboratorId: p.sourceProviderId }));
  record(report, 'dossier.collaborator.images.visible', missingDossierImages.length === 0, missingDossierImages);

  const visibleLines = collaboratorRows.map((product, index) => {
    const collaboratorName = product.collaborator.company || product.collaborator.name;
    const roles = product.collaborator.roles || [];
    const kind = roles.includes('EQUIPMENT_RENTAL') ? 'EQUIPMENT' : 'PROVIDER_SERVICE';
    const travelHeadcount = kind === 'PROVIDER_SERVICE' ? countProductCrewMembers(product.crew) : 0;
    return {
      collaboratorId: product.collaboratorId,
      kind,
      label: `${product.name} · ${collaboratorName}`,
      revenueAmount: product.sellPrice,
      costAmount: product.costPrice,
      quantity: 1,
      hours: product.durationLabel?.match(/(\d+(?:[,.]\d+)?)/)?.[1]
        ? Number(product.durationLabel.match(/(\d+(?:[,.]\d+)?)/)?.[1]?.replace(',', '.'))
        : null,
      notes: `Producte de catàleg: ${product.id}`,
      travelHeadcount,
      sortOrder: index + 1,
    };
  });

  const serviceLinesBaseRaw = [
    {
      collaboratorId: null,
      kind: 'DJ',
      label: 'DJ Orbita · primera hora',
      revenueAmount: 150,
      costAmount: null,
      quantity: 1,
      hours: 1,
      notes: 'ZENIT E2E servei propi.',
      sortOrder: 0,
    },
    ...visibleLines,
  ];
  const serviceLinesBase = syncLeadBingoAssistantForGuests(serviceLinesBaseRaw, 96)
    .map((line, index) => ({ ...line, sortOrder: index }));

  const routeKm = 411.4;
  const tollsEur = 29;
  const vehicleCostReference = await getEffectiveVehicleCostPerKm();
  const vehicleCostPerKm = vehicleCostReference.costPerKm;
  record(report, 'rutes.vehicle-cost-reference', vehicleCostPerKm > 0, vehicleCostReference);
  const transport = computeBoloTransport({
    roundTripKm: routeKm,
    serviceLines: serviceLinesBase,
    tollsEur,
    vehicleCostPerKm,
  });
  const people = transport.headcount > 0
    ? [
        { role: 'DRIVER' as const, label: 'Orbita' },
        ...(transport.headcount > 1 ? [{ role: 'PASSENGER' as const, label: 'Equip ruta', count: transport.headcount - 1 }] : []),
      ]
    : [];
  const routeBreakdown = calculateTravelCostBreakdown({
    roundTripKm: routeKm,
    tollsEur,
    vehicleCostPerKm,
    vehicleOwner: { label: 'Orbita' },
    people,
  });
  const routeLines = [
    ...routeBreakdown.lines,
    ...buildTravelMealAllowanceLines(people, transport.mealAllowance),
  ].map((line, index) => ({
    collaboratorId: line.collaboratorId,
    kind: 'OTHER',
    label: line.label,
    revenueAmount: 0,
    costAmount: line.costAmount,
    quantity: 1,
    hours: null,
    notes: line.notes,
    sortOrder: serviceLinesBase.length + index,
  }));

  const replaceLinesResult = await replaceLeadServiceLines(
    primaryLeadId,
    [...serviceLinesBase, ...routeLines],
    routeKm,
    tollsEur,
  );
  record(report, 'lead.bolo.service-lines.replace', replaceLinesResult.status === 200, replaceLinesResult.body);

  const leadServiceLines = await prisma.leadServiceLine.findMany({
    where: { leadId: primaryLeadId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  record(report, 'lead.bolo.service-lines.persisted', leadServiceLines.length === serviceLinesBase.length + routeLines.length, {
    expected: serviceLinesBase.length + routeLines.length,
    actual: leadServiceLines.length,
  });

  const dossierProductIds = productIdsFromDossierServiceLines(leadServiceLines, dossierProducts);
  const dossierSelectedProducts = buildDossierProductsForSelection(dossierProducts, dossierProductIds, 1);
  const dossierSnapshot = buildDossierLineSnapshot({
    products: dossierSelectedProducts,
    travelKm: routeKm,
    travelTollsEur: tollsEur,
    travelLocation: 'Cornella de Llobregat',
  });
  const dossier = await prisma.dossier.create({
    data: {
      leadId: primaryLeadId,
      nom: leadBeforeLines.name,
      telefon: leadBeforeLines.phone,
      email: leadBeforeLines.email,
      eventDesc: `${eventDate} · 20:30-23:30 · Cornella de Llobregat · 96 pax`,
      productIds: dossierProductIds,
      lineSnapshot: dossierSnapshot,
      mode: 'DRAFT',
    },
  });
  report.created.dossierId = dossier.id;
  record(report, 'dossier.create-from-lead-snapshot', dossierProductIds.length > 0, {
    dossierId: dossier.id,
    productIds: dossierProductIds,
    productNames: dossierSelectedProducts.map((product) => product.nom),
    imageCount: dossierSelectedProducts.filter((product) => product.image).length,
  });

  const serviceRevenue = serviceLinesBase.reduce((sum, line) => sum + Number(line.revenueAmount || 0) * (line.quantity || 1), 0);
  const proposalSubtotal = roundMoney(serviceRevenue + transport.clientCharge);
  const proposalVatRate = 21;
  const proposalVatAmount = roundMoney(proposalSubtotal * (proposalVatRate / 100));
  const proposalTotal = roundMoney(proposalSubtotal + proposalVatAmount);
  const proposal = await createAdminProposal({
    customerId: leadBeforeLines.customerId || undefined,
    leadId: primaryLeadId,
    status: 'SENT',
    locale: 'ca',
    currency: 'EUR',
    validityDays: 15,
    subtotal: proposalSubtotal,
    discount: 0,
    vatRate: proposalVatRate,
    vatAmount: proposalVatAmount,
    total: proposalTotal,
    snapshot: {
      zenit: true,
      stamp,
      source: 'lead-service-lines',
      serviceLines: serviceLinesBase,
      transport,
    },
    pdfUrl: `/zenit-e2e/${stamp}/pressupost-preview.pdf`,
    pdfKey: `zenit-e2e/${stamp}/pressupost-preview.pdf`,
  });
  report.created.proposalId = proposal.proposal.id;
  record(report, 'pressupost.create-from-lead-lines', proposal.ok && proposal.proposal.total === proposalTotal, {
    proposalId: proposal.proposal.id,
    subtotal: proposalSubtotal,
    vatAmount: proposalVatAmount,
    total: proposalTotal,
  });

  const bookingResult = await createBookingFromInput({
    leadId: primaryLeadId,
    customerId: leadBeforeLines.customerId || undefined,
    clientName: leadBeforeLines.name,
    clientEmail: leadBeforeLines.email,
    clientPhone: leadBeforeLines.phone || phone,
    eventType: 'PRIVATE_PARTY',
    eventDate,
    eventStartTime: '20:30',
    eventEndTime: '23:30',
    eventLocation: 'Cornella de Llobregat',
    eventVenue: 'ZENIT E2E Venue',
    guestCount: 96,
    packId: CUSTOM_BOOKING_PACK_MARKER,
    invoiceRequired: true,
    distanceKm: routeKm,
    tollsEur,
    fuelCostPerKm: vehicleCostPerKm,
    notes: `ZENIT E2E booking ${stamp}`,
  });
  record(report, 'reserva.create-from-lead-inherits-lines', bookingResult.status === 200 && Boolean((bookingResult.body as any).booking?.id), bookingResult.body);
  const booking = (bookingResult.body as any).booking;
  const bookingId = booking.id as string;
  report.created.bookingId = bookingId;
  await reassignProposalOwner({ proposalId: proposal.proposal.id, customerId: leadBeforeLines.customerId, leadId: primaryLeadId, bookingId, actor: 'zenit-e2e' });

  const bookingAfterCreate = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: {
      serviceLines: true,
      inventory: { include: { item: true } },
      availability: true,
      proposals: true,
    },
  });
  const bookingDistanceKm = Number(bookingAfterCreate.distanceKm ?? 0);
  const bookingTravelCost = Number(bookingAfterCreate.travelCost ?? 0);
  record(report, 'reserva.route.distance-persisted', Math.abs(bookingDistanceKm - routeKm) < 0.1, {
    expectedKm: routeKm,
    actualKm: bookingDistanceKm,
  });
  record(report, 'reserva.route.transport-persisted', Math.abs(bookingTravelCost - transport.clientCharge) < 0.01, {
    expectedTransport: transport.clientCharge,
    actualTransport: bookingTravelCost,
    expectedHeadcount: transport.headcount,
  });
  const bookingVisibleLineLabels = new Set(bookingAfterCreate.serviceLines.map((line) => line.label));
  const missingBookingLines = serviceLinesBase.filter((line) => line.label && !bookingVisibleLineLabels.has(line.label));
  record(report, 'reserva.service-lines.inherited', missingBookingLines.length === 0, missingBookingLines);
  record(report, 'calendari.availability.booked', bookingAfterCreate.availability.some((row) => row.status === 'BOOKED'), bookingAfterCreate.availability);

  await transitionBooking(bookingId, 'CONFIRMED');
  const availableItem = await prisma.inventoryItem.findFirst({
    where: {
      status: 'AVAILABLE',
      isConsumable: false,
      bookingItems: {
        none: {
          booking: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
        },
      },
    },
    orderBy: [{ category: 'asc' }, { code: 'asc' }],
  });
  record(report, 'inventari.available-item-found', Boolean(availableItem), availableItem ? {
    id: availableItem.id,
    code: availableItem.code,
    name: availableItem.name,
  } : null);
  let assignmentId: string | null = null;
  if (availableItem) {
    const assignment = await assignBookingInventory(bookingId, { mode: 'single', itemId: availableItem.id, quantity: 1 });
    assignmentId = (assignment.body as any).assignment?.id || null;
    record(report, 'inventari.assignat.reserva', assignment.status === 200, assignment.body);
  }

  await transitionBooking(bookingId, 'COMPLETED');
  const [usageRows, inventoryRows] = await Promise.all([
    prisma.inventoryUsage.findMany({ where: { bookingId }, include: { item: true } }),
    prisma.bookingInventory.findMany({ where: { bookingId }, include: { item: true } }),
  ]);
  record(report, 'hores-consumides.inventory-usage', usageRows.length > 0, usageRows.map((row) => ({
    itemCode: row.item.code,
    hoursUsed: row.hoursUsed,
  })));
  record(report, 'inventari.assignacio.persistida', inventoryRows.length > 0 && (!assignmentId || inventoryRows.some((row) => row.id === assignmentId)), inventoryRows.map((row) => ({
    id: row.id,
    itemCode: row.item.code,
    checkedOut: row.checkedOut,
    checkedIn: row.checkedIn,
  })));

  const bookingForMargin = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: {
      serviceLines: true,
      extras: true,
      pack: true,
    },
  });
  const financial = computeBookingFinancialSummary({
    total: bookingForMargin.subtotal,
    packPrice: bookingForMargin.pack.price,
    extrasTotal: bookingForMargin.extras.reduce((sum, extra) => sum + extra.price * extra.quantity, 0),
    extraHours: bookingForMargin.extraHours,
    extraHourPrice: bookingForMargin.pack.extraHourPrice,
    distanceKm: bookingForMargin.distanceKm || 0,
    vehicleCostPerKm: bookingForMargin.fuelCostPerKm,
    travelRevenue: transport.clientCharge,
    travelCost: bookingForMargin.travelCost,
    source: 'CONFIGURATOR',
    serviceLines: bookingForMargin.serviceLines,
  }, PROFITABILITY_MODEL_DEFAULTS);
  record(report, 'marges.motor-costos', Number.isFinite(financial.marginPct), {
    totalNet: bookingForMargin.subtotal,
    directCost: financial.directCost,
    netMargin: financial.netMargin,
    marginPct: financial.marginPct,
    serviceLinesRevenue: financial.serviceLinesRevenue,
    serviceLinesCost: financial.serviceLinesCost,
    transportMargin: financial.transportMargin,
    subcontractedMarkup: financial.subcontractedMarkup,
  });

  const invoice = await createInvoiceFromBooking(bookingId);
  report.created.invoiceId = invoice.invoiceId;
  const invoiceRow = await prisma.invoice.findUnique({ where: { id: invoice.invoiceId } });
  record(report, 'factura.create-from-booking', Boolean(invoiceRow), invoiceRow ? {
    id: invoiceRow.id,
    reference: invoiceRow.reference,
    subtotal: invoiceRow.subtotal,
    vatRate: invoiceRow.vatRate,
    vatAmount: invoiceRow.vatAmount,
    total: invoiceRow.total,
    status: invoiceRow.status,
  } : null);

  const postEventReport = await createAdminPostEventReport({
    bookingId,
    eventSummary: 'ZENIT E2E post-event completat.',
    startTime: '20:30',
    endTime: '23:30',
    soundQuality: 5,
    danceFloorLevel: 5,
    musicStyles: 'Bingo, adults, dance',
    status: 'COMPLETED',
  });
  record(report, 'post-event.report', postEventReport.status === 200, postEventReport.body);

  const template = await prisma.questionnaireTemplate.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (template) {
    const questionnaireResponse = await prisma.questionnaireResponse.upsert({
      where: { bookingId_templateId: { bookingId, templateId: template.id } },
      create: {
        bookingId,
        templateId: template.id,
        answers: { zenit: 'Resposta E2E' },
        submittedAt: new Date(),
      },
      update: {
        answers: { zenit: 'Resposta E2E actualitzada' },
        submittedAt: new Date(),
      },
    });
    record(report, 'enquesta.pre-event.questionnaire-response', true, {
      id: questionnaireResponse.id,
      templateId: template.id,
    });
  } else {
    record(report, 'enquesta.pre-event.questionnaire-template', false, 'No hi ha plantilla activa');
  }

  const clientSurvey = await prisma.clientSurvey.upsert({
    where: { bookingId },
    create: {
      bookingId,
      overallRating: 5,
      djMusicSelection: 5,
      djCrowdReading: 5,
      djEnergyAttitude: 5,
      djProfessionalism: 5,
      soundQuality: 5,
      volumeAdequate: 5,
      lightingQuality: 5,
      effectsQuality: 4,
      priorCommunication: 5,
      punctuality: 5,
      flexibility: 5,
      dancefloorActivity: 'MOSTLY_FULL',
      guestsEnjoyment: 'ALL',
      npsScore: 10,
      wouldHireAgain: 'YES_DEFINITELY',
      bestMoment: 'ZENIT E2E best moment',
      testimonialPermission: 'YES_ANONYMOUS',
    },
    update: {
      overallRating: 5,
      npsScore: 10,
      additionalComments: 'ZENIT E2E survey updated',
    },
  });
  record(report, 'enquesta.post-event.client-survey', Boolean(clientSurvey.id), {
    id: clientSurvey.id,
    npsScore: clientSurvey.npsScore,
    overallRating: clientSurvey.overallRating,
  });

  const collaborator = await prisma.collaborator.findFirst({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  if (collaborator) {
    const tempProduct = await prisma.collaboratorProduct.create({
      data: {
        collaboratorId: collaborator.id,
        name: `ZENIT E2E alta baixa ${stamp}`,
        category: 'ZENIT',
        durationLabel: '1h',
        costPrice: 10,
        sellPrice: 12,
        visibleInDossier: false,
        visibleInBooking: false,
      },
    });
    const disabledProduct = await prisma.collaboratorProduct.update({
      where: { id: tempProduct.id },
      data: { isActive: false },
    });
    record(report, 'producte.alta-baixa.collaborator-product', !disabledProduct.isActive, {
      id: disabledProduct.id,
      collaboratorId: collaborator.id,
      name: disabledProduct.name,
      isActive: disabledProduct.isActive,
    });
  } else {
    record(report, 'producte.alta-baixa.collaborator-product', false, 'No hi ha cap col·laborador actiu');
  }

  const transportSamples = [
    { label: 'local_dins_50', km: 40, tolls: 0, headcountOverride: 2 },
    { label: 'frontera_56', km: 56, tolls: 0, headcountOverride: 2 },
    { label: 'llarga_411_peatges', km: 411.4, tolls: 29, headcountOverride: 2 },
  ].map((sample) => {
    const result = computeBoloTransport({
      roundTripKm: sample.km,
      tollsEur: sample.tolls,
      headcountOverride: sample.headcountOverride,
      vehicleCostPerKm,
    });
    return {
      ...sample,
      clientCharge: result.clientCharge,
      cost: result.cost,
      routeHours: result.routeHours,
      chargeableHours: result.chargeableHours,
      mealAllowance: result.mealAllowance,
    };
  });
  const microTransport = transportSamples.filter((sample) => sample.clientCharge > 0 && sample.clientCharge < 10);
  record(report, 'rutes.transports.matrix', microTransport.length === 0, {
    samples: transportSamples,
    microTransport,
    note: 'Si aquest check falla, hi ha càrrecs comercials microscòpics com 1-2 EUR just sobre 50 km.',
  });

  const deliveryNoteCreate = await createAdminDeliveryNoteFromBooking(bookingId);
  const deliveryNoteId = deliveryNoteCreate.deliveryNoteId;
  if (deliveryNoteId) {
    await updateAdminDeliveryNoteStatus(deliveryNoteId, 'SIGNED', {
      signedBy: 'ZENIT E2E client',
      signatureIp: '127.0.0.1',
      signatureUa: 'zenit-e2e-trace',
    });
    await generateAdminDeliveryNotePdf(deliveryNoteId);
  }
  const deliveryNote = deliveryNoteId
    ? await prisma.deliveryNote.findUnique({ where: { id: deliveryNoteId }, select: { id: true, reference: true, status: true, bookingId: true, customerId: true, signedAt: true, pdfUrl: true, pdfKey: true } })
    : null;
  record(
    report,
    'albarans.booking-delivery-note',
    Boolean(deliveryNote && deliveryNote.status === 'SIGNED' && deliveryNote.bookingId === bookingId && deliveryNote.pdfUrl && deliveryNote.pdfKey),
    deliveryNote || deliveryNoteCreate,
  );

  const portalAccess = await issueClientPortalAccess({
    bookingId,
    locale: 'ca',
    createdBy: 'zenit-e2e-trace',
    expiresInDays: 7,
  });
  report.created.portalUrl = portalAccess.url;
  const portalRead = await findPortalAccessByRawToken(portalAccess.token);
  const portalDeliveryNote = portalRead
    ? getClientPortalDeliveryNoteDocument(portalRead.booking.deliveryNotes ?? [])
    : null;
  const portalTravel = portalRead
    ? computeBoloTransport({
        roundTripKm: Number(portalRead.booking.distanceKm ?? 0),
        serviceLines: portalRead.booking.serviceLines ?? [],
        hasOrbitaPack: Number(portalRead.booking.pack?.price ?? 0) > 0,
        tollsEur: Number(portalRead.booking.tollsEur ?? 0),
        vehicleCostPerKm: portalRead.booking.fuelCostPerKm ?? vehicleCostPerKm,
      })
    : null;
  record(
    report,
    'portal.travel.matches-booking',
    Boolean(
      portalTravel &&
      portalTravel.headcount === transport.headcount &&
      Math.abs(portalTravel.clientCharge - bookingTravelCost) < 0.01
    ),
    {
      portalUrl: portalAccess.url,
      expected: {
        headcount: transport.headcount,
        clientCharge: bookingTravelCost,
      },
      actual: portalTravel ? {
        headcount: portalTravel.headcount,
        clientCharge: portalTravel.clientCharge,
        vehicleCostPerKm: portalRead?.booking.fuelCostPerKm ?? null,
      } : null,
    },
  );
  record(
    report,
    'portal.documents.delivery-note-pdf',
    Boolean(deliveryNote?.pdfUrl && portalDeliveryNote?.pdfUrl === deliveryNote.pdfUrl && portalDeliveryNote.reference === deliveryNote.reference),
    {
      portalUrl: portalAccess.url,
      expected: deliveryNote ? { reference: deliveryNote.reference, pdfUrl: deliveryNote.pdfUrl } : null,
      actual: portalDeliveryNote,
    },
  );

  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    ok: report.checks.every((check) => check.ok),
    outputDir,
    created: report.created,
    failedChecks: report.checks.filter((check) => !check.ok).map((check) => ({ area: check.area, detail: check.detail })),
    warningCount: report.warnings.length,
  }, null, 2));

  await prisma.$disconnect();
  if (report.checks.some((check) => !check.ok)) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$disconnect();
  } catch {
    // ignore disconnect failures on fatal bootstrap errors
  }
  process.exit(1);
});

/**
 * SEED EXEMPLE — Crea dades d'exemple completes per testar l'admin
 * Executa: node scripts/seed-exemple.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('--- Netejant exemples anteriors ---');

  // Netejar en ordre correcte (relacions)
  await prisma.task.deleteMany({ where: { createdBy: 'system:exemple-seed' } });

  const oldProposal = await prisma.proposal.findUnique({ where: { reference: 'OE-PROP-EXEMPLE-001' } });
  if (oldProposal) {
    await prisma.proposal.delete({ where: { id: oldProposal.id } });
  }

  const oldBooking = await prisma.booking.findUnique({ where: { reference: 'OE-EXEMPLE-001' } });
  if (oldBooking) {
    await prisma.proposal.deleteMany({ where: { bookingId: oldBooking.id } });
    await prisma.booking.delete({ where: { id: oldBooking.id } });
  }

  // Netejar lead notes abans del lead
  const oldLeads = await prisma.lead.findMany({ where: { email: 'exemple.joan@test.cat' } });
  for (const ol of oldLeads) {
    await prisma.leadNote.deleteMany({ where: { leadId: ol.id } });
  }
  await prisma.lead.deleteMany({ where: { email: 'exemple.joan@test.cat' } });

  const oldCustomer = await prisma.customer.findUnique({ where: { emailNormalized: 'exemple.maria@test.cat' } });
  if (oldCustomer) {
    await prisma.customerActivity.deleteMany({ where: { customerId: oldCustomer.id } });
    await prisma.customer.delete({ where: { id: oldCustomer.id } });
  }

  console.log('OK - anteriors netejats\n');

  // ═══ 1. CLIENT ═══
  const customer = await prisma.customer.create({
    data: {
      name: '[EXEMPLE] Maria Garcia',
      nameNormalized: 'exemple maria garcia',
      email: 'exemple.maria@test.cat',
      emailNormalized: 'exemple.maria@test.cat',
      phone: '+34600000001',
      phoneNormalized: '34600000001',
      instagram: '@exempleorbita',
      instagramNormalized: 'exempleorbita',
      dni: '12345678Z',
      dniNormalized: '12345678Z',
      preferredLocale: 'ca',
      source: 'WEBSITE',
      gdprConsent: true,
      gdprConsentDate: new Date(),
      totalEvents: 1,
      totalSpent: 1200,
    }
  });
  console.log('✓ Client:', customer.name);

  // ═══ 2. LEAD (notes és relació LeadNote[], usar message per text lliure) ═══
  const lead = await prisma.lead.create({
    data: {
      name: '[EXEMPLE] Joan Puig',
      email: 'exemple.joan@test.cat',
      phone: '+34600000002',
      eventType: 'BIRTHDAY',
      eventDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      eventLocation: 'Barcelona',
      guestCount: 80,
      message: 'Festa 18è aniversari, 80 convidats, vol DJ + llums UV + fum. Pressupost enviat i acceptat.',
      status: 'WON',
      priority: 'HIGH',
      preferredLocale: 'ca',
      source: 'CONFIGURATOR',
      cachedScore: 78,
      cachedScoreAt: new Date(),
      customerId: customer.id,
      contactedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      convertedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      // Notes com a relació nested
      notes: {
        create: [
          { content: 'Primera trucada: molt interessada, vol tema neon UV per festa 18 anys.', createdBy: 'system:exemple-seed', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
          { content: 'Pressupost enviat per email. Espera confirmació.', createdBy: 'system:exemple-seed', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
          { content: 'Confirmat! Dipòsit rebut. Reserva creada.', createdBy: 'system:exemple-seed', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        ]
      }
    }
  });
  console.log('✓ Lead:', lead.name, '(score:', lead.cachedScore, ')');

  // ═══ 3. PACK (obligatori per a Booking) ═══
  let pack = await prisma.pack.findFirst({ where: { isActive: true } });
  if (!pack) {
    console.log('⚠ Cap pack actiu — creant pack exemple...');
    pack = await prisma.pack.create({
      data: {
        slug: 'premium-exemple',
        isActive: true,
        price: 950,
        extraHourPrice: 75,
        djHours: 5,
        soundWatts: 5000,
        includesFog: true,
        includesMic: true,
        service: 'fiestas',
        translations: {
          create: [
            { locale: 'ca', name: 'Premium', description: 'Pack complet per festes grans', features: ['DJ Professional', 'Equip so 5000W', 'Il·luminació LED', 'Màquina fum'] },
            { locale: 'es', name: 'Premium', description: 'Pack completo para fiestas grandes', features: ['DJ Profesional', 'Equipo sonido 5000W', 'Iluminación LED', 'Máquina humo'] },
            { locale: 'en', name: 'Premium', description: 'Complete pack for big parties', features: ['Professional DJ', '5000W Sound System', 'LED Lighting', 'Fog Machine'] },
          ]
        }
      }
    });
  }
  console.log('✓ Pack:', pack.slug, '(' + pack.price + '€)');

  // ═══ 4. RESERVA (amb km, cost viatge, hores extra, tots els camps obligatoris) ═══
  const eventDate = new Date();
  eventDate.setMonth(eventDate.getMonth() + 2);
  eventDate.setDate(15);

  const subtotal = 1200;
  // Exemple particular: sense factura, sense IVA.

  const booking = await prisma.booking.create({
    data: {
      reference: 'OE-EXEMPLE-001',
      clientName: '[EXEMPLE] Maria Garcia',
      clientEmail: 'exemple.maria@test.cat',
      clientPhone: '+34600000001',
      preferredLocale: 'ca',
      eventType: 'BIRTHDAY',
      eventDate: eventDate,
      eventStartTime: '22:00',
      eventEndTime: '04:00',
      eventLocation: 'Barcelona',
      eventVenue: 'Sala Razzmatazz',
      guestCount: 80,
      packId: pack.id,
      extraHours: 1,
      subtotal: 1200,
      discount: 0,
      vatRate: 0,       // Particular, sense IVA
      vatAmount: 0,
      total: 1200,
      depositAmount: 300,
      depositPaid: true,
      depositPaidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      remainingAmount: 900,
      remainingPaid: false,
      distanceKm: 45,
      fuelCostPerKm: 0.15,
      travelCost: 6.75,
      status: 'CONFIRMED',
      notes: 'Client vol tema neon/UV. Portar llums UV extra. Accés càrrega pel carrer lateral.',
      customerId: customer.id,
      leadId: lead.id,
    }
  });
  console.log('✓ Reserva:', booking.reference, '- Total:', booking.total, '€, Km:', booking.distanceKm, ', Hores extra:', booking.extraHours);

  // ═══ 5. PRESSUPOST (snapshot = Json, tots els camps obligatoris) ═══
  const proposal = await prisma.proposal.create({
    data: {
      reference: 'OE-PROP-EXEMPLE-001',
      bookingId: booking.id,
      customerId: customer.id,
      leadId: lead.id,
      status: 'ACCEPTED',
      locale: 'ca',
      validityDays: 15,
      subtotal: 1200,
      discount: 0,
      vatRate: 0,
      vatAmount: 0,
      total: 1200,
      snapshot: {
        clientName: '[EXEMPLE] Maria Garcia',
        clientEmail: 'exemple.maria@test.cat',
        clientPhone: '+34600000001',
        eventType: 'Festa 18è aniversari',
        eventDate: eventDate.toISOString(),
        location: 'Barcelona — Sala Razzmatazz',
        guestCount: 80,
        packName: pack.slug,
        packPrice: pack.price,
        extras: [
          { name: 'Llums UV extra (x4)', price: 100 },
          { name: 'Màquina de fum', price: 75 },
          { name: 'Hora extra DJ', price: 75 },
        ],
        subtotal: 1200,
        total: 1200,
        deposit: 300,
        distanceKm: 45,
        travelCost: 6.75,
        notes: 'Tema neon/UV — ambient festa jove',
      },
      sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    }
  });
  console.log('✓ Pressupost:', proposal.reference, '- Estat:', proposal.status);

  // ═══ 6. TASQUES ═══
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: '[EXEMPLE] Confirmar pagament restant 900€',
        description: 'Trucar Maria Garcia per confirmar transferència 900€ abans del 10/05.\nCompte: ES12 3456 7890 1234 5678',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
        priority: 'HIGH',
        customerId: customer.id,
        bookingId: booking.id,
        createdBy: 'system:exemple-seed',
      }
    }),
    prisma.task.create({
      data: {
        title: '[EXEMPLE] Preparar equip per Razzmatazz',
        description: 'Altaveus 5000W (x2), taula DJ, llums LED (x8), llums UV (x4), màquina fum, micro sense fil.\nAccés càrrega: carrer lateral, porta servei.',
        dueDate: new Date(eventDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
        priority: 'MEDIUM',
        customerId: customer.id,
        bookingId: booking.id,
        createdBy: 'system:exemple-seed',
      }
    }),
    prisma.task.create({
      data: {
        title: '[EXEMPLE] Enviar email recordatori event',
        description: 'Recordar a la client:\n- Hora arribada: 20:00 (muntatge)\n- Accés càrrega: carrer lateral\n- Contacte dia event: +34600000001\n- Playlist: confirmar gustos musicals',
        dueDate: new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
        priority: 'LOW',
        customerId: customer.id,
        bookingId: booking.id,
        createdBy: 'system:exemple-seed',
      }
    }),
  ]);
  console.log('✓ Tasques:', tasks.length, 'creades (pagament, equip, recordatori)');

  // ═══ 7. TIMELINE ACTIVITATS ═══
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  await Promise.all([
    prisma.customerActivity.create({
      data: { customerId: customer.id, action: 'CUSTOMER_CREATED', details: { source: 'EXEMPLE_SEED', channel: 'web' }, createdAt: new Date(now - 30 * DAY) }
    }),
    prisma.customerActivity.create({
      data: { customerId: customer.id, action: 'LEAD_CREATED', details: { source: 'EXEMPLE_SEED', eventType: 'BIRTHDAY', guestCount: 80 }, createdAt: new Date(now - 25 * DAY) }
    }),
    prisma.customerActivity.create({
      data: { customerId: customer.id, action: 'NOTE_ADDED', details: { source: 'EXEMPLE_SEED', text: 'Primera trucada: molt interessada, vol tema neon UV' }, createdAt: new Date(now - 20 * DAY) }
    }),
    prisma.customerActivity.create({
      data: { customerId: customer.id, action: 'PROPOSAL_SENT', details: { source: 'EXEMPLE_SEED', proposalRef: 'OE-PROP-EXEMPLE-001', total: 1200 }, createdAt: new Date(now - 10 * DAY) }
    }),
    prisma.customerActivity.create({
      data: { customerId: customer.id, action: 'BOOKING_CONFIRMED', details: { source: 'EXEMPLE_SEED', bookingRef: 'OE-EXEMPLE-001', total: 1200 }, createdAt: new Date(now - 7 * DAY) }
    }),
    prisma.customerActivity.create({
      data: { customerId: customer.id, action: 'DEPOSIT_PAID', details: { source: 'EXEMPLE_SEED', amount: 300, method: 'Transferència' }, createdAt: new Date(now - 7 * DAY) }
    }),
    prisma.customerActivity.create({
      data: { customerId: customer.id, action: 'NOTE_ADDED', details: { source: 'EXEMPLE_SEED', text: 'Confirmat accés càrrega pel carrer lateral de Razzmatazz' }, createdAt: new Date(now - 3 * DAY) }
    }),
  ]);
  console.log('✓ Activitats: 7 creades (timeline completa 30 dies)');

  // ═══ RESUM ═══
  console.log('\n════════════════════════════════════════');
  console.log('  EXEMPLE COMPLET CREAT CORRECTAMENT');
  console.log('════════════════════════════════════════');
  console.log('');
  console.log('  Client:     [EXEMPLE] Maria Garcia');
  console.log('              Email: exemple.maria@test.cat');
  console.log('              Tel: +34600000001');
  console.log('              Instagram: @exempleorbita');
  console.log('');
  console.log('  Lead:       [EXEMPLE] Joan Puig (score: 78)');
  console.log('              Estat: WON');
  console.log('              Tipus: BIRTHDAY (festa 18 anys)');
  console.log('              3 notes de seguiment');
  console.log('');
  console.log('  Reserva:    OE-EXEMPLE-001');
  console.log('              Total: 1.200€ (dipòsit 300€ PAGAT)');
  console.log('              Data: ' + eventDate.toLocaleDateString('ca-ES'));
  console.log('              Lloc: Sala Razzmatazz, Barcelona');
  console.log('              Km: 45 (cost viatge: 6,75€)');
  console.log('              Hora extra: 1 (75€)');
  console.log('');
  console.log('  Pressupost: OE-PROP-EXEMPLE-001 (ACCEPTAT)');
  console.log('              Pack + 3 extras + hora extra');
  console.log('');
  console.log('  Tasques:    3 (pagament, equip, recordatori)');
  console.log('  Timeline:   7 activitats (30 dies historial)');
  console.log('');
  console.log('  → Ves a /admin per verificar!');
  console.log('');
}

seed()
  .catch(e => { console.error('\n❌ ERROR:', e.message || e); process.exit(1); })
  .finally(() => prisma.$disconnect());

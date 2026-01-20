// prisma/seed.ts
// Dades inicials per Òrbita Events - Sistema Centralitzat
// Versió 2.0 - Desembre 2024

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciant seed de la base de dades...\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SETTINGS (Configuració i Estadístiques)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('⚙️ Creant configuració global...');

  const settings = [
    // Stats (DADES REALS: 50+ events, 2000 persones, 15+ anys experiència fundador)
    { key: 'stats.eventsCompleted', value: '50', type: 'NUMBER', category: 'stats', label: 'Esdeveniments completats' },
    { key: 'stats.peopleEntertained', value: '2000', type: 'NUMBER', category: 'stats', label: 'Persones que han ballat' },
    { key: 'stats.yearStarted', value: '2023', type: 'NUMBER', category: 'stats', label: 'Any inici Òrbita' },
    { key: 'stats.technicalIncidents', value: '0', type: 'NUMBER', category: 'stats', label: 'Incidents tècnics' },
    
    // Stats per l'API pública (claus que busca /api/public/stats)
    // NOTA: L'API ara usa valors hardcoded, però mantenim aquests per referència
    { key: 'years_experience', value: '+2 anys', type: 'STRING', category: 'stats', label: 'Anys empresa activa (des de 2023)' },
    { key: 'coverage', value: 'Barcelona + Girona', type: 'STRING', category: 'stats', label: 'Cobertura geogràfica (2 províncies)' },
    { key: 'response_time', value: '2h', type: 'STRING', category: 'stats', label: 'Temps resposta' },
    { key: 'google_rating', value: '5.0', type: 'STRING', category: 'stats', label: 'Valoració Google' },
    { key: 'google_reviews_count', value: '1', type: 'NUMBER', category: 'stats', label: 'Ressenyes Google' },

    // Contacte
    { key: 'contact.phone', value: '699121023', type: 'STRING', category: 'contact', label: 'Telèfon' },
    { key: 'contact.phoneDisplay', value: '699 121 023', type: 'STRING', category: 'contact', label: 'Telèfon format' },
    { key: 'contact.email', value: 'info@orbitaevents.com', type: 'STRING', category: 'contact', label: 'Email' },
    { key: 'contact.whatsapp', value: '34699121023', type: 'STRING', category: 'contact', label: 'WhatsApp' },
    { key: 'contact.address', value: 'Granollers, Barcelona', type: 'STRING', category: 'contact', label: 'Adreça' },

    // Xarxes socials
    { key: 'social.instagram', value: 'https://instagram.com/orbitaevents', type: 'STRING', category: 'social', label: 'Instagram' },
    { key: 'social.tiktok', value: 'https://tiktok.com/@orbitaevents', type: 'STRING', category: 'social', label: 'TikTok' },
    { key: 'social.facebook', value: 'https://facebook.com/orbitaevents', type: 'STRING', category: 'social', label: 'Facebook' },

    // Preus
    { key: 'pricing.depositPercent', value: '30', type: 'NUMBER', category: 'pricing', label: 'Percentatge senyal' },
    { key: 'pricing.vatRate', value: '21', type: 'NUMBER', category: 'pricing', label: 'IVA' },
    { key: 'pricing.freeKm', value: '25', type: 'NUMBER', category: 'pricing', label: 'Km gratuïts' },
    { key: 'pricing.extraKmRate', value: '0.50', type: 'STRING', category: 'pricing', label: 'Preu km extra' },
    { key: 'pricing.extraHourPrice', value: '75', type: 'NUMBER', category: 'pricing', label: 'Preu hora extra' },

    // Config
    { key: 'config.responseTime', value: '2h', type: 'STRING', category: 'config', label: 'Temps resposta' },
    { key: 'config.confirmationTime', value: '24h', type: 'STRING', category: 'config', label: 'Temps confirmació' },
    { key: 'config.minAdvanceDays', value: '7', type: 'NUMBER', category: 'config', label: 'Dies antelació mínima' },

    // Empresa
    { key: 'company.name', value: 'Òrbita Events', type: 'STRING', category: 'company', label: 'Nom empresa' },
    { key: 'company.legalName', value: 'Orbita Events S.L.', type: 'STRING', category: 'company', label: 'Nom legal' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting as any,
    });
  }

  console.log(`   ✅ ${settings.length} settings creats`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. INVENTARI COMPLET
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📦 Creant inventari...');

  const inventoryItems = [
    // SO (Total: 4.700€ | Potència: 4.000W)
    { code: 'ALT-001', name: 'Altaveu EV ETX #1', category: 'SOUND', watts: 2000, value: 1200 },
    { code: 'ALT-002', name: 'Altaveu EV ETX #2', category: 'SOUND', watts: 2000, value: 1200 },
    { code: 'CTR-001', name: 'Controladora Pioneer DDJ-REV7', category: 'SOUND', watts: null, value: 1800 },
    { code: 'AUR-001', name: 'Auriculars Pioneer HDJ-CX', category: 'SOUND', watts: null, value: 150 },
    { code: 'SPK-001', name: 'Altaveu sobretaula Apple', category: 'SOUND', watts: null, value: 350 },

    // IL·LUMINACIÓ (Total: 1.935€ | Potència: 720W)
    { code: 'MOV-001', name: 'Foco cap mòbil #1', category: 'LIGHTING', watts: 150, value: 300 },
    { code: 'MOV-002', name: 'Foco cap mòbil #2', category: 'LIGHTING', watts: 150, value: 300 },
    { code: 'MOV-003', name: 'Foco cap mòbil #3', category: 'LIGHTING', watts: 150, value: 300 },
    { code: 'MOV-004', name: 'Foco cap mòbil #4', category: 'LIGHTING', watts: 150, value: 300 },
    { code: 'LED-001', name: 'Multibox BeamZ LED multiefectes', category: 'LIGHTING', watts: null, value: 200 },
    { code: 'BSH-001', name: 'Focus Bash bateria LED #1', category: 'LIGHTING', watts: null, value: 180 },
    { code: 'BSH-002', name: 'Focus Bash bateria LED #2', category: 'LIGHTING', watts: null, value: 180 },
    { code: 'DIF-001', name: 'Llum LED 60W + difusor cúpula #1', category: 'LIGHTING', watts: 60, value: 80 },
    { code: 'DIF-002', name: 'Llum LED 60W + difusor cúpula #2', category: 'LIGHTING', watts: 60, value: 80 },
    { code: 'USB-001', name: 'Llum USB cabina', category: 'LIGHTING', watts: null, value: 15 },

    // EFECTES (Total: 265€)
    { code: 'FUM-001', name: 'Màquina de fum 1800W', category: 'EFFECTS', watts: 1800, value: 250 },
    { code: 'LIQ-001', name: 'Líquid de fum', category: 'CONSUMABLE', watts: null, value: 15, isConsumable: true, stockQuantity: 10 },

    // ESTRUCTURA (Total: 680€)
    { code: 'CAB-001', name: 'Cabina DJ VONYX', category: 'STRUCTURE', watts: null, value: 400 },
    { code: 'TEL-001', name: 'Tela blanca cabina', category: 'STRUCTURE', watts: null, value: 50 },
    { code: 'TEL-002', name: 'Tela negra cabina', category: 'STRUCTURE', watts: null, value: 50 },
    { code: 'TRI-001', name: 'Trípode #1', category: 'STRUCTURE', watts: null, value: 60 },
    { code: 'TRI-002', name: 'Trípode #2', category: 'STRUCTURE', watts: null, value: 60 },
    { code: 'TRI-003', name: 'Trípode #3', category: 'STRUCTURE', watts: null, value: 60 },
    { code: 'TRI-004', name: 'Trípode #4', category: 'STRUCTURE', watts: null, value: 60 },

    // CABLEJAT (Total: 255€)
    { code: 'DMX-001', name: 'Cablejat DMX (lot)', category: 'CABLING', watts: null, value: 100 },
    { code: 'ALL-001', name: 'Allargo 50 metres', category: 'CABLING', watts: null, value: 80 },
    { code: 'ALL-002', name: 'Allargo 3m + multiendoll #1', category: 'CABLING', watts: null, value: 25 },
    { code: 'ALL-003', name: 'Allargo 3m + multiendoll #2', category: 'CABLING', watts: null, value: 25 },
    { code: 'ALL-004', name: 'Allargo 3m + multiendoll #3', category: 'CABLING', watts: null, value: 25 },

    // TECH (Total: 1.950€)
    { code: 'PC-001', name: 'Portàtil HP OMEN', category: 'TECH', watts: null, value: 1500 },
    { code: 'CAM-001', name: 'GoPro 11', category: 'TECH', watts: null, value: 450 },

    // DECORACIÓ MÓN MÀGIC (Total: 410€)
    { code: 'HP-ESC1', name: 'Escombra Màgica #1', category: 'DECORATION_HP', watts: null, value: 30 },
    { code: 'HP-ESC2', name: 'Escombra Màgica #2', category: 'DECORATION_HP', watts: null, value: 30 },
    { code: 'HP-ESC3', name: 'Escombra Màgica #3', category: 'DECORATION_HP', watts: null, value: 30 },
    { code: 'HP-ESC4', name: 'Escombra Màgica #4', category: 'DECORATION_HP', watts: null, value: 30 },
    { code: 'HP-MIR1', name: 'Mirall Rococó', category: 'DECORATION_HP', watts: null, value: 150 },
    { code: 'HP-QUA1', name: 'Quadre 2x70cm', category: 'DECORATION_HP', watts: null, value: 80 },
    { code: 'HP-GAB1', name: 'Gàbia decorativa', category: 'DECORATION_HP', watts: null, value: 60 },

    // DECORACIÓ HALLOWEEN (Total: 200€)
    { code: 'HW-FAN1', name: 'Fantasma gegant #1', category: 'DECORATION_HW', watts: null, value: 100 },
    { code: 'HW-FAN2', name: 'Fantasma gegant #2', category: 'DECORATION_HW', watts: null, value: 100 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { code: item.code },
      update: {},
      create: item as any,
    });
  }

  console.log(`   ✅ ${inventoryItems.length} items d'inventari creats`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. PACKS
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📦 Creant packs...');

  // Pack Flash (250€)
  const packFlash = await prisma.pack.upsert({
    where: { slug: 'flash' },
    update: {},
    create: {
      slug: 'flash',
      price: 250,
      originalPrice: 450,
      djHours: 3,
      maxGuests: 50,
      soundWatts: 4000,
      includesFog: true,
      includesMic: false,
      order: 1,
    },
  });

  // Traduccions Pack Flash
  const flashTranslations = [
    {
      locale: 'es',
      name: 'Oferta Flash',
      tagline: 'Solo para fiestas hasta 50 invitados',
      badge: 'OFERTA',
      features: ['DJ profesional 3 horas', 'Sonido PRO 4000W', 'Iluminación LED básica', 'Máquina de humo', 'Montaje y desmontaje', '25km incluidos'],
    },
    {
      locale: 'ca',
      name: 'Oferta Flash',
      tagline: 'Només per festes fins a 50 convidats',
      badge: 'OFERTA',
      features: ['DJ professional 3 hores', 'So PRO 4000W', 'Il·luminació LED bàsica', 'Màquina de fum', 'Muntatge i desmuntatge', '25km inclosos'],
    },
    {
      locale: 'en',
      name: 'Flash Offer',
      tagline: 'Only for parties up to 50 guests',
      badge: 'OFFER',
      features: ['Professional DJ 3 hours', 'PRO Sound 4000W', 'Basic LED lighting', 'Fog machine', 'Setup and teardown', '25km included'],
    },
  ];

  for (const trans of flashTranslations) {
    await prisma.packTranslation.upsert({
      where: { packId_locale: { packId: packFlash.id, locale: trans.locale } },
      update: {},
      create: { packId: packFlash.id, ...trans },
    });
  }

  // Pack Party Starter (400€)
  const packPartyStarter = await prisma.pack.upsert({
    where: { slug: 'party-starter' },
    update: {},
    create: {
      slug: 'party-starter',
      price: 400,
      djHours: 4,
      minGuests: 50,
      maxGuests: 150,
      soundWatts: 4000,
      includesFog: true,
      includesMic: false,
      isFeatured: true,
      order: 2,
    },
  });

  const partyStarterTranslations = [
    {
      locale: 'es',
      name: 'Party Starter',
      tagline: 'Tu fiesta, tu estilo. Nosotros la hacemos realidad',
      badge: 'MÁS POPULAR',
      features: ['DJ profesional 4 horas', 'Sonido PRO 4000W', '2 cabezas móviles', 'Iluminación ambiente LED', 'Máquina de humo', 'Montaje y desmontaje', '25km incluidos'],
    },
    {
      locale: 'ca',
      name: 'Party Starter',
      tagline: 'La teva festa, el teu estil. Nosaltres la fem realitat',
      badge: 'MÉS POPULAR',
      features: ['DJ professional 4 hores', 'So PRO 4000W', '2 caps mòbils', 'Il·luminació ambient LED', 'Màquina de fum', 'Muntatge i desmuntatge', '25km inclosos'],
    },
    {
      locale: 'en',
      name: 'Party Starter',
      tagline: 'Your party, your style. We make it happen',
      badge: 'MOST POPULAR',
      features: ['Professional DJ 4 hours', 'PRO Sound 4000W', '2 moving heads', 'LED ambient lighting', 'Fog machine', 'Setup and teardown', '25km included'],
    },
  ];

  for (const trans of partyStarterTranslations) {
    await prisma.packTranslation.upsert({
      where: { packId_locale: { packId: packPartyStarter.id, locale: trans.locale } },
      update: {},
      create: { packId: packPartyStarter.id, ...trans },
    });
  }

  // Pack Corporate (450€)
  const packCorporate = await prisma.pack.upsert({
    where: { slug: 'corporate' },
    update: {},
    create: {
      slug: 'corporate',
      price: 450,
      djHours: 5,
      minGuests: 50,
      maxGuests: 200,
      soundWatts: 4000,
      includesFog: true,
      includesMic: true,
      order: 3,
    },
  });

  const corporateTranslations = [
    {
      locale: 'es',
      name: 'Corporate',
      tagline: 'Eventos empresariales con impacto',
      features: ['DJ profesional 5 horas', 'Sonido PRO 4000W', '4 cabezas móviles', 'Iluminación completa', 'Micrófono inalámbrico', 'Máquina de humo', 'Montaje y desmontaje', '25km incluidos'],
    },
    {
      locale: 'ca',
      name: 'Corporate',
      tagline: 'Esdeveniments empresarials amb impacte',
      features: ['DJ professional 5 hores', 'So PRO 4000W', '4 caps mòbils', 'Il·luminació completa', 'Micròfon sense fils', 'Màquina de fum', 'Muntatge i desmuntatge', '25km inclosos'],
    },
    {
      locale: 'en',
      name: 'Corporate',
      tagline: 'Corporate events with impact',
      features: ['Professional DJ 5 hours', 'PRO Sound 4000W', '4 moving heads', 'Full lighting', 'Wireless microphone', 'Fog machine', 'Setup and teardown', '25km included'],
    },
  ];

  for (const trans of corporateTranslations) {
    await prisma.packTranslation.upsert({
      where: { packId_locale: { packId: packCorporate.id, locale: trans.locale } },
      update: {},
      create: { packId: packCorporate.id, ...trans },
    });
  }

  console.log('   ✅ 3 packs creats');

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PACK INVENTORY (Equipament per pack)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('🔗 Assignant inventari als packs...');

  const items = await prisma.inventoryItem.findMany();
  const getItemId = (code: string) => items.find(i => i.code === code)?.id;

  // Pack Flash items
  const flashItems = ['ALT-001', 'ALT-002', 'CTR-001', 'AUR-001', 'LED-001', 'BSH-001', 'BSH-002', 'FUM-001', 'CAB-001', 'TRI-001', 'TRI-002', 'DMX-001', 'ALL-001', 'ALL-002', 'PC-001'];
  for (const code of flashItems) {
    const itemId = getItemId(code);
    if (itemId) {
      await prisma.packInventory.upsert({
        where: { packId_itemId: { packId: packFlash.id, itemId } },
        update: {},
        create: { packId: packFlash.id, itemId },
      });
    }
  }

  // Pack Party Starter items (Flash + extras)
  const partyStarterItems = [...flashItems, 'MOV-001', 'MOV-002', 'DIF-001', 'DIF-002', 'TRI-003', 'TRI-004', 'ALL-003'];
  for (const code of partyStarterItems) {
    const itemId = getItemId(code);
    if (itemId) {
      await prisma.packInventory.upsert({
        where: { packId_itemId: { packId: packPartyStarter.id, itemId } },
        update: {},
        create: { packId: packPartyStarter.id, itemId },
      });
    }
  }

  // Pack Corporate items (Party Starter + extras)
  const corporateItems = [...partyStarterItems, 'MOV-003', 'MOV-004', 'ALL-004'];
  for (const code of corporateItems) {
    const itemId = getItemId(code);
    if (itemId) {
      await prisma.packInventory.upsert({
        where: { packId_itemId: { packId: packCorporate.id, itemId } },
        update: {},
        create: { packId: packCorporate.id, itemId },
      });
    }
  }

  console.log('   ✅ Inventari assignat als packs');

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EXTRAS
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('✨ Creant extras...');

  const extras = [
    { slug: 'extra-hour', price: 75, priceType: 'PER_HOUR', order: 1 },
    { slug: 'low-fog', price: 50, priceType: 'FIXED', order: 2 },
    { slug: 'co2-cannon', price: 150, priceType: 'FIXED', order: 3 },
    { slug: 'confetti', price: 80, priceType: 'FIXED', order: 4 },
    { slug: 'sparklers', price: 120, priceType: 'FIXED', order: 5 },
    { slug: 'extra-lights', price: 100, priceType: 'FIXED', order: 6 },
    { slug: 'karaoke', price: 80, priceType: 'FIXED', order: 7 },
    { slug: 'theme-hp', price: 150, priceType: 'FIXED', order: 8 },
    { slug: 'theme-halloween', price: 150, priceType: 'FIXED', order: 9 },
    { slug: 'gopro-recording', price: 50, priceType: 'FIXED', order: 10 },
  ];

  const extraTranslations: Record<string, { es: { name: string; description?: string }; ca: { name: string; description?: string }; en: { name: string; description?: string } }> = {
    'extra-hour': {
      es: { name: 'Hora extra DJ', description: 'Extiende la fiesta una hora más' },
      ca: { name: 'Hora extra DJ', description: 'Allarga la festa una hora més' },
      en: { name: 'Extra DJ hour', description: 'Extend the party one more hour' },
    },
    'low-fog': {
      es: { name: 'Fum baix', description: 'Efecto de niebla a ras de suelo' },
      ca: { name: 'Fum baix', description: 'Efecte de boira arran de terra' },
      en: { name: 'Low fog', description: 'Ground-level fog effect' },
    },
    'co2-cannon': {
      es: { name: 'Cañón CO2', description: 'Explosiones de humo frío espectaculares' },
      ca: { name: 'Canó CO2', description: 'Explosions de fum fred espectaculars' },
      en: { name: 'CO2 Cannon', description: 'Spectacular cold smoke explosions' },
    },
    'confetti': {
      es: { name: 'Confeti', description: 'Lluvia de confeti para momentos especiales' },
      ca: { name: 'Confeti', description: 'Pluja de confeti per moments especials' },
      en: { name: 'Confetti', description: 'Confetti rain for special moments' },
    },
    'sparklers': {
      es: { name: 'Bengalas frías', description: 'Chispas frías para entradas y momentos WOW' },
      ca: { name: 'Bengales fredes', description: 'Espurnes fredes per entrades i moments WOW' },
      en: { name: 'Cold sparklers', description: 'Cold sparks for entrances and WOW moments' },
    },
    'extra-lights': {
      es: { name: 'Luces extra', description: 'Más cabezas móviles para más impacto' },
      ca: { name: 'Llums extra', description: 'Més caps mòbils per més impacte' },
      en: { name: 'Extra lights', description: 'More moving heads for more impact' },
    },
    'karaoke': {
      es: { name: 'Karaoke', description: 'Sistema de karaoke con miles de canciones' },
      ca: { name: 'Karaoke', description: 'Sistema de karaoke amb milers de cançons' },
      en: { name: 'Karaoke', description: 'Karaoke system with thousands of songs' },
    },
    'theme-hp': {
      es: { name: 'Tematización Mundo Mágico', description: 'Decoración mágica completa de escuela de brujos' },
      ca: { name: 'Tematització Món Màgic', description: 'Decoració màgica completa d\'escola de bruixeria' },
      en: { name: 'Magic World Theme', description: 'Complete magical wizard school decoration' },
    },
    'theme-halloween': {
      es: { name: 'Tematización Halloween', description: 'Terror y diversión para tu fiesta' },
      ca: { name: 'Tematització Halloween', description: 'Terror i diversió per la teva festa' },
      en: { name: 'Halloween Theme', description: 'Terror and fun for your party' },
    },
    'gopro-recording': {
      es: { name: 'Grabación GoPro', description: 'Capturamos los mejores momentos' },
      ca: { name: 'Gravació GoPro', description: 'Capturem els millors moments' },
      en: { name: 'GoPro Recording', description: 'We capture the best moments' },
    },
  };

  for (const extra of extras) {
    const created = await prisma.extra.upsert({
      where: { slug: extra.slug },
      update: {},
      create: extra as any,
    });

    const translations = extraTranslations[extra.slug];
    if (translations) {
      for (const [locale, data] of Object.entries(translations)) {
        await prisma.extraTranslation.upsert({
          where: { extraId_locale: { extraId: created.id, locale } },
          update: {},
          create: { extraId: created.id, locale, ...data },
        });
      }
    }
  }

  console.log(`   ✅ ${extras.length} extras creats`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. FAQ
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('❓ Creant FAQs...');

  const faqs = [
    {
      slug: 'que-hace-diferente',
      category: 'general',
      order: 1,
      translations: {
        es: { question: '¿Qué hace diferente a Òrbita Events de otros DJs?', answer: 'Creamos experiencias completas personalizadas. No solo ponemos música, diseñamos el ambiente perfecto con iluminación profesional, efectos especiales y un DJ que lee el ambiente para que la pista esté siempre llena.' },
        ca: { question: 'Què fa diferent a Òrbita Events d\'altres DJs?', answer: 'Creem experiències completes personalitzades. No només posem música, dissenyem l\'ambient perfecte amb il·luminació professional, efectes especials i un DJ que llegeix l\'ambient perquè la pista estigui sempre plena.' },
        en: { question: 'What makes Òrbita Events different from other DJs?', answer: 'We create complete personalized experiences. We don\'t just play music, we design the perfect atmosphere with professional lighting, special effects, and a DJ who reads the crowd to keep the dance floor packed.' },
      },
    },
    {
      slug: 'cuanto-cuesta',
      category: 'pricing',
      order: 2,
      translations: {
        es: { question: '¿Cuánto cuesta contratar Òrbita Events?', answer: 'Trabajamos con packs claros desde 250€. El precio final depende del tipo de evento, duración y extras que quieras añadir. Usa nuestro configurador para calcular el precio exacto o pídenos presupuesto sin compromiso.' },
        ca: { question: 'Quant costa contractar Òrbita Events?', answer: 'Treballem amb packs clars des de 250€. El preu final depèn del tipus d\'event, durada i extres que vulguis afegir. Usa el nostre configurador per calcular el preu exacte o demana\'ns pressupost sense compromís.' },
        en: { question: 'How much does it cost to hire Òrbita Events?', answer: 'We work with clear packages starting from €250. The final price depends on the type of event, duration, and extras you want to add. Use our configurator to calculate the exact price or ask for a no-obligation quote.' },
      },
    },
    {
      slug: 'zona-cobertura',
      category: 'coverage',
      order: 3,
      translations: {
        es: { question: '¿Trabajáis fuera de Barcelona?', answer: 'Sí, cubrimos toda Barcelona y Girona. Incluimos 25km desde Granollers en todos los packs. Para distancias mayores, aplicamos un pequeño suplemento por km.' },
        ca: { question: 'Treballeu fora de Barcelona?', answer: 'Sí, cobrim tota Barcelona i Girona. Incloem 25km des de Granollers en tots els packs. Per distàncies majors, apliquem un petit suplement per km.' },
        en: { question: 'Do you work outside Barcelona?', answer: 'Yes, we cover all of Barcelona and Girona. We include 25km from Granollers in all packs. For longer distances, we apply a small supplement per km.' },
      },
    },
    {
      slug: 'tipo-musica',
      category: 'music',
      order: 4,
      translations: {
        es: { question: '¿Qué tipo de música ponéis?', answer: 'Nos adaptamos 100% a tus gustos. Antes del evento, te pedimos tus preferencias y creamos una playlist personalizada. Desde reggaeton hasta clásicos, pasando por remember, hits actuales o música temática.' },
        ca: { question: 'Quin tipus de música poseu?', answer: 'Ens adaptem 100% als teus gustos. Abans de l\'event, et demanem les teves preferències i creem una playlist personalitzada. Des de reggaeton fins a clàssics, passant per remember, hits actuals o música temàtica.' },
        en: { question: 'What type of music do you play?', answer: 'We adapt 100% to your tastes. Before the event, we ask for your preferences and create a personalized playlist. From reggaeton to classics, including remember, current hits, or themed music.' },
      },
    },
    {
      slug: 'proceso-reserva',
      category: 'booking',
      order: 5,
      translations: {
        es: { question: '¿Cómo funciona el proceso de reserva?', answer: '1. Contactas con nosotros o usas el configurador. 2. Te enviamos presupuesto personalizado en menos de 2h. 3. Confirmas con un 30% de señal. 4. Coordinamos los detalles. 5. ¡Disfrutas tu evento!' },
        ca: { question: 'Com funciona el procés de reserva?', answer: '1. Contactes amb nosaltres o uses el configurador. 2. T\'enviem pressupost personalitzat en menys de 2h. 3. Confirmes amb un 30% de senyal. 4. Coordinem els detalls. 5. Gaudeixes el teu event!' },
        en: { question: 'How does the booking process work?', answer: '1. Contact us or use the configurator. 2. We send you a personalized quote in less than 2h. 3. Confirm with a 30% deposit. 4. We coordinate the details. 5. Enjoy your event!' },
      },
    },
    {
      slug: 'problema-tecnico',
      category: 'technical',
      order: 6,
      translations: {
        es: { question: '¿Qué pasa si hay un problema técnico?', answer: 'Siempre llevamos equipo de backup. En años de eventos, nunca hemos tenido que cancelar. Tu evento está protegido con nuestro Plan B garantizado.' },
        ca: { question: 'Què passa si hi ha un problema tècnic?', answer: 'Sempre portem equip de backup. En anys d\'events, mai hem hagut de cancel·lar. El teu event està protegit amb el nostre Pla B garantit.' },
        en: { question: 'What happens if there is a technical problem?', answer: 'We always carry backup equipment. In years of events, we have never had to cancel. Your event is protected with our guaranteed Plan B.' },
      },
    },
    {
      slug: 'eventos-tematicos',
      category: 'services',
      order: 7,
      translations: {
        es: { question: '¿Hacéis eventos temáticos?', answer: '¡Es nuestra especialidad! Mundo Mágico (escuela de brujos), Halloween, años 80, discoteca... Tenemos decoración, efectos y playlists específicas para cada temática.' },
        ca: { question: 'Feu events temàtics?', answer: 'És la nostra especialitat! Món Màgic (escola de bruixeria), Halloween, anys 80, discoteca... Tenim decoració, efectes i playlists específiques per cada temàtica.' },
        en: { question: 'Do you do themed events?', answer: 'It\'s our specialty! Magic World (wizard school), Halloween, 80s, disco... We have decoration, effects, and specific playlists for each theme.' },
      },
    },
  ];

  for (const faq of faqs) {
    const created = await prisma.fAQ.upsert({
      where: { slug: faq.slug },
      update: {},
      create: { slug: faq.slug, category: faq.category, order: faq.order },
    });

    for (const [locale, data] of Object.entries(faq.translations)) {
      await prisma.fAQTranslation.upsert({
        where: { faqId_locale: { faqId: created.id, locale } },
        update: {},
        create: { faqId: created.id, locale, ...data },
      });
    }
  }

  console.log(`   ✅ ${faqs.length} FAQs creades`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. TRADUCCIONS WEB
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('🌍 Creant traduccions...');

  const translations = [
    // Hero
    { namespace: 'hero', key: 'badge', locale: 'es', value: '🔥 {count} sábados disponibles en {month}' },
    { namespace: 'hero', key: 'badge', locale: 'ca', value: '🔥 {count} dissabtes disponibles al {month}' },
    { namespace: 'hero', key: 'badge', locale: 'en', value: '🔥 {count} Saturdays available in {month}' },
    { namespace: 'hero', key: 'title', locale: 'es', value: 'Tu Evento Merece' },
    { namespace: 'hero', key: 'title', locale: 'ca', value: 'El Teu Esdeveniment Mereix' },
    { namespace: 'hero', key: 'title', locale: 'en', value: 'Your Event Deserves' },
    { namespace: 'hero', key: 'titleHighlight', locale: 'es', value: 'Algo Extraordinario' },
    { namespace: 'hero', key: 'titleHighlight', locale: 'ca', value: 'Quelcom Extraordinari' },
    { namespace: 'hero', key: 'titleHighlight', locale: 'en', value: 'Something Extraordinary' },
    { namespace: 'hero', key: 'subtitle', locale: 'es', value: 'DJ profesional + efectos visuales + sonido premium para bodas, fiestas y eventos corporativos en Barcelona y Girona' },
    { namespace: 'hero', key: 'subtitle', locale: 'ca', value: 'DJ professional + efectes visuals + so premium per a casaments, festes i esdeveniments corporatius a Barcelona i Girona' },
    { namespace: 'hero', key: 'subtitle', locale: 'en', value: 'Professional DJ + visual effects + premium sound for weddings, parties and corporate events in Barcelona and Girona' },
    { namespace: 'hero', key: 'ctaPrimary', locale: 'es', value: 'Calcula tu Precio' },
    { namespace: 'hero', key: 'ctaPrimary', locale: 'ca', value: 'Calcula el teu Preu' },
    { namespace: 'hero', key: 'ctaPrimary', locale: 'en', value: 'Calculate your Price' },
    { namespace: 'hero', key: 'ctaSecondary', locale: 'es', value: 'Ver Eventos Reales' },
    { namespace: 'hero', key: 'ctaSecondary', locale: 'ca', value: 'Veure Esdeveniments Reals' },
    { namespace: 'hero', key: 'ctaSecondary', locale: 'en', value: 'See Real Events' },

    // Stats
    { namespace: 'stats', key: 'eventsLabel', locale: 'es', value: 'Eventos realizados' },
    { namespace: 'stats', key: 'eventsLabel', locale: 'ca', value: 'Esdeveniments realitzats' },
    { namespace: 'stats', key: 'eventsLabel', locale: 'en', value: 'Events completed' },
    { namespace: 'stats', key: 'peopleLabel', locale: 'es', value: 'Personas bailando' },
    { namespace: 'stats', key: 'peopleLabel', locale: 'ca', value: 'Persones ballant' },
    { namespace: 'stats', key: 'peopleLabel', locale: 'en', value: 'People dancing' },
    { namespace: 'stats', key: 'satisfactionLabel', locale: 'es', value: 'Clientes satisfechos' },
    { namespace: 'stats', key: 'satisfactionLabel', locale: 'ca', value: 'Clients satisfets' },
    { namespace: 'stats', key: 'satisfactionLabel', locale: 'en', value: 'Satisfied clients' },
    { namespace: 'stats', key: 'sinceLabel', locale: 'es', value: 'Desde' },
    { namespace: 'stats', key: 'sinceLabel', locale: 'ca', value: 'Des de' },
    { namespace: 'stats', key: 'sinceLabel', locale: 'en', value: 'Since' },

    // CTA
    { namespace: 'cta', key: 'title', locale: 'es', value: '¿Listo para' },
    { namespace: 'cta', key: 'title', locale: 'ca', value: 'Preparat per' },
    { namespace: 'cta', key: 'title', locale: 'en', value: 'Ready for' },
    { namespace: 'cta', key: 'titleHighlight', locale: 'es', value: 'tu evento perfecto?' },
    { namespace: 'cta', key: 'titleHighlight', locale: 'ca', value: 'el teu event perfecte?' },
    { namespace: 'cta', key: 'titleHighlight', locale: 'en', value: 'your perfect event?' },
  ];

  for (const t of translations) {
    await prisma.translation.upsert({
      where: { namespace_key_locale: { namespace: t.namespace, key: t.key, locale: t.locale } },
      update: { value: t.value },
      create: t,
    });
  }

  console.log(`   ✅ ${translations.length} traduccions creades`);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUM FINAL
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎉 SEED COMPLETAT!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 RESUM:');
  console.log(`   • ${settings.length} settings (config + stats)`);
  console.log(`   • ${inventoryItems.length} items d'inventari (~9.500€ valor)`);
  console.log('   • 3 packs (Flash 250€, Party Starter 400€, Corporate 450€)');
  console.log(`   • ${extras.length} extras`);
  console.log(`   • ${faqs.length} FAQs`);
  console.log(`   • ${translations.length} traduccions`);
  console.log('');
  console.log('📈 ESTADÍSTIQUES INICIALS:');
  console.log('   • 45 esdeveniments completats');
  console.log('   • ~2.000 persones han ballat');
  console.log('   • Òrbita des de 2023');
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. LEADS DE PROVA
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('👥 Creant leads de prova...');

  const leads = [
    {
      name: 'Maria García López',
      email: 'maria.garcia@gmail.com',
      phone: '612345678',
      eventType: 'WEDDING',
      eventDate: new Date('2025-06-14'),
      eventLocation: 'Granollers',
      guestCount: 120,
      message: 'Ens casem el juny i volem una festa inolvidable!',
      status: 'NEW',
      source: 'WEBSITE',
      budget: '800-1000€',
    },
    {
      name: 'Pere López Martí',
      email: 'pere.lopez@empresa.com',
      phone: '623456789',
      eventType: 'CORPORATE',
      eventDate: new Date('2025-03-20'),
      eventLocation: 'Barcelona',
      guestCount: 80,
      message: 'Festa d\'empresa anual, necessitem DJ i il·luminació',
      status: 'CONTACTED',
      source: 'REFERRAL',
      budget: '1000-1500€',
    },
    {
      name: 'Anna Martí Puig',
      email: 'anna.marti@hotmail.com',
      phone: '634567890',
      eventType: 'BIRTHDAY',
      eventDate: new Date('2025-04-05'),
      eventLocation: 'Vic',
      guestCount: 50,
      message: 'Aniversari dels 50 anys del meu pare',
      status: 'QUOTE_SENT',
      source: 'INSTAGRAM',
      budget: '500-700€',
    },
    {
      name: 'Joan Puig Soler',
      email: 'joan.puig@gmail.com',
      phone: '645678901',
      eventType: 'WEDDING',
      eventDate: new Date('2025-07-12'),
      eventLocation: 'Caldes de Montbui',
      guestCount: 150,
      message: 'Boda al juliol, volem pack complet',
      status: 'WON',
      source: 'WEBSITE',
      budget: '1000-1500€',
    },
    {
      name: 'Laura Soler Costa',
      email: 'laura.soler@yahoo.es',
      phone: '656789012',
      eventType: 'PRIVATE_PARTY',
      eventDate: new Date('2025-05-24'),
      eventLocation: 'Mollet del Vallès',
      guestCount: 60,
      message: 'Festa de fi de curs universitari',
      status: 'NEGOTIATING',
      source: 'OTHER',
      budget: '400-600€',
    },
  ];

  for (const lead of leads) {
    // Buscar si ja existeix un lead amb aquest email
    const existingLead = await prisma.lead.findFirst({
      where: { email: lead.email },
    });

    if (!existingLead) {
      await prisma.lead.create({
        data: lead as any,
      });
    }
  }

  console.log(`   ✅ ${leads.length} leads creats`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. RESERVES DE PROVA
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📅 Creant reserves de prova...');

  const packs = await prisma.pack.findMany();
  const getPackId = (slug: string) => packs.find(p => p.slug === slug)?.id;

  const bookings = [
    {
      reference: 'OE-2025-001',
      clientName: 'Laura & Marc Fernández',
      clientEmail: 'laura.marc@gmail.com',
      clientPhone: '612111222',
      eventType: 'WEDDING',
      eventDate: new Date('2025-12-14'),
      eventStartTime: '18:00',
      eventEndTime: '03:00',
      eventLocation: 'Granollers',
      eventVenue: 'Mas Can Ferrer',
      guestCount: 130,
      status: 'CONFIRMED',
      packId: getPackId('party-starter'),
      subtotal: 400,
      discount: 0,
      total: 550,
      vatAmount: 95.55,
      depositAmount: 165,
      remainingAmount: 385,
      depositPaid: true,
      notes: 'Boda amb temàtica rústica',
    },
    {
      reference: 'OE-2025-002',
      clientName: 'TechCorp SL',
      clientEmail: 'events@techcorp.com',
      clientPhone: '623222333',
      eventType: 'CORPORATE',
      eventDate: new Date('2025-12-20'),
      eventStartTime: '20:00',
      eventEndTime: '01:00',
      eventLocation: 'Barcelona',
      eventVenue: 'Hotel Hilton Diagonal Mar',
      guestCount: 100,
      status: 'CONFIRMED',
      packId: getPackId('corporate'),
      subtotal: 450,
      discount: 0,
      total: 450,
      vatAmount: 78.10,
      depositAmount: 135,
      remainingAmount: 315,
      depositPaid: true,
      notes: 'Festa de Nadal empresa',
    },
    {
      reference: 'OE-2025-003',
      clientName: 'Família Soler Puig',
      clientEmail: 'soler.familia@hotmail.com',
      clientPhone: '634333444',
      eventType: 'BIRTHDAY',
      eventDate: new Date('2025-12-21'),
      eventStartTime: '19:00',
      eventEndTime: '02:00',
      eventLocation: 'Cardedeu',
      eventVenue: 'Restaurant El Celler',
      guestCount: 45,
      status: 'PENDING',
      packId: getPackId('flash'),
      subtotal: 250,
      discount: 0,
      total: 300,
      vatAmount: 52.07,
      depositAmount: 90,
      remainingAmount: 210,
      depositPaid: false,
      notes: 'Aniversari 60 anys',
    },
    {
      reference: 'OE-2025-004',
      clientName: 'Sandra & Jordi Vila',
      clientEmail: 'sandra.jordi@gmail.com',
      clientPhone: '645444555',
      eventType: 'WEDDING',
      eventDate: new Date('2026-01-18'),
      eventStartTime: '17:00',
      eventEndTime: '04:00',
      eventLocation: 'La Garriga',
      eventVenue: 'Can Galvany',
      guestCount: 180,
      status: 'PREPARING',
      packId: getPackId('corporate'),
      subtotal: 450,
      discount: 50,
      total: 670,
      vatAmount: 116.28,
      depositAmount: 201,
      remainingAmount: 469,
      depositPaid: true,
      notes: 'Boda amb extres: CO2, bengales, hora extra',
    },
    {
      reference: 'OE-2025-005',
      clientName: 'Marc Costa Riera',
      clientEmail: 'marc.costa@yahoo.es',
      clientPhone: '656555666',
      eventType: 'PRIVATE_PARTY',
      eventDate: new Date('2026-02-08'),
      eventStartTime: '21:00',
      eventEndTime: '03:00',
      eventLocation: 'Sabadell',
      eventVenue: 'Local privat',
      guestCount: 70,
      status: 'CONFIRMED',
      packId: getPackId('party-starter'),
      subtotal: 400,
      discount: 0,
      total: 480,
      vatAmount: 83.31,
      depositAmount: 144,
      remainingAmount: 336,
      depositPaid: true,
      notes: 'Festa temàtica anys 80',
    },
  ];

  for (const booking of bookings) {
    await prisma.booking.upsert({
      where: { reference: booking.reference },
      update: {},
      create: booking as any,
    });
  }

  console.log(`   ✅ ${bookings.length} reserves creades`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. ACTIVITAT ADMIN LOG
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📋 Creant activitat recent...');

  const adminLogs = [
    { action: 'CREATE', entity: 'Lead', details: 'Nou lead creat des del formulari web', userId: 'system' },
    { action: 'UPDATE', entity: 'Booking', entityId: 'OE-2025-001', details: 'Reserva confirmada', userId: 'admin' },
    { action: 'EMAIL_SENT', entity: 'Lead', details: 'Email de benvinguda enviat a Maria García', userId: 'system' },
    { action: 'STATUS_CHANGE', entity: 'Lead', details: 'Lead passat a CONTACTED', userId: 'admin' },
    { action: 'CREATE', entity: 'Booking', entityId: 'OE-2025-005', details: 'Nova reserva creada', userId: 'admin' },
  ];

  for (const log of adminLogs) {
    await prisma.adminLog.create({
      data: log as any,
    });
  }

  console.log(`   ✅ ${adminLogs.length} logs d'activitat creats`);

}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type Messages = {
  common: {
    buttons: {
      requestQuote: string;
      reserveToday: string;
    };
  };
  checkout: {
    subtitle: string;
    offerReason: string;
    finalPrice: string;
  };
  flashOffer: {
    title: string;
    cta: string;
  };
  offerModal: {
    title: string;
    description: string;
    cta: string;
  };
  packsOffers: {
    earlyBird: {
      name: string;
      description: string;
    };
  };
  pages: {
    about: {
      cta: {
        description: string;
      };
    };
    weddings: {
      heroSubtitle: string;
    };
    mobile: {
      heroSubtitle: string;
    };
    rental: {
      heroSubtitle: string;
    };
  };
  reviews: {
    cta: {
      requestQuote: string;
    };
  };
  urgency: {
    cta: string;
    normalSubtitle: string;
    bookingTime: string;
  };
  heroUrgency: {
    halloween: {
      reserveNow: string;
    };
    monMagic: {
      bookNow: string;
    };
    cta: {
      reserveNow: string;
    };
  };
  calendar: {
    cta: {
      title: string;
    };
    earlyBird: string;
    modal: {
      whatsappMsg: string;
    };
  };
  mobileExperience: {
    cta: {
      guarantee: string;
    };
  };
  homeSections: {
    ctaFinal: {
      guarantee: string;
    };
  };
  halloweenPage: {
    cta: {
      reserve2025: string;
    };
    urgency: {
      subtitle: string;
    };
  };
  monMagicPage: {
    cta: {
      description: string;
    };
  };
  configuradorPage: {
    meta: {
      title: string;
      description: string;
      ogTitle: string;
      ogDescription: string;
    };
  };
  booking: {
    trust: {
      items: Record<string, {
        title: string;
        description: string;
      }>;
    };
  };
  configurator: {
    step4: {
      subtitle: string;
      reserveWithDiscount: string;
      whyOfferText: string;
      guaranteeText: string;
      checkEmail: string;
      satisfactionGuaranteed: string;
    };
  };
};

function readMessages(locale: 'ca' | 'es' | 'en'): Messages {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), 'messages', `${locale}.json`), 'utf8'),
  ) as Messages;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
  return [];
}

describe('configurador public promise copy', () => {
  it('no promet reserva instantania ni confirmacio final en el lead del configurador', () => {
    const messages = {
      ca: readMessages('ca').configurator.step4,
      es: readMessages('es').configurator.step4,
      en: readMessages('en').configurator.step4,
    };

    expect(messages.ca.reserveWithDiscount).toContain('Demanar proposta');
    expect(messages.es.reserveWithDiscount).toContain('Pedir propuesta');
    expect(messages.en.reserveWithDiscount).toContain('Request proposal');

    expect(messages.ca.subtitle).toContain('Demana proposta');
    expect(messages.es.subtitle).toContain('Pide propuesta');
    expect(messages.en.subtitle).toContain('Request a proposal');

    for (const copy of Object.values(messages)) {
      expect(copy.checkEmail).not.toMatch(/confirmaci[oó]n|confirmació|confirmation/i);
      expect(copy.whyOfferText).not.toMatch(/confirm.*instant|confirmar.*instant|confirm.*instante/i);
      expect(copy.guaranteeText).not.toMatch(/reembors|reembols|refund/i);
    }
  });

  it('manté les ofertes publiques com a proposta, no com a reserva confirmada', () => {
    const messages = {
      ca: readMessages('ca'),
      es: readMessages('es'),
      en: readMessages('en'),
    };

    expect(messages.ca.checkout.subtitle).toContain('Demana proposta');
    expect(messages.ca.checkout.finalPrice).toContain('Preu estimat');
    expect(messages.es.checkout.subtitle).toContain('Pide propuesta');
    expect(messages.es.checkout.finalPrice).toContain('Precio estimado');
    expect(messages.en.checkout.subtitle).toContain('Request a proposal');
    expect(messages.en.checkout.finalPrice).toContain('Estimated price');

    expect(messages.ca.offerModal.title).toContain('Sol·licita proposta');
    expect(messages.es.offerModal.title).toContain('Solicita propuesta');
    expect(messages.en.offerModal.title).toContain('Request a proposal');

    for (const copy of Object.values(messages)) {
      expect(copy.checkout.offerReason).not.toMatch(/confirm.*instant|confirmar.*instant|confirm.*instante/i);
      expect(copy.checkout.finalPrice).not.toMatch(/preu final|precio final|final price/i);
      expect(copy.offerModal.description).not.toMatch(/reserves confirmades|reservas confirmadas|reservations confirmed/i);
      expect(copy.offerModal.cta).not.toMatch(/^Aprofita|^Aprovecha|^Take advantage/i);
    }
  });

  it('no conserva CTAs residuals de reserva en captacio publica que nomes demana proposta', () => {
    const messages = {
      ca: readMessages('ca'),
      es: readMessages('es'),
      en: readMessages('en'),
    };

    expect(messages.ca.common.buttons.requestQuote).toContain('PROPOSTA');
    expect(messages.es.common.buttons.requestQuote).toContain('PROPUESTA');
    expect(messages.en.common.buttons.requestQuote).toContain('PROPOSAL');

    const leadGenerationCopy = Object.values(messages).flatMap((copy) => [
      copy.common.buttons.requestQuote,
      copy.common.buttons.reserveToday,
      copy.reviews.cta.requestQuote,
      copy.urgency.cta,
      copy.urgency.normalSubtitle,
      copy.urgency.bookingTime,
      copy.flashOffer.title,
      copy.flashOffer.cta,
      copy.packsOffers.earlyBird.name,
      copy.packsOffers.earlyBird.description,
      copy.heroUrgency.halloween.reserveNow,
      copy.heroUrgency.cta.reserveNow,
      copy.pages.about.cta.description,
      copy.calendar.cta.title,
      copy.calendar.earlyBird,
      copy.calendar.modal.whatsappMsg,
      copy.mobileExperience.cta.guarantee,
      copy.homeSections.ctaFinal.guarantee,
      copy.halloweenPage.cta.reserve2025,
      copy.halloweenPage.urgency.subtitle,
      copy.monMagicPage.cta.description,
      copy.heroUrgency.monMagic.bookNow,
    ]);

    for (const text of leadGenerationCopy) {
      expect(text).not.toMatch(/Reserva ara|Reserva ahora|Book now|Reserva avui|Reserva hoy|Book today/i);
      expect(text).not.toMatch(/Reserva en \{days\}|Book within \{days\}|Book in \{days\}/i);
      expect(text).not.toMatch(/Reservar Data|Reservar Fecha|Book Date/i);
      expect(text).not.toMatch(/Vols reservar una data|Quieres reservar una fecha|reserve a date/i);
      expect(text).not.toMatch(/data es reserva 48h|fecha se reserva 48h|date reserved for 48h/i);
      expect(text).not.toMatch(/Reserva el teu Halloween|Reserva tu Halloween|Book your Halloween/i);
      expect(text).not.toMatch(/Reserva aviat|Reserva pronto|Book soon/i);
      expect(text).not.toMatch(/Reserva la teva experiència|Reserva tu experiencia|Book your experience/i);
      expect(text).not.toMatch(/reserve your date before/i);
      expect(text).not.toMatch(/reserva el teu esdeveniment|reserva tu evento|book your event/i);
    }
  });

  it('no promet pressupost final instantani quan el flux dona estimacio revisable', () => {
    const messages = {
      ca: readMessages('ca'),
      es: readMessages('es'),
      en: readMessages('en'),
    };

    expect(messages.ca.configuradorPage.meta.title).toContain('Estimació');
    expect(messages.ca.configuradorPage.meta.ogDescription).toContain('estimació');
    expect(messages.es.configuradorPage.meta.title).toContain('Estimación');
    expect(messages.es.configuradorPage.meta.ogDescription).toContain('estimación');
    expect(messages.en.configuradorPage.meta.ogTitle).toContain('Estimate');
    expect(messages.en.configuradorPage.meta.ogDescription).toContain('estimate');

    const pricingPromiseCopy = Object.values(messages).flatMap((copy) => [
      copy.pages.weddings.heroSubtitle,
      copy.pages.mobile.heroSubtitle,
      copy.pages.rental.heroSubtitle,
      copy.configuradorPage.meta.title,
      copy.configuradorPage.meta.description,
      copy.configuradorPage.meta.ogTitle,
      copy.configuradorPage.meta.ogDescription,
    ]);

    for (const text of pricingPromiseCopy) {
      expect(text).not.toMatch(/Pressupost instantani|Pressupost a l'instant|Pressupost en 1 Minut|pressupost personalitzat/i);
      expect(text).not.toMatch(/Presupuesto instantáneo|Presupuesto al instante|Presupuesto en 1 Minuto|presupuesto personalizado/i);
      expect(text).not.toMatch(/receive your quote instantly|quote in 1 minute|personalized quote/i);
    }
  });

  it('no presenta el calcul automatic com a preu final tancat', () => {
    const allPublicCopy = [
      ...collectStrings(readMessages('ca')),
      ...collectStrings(readMessages('es')),
      ...collectStrings(readMessages('en')),
    ];

    for (const text of allPublicCopy) {
      expect(text).not.toMatch(/Els preus es calculen automàticament/i);
      expect(text).not.toMatch(/Los precios se calculan automáticamente/i);
      expect(text).not.toMatch(/Prices are calculated automatically/i);
    }
  });

  it('no barreja sense compromis amb reemborsament post-senyal', () => {
    const messages = {
      ca: readMessages('ca'),
      es: readMessages('es'),
      en: readMessages('en'),
    };

    expect(messages.ca.booking.trust.items['2']?.description).toContain('Revisió final');
    expect(messages.es.booking.trust.items['2']?.description).toContain('Revisión final');
    expect(messages.en.booking.trust.items['2']?.description).toContain('Final review');

    for (const copy of Object.values(messages)) {
      const noCommitmentTrust = copy.booking.trust.items['2'];
      expect(noCommitmentTrust?.description).not.toMatch(/Retorn 100%|Devolución 100%|100% refund/i);
    }
  });
});

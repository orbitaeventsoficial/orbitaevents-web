// lib/services/inboxTemplateService.ts
// ═══════════════════════════════════════════════════════════════════════════
// INBOX SMART TEMPLATES SERVICE
// Genera plantilles de missatge intel·ligents per al compose de l'Inbox,
// adaptades al context del lead/client (nom, event, estat, idioma).
// Part pura — no toca la base de dades.
// ═══════════════════════════════════════════════════════════════════════════

import { getEventLabel } from '@/lib/constants';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type TemplateKey =
  | 'primer-contacte'
  | 'seguiment'
  | 'seguiment-pressupost'
  | 'confirmacio-data'
  | 'agraiment-post-event'
  | 'reactivacio';

export interface TemplateContext {
  name: string;
  email?: string;
  eventType?: string | null;
  eventDate?: string | null;
  eventLocation?: string | null;
  guestCount?: number | null;
  status?: string | null;
  locale?: string;
}

export interface SmartTemplate {
  key: TemplateKey;
  label: string;
  icon: string;
  description: string;
  subject: string;
  body: string;
  mode: 'email' | 'quote';
}

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

function formatEventDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// ───────────────────────────────────────────────────────────────────────────
// TEMPLATE GENERATORS (per locale)
// ───────────────────────────────────────────────────────────────────────────

type TemplateGenerator = (ctx: TemplateContext & { first: string; eventLabel: string; dateFormatted: string; lang: string }) => SmartTemplate;

const generators: Record<TemplateKey, TemplateGenerator> = {
  'primer-contacte': (ctx) => {
    const eventMention = ctx.eventLabel ? ` per al teu ${ctx.eventLabel.toLowerCase()}` : '';
    const dateMention = ctx.dateFormatted ? ` el ${ctx.dateFormatted}` : '';
    const guestMention = ctx.guestCount ? ` per a ${ctx.guestCount} convidats` : '';

    if (ctx.lang === 'es') {
      const eventEs = ctx.eventLabel ? ` para tu ${ctx.eventLabel.toLowerCase()}` : '';
      const dateEs = ctx.dateFormatted ? ` el ${ctx.dateFormatted}` : '';
      const guestEs = ctx.guestCount ? ` para ${ctx.guestCount} invitados` : '';
      return {
        key: 'primer-contacte',
        label: 'Primer contacte',
        icon: '👋',
        description: 'Resposta inicial a una nova sol·licitud',
        mode: 'email',
        subject: `Tu consulta${eventEs} — Òrbita Events`,
        body: `Hola ${ctx.first},\n\nGracias por contactar con nosotros${eventEs}${dateEs}${guestEs}. Nos encanta lo que tienes en mente.\n\nSi te va bien, te llamamos y en 5 minutos cerramos los detalles de tu propuesta personalizada.\n\n¿Cuándo te va mejor?\n\nUn saludo,\nÒrbita Events`,
      };
    }

    return {
      key: 'primer-contacte',
      label: 'Primer contacte',
      icon: '👋',
      description: 'Resposta inicial a una nova sol·licitud',
      mode: 'email',
      subject: `La teva consulta${eventMention} — Òrbita Events`,
      body: `Hola ${ctx.first},\n\nGràcies per contactar amb nosaltres${eventMention}${dateMention}${guestMention}. Ens encanta el que tens al cap.\n\nSi et va bé, et truquem i en 5 minuts tanquem els detalls de la teva proposta personalitzada.\n\nQuan et va millor?\n\nUna abraçada,\nÒrbita Events`,
    };
  },

  'seguiment': (ctx) => {
    if (ctx.lang === 'es') {
      return {
        key: 'seguiment',
        label: 'Seguiment / Recordatori',
        icon: '🔔',
        description: 'Recordatori amable per leads que no han respost',
        mode: 'email',
        subject: `Seguimiento — tu evento con Òrbita Events`,
        body: `Hola ${ctx.first},\n\nTe escribo por si pudiste valorar nuestra propuesta. Queremos asegurarnos de que tienes toda la información que necesitas.\n\nSi tienes dudas o quieres ajustar algo, dinos y lo miramos juntos.\n\nQuedamos a tu disposición,\nÒrbita Events`,
      };
    }

    return {
      key: 'seguiment',
      label: 'Seguiment / Recordatori',
      icon: '🔔',
      description: 'Recordatori amable per leads que no han respost',
      mode: 'email',
      subject: `Seguiment — el teu event amb Òrbita Events`,
      body: `Hola ${ctx.first},\n\nT'escric per si has pogut valorar la nostra proposta. Volem assegurar-nos que tens tota la informació que necessites.\n\nSi tens dubtes o vols ajustar alguna cosa, digues-nos i ho mirem junts.\n\nQuedem a la teva disposició,\nÒrbita Events`,
    };
  },

  'seguiment-pressupost': (ctx) => {
    const eventMention = ctx.eventLabel ? ` per al teu ${ctx.eventLabel.toLowerCase()}` : '';
    if (ctx.lang === 'es') {
      const eventEs = ctx.eventLabel ? ` para tu ${ctx.eventLabel.toLowerCase()}` : '';
      return {
        key: 'seguiment-pressupost',
        label: 'Seguiment pressupost',
        icon: '💰',
        description: 'Follow-up després d\'enviar un pressupost',
        mode: 'email',
        subject: `Tu presupuesto${eventEs} — ¿alguna duda?`,
        body: `Hola ${ctx.first},\n\n¿Pudiste revisar el presupuesto que te enviamos? Queríamos saber si se ajusta a lo que tenías en mente o si necesitas algún cambio.\n\nEstamos encantados de adaptar la propuesta a tus necesidades. Dinos y lo ajustamos.\n\nUn saludo,\nÒrbita Events`,
      };
    }

    return {
      key: 'seguiment-pressupost',
      label: 'Seguiment pressupost',
      icon: '💰',
      description: 'Follow-up després d\'enviar un pressupost',
      mode: 'email',
      subject: `El teu pressupost${eventMention} — algun dubte?`,
      body: `Hola ${ctx.first},\n\nHas pogut revisar el pressupost que t'hem enviat? Volíem saber si s'ajusta al que tenies al cap o si necessites algun canvi.\n\nEstem encantats d'adaptar la proposta a les teves necessitats. Digues-nos i ho ajustem.\n\nUna abraçada,\nÒrbita Events`,
    };
  },

  'confirmacio-data': (ctx) => {
    const dateMention = ctx.dateFormatted ? ` per al ${ctx.dateFormatted}` : '';
    const locationMention = ctx.eventLocation ? ` a ${ctx.eventLocation}` : '';
    if (ctx.lang === 'es') {
      const dateEs = ctx.dateFormatted ? ` para el ${ctx.dateFormatted}` : '';
      const locationEs = ctx.eventLocation ? ` en ${ctx.eventLocation}` : '';
      return {
        key: 'confirmacio-data',
        label: 'Confirmació de data',
        icon: '📅',
        description: 'Confirmar data i detalls logístics',
        mode: 'email',
        subject: `Confirmación de tu evento${dateEs}`,
        body: `Hola ${ctx.first},\n\nTe confirmamos que tu evento queda reservado${dateEs}${locationEs}.\n\nPróximos pasos:\n- Revisaremos juntos los últimos detalles la semana antes del evento\n- Si necesitas cambios, avísanos con la mayor antelación posible\n\n¡Estamos deseando que llegue el día!\n\nÒrbita Events`,
      };
    }

    return {
      key: 'confirmacio-data',
      label: 'Confirmació de data',
      icon: '📅',
      description: 'Confirmar data i detalls logístics',
      mode: 'email',
      subject: `Confirmació del teu event${dateMention}`,
      body: `Hola ${ctx.first},\n\nEt confirmem que el teu event queda reservat${dateMention}${locationMention}.\n\nPròxims passos:\n- Revisarem junts els últims detalls la setmana abans de l'event\n- Si necessites canvis, avisa'ns amb la major antelació possible\n\nEstem desitjant que arribi el dia!\n\nÒrbita Events`,
    };
  },

  'agraiment-post-event': (ctx) => {
    if (ctx.lang === 'es') {
      return {
        key: 'agraiment-post-event',
        label: 'Agraïment post-event',
        icon: '🎉',
        description: 'Agraïment personalitzat després de l\'event',
        mode: 'email',
        subject: `¡Gracias, ${ctx.first}! Ha sido un placer`,
        body: `Hola ${ctx.first},\n\nQueríamos darte las gracias por confiar en nosotros para tu evento. Ha sido un placer trabajar contigo y esperamos que todo haya sido como lo imaginabas.\n\nSi tienes un momento, nos encantaría saber tu opinión — nos ayuda a seguir mejorando.\n\nY si conoces a alguien que esté preparando un evento, será un placer ayudarles también.\n\n¡Hasta pronto!\nÒrbita Events`,
      };
    }

    return {
      key: 'agraiment-post-event',
      label: 'Agraïment post-event',
      icon: '🎉',
      description: 'Agraïment personalitzat després de l\'event',
      mode: 'email',
      subject: `Gràcies, ${ctx.first}! Ha estat un plaer`,
      body: `Hola ${ctx.first},\n\nVolíem donar-te les gràcies per confiar en nosaltres per al teu event. Ha estat un plaer treballar amb tu i esperem que tot hagi estat com t'ho imaginaves.\n\nSi tens un moment, ens encantaria saber la teva opinió — ens ajuda a seguir millorant.\n\nI si coneixes algú que estigui preparant un event, serà un plaer ajudar-lo també.\n\nFins aviat!\nÒrbita Events`,
    };
  },

  'reactivacio': (ctx) => {
    if (ctx.lang === 'es') {
      return {
        key: 'reactivacio',
        label: 'Reactivació',
        icon: '💤',
        description: 'Recuperar un client o lead dormant',
        mode: 'email',
        subject: `${ctx.first}, ¿repetimos? 🎉`,
        body: `Hola ${ctx.first},\n\nHace tiempo que no coincidimos y queríamos saludarte. Siempre nos ha hecho ilusión trabajar contigo.\n\nSi estás pensando en una nueva celebración, nos encantaría acompañarte de nuevo. Tenemos novedades que te pueden interesar.\n\nCuéntanos cuando quieras,\nÒrbita Events`,
      };
    }

    return {
      key: 'reactivacio',
      label: 'Reactivació',
      icon: '💤',
      description: 'Recuperar un client o lead dormant',
      mode: 'email',
      subject: `${ctx.first}, repetim? 🎉`,
      body: `Hola ${ctx.first},\n\nFa temps que no coincidim i volíem saludar-te. Sempre ens ha fet il·lusió treballar amb tu.\n\nSi estàs pensant en una nova celebració, ens encantaria tornar-te a acompanyar. Tenim novetats que et poden interessar.\n\nExplica'ns quan vulguis,\nÒrbita Events`,
    };
  },
};

// ───────────────────────────────────────────────────────────────────────────
// MAIN — genera totes les plantilles disponibles per al context donat
// ───────────────────────────────────────────────────────────────────────────

export function generateSmartTemplates(context: TemplateContext): SmartTemplate[] {
  const lang = context.locale === 'es' ? 'es' : 'ca';
  const first = firstName(context.name) || context.name;
  const eventLabel = context.eventType ? getEventLabel(context.eventType) : '';
  const dateFormatted = formatEventDate(context.eventDate, lang);

  const enriched = {
    ...context,
    first,
    eventLabel,
    dateFormatted,
    lang,
    guestCount: context.guestCount ?? null,
  };

  // Decidim quines plantilles oferir segons l'estat
  const keys: TemplateKey[] = [];
  const status = context.status?.toUpperCase();

  if (status === 'NEW' || !status) {
    keys.push('primer-contacte');
  }
  if (status === 'CONTACTED' || status === 'NEGOTIATING' || status === 'NEW') {
    keys.push('seguiment');
  }
  if (status === 'NEGOTIATING' || status === 'CONTACTED') {
    keys.push('seguiment-pressupost');
  }
  if (status === 'NEGOTIATING' || status === 'WON') {
    keys.push('confirmacio-data');
  }
  if (status === 'WON') {
    keys.push('agraiment-post-event');
  }

  // Reactivació sempre disponible
  keys.push('reactivacio');

  return keys.map((key) => generators[key](enriched));
}

// Genera totes les plantilles sense filtre d'estat (per UI sense lead seleccionat)
export function generateAllTemplates(context: TemplateContext): SmartTemplate[] {
  const lang = context.locale === 'es' ? 'es' : 'ca';
  const first = firstName(context.name) || context.name;
  const eventLabel = context.eventType ? getEventLabel(context.eventType) : '';
  const dateFormatted = formatEventDate(context.eventDate, lang);

  const enriched = {
    ...context,
    first,
    eventLabel,
    dateFormatted,
    lang,
    guestCount: context.guestCount ?? null,
  };

  const allKeys: TemplateKey[] = [
    'primer-contacte',
    'seguiment',
    'seguiment-pressupost',
    'confirmacio-data',
    'agraiment-post-event',
    'reactivacio',
  ];

  return allKeys.map((key) => generators[key](enriched));
}

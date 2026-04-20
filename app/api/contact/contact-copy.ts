/**
 * Traduccions, validació i helpers purs per l'API de contacte.
 * Extret de route.ts per reduir la mida del handler.
 */

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import type { EventType, LeadSource } from '@prisma/client';

export type Locale = 'ca' | 'es' | 'en';

export const CONTACT_COPY: Record<Locale, Record<string, string>> = {
  ca: {
    nameTooShort: 'Nom massa curt',
    enterEmailOrPhone: 'Introdueix correu o telèfon',
    selectEventType: "Selecciona tipus d'esdeveniment",
    invalidData: 'Dades no vàlides',
    captchaFailed: 'Verificació de seguretat fallida. Torna-ho a intentar.',
    noteNewWebContact: 'Nou contacte via web',
    notePack: 'Pack',
    noteMessage: 'Missatge',
    noteLeadCreatedVia: 'Lead creat via',
    viaConfigurator: 'configurador',
    viaWebForm: 'formulari web',
    noteInterestedPack: 'Pack interessat',
    notePhoneContact: 'Contacte per telèfon',
    adminLeadTitle: 'NOU LEAD',
    adminCustomer: 'Client',
    adminEmail: 'Correu',
    adminPhone: 'Telèfon',
    adminEventType: "Tipus d'esdeveniment",
    adminEventDate: "Data de l'esdeveniment",
    adminGuests: 'Nombre de convidats',
    adminPeople: 'persones',
    adminMessage: 'Missatge',
    adminSelectedPack: 'Pack seleccionat',
    adminRequestedExtras: 'Extres sol·licitats',
    adminCallNow: 'Trucar a',
    adminReplyByEmail: 'Respondre per correu',
    adminReplySubjectPrefix: 'Re: La teva sol·licitud a Orbita Events',
    adminSystemFooter: 'Òrbita Events | Sistema de leads automatitzat',
    adminMailSubjectPrefix: 'NOU LEAD',
    adminMailFrom: 'Òrbita Events Web',
    clientHeader: 'Missatge rebut',
    clientGreeting: 'Hola',
    clientThanks: 'Gràcies per contactar amb',
    clientReceivedFor: 'Hem rebut la teva sol·licitud per',
    clientReference: 'La teva referència',
    clientSaveCode: 'Guarda aquest codi per a qualsevol consulta',
    clientStep1Title: 'Revisem la teva sol·licitud',
    clientStep1Text: 'En les pròximes hores analitzem les teves necessitats.',
    clientStep2Title: 'Et contactem en menys de 2 hores',
    clientStep2Text: 'Fins i tot caps de setmana.',
    clientStep3Title: 'Pressupost personalitzat',
    clientStep3Text: 'T\u2019enviem una proposta detallada adaptada al teu esdeveniment.',
    clientEstimatedBudget: 'Pressupost estimat',
    clientEstimatedNote: '*Preu orientatiu. Confirmarem el preu final al correu.',
    clientCallNow: 'Trucar ara al',
    clientReasonEmail: 'Has rebut aquest correu perqu\u00e8 has demanat informaci\u00f3 a orbitaevents.com.',
    clientMailSubjectPrefix: 'Rebut! La teva sol\u00b7licitud per',
    successMessage: 'Missatge enviat correctament',
    estimatedResponse: '2-4 hores',
    sendError: 'Error en enviar el missatge. Si ho prefereixes, truca\u2019ns al',
    retrySuffix: 'o torna-ho a provar.',
  },
  es: {
    nameTooShort: 'Nombre demasiado corto',
    enterEmailOrPhone: 'Introduce correo o teléfono',
    selectEventType: 'Selecciona tipo de evento',
    invalidData: 'Datos inválidos',
    captchaFailed: 'La verificación de seguridad ha fallado. Vuelve a intentarlo.',
    noteNewWebContact: 'Nuevo contacto vía web',
    notePack: 'Pack',
    noteMessage: 'Mensaje',
    noteLeadCreatedVia: 'Lead creado vía',
    viaConfigurator: 'configurador',
    viaWebForm: 'formulario web',
    noteInterestedPack: 'Pack interesado',
    notePhoneContact: 'Contacto por teléfono',
    adminLeadTitle: 'NUEVO LEAD',
    adminCustomer: 'Cliente',
    adminEmail: 'Email',
    adminPhone: 'Teléfono',
    adminEventType: 'Tipo de evento',
    adminEventDate: 'Fecha del evento',
    adminGuests: 'Número de invitados',
    adminPeople: 'personas',
    adminMessage: 'Mensaje',
    adminSelectedPack: 'Pack seleccionado',
    adminRequestedExtras: 'Extras solicitados',
    adminCallNow: 'Llamar a',
    adminReplyByEmail: 'Responder por email',
    adminReplySubjectPrefix: 'Re: Tu solicitud en Orbita Events',
    adminSystemFooter: 'Orbita Events | Sistema de leads automatizado',
    adminMailSubjectPrefix: 'NUEVO LEAD',
    adminMailFrom: 'Orbita Events Web',
    clientHeader: 'Mensaje recibido',
    clientGreeting: 'Hola',
    clientThanks: 'Gracias por contactar con',
    clientReceivedFor: 'Hemos recibido tu solicitud para',
    clientReference: 'Tu referencia',
    clientSaveCode: 'Guarda este código para cualquier consulta',
    clientStep1Title: 'Revisamos tu solicitud',
    clientStep1Text: 'En las próximas horas analizaremos tus necesidades.',
    clientStep2Title: 'Te contactamos en menos de 2 horas',
    clientStep2Text: 'Incluso fines de semana.',
    clientStep3Title: 'Presupuesto personalizado',
    clientStep3Text: 'Te enviamos una propuesta detallada adaptada a tu evento.',
    clientEstimatedBudget: 'Presupuesto estimado',
    clientEstimatedNote: '*Precio orientativo. Confirmaremos el precio final por correo.',
    clientCallNow: 'Llamar ahora al',
    clientReasonEmail: 'Has recibido este correo porque solicitaste información en orbitaevents.com.',
    clientMailSubjectPrefix: '¡Recibido! Tu solicitud para',
    successMessage: 'Mensaje enviado con éxito',
    estimatedResponse: '2-4 horas',
    sendError: 'Error al enviar el mensaje. Si lo prefieres, llámanos al',
    retrySuffix: 'o vuelve a intentarlo.',
  },
  en: {
    nameTooShort: 'Name is too short',
    enterEmailOrPhone: 'Enter email or phone',
    selectEventType: 'Select event type',
    invalidData: 'Invalid data',
    captchaFailed: 'Security verification failed. Please try again.',
    noteNewWebContact: 'New web contact',
    notePack: 'Pack',
    noteMessage: 'Message',
    noteLeadCreatedVia: 'Lead created via',
    viaConfigurator: 'configurator',
    viaWebForm: 'web form',
    noteInterestedPack: 'Interested pack',
    notePhoneContact: 'Phone contact',
    adminLeadTitle: 'NEW LEAD',
    adminCustomer: 'Customer',
    adminEmail: 'Email',
    adminPhone: 'Phone',
    adminEventType: 'Event type',
    adminEventDate: 'Event date',
    adminGuests: 'Guests',
    adminPeople: 'people',
    adminMessage: 'Message',
    adminSelectedPack: 'Selected pack',
    adminRequestedExtras: 'Requested extras',
    adminCallNow: 'Call',
    adminReplyByEmail: 'Reply by email',
    adminReplySubjectPrefix: 'Re: Your request at Orbita Events',
    adminSystemFooter: 'Orbita Events | Automated lead system',
    adminMailSubjectPrefix: 'NEW LEAD',
    adminMailFrom: 'Orbita Events Web',
    clientHeader: 'Message received',
    clientGreeting: 'Hi',
    clientThanks: 'Thanks for contacting',
    clientReceivedFor: 'We have received your request for',
    clientReference: 'Your reference',
    clientSaveCode: 'Keep this code for any follow-up',
    clientStep1Title: 'We review your request',
    clientStep1Text: 'In the next few hours, we will review your needs.',
    clientStep2Title: 'We will contact you in less than 2 hours',
    clientStep2Text: 'Even on weekends.',
    clientStep3Title: 'Personalized quote',
    clientStep3Text: 'We will send you a detailed proposal tailored to your event.',
    clientEstimatedBudget: 'Estimated quote',
    clientEstimatedNote: '*Indicative price. We will confirm final price by email.',
    clientCallNow: 'Call now at',
    clientReasonEmail: 'You received this email because you requested information on orbitaevents.com.',
    clientMailSubjectPrefix: 'Received! Your request for',
    successMessage: 'Message sent successfully',
    estimatedResponse: '2-4 hours',
    sendError: 'Error sending message. If you prefer, call us at',
    retrySuffix: 'or try again.',
  },
};

export const EVENT_TYPE_LABELS: Record<Locale, Record<string, string>> = {
  ca: {
    boda: 'Casament', bodas: 'Casament', wedding: 'Casament', discomovil: 'Discomòbil',
    empresa: 'Esdeveniment corporatiu', empresas: 'Esdeveniment corporatiu', corporate: 'Esdeveniment corporatiu',
    fiesta: 'Festa privada', fiestas: 'Festa privada',
    cumpleanos: 'Aniversari', cumpleanyos: 'Aniversari', birthday: 'Aniversari',
    communion: 'Comunió', baptism: 'Bateig', graduation: 'Graduació', anniversary: 'Aniversari',
    tematizacion: 'Tematització', produccion: 'Producció tècnica', alquiler: "Lloguer d'equip",
    otro: 'Altre', other: 'Altre',
  },
  es: {
    boda: 'Boda', bodas: 'Boda', wedding: 'Boda', discomovil: 'Discomovil',
    empresa: 'Evento corporativo', empresas: 'Evento corporativo', corporate: 'Evento corporativo',
    fiesta: 'Fiesta privada', fiestas: 'Fiesta privada',
    cumpleanos: 'Cumpleanos', cumpleanyos: 'Cumpleanos', birthday: 'Cumpleanos',
    communion: 'Comunion', baptism: 'Bautizo', graduation: 'Graduacion', anniversary: 'Aniversario',
    tematizacion: 'Tematizacion', produccion: 'Produccion tecnica', alquiler: 'Alquiler de equipo',
    otro: 'Otro', other: 'Otro',
  },
  en: {
    boda: 'Wedding', bodas: 'Wedding', wedding: 'Wedding', discomovil: 'Mobile disco',
    empresa: 'Corporate event', empresas: 'Corporate event', corporate: 'Corporate event',
    fiesta: 'Private party', fiestas: 'Private party',
    cumpleanos: 'Birthday', cumpleanyos: 'Birthday', birthday: 'Birthday',
    communion: 'Communion', baptism: 'Baptism', graduation: 'Graduation', anniversary: 'Anniversary',
    tematizacion: 'Theming', produccion: 'Technical production', alquiler: 'Equipment rental',
    otro: 'Other', other: 'Other',
  },
};

export function resolveLocale(req: NextRequest, candidate?: string): Locale {
  const c = (candidate || '').toLowerCase();
  if (c === 'ca' || c === 'es' || c === 'en') return c as Locale;
  const lang = req.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}

export const contactSchema = (t: Record<string, string>) => z.object({
  name: z.string().min(2, t.nameTooShort).max(50),
  contact: z.string().min(3, t.enterEmailOrPhone).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  event: z.string().min(1, t.selectEventType),
  message: z.string().optional(),
  packId: z.string().optional(),
  packName: z.string().optional(),
  estimatedPrice: z.number().optional(),
  eventDate: z.string().optional(),
  guests: z.union([z.number(), z.string()]).optional(),
  guestCount: z.union([z.number(), z.string()]).optional(),
  extras: z.array(z.string()).optional(),
  locale: z.string().optional(),
  turnstileToken: z.string().optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  landingPage: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (!data.contact && !data.email && !data.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contact'],
      message: t.enterEmailOrPhone,
    });
  }
});

export function parseGuestCount(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (/^\d+$/.test(normalized)) return Number(normalized);
  const range = normalized.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    return Math.round((min + max) / 2);
  }
  const plus = normalized.match(/^(\d+)\+$/);
  if (plus) return Number(plus[1]);
  return undefined;
}

export function mapEventType(eventStr: string): EventType {
  const normalized = eventStr.toLowerCase();
  if (normalized.includes('boda') || normalized.includes('wedding')) return 'WEDDING';
  if (normalized.includes('empresa') || normalized.includes('corporativ') || normalized.includes('corporate')) return 'CORPORATE';
  if (normalized.includes('cumpleanos') || normalized.includes('cumpleanyos') || normalized.includes('birthday')) return 'BIRTHDAY';
  if (normalized.includes('comunion') || normalized.includes('communion')) return 'COMMUNION';
  if (normalized.includes('bautizo') || normalized.includes('baptism')) return 'BAPTISM';
  if (normalized.includes('graduacion') || normalized.includes('graduation')) return 'GRADUATION';
  if (normalized.includes('aniversari') || normalized.includes('anniversary')) return 'ANNIVERSARY';
  if (normalized.includes('fiesta') || normalized.includes('discomovil') || normalized.includes('party')) return 'PRIVATE_PARTY';
  return 'OTHER';
}

export function determineSource(packId?: string, packName?: string): LeadSource {
  if (packId || packName) return 'CONFIGURATOR';
  return 'WEBSITE';
}

/**
 * Logística de bolo — helpers purs per a l'operador de camp (mòbil).
 *
 * Converteixen les dades d'un esdeveniment en accions del telèfon: trucar al
 * client, navegar a l'adreça amb Waze/Maps, i saber a quina hora SORTIR per
 * arribar a temps (hora del bolo − viatge − muntatge). Font única; sense I/O.
 */

/** Minuts de muntatge per defecte abans del bolo (decisió del propietari). */
export const SETUP_MINUTES = 60;

/** Velocitat mitjana per estimar el temps de viatge (mix carretera/ciutat). */
export const AVG_TRAVEL_SPEED_KMH = 65;

/** Enllaç `tel:` net (sense espais ni guions) per trucar des del mòbil. */
export function buildTelHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.length >= 6 ? `tel:${cleaned}` : null;
}

/** Enllaç a Waze amb navegació directa cap a l'adreça. */
export function buildWazeUrl(address: string | null | undefined): string | null {
  if (!address || !address.trim()) return null;
  return `https://waze.com/ul?q=${encodeURIComponent(address.trim())}&navigate=yes`;
}

/** Enllaç a Google Maps (cerca de l'adreça) — fallback / alternativa a Waze. */
export function buildMapsUrl(address: string | null | undefined): string | null {
  if (!address || !address.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

/** Estima els minuts de viatge a partir dels km (anada), amb velocitat mitjana. */
export function estimateTravelMinutes(distanceKm: number | null | undefined, speedKmh = AVG_TRAVEL_SPEED_KMH): number {
  if (!distanceKm || distanceKm <= 0 || speedKmh <= 0) return 0;
  return Math.round((distanceKm / speedKmh) * 60);
}

/**
 * Calcula l'hora de SORTIDA: hora del bolo − temps de viatge − temps de muntatge.
 * `eventStartTime` en format "HH:MM". Retorna "HH:MM" (o null si no hi ha hora).
 * Defensiu: si el resultat creua mitjanit cap enrere, embolcalla a 24h.
 */
export function computeDepartureTime(input: {
  eventStartTime: string | null | undefined;
  travelMinutes: number;
  setupMinutes?: number;
}): string | null {
  const { eventStartTime, travelMinutes, setupMinutes = SETUP_MINUTES } = input;
  if (!eventStartTime || !/^\d{1,2}:\d{2}$/.test(eventStartTime)) return null;
  const [h, m] = eventStartTime.split(':').map(Number);
  const eventMin = h * 60 + m;
  let depart = eventMin - travelMinutes - setupMinutes;
  depart = ((depart % 1440) + 1440) % 1440; // embolcalla a [0, 1440)
  const dh = Math.floor(depart / 60);
  const dm = depart % 60;
  return `${String(dh).padStart(2, '0')}:${String(dm).padStart(2, '0')}`;
}

/**
 * Resum de logística complet d'un bolo per a la UI de camp.
 */
export interface EventLogistics {
  telHref: string | null;
  wazeUrl: string | null;
  mapsUrl: string | null;
  travelMinutes: number;
  setupMinutes: number;
  departureTime: string | null;
}

export function buildEventLogistics(input: {
  phone?: string | null;
  address?: string | null;
  distanceKm?: number | null;
  eventStartTime?: string | null;
  setupMinutes?: number;
}): EventLogistics {
  const travelMinutes = estimateTravelMinutes(input.distanceKm);
  const setupMinutes = input.setupMinutes ?? SETUP_MINUTES;
  return {
    telHref: buildTelHref(input.phone),
    wazeUrl: buildWazeUrl(input.address),
    mapsUrl: buildMapsUrl(input.address),
    travelMinutes,
    setupMinutes,
    departureTime: computeDepartureTime({ eventStartTime: input.eventStartTime, travelMinutes, setupMinutes }),
  };
}

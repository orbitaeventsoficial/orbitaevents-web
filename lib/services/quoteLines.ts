import { DJ_FIRST_HOUR_PRICE, DJ_EXTRA_HOUR_PRICE, CANDYBAR_INCLUDED_CHILDREN } from '@/lib/constants/orbita-services';

/**
 * Les línies que el client llegeix al pressupost del dossier.
 *
 * El DJ es ven per hores i així s'ha de llegir: «DJ · 3 hores 350 €». A dins,
 * el bolo el pot tenir desat en dues línies (1a hora + hores addicionals),
 * perquè és com es va muntar o com va quedar d'abans. Aquell detall és nostre,
 * no del client: al pressupost surt una sola línia amb les hores escrites.
 *
 * Les hores es dedueixen del preu canònic (150 € la primera, 100 € cada una
 * més), que és l'única font. Si els imports no donen un nombre d'hores sencer
 * —algú ha pactat un altre preu— no s'inventa cap hora: les línies es deixen
 * tal com estan.
 */

export type QuoteSourceLine = {
  label?: string | null;
  kind?: string | null;
  revenueAmount?: number | null;
  quantity?: number | null;
};

export type QuoteLine = { label: string; amount: number };

function isDjLine(line: QuoteSourceLine): boolean {
  if (line.kind === 'DJ') return true;
  return /\bdj\b/i.test(line.label ?? '');
}

function amountOf(line: QuoteSourceLine): number {
  return (line.revenueAmount ?? 0) * (line.quantity || 1);
}

export function djHoursFromRevenue(revenue: number): number | null {
  if (revenue <= 0) return null;
  const hores = 1 + (revenue - DJ_FIRST_HOUR_PRICE) / DJ_EXTRA_HOUR_PRICE;
  return Number.isInteger(hores) && hores >= 1 ? hores : null;
}

export function djLabelForHours(hours: number): string {
  return hours === 1 ? 'DJ · 1 hora' : `DJ · ${hours} hores`;
}

function esCandybar(line: QuoteSourceLine): boolean {
  return /candybar/i.test(line.label ?? '');
}

function esPerNen(line: QuoteSourceLine): boolean {
  return /per\s*nen|por\s*ni[ñn]/i.test(line.label ?? '');
}

/**
 * El candybar i les seves llaminadures són una sola cosa per al client.
 *
 * A dins van per separat perquè les llaminadures es gasten per nen i el moble
 * no. Al pressupost, dues línies —una de 120 € i una de 2 €— fan pensar que
 * les llaminadures són una propina. Es presenten com un paquet, amb els nens
 * escrits i el preu del conjunt.
 */
function ajuntaCandybar(source: readonly QuoteSourceLine[]): { paquet?: QuoteLine; usades: Set<QuoteSourceLine> } {
  const moble = source.find((l) => esCandybar(l) && !esPerNen(l));
  if (!moble) return { usades: new Set() };

  // Les llaminadures dels vint primers nens ja van dins del candybar: encara
  // que ningú n'hagi afegit cap línia, el paquet en porta. La línia de
  // llaminadures, si hi és, només suma els nens que passen de vint.
  const llaminadures = source.find((l) => esCandybar(l) && esPerNen(l))
    ?? source.find((l) => esPerNen(l));

  const nens = CANDYBAR_INCLUDED_CHILDREN + (llaminadures?.quantity || 0);
  const total = amountOf(moble) + (llaminadures ? amountOf(llaminadures) : 0);
  if (total <= 0) return { usades: new Set() };

  return {
    paquet: { label: `${moble.label ?? 'Candybar'} · ${nens} ${nens === 1 ? 'nen' : 'nens'}`, amount: total },
    usades: new Set(llaminadures ? [moble, llaminadures] : [moble]),
  };
}

export function buildQuoteLines(source: readonly QuoteSourceLine[]): QuoteLine[] {
  const { paquet, usades } = ajuntaCandybar(source);
  const dj = source.filter(isDjLine);
  const resta = source
    .filter((line) => !isDjLine(line) && !usades.has(line))
    .map((line) => ({ label: line.label ?? '', amount: amountOf(line) }))
    .filter((line) => line.label !== '' && line.amount > 0);
  if (paquet) resta.push(paquet);

  if (dj.length === 0) return resta;

  const djTotal = dj.reduce((sum, line) => sum + amountOf(line), 0);
  const hores = djHoursFromRevenue(djTotal);

  if (hores === null) {
    // Preu pactat fora de l'escala: es respecta el que hi ha, sense inventar hores.
    const djTalQualSon = dj
      .map((line) => ({ label: line.label ?? '', amount: amountOf(line) }))
      .filter((line) => line.label !== '' && line.amount > 0);
    return [...djTalQualSon, ...resta];
  }

  return [{ label: djLabelForHours(hores), amount: djTotal }, ...resta];
}

import { DJ_FIRST_HOUR_PRICE, DJ_EXTRA_HOUR_PRICE } from '@/lib/constants/orbita-services';

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

export function buildQuoteLines(source: readonly QuoteSourceLine[]): QuoteLine[] {
  const dj = source.filter(isDjLine);
  const resta = source
    .filter((line) => !isDjLine(line))
    .map((line) => ({ label: line.label ?? '', amount: amountOf(line) }))
    .filter((line) => line.label !== '' && line.amount > 0);

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

import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { SITE_CONFIG } from '@/app/config/site-config';
import { formatCurrency } from '@/lib/constants';
import {
  INCLUDED_TRAVEL_KM,
} from '@/lib/services/travelCost';
import { computeBoloTransport } from '@/lib/services/travelLaborCost';

/**
 * Tripulació assumida per calcular el desplaçament a la pre-venda (dossier i
 * pressupost estudi comparteixen convenció): 2 persones (p. ex. DJ + tècnic).
 * El càlcul real per bolo deriva el headcount de les línies; aquí, sense
 * serviceLines encara, s'usa aquesta base conscient. Font única del càrrec:
 * `computeBoloTransport` (mai fórmula pròpia).
 */
const DOSSIER_TRAVEL_HEADCOUNT = 2;

/** Càrrec de transport al client per a la ruta del dossier (un sol cervell). */
function dossierTravelCharge(travelKm: number): number {
  if (travelKm <= 0) return 0;
  return computeBoloTransport({ roundTripKm: travelKm, headcountOverride: DOSSIER_TRAVEL_HEADCOUNT }).clientCharge;
}

export type DossierClientInfo = {
  nom: string;
  telefon?: string;
  email?: string;
  empresa?: string;
  eventDesc?: string;
  salutacio?: string;
};

/**
 * Tots els textos marc del dossier. Font única canònica: `messages.dossier.*`
 * (editables a /admin/text-manager → secció Dossiers). El builder no porta cap
 * string hardcoded; sempre rep aquest objecte resolt al servidor.
 */
export type DossierCopy = {
  portada: { eyebrow: string; clientLabel: string; bottom: string };
  intro: {
    kicker: string;
    title: string;
    greetingDefault: string;
    offerCountOne: string;
    offerCountMany: string;
    summaryOfferLabel: string;
    summaryFormatLabel: string;
    summaryFormatValue: string;
    summaryGoalLabel: string;
    summaryGoalValue: string;
  };
  chapter: {
    eyebrow: string;
    priceLabel: string;
    priceFromPrefix: string;
    priceCustom: string;
    durationLabel: string;
    includesTitle: string;
    noteLabel: string;
  };
  resum: { kicker: string; title: string; lead: string; totalLabel: string; travelLabel: string };
  budget: {
    kicker: string;
    title: string;
    lead: string;
    servicesLabel: string;
    travelTitle: string;
    travelNote: string;
    travelRoute: string;
    travelPriceLabel: string;
    vatNote: string;
  };
  cta: { label: string };
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatOfferCount(copy: DossierCopy, count: number): string {
  const template = count === 1 ? copy.intro.offerCountOne : copy.intro.offerCountMany;
  return template.replace('{count}', String(count));
}

/** Numeral editorial gran per a la portada del capítol (01 → I, etc. → fem servir el número amb zero). */
function chapterLabel(num: number): string {
  return String(num).padStart(2, '0');
}

function buildProductBlock(product: AnimacioProduct, num: number, copy: DossierCopy, locale: string, logoDataUri?: string, isLast = false): string {
  const descripcio = product.descripcio
    .map((p) => `<p>${escHtml(p)}</p>`)
    .join('\n      ');

  const inclou = product.inclou
    .map((item) => `<li>${escHtml(item)}</li>`)
    .join('\n      ');

  const noInclou = product.noInclou
    ? `<div class="dossier-note"><span>${escHtml(copy.chapter.noteLabel)}</span><p>${escHtml(product.noInclou)}</p></div>`
    : '';

  const duration = product.durada
    ? `<div class="producte-durada"><span>${escHtml(copy.chapter.durationLabel)}</span><strong>${escHtml(product.durada)}</strong></div>`
    : '';

  const categoria = product.categoria
    ? `<span class="producte-categoria">${escHtml(product.categoria)}</span>`
    : '';

  // Preu canònic "des de X €" (de priceFrom; mai hardcoded). Consistent amb el jsPDF.
  const priceValue =
    typeof product.priceFrom === 'number'
      ? `<p class="producte-preu">${escHtml(copy.chapter.priceFromPrefix)} ${escHtml(formatCurrency(product.priceFrom, locale))}</p>`
      : `<p class="producte-preu producte-preu--mida">${escHtml(copy.chapter.priceCustom)}</p>`;
  const priceHtml = `<div class="producte-preu-wrap"><span class="producte-preu-label">${escHtml(copy.chapter.priceLabel)}</span>${priceValue}</div>`;

  return `
  <section class="product-page${isLast ? ' product-page--last' : ''}">
  ${logoDataUri ? `<div class="product-page-header"><img src="${logoDataUri}" alt="Òrbita Events"><span class="product-page-header-tag">${escHtml(copy.portada.bottom)}</span></div>` : ''}
  <article class="producte">
    <header class="producte-header">
      <div class="producte-marker">
        <span class="producte-marker-num">${chapterLabel(num)}</span>
        <span class="producte-marker-rule"></span>
      </div>
      <div class="producte-head-main">
        <span class="producte-num">${escHtml(copy.chapter.eyebrow)} ${chapterLabel(num)}</span>
        ${categoria}
        <h2 class="producte-nom">${escHtml(product.nom)}</h2>
      </div>
    </header>
    <div class="producte-body">
      <div class="producte-desc">
        ${descripcio}
      </div>
      <aside class="producte-aside">
        ${priceHtml}
        ${duration}
      </aside>
    </div>
    <div class="producte-inclou-block">
      <h3>${escHtml(copy.chapter.includesTitle)}</h3>
      <ul class="producte-inclou">
        ${inclou}
      </ul>
    </div>
    ${noInclou}
  </article>
  </section>`;
}

/**
 * Resum de la proposta. Decisió del propietari (#1396): el dossier ENSENYA cada servei
 * amb el seu preu «des de» com a referència, però NO suma un total dels elements (un total
 * sec espanta i el dossier és presentació de valor, no una factura). L'ÚNIC import concret
 * del peu és el desplaçament d'aquesta ruta —cost real i transparent (font única
 * `computeBoloTransport`, mai fórmula pròpia)— perquè el client decideixi conscientment.
 */
function buildResumBlock(
  products: AnimacioProduct[],
  copy: DossierCopy,
  locale: string,
  travelKm: number,
): string {
  if (products.length === 0) return '';

  const fromPrefix = escHtml(copy.chapter.priceFromPrefix);

  const rows = products
    .map((p, i) => {
      const num = chapterLabel(i + 1);
      const nom = escHtml(p.nom);
      const cat = p.categoria ? `<span class="resum-row-cat">${escHtml(p.categoria)}</span>` : '';
      const preu = typeof p.priceFrom === 'number'
        ? `<span class="resum-row-preu">${fromPrefix} ${escHtml(formatCurrency(p.priceFrom, locale))}</span>`
        : `<span class="resum-row-preu resum-row-preu--mida">${escHtml(copy.chapter.priceCustom)}</span>`;
      return `<li class="resum-row">
        <span class="resum-row-num">${num}</span>
        <span class="resum-row-nom">${nom}${cat}</span>
        <span class="resum-row-dots" aria-hidden="true"></span>
        ${preu}
      </li>`;
    })
    .join('\n      ');

  // Peu: proposta (sense suma) + desplaçament clar (l'únic € concret) si es coneix la ruta.
  const travelCharge = dossierTravelCharge(travelKm);
  const travelBlock = travelCharge > 0
    ? `<div class="resum-total-right">
        <span class="resum-total-label">${escHtml(copy.resum.travelLabel)}</span>
        <span class="resum-total-value">${escHtml(formatCurrency(travelCharge, locale))}</span>
      </div>`
    : '';

  return `
  <section class="resum-page">
    <div class="resum-kicker">${escHtml(copy.resum.kicker)}</div>
    <h2 class="resum-title">${escHtml(copy.resum.title)}</h2>
    <p class="resum-lead">${escHtml(copy.resum.lead)}</p>
    <ul class="resum-list">
      ${rows}
    </ul>
    <div class="resum-total">
      <div class="resum-total-left">
        <span class="resum-total-label">${escHtml(copy.resum.totalLabel)}</span>
        <span class="resum-total-hint">${formatOfferCount(copy, products.length)}</span>
      </div>
      ${travelBlock}
    </div>
  </section>`;
}

/**
 * Pressupost desglossat amb el desplaçament calculat segons l'emplaçament del
 * lead. Tot canònic: km inclosos i suplement surten dels helpers de travelCost
 * (mai hardcoded). Només es pinta si hi ha distància coneguda (`travelKm`).
 * Els serveis sense `priceFrom` (a mida) no entren al total.
 */
function buildBudgetBlock(
  products: AnimacioProduct[],
  copy: DossierCopy,
  locale: string,
  travelKm: number,
  location?: string,
): string {
  if (products.length === 0 || travelKm <= 0) return '';

  const money = (n: number) => escHtml(formatCurrency(n, locale));
  const includedOneWay = Math.round(INCLUDED_TRAVEL_KM / 2);
  const fill = (tpl: string, vars: Record<string, string>) =>
    escHtml(Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), tpl));

  // Serveis amb preu «des de» (referència de valor, sense sumar total).
  const priced = products.filter((p) => typeof p.priceFrom === 'number');
  const serviceRows = priced
    .map((p) => `<li class="bud-row">
        <span class="bud-row-nom">${escHtml(p.nom)}</span>
        <span class="bud-row-dots" aria-hidden="true"></span>
        <span class="bud-row-val">${money(p.priceFrom as number)}</span>
      </li>`)
    .join('\n      ');

  // El dossier ENSENYA què fem i què val: mostra el preu «des de» de cada servei com a
  // referència, però NO suma un total dels elements (un total sec espanta; el dossier és
  // presentació de valor, no una factura). En canvi, el DESPLAÇAMENT sí que es mostra amb la
  // seva xifra concreta (decisió del propietari #1396): és un cost real i transparent
  // d'aquesta ruta, no un element del catàleg. Font única del càrrec: `computeBoloTransport`.
  const travelCharge = dossierTravelCharge(travelKm);
  return `
  <section class="bud-page">
    <div class="bud-kicker">${escHtml(copy.budget.kicker)}</div>
    <h2 class="bud-title">${escHtml(copy.budget.title)}</h2>
    <p class="bud-lead">${fill(copy.budget.lead, { includedKm: String(includedOneWay) })}</p>

    <div class="bud-group-label">${escHtml(copy.budget.servicesLabel)}</div>
    <ul class="bud-list">
      ${serviceRows}
    </ul>

    <div class="bud-group-label">${escHtml(copy.budget.travelTitle)}</div>
    <p class="bud-note">${fill(copy.budget.travelNote, { includedKm: String(includedOneWay) })}</p>
    ${location ? `<p class="bud-note bud-note--route">${fill(copy.budget.travelRoute, { location, km: String(Math.round(travelKm)) })}</p>` : ''}
    ${travelCharge > 0 ? `<div class="bud-travel-price">
      <span class="bud-travel-price-label">${escHtml(copy.budget.travelPriceLabel)}</span>
      <span class="bud-travel-price-val">${money(travelCharge)}</span>
    </div>` : ''}
    <p class="bud-note">${escHtml(copy.budget.vatNote)}</p>
  </section>`;
}

export function buildDossierHtml(
  client: DossierClientInfo,
  products: AnimacioProduct[],
  copy: DossierCopy,
  options: { autoPrint?: boolean; logoDataUri?: string; locale?: string; travelKm?: number; location?: string } = {},
): string {
  const locale = options.locale || 'ca-ES';
  const nomPrincipal = escHtml(client.nom);
  const empresa = client.empresa ? escHtml(client.empresa) : '';
  const eventDesc = client.eventDesc ? escHtml(client.eventDesc) : '';
  const salutacio = client.salutacio || copy.intro.greetingDefault;

  const producteBlocs = products
    .map((p, i) => buildProductBlock(p, i + 1, copy, locale, options.logoDataUri, false))
    .join('\n');

  const resumBloc = buildResumBlock(products, copy, locale, options.travelKm ?? 0);
  const budgetBloc = buildBudgetBlock(products, copy, locale, options.travelKm ?? 0, options.location);

  const salutacioHtml = escHtml(salutacio).replace(/\n\n/g, '<br><br>');

  return `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dossier Òrbita Events — ${nomPrincipal}</title>
  <style>
    :root {
      --o-ink: #211d16;
      --o-ink-soft: #4f493f;
      --o-ink-mute: #7a7264;
      --o-gold: #a9863f;
      --o-gold-bright: #d7b86e;
      --o-gold-deep: #b8860b;
      --o-paper: #fbf8f1;
      --o-paper-card: #f6f1e6;
      --o-line: #e3dccd;
      --o-line-soft: #ece5d6;
      --o-carbon: #0c0b0a;
      --o-carbon-2: #16140f;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
      background: var(--o-paper);
      color: var(--o-ink);
      font-size: 15px;
      line-height: 1.6;
      font-variant-numeric: tabular-nums;
      -webkit-font-smoothing: antialiased;
    }
    .sans { font-family: 'Inter', Arial, sans-serif; }
    .page { max-width: 820px; margin: 0 auto; padding: 0 60px 70px; }

    /* ---------- PORTADA ---------- */
    .portada {
      background:
        radial-gradient(120% 80% at 50% 0%, rgba(215,184,110,0.10), transparent 55%),
        radial-gradient(90% 60% at 50% 100%, rgba(184,134,11,0.08), transparent 60%),
        linear-gradient(160deg, var(--o-carbon-2), var(--o-carbon));
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      break-after: page;
      padding: 90px 60px 70px;
      position: relative;
      color: #fff;
      overflow: hidden;
    }
    .portada::before {
      content: '';
      position: absolute; inset: 30px;
      border: 1px solid rgba(215,184,110,0.30);
      pointer-events: none;
    }
    .portada::after {
      content: '';
      position: absolute; inset: 38px;
      border: 1px solid rgba(215,184,110,0.12);
      pointer-events: none;
    }
    .portada-corner {
      position: absolute; width: 26px; height: 26px;
      border-color: var(--o-gold-bright); border-style: solid; border-width: 0;
      opacity: 0.85;
    }
    .portada-corner--tl { top: 30px; left: 30px; border-top-width: 2px; border-left-width: 2px; }
    .portada-corner--tr { top: 30px; right: 30px; border-top-width: 2px; border-right-width: 2px; }
    .portada-corner--bl { bottom: 30px; left: 30px; border-bottom-width: 2px; border-left-width: 2px; }
    .portada-corner--br { bottom: 30px; right: 30px; border-bottom-width: 2px; border-right-width: 2px; }
    .portada-eyebrow {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 10px; font-weight: 600; letter-spacing: 0.42em; text-transform: uppercase;
      color: rgba(215,184,110,0.78); margin-bottom: 46px;
    }
    .portada-logo { width: 300px; max-width: 64vw; display: block; margin: 0 auto 46px; }
    .portada-wordmark {
      font-size: 46px; font-weight: 600; letter-spacing: 0.04em;
      color: #fff; margin-bottom: 46px; font-family: 'Cormorant Garamond', Georgia, serif;
    }
    .portada-divider {
      width: 64px; height: 0; border-top: 1px solid var(--o-gold-deep);
      margin: 0 auto 40px; position: relative;
    }
    .portada-divider::before {
      content: '✦'; position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%); color: var(--o-gold-bright);
      font-size: 13px; background: var(--o-carbon); padding: 0 10px;
    }
    .portada-client { text-align: center; }
    .portada-client-label {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 10px; letter-spacing: 0.34em; text-transform: uppercase;
      color: rgba(255,255,255,0.45); margin-bottom: 22px;
    }
    .portada-client-nom {
      font-size: 56px; line-height: 1.02; font-weight: 600; letter-spacing: 0.01em;
      color: #fff; margin-bottom: 18px;
    }
    .portada-client-empresa {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 14px; color: var(--o-gold-bright); margin-bottom: 14px;
      letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500;
    }
    .portada-client-event { font-size: 19px; color: rgba(255,255,255,0.62); font-style: italic; }
    .portada-bottom {
      position: absolute; bottom: 50px; left: 0; right: 0; text-align: center;
      font-family: 'Inter', Arial, sans-serif;
      font-size: 10px; color: rgba(255,255,255,0.30); letter-spacing: 0.30em; text-transform: uppercase;
    }

    /* ---------- INTRO ---------- */
    .intro-page { min-height: 100vh; page-break-after: always; break-after: page; padding-top: 64px; }
    .intro-kicker {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 10px; font-weight: 600; letter-spacing: 0.34em; text-transform: uppercase;
      color: var(--o-gold); margin-bottom: 26px;
    }
    .intro-title {
      font-size: 50px; line-height: 1.06; font-weight: 600; max-width: 660px;
      margin-bottom: 36px; color: #16130d; letter-spacing: -0.005em;
    }
    .intro-title em { font-style: italic; color: var(--o-gold-deep); }
    .salutacio {
      border-top: 1px solid var(--o-gold-bright); padding-top: 28px;
      font-size: 17px; color: var(--o-ink-soft); line-height: 1.9; max-width: 640px;
    }
    .salutacio strong { color: var(--o-ink); font-weight: 600; }
    .intro-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 52px; border: 1px solid var(--o-line); }
    .intro-summary div { padding: 22px 20px; border-right: 1px solid var(--o-line); }
    .intro-summary div:last-child { border-right: 0; }
    .intro-summary span {
      display: block; font-family: 'Inter', Arial, sans-serif;
      font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--o-gold); margin-bottom: 12px; font-weight: 600;
    }
    .intro-summary strong { display: block; font-size: 17px; line-height: 1.4; color: var(--o-ink); font-weight: 600; }

    /* ---------- CAPÍTOLS ---------- */
    .product-page { page-break-after: always; break-after: page; padding-top: 60px; }
    .product-page--last { page-break-after: auto; break-after: auto; }
    .product-page-header {
      background: linear-gradient(120deg, var(--o-carbon-2), var(--o-carbon));
      border-bottom: 1px solid var(--o-gold-bright);
      padding: 16px 22px; margin: 0 0 38px; display: flex; align-items: center; justify-content: space-between;
    }
    .product-page-header img { display: block; width: 210px; max-width: 46%; height: auto; }
    .product-page-header-tag {
      font-family: 'Inter', Arial, sans-serif; font-size: 9px; letter-spacing: 0.26em;
      text-transform: uppercase; color: rgba(215,184,110,0.7);
    }
    .producte { page-break-inside: avoid; }
    .producte-header { display: flex; align-items: flex-start; gap: 26px; margin-bottom: 30px; }
    .producte-marker { display: flex; flex-direction: column; align-items: center; padding-top: 6px; }
    .producte-marker-num {
      font-size: 58px; font-weight: 600; color: var(--o-gold-bright); line-height: 0.9;
      font-family: 'Cormorant Garamond', Georgia, serif;
    }
    .producte-marker-rule { width: 1px; flex: 1; min-height: 24px; background: var(--o-line); margin-top: 12px; }
    .producte-head-main { flex: 1; }
    .producte-num {
      display: inline-block; font-family: 'Inter', Arial, sans-serif;
      font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
      color: var(--o-gold); margin-bottom: 4px;
    }
    .producte-categoria {
      display: inline-block; margin-left: 12px; font-family: 'Inter', Arial, sans-serif;
      font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
      color: var(--o-ink-mute); border: 1px solid var(--o-line); padding: 3px 9px; vertical-align: middle;
    }
    .producte-nom { font-size: 42px; line-height: 1.05; font-weight: 600; color: var(--o-ink); margin-top: 8px; letter-spacing: -0.01em; }
    .producte-body { display: grid; grid-template-columns: 1fr 200px; gap: 34px; margin-bottom: 32px; align-items: start; }
    .producte-desc { font-size: 17px; color: var(--o-ink-soft); line-height: 1.92; }
    .producte-desc p + p { margin-top: 16px; }
    .producte-desc p:first-child::first-letter {
      font-size: 50px; font-weight: 600; float: left; line-height: 0.82;
      padding: 6px 12px 0 0; color: var(--o-gold-deep);
    }
    .producte-aside { border-left: 1px solid var(--o-gold-bright); padding-left: 20px; }
    .producte-preu-wrap { margin-bottom: 20px; }
    .producte-preu-label, .producte-durada span {
      display: block; font-family: 'Inter', Arial, sans-serif;
      font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--o-gold);
      font-weight: 600; margin-bottom: 6px;
    }
    .producte-preu { font-size: 24px; font-weight: 600; color: var(--o-ink); letter-spacing: 0.005em; }
    .producte-preu--mida { color: var(--o-ink-mute); font-style: italic; }
    .producte-durada strong { font-size: 17px; font-weight: 600; color: var(--o-ink); }
    .producte-inclou-block { border-top: 1px solid var(--o-line); padding-top: 26px; }
    .producte h3 {
      font-family: 'Inter', Arial, sans-serif; font-size: 10px; letter-spacing: 0.22em;
      text-transform: uppercase; color: var(--o-gold); margin-bottom: 18px; font-weight: 600;
    }
    .producte-inclou { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 30px; font-size: 15px; list-style: none; }
    .producte-inclou li { display: flex; align-items: flex-start; gap: 10px; color: var(--o-ink); line-height: 1.5; }
    .producte-inclou li::before { content: '✦'; color: var(--o-gold-bright); font-size: 10px; flex-shrink: 0; margin-top: 4px; }
    .dossier-note { border-left: 2px solid var(--o-gold-bright); background: var(--o-paper-card); padding: 16px 18px; margin-top: 28px; color: var(--o-ink-soft); }
    .dossier-note span {
      display: block; font-family: 'Inter', Arial, sans-serif; font-size: 9px; letter-spacing: 0.2em;
      text-transform: uppercase; color: var(--o-gold); font-weight: 600; margin-bottom: 6px;
    }
    .dossier-note p { font-size: 15px; font-style: italic; }

    /* ---------- RESUM ECONÒMIC ---------- */
    .resum-page { page-break-inside: avoid; page-break-before: always; break-before: page; padding-top: 60px; margin-bottom: 56px; }
    .resum-kicker {
      font-family: 'Inter', Arial, sans-serif; font-size: 10px; font-weight: 600;
      letter-spacing: 0.34em; text-transform: uppercase; color: var(--o-gold); margin-bottom: 22px;
    }
    .resum-title { font-size: 46px; font-weight: 600; color: var(--o-ink); letter-spacing: -0.01em; margin-bottom: 18px; }
    .resum-lead { font-size: 16px; color: var(--o-ink-soft); line-height: 1.85; max-width: 640px; margin-bottom: 38px; }
    .resum-list { list-style: none; margin-bottom: 34px; }
    .resum-row { display: flex; align-items: baseline; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--o-line-soft); }
    .resum-row-num {
      font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
      color: var(--o-gold); min-width: 24px;
    }
    .resum-row-nom { font-size: 19px; font-weight: 600; color: var(--o-ink); flex-shrink: 0; }
    .resum-row-cat {
      display: inline-block; margin-left: 12px; font-family: 'Inter', Arial, sans-serif;
      font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--o-ink-mute); font-weight: 600;
    }
    .resum-row-dots { flex: 1; border-bottom: 1px dotted var(--o-line); transform: translateY(-4px); min-width: 18px; }
    .resum-row-preu { font-size: 18px; font-weight: 600; color: var(--o-ink); white-space: nowrap; }
    .resum-row-preu--mida { color: var(--o-ink-mute); font-style: italic; }
    .resum-total {
      display: flex; align-items: center; justify-content: space-between; gap: 24px;
      background: linear-gradient(120deg, var(--o-carbon-2), var(--o-carbon));
      color: #fff; padding: 28px 32px; border: 1px solid var(--o-gold-deep); position: relative;
    }
    .resum-total::before {
      content: ''; position: absolute; inset: 5px; border: 1px solid rgba(215,184,110,0.22); pointer-events: none;
    }
    .resum-total-label {
      display: block; font-family: 'Inter', Arial, sans-serif; font-size: 10px; letter-spacing: 0.22em;
      text-transform: uppercase; color: rgba(215,184,110,0.85); font-weight: 600; margin-bottom: 8px;
    }
    .resum-total-hint { display: block; font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.55); }
    .resum-total-right { text-align: right; }
    .resum-total-value { display: block; font-size: 40px; font-weight: 600; color: var(--o-gold-bright); letter-spacing: 0.005em; }

    /* ---------- PRESSUPOST DESGLOSSAT ---------- */
    .bud-page { page-break-inside: avoid; page-break-before: always; break-before: page; padding-top: 60px; margin-bottom: 56px; }
    .bud-kicker { font-family: 'Inter', Arial, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.34em; text-transform: uppercase; color: var(--o-gold); margin-bottom: 22px; }
    .bud-title { font-size: 46px; font-weight: 600; color: var(--o-ink); letter-spacing: -0.01em; margin-bottom: 18px; }
    .bud-lead { font-size: 16px; color: var(--o-ink-soft); line-height: 1.85; max-width: 640px; margin-bottom: 34px; }
    .bud-group-label { font-family: 'Inter', Arial, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--o-gold); margin: 26px 0 10px; }
    .bud-list { list-style: none; margin: 0 0 8px; }
    .bud-row { display: flex; align-items: baseline; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--o-line-soft); }
    .bud-row--sub .bud-row-nom { color: var(--o-ink-mute); font-size: 15px; }
    .bud-row-nom { font-size: 17px; color: var(--o-ink); flex-shrink: 0; }
    .bud-row-dots { flex: 1; border-bottom: 1px dotted var(--o-line); transform: translateY(-4px); min-width: 18px; }
    .bud-row-val { font-size: 17px; font-weight: 600; color: var(--o-ink); white-space: nowrap; }
    .bud-row-val--mute { color: var(--o-ink-mute); font-weight: 400; font-style: italic; }
    .bud-total { display: flex; align-items: center; justify-content: space-between; gap: 24px; background: linear-gradient(120deg, var(--o-carbon-2), var(--o-carbon)); color: #fff; padding: 24px 28px; border: 1px solid var(--o-gold-deep); margin-top: 22px; }
    .bud-total-label { font-family: 'Inter', Arial, sans-serif; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(215,184,110,0.85); font-weight: 600; }
    .bud-total-value { font-size: 36px; font-weight: 600; color: var(--o-gold-bright); }
    .bud-travel-price { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-top: 14px; padding: 14px 20px; background: var(--o-paper-card); border: 1px solid var(--o-gold); border-left: 3px solid var(--o-gold-deep); }
    .bud-travel-price-label { font-family: 'Inter', Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; color: var(--o-ink); }
    .bud-travel-price-val { font-size: 26px; font-weight: 600; color: var(--o-gold-deep); white-space: nowrap; }
    .bud-note { font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: var(--o-ink-mute); margin-top: 12px; line-height: 1.6; }

    /* ---------- CTA + PEU ---------- */
    .cta {
      background: var(--o-paper-card); color: var(--o-ink); border: 1px solid var(--o-gold-bright);
      padding: 26px 28px; margin-top: 44px; text-align: center; position: relative;
    }
    .cta-icon { color: var(--o-gold-bright); font-size: 16px; margin-bottom: 12px; }
    .cta p { font-family: 'Inter', Arial, sans-serif; font-size: 11px; letter-spacing: 0.06em; color: var(--o-ink-mute); margin-bottom: 8px; text-transform: uppercase; }
    .cta strong { font-size: 22px; color: var(--o-ink); display: block; font-weight: 600; }
    .peu { margin-top: 56px; border-top: 1px solid var(--o-line); padding-top: 26px; display: flex; justify-content: space-between; align-items: flex-end; }
    .peu-marca { font-size: 19px; font-weight: 600; color: var(--o-ink); letter-spacing: 0.02em; }
    .peu-web { margin-top: 4px; font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: var(--o-gold-deep); letter-spacing: 0.04em; }
    .peu-contact { text-align: right; line-height: 1.8; font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: var(--o-ink-mute); }
    .peu-contact a { color: var(--o-gold-deep); text-decoration: none; }

    @media (max-width: 640px) {
      .page { padding: 0 22px 48px; }
      .intro-title { font-size: 34px; }
      .intro-summary { grid-template-columns: 1fr; }
      .intro-summary div { border-right: 0; border-bottom: 1px solid var(--o-line); }
      .intro-summary div:last-child { border-bottom: 0; }
      .producte-nom { font-size: 30px; }
      .producte-body { grid-template-columns: 1fr; gap: 22px; }
      .producte-aside { border-left: 0; border-top: 1px solid var(--o-gold-bright); padding-left: 0; padding-top: 18px; }
      .producte-inclou { grid-template-columns: 1fr; }
      .producte-marker-num { font-size: 44px; }
      .portada-client-nom { font-size: 38px; }
      .portada-wordmark { font-size: 34px; }
      .resum-title { font-size: 32px; }
      .resum-row { flex-wrap: wrap; }
      .resum-row-dots { display: none; }
      .resum-row-preu { margin-left: auto; }
      .resum-total { flex-direction: column; align-items: flex-start; gap: 14px; }
      .resum-total-right { text-align: left; }
      .resum-total-value { font-size: 32px; }
      .bud-title { font-size: 32px; }
      .bud-row { flex-wrap: wrap; }
      .bud-row-dots { display: none; }
      .bud-row-val { margin-left: auto; }
      .bud-total { flex-direction: column; align-items: flex-start; gap: 10px; }
      .bud-total-value { font-size: 30px; }
      .bud-travel-price { flex-wrap: wrap; gap: 6px 16px; }
      .bud-travel-price-val { font-size: 22px; }
    }

    @media print {
      body { font-size: 13px; background: #fff; }
      .page { padding: 0 32px 30px; }
      .portada {
        background: linear-gradient(160deg, #16140f, #0c0b0a) !important;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .product-page-header {
        background: #16140f !important;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .resum-total, .bud-total {
        background: #16140f !important;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .cta, .dossier-note, .intro-summary {
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .product-page, .resum-page, .bud-page { padding-top: 0; }
      .producte, .resum-total, .resum-row, .bud-total, .bud-row, .cta, .peu { page-break-inside: avoid; }
    }
  </style>
  ${options.autoPrint ? '<script>window.addEventListener("load", function(){ window.print(); });</script>' : ''}
</head>
<body>

<div class="portada">
  <span class="portada-corner portada-corner--tl"></span>
  <span class="portada-corner portada-corner--tr"></span>
  <span class="portada-corner portada-corner--bl"></span>
  <span class="portada-corner portada-corner--br"></span>
  <div class="portada-eyebrow">${escHtml(copy.portada.eyebrow)}</div>
  ${options.logoDataUri ? `<img class="portada-logo" src="${options.logoDataUri}" alt="Òrbita Events" />` : '<div class="portada-wordmark">Òrbita Events</div>'}
  <div class="portada-divider"></div>
  <div class="portada-client">
    <div class="portada-client-label">${escHtml(copy.portada.clientLabel)}</div>
    <div class="portada-client-nom">${nomPrincipal}</div>
    ${empresa ? `<div class="portada-client-empresa">${empresa}</div>` : ''}
    ${eventDesc ? `<div class="portada-client-event">${eventDesc}</div>` : ''}
  </div>
  <div class="portada-bottom">${escHtml(copy.portada.bottom)}</div>
</div>

<div class="page">
  <section class="intro-page">
    <div class="intro-kicker">${escHtml(copy.intro.kicker)}</div>
    <h1 class="intro-title">${escHtml(copy.intro.title)}</h1>

  <div class="salutacio">
    Hola ${nomPrincipal},<br><br>
    ${salutacioHtml}
  </div>

    <div class="intro-summary">
      <div><span>${escHtml(copy.intro.summaryOfferLabel)}</span><strong>${formatOfferCount(copy, products.length)}</strong></div>
      <div><span>${escHtml(copy.intro.summaryFormatLabel)}</span><strong>${escHtml(copy.intro.summaryFormatValue)}</strong></div>
      <div><span>${escHtml(copy.intro.summaryGoalLabel)}</span><strong>${escHtml(copy.intro.summaryGoalValue)}</strong></div>
    </div>
  </section>

  ${producteBlocs}

  ${resumBloc}

  ${budgetBloc}

  <div class="cta">
    <div class="cta-icon">✦</div>
    <p>${escHtml(copy.cta.label)}</p>
    <strong>${SITE_CONFIG.business.phoneDisplay} · ${SITE_CONFIG.business.email}</strong>
  </div>

  <div class="peu">
    <div>
      <div class="peu-marca">Òrbita Events</div>
      <div class="peu-web">www.${SITE_CONFIG.web.domain}</div>
    </div>
    <div class="peu-contact">
      ${escHtml(copy.portada.clientLabel)} ${nomPrincipal}${empresa ? `<br>${empresa}` : ''}${eventDesc ? `<br>${eventDesc}` : ''}
    </div>
  </div>

</div>
</body>
</html>`;
}

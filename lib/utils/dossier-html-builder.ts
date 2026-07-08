import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { SITE_CONFIG } from '@/app/config/site-config';
import { formatCurrency } from '@/lib/constants';
import { INCLUDED_TRAVEL_KM } from '@/lib/services/travelCost';
import { computeDossierTransportBudget } from '@/lib/services/dossierMarginGuardService';

/** Càrrec de transport al client per a la ruta del dossier (un sol cervell). */
function dossierTravelBudget(travelKm: number, travelTollsEur = 0) {
  return computeDossierTransportBudget(travelKm, travelTollsEur);
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
    greeting: string;
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
  resum: { kicker: string; title: string; lead: string };
  budget: {
    servicesLabel: string;
    travelTitle: string;
    travelNote: string;
    travelRoute: string;
    travelPriceLabel: string;
    travelBreakdownLabel: string;
    travelBreakdownVehicle: string;
    travelBreakdownPeople: string;
    travelBreakdownTolls: string;
    travelBreakdownMeals: string;
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

function resolveDossierAssetSrc(src: string, assetBaseUrl?: string): string {
  if (!assetBaseUrl) return src;
  if (/^(?:data:|blob:|https?:\/\/)/i.test(src)) return src;
  try {
    return new URL(src, assetBaseUrl).toString();
  } catch {
    return src;
  }
}

function buildProductBlock(
  product: AnimacioProduct,
  num: number,
  copy: DossierCopy,
  locale: string,
  logoDataUri?: string,
  isLast = false,
  assetBaseUrl?: string,
): string {
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

  const imageSrc = product.image ? resolveDossierAssetSrc(product.image, assetBaseUrl) : '';
  const imageHtml = imageSrc
    ? `<figure class="producte-media"><img src="${escHtml(imageSrc)}" alt="${escHtml(product.nom)}"></figure>`
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
      ${imageHtml}
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
 * La proposta, en UNA sola pàgina (#1397). Fusió del resum i la transparència perquè el preu
 * no es repeteixi en pàgines paral·leles: cada servei amb el seu preu «des de» com a
 * referència (mai una suma que espanti — no és una factura) i JUST DESPRÉS el desplaçament,
 * explicat a nivell de principi (temps de l'equip + vehicle, a cost, sense sorpreses) i amb
 * el seu cost real d'aquesta ruta. Font única del càrrec: `computeBoloTransport` (mai fórmula
 * pròpia). El transport només es pinta si es coneix la ruta (`travelKm`).
 */
function buildProposalBlock(
  products: AnimacioProduct[],
  copy: DossierCopy,
  locale: string,
  travelKm: number,
  travelTollsEur: number,
  location?: string,
): string {
  if (products.length === 0) return '';

  const money = (n: number) => escHtml(formatCurrency(n, locale));
  const fromPrefix = escHtml(copy.chapter.priceFromPrefix);
  const includedOneWay = Math.round(INCLUDED_TRAVEL_KM / 2);
  const fillRaw = (tpl: string, vars: Record<string, string>) =>
    Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), tpl);
  const fill = (tpl: string, vars: Record<string, string>) => escHtml(fillRaw(tpl, vars));

  const rows = products
    .map((p, i) => {
      const num = chapterLabel(i + 1);
      const nom = escHtml(p.nom);
      const cat = p.categoria ? `<span class="resum-card-cat">${escHtml(p.categoria)}</span>` : '';
      const preu = typeof p.priceFrom === 'number'
        ? `<strong class="resum-card-preu">${fromPrefix} ${escHtml(formatCurrency(p.priceFrom, locale))}</strong>`
        : `<strong class="resum-card-preu resum-card-preu--mida">${escHtml(copy.chapter.priceCustom)}</strong>`;
      return `<li class="resum-card">
        <div class="resum-card-main">
          <span class="resum-card-num">${num}</span>
          <h3>${nom}</h3>
          ${cat}
        </div>
        <div class="resum-card-price">
          <span>${escHtml(copy.chapter.priceLabel)}</span>
          ${preu}
        </div>
      </li>`;
    })
    .join('\n      ');

  // Desplaçament JUST DESPRÉS dels productes: ruta real, cost client i desglossament
  // comercial dels conceptes que expliquen el preu sense convertir-los en productes.
  const travelBudget = dossierTravelBudget(travelKm, travelTollsEur);
  const travelCharge = travelBudget.clientCharge;
  const travelBreakdownRows = [
    travelBudget.clientVehicleCost > 0
      ? { label: copy.budget.travelBreakdownVehicle, amount: travelBudget.clientVehicleCost }
      : null,
    travelBudget.peopleCost > 0
      ? {
          label: fillRaw(copy.budget.travelBreakdownPeople, {
            headcount: String(travelBudget.headcount),
            hours: new Intl.NumberFormat(locale, {
              minimumFractionDigits: travelBudget.chargeableHours % 1 === 0 ? 0 : 1,
              maximumFractionDigits: 1,
            }).format(travelBudget.chargeableHours),
          }),
          amount: travelBudget.peopleCost,
        }
      : null,
    travelBudget.tollsCost > 0
      ? { label: copy.budget.travelBreakdownTolls, amount: travelBudget.tollsCost }
      : null,
    travelBudget.mealAllowance > 0
      ? { label: copy.budget.travelBreakdownMeals, amount: travelBudget.mealAllowance }
      : null,
  ].filter((row): row is { label: string; amount: number } => Boolean(row));
  const travelSection = travelKm > 0 ? `
    <div class="bud-travel">
      <div class="bud-travel-marker" aria-hidden="true">
        <span class="bud-travel-dot"></span>
        <span class="bud-travel-rule"></span>
      </div>
      <div class="bud-travel-main">
        <div class="bud-travel-title">${escHtml(copy.budget.travelTitle)}</div>
        <p class="bud-note">${fill(copy.budget.travelNote, { includedKm: String(includedOneWay) })}</p>
        ${location ? `<p class="bud-note bud-note--route">${fill(copy.budget.travelRoute, { location, km: String(Math.round(travelKm)) })}</p>` : ''}
        ${travelCharge > 0 ? `<div class="bud-travel-price">
          <span class="bud-travel-price-label">${escHtml(copy.budget.travelPriceLabel)}</span>
          <span class="bud-travel-price-val">${money(travelCharge)}</span>
          ${travelBreakdownRows.length > 0 ? `<div class="bud-travel-breakdown">
            <span class="bud-travel-breakdown-title">${escHtml(copy.budget.travelBreakdownLabel)}</span>
            ${travelBreakdownRows.map((row) => `<span class="bud-travel-breakdown-row"><span>${escHtml(row.label)}</span><strong>${money(row.amount)}</strong></span>`).join('')}
          </div>` : ''}
        </div>` : ''}
      </div>
    </div>` : '';

  return `
  <section class="resum-page">
    <div class="resum-kicker">${escHtml(copy.resum.kicker)}</div>
    <h2 class="resum-title">${escHtml(copy.resum.title)}</h2>
    <p class="resum-lead">${escHtml(copy.resum.lead)}</p>

    <div class="bud-group-label">${escHtml(copy.budget.servicesLabel)}</div>
    <ul class="resum-list">
      ${rows}
    </ul>
    ${travelSection}
    <p class="bud-note">${escHtml(copy.budget.vatNote)}</p>
  </section>`;
}

export function buildDossierHtml(
  client: DossierClientInfo,
  products: AnimacioProduct[],
  copy: DossierCopy,
  options: { autoPrint?: boolean; logoDataUri?: string; locale?: string; travelKm?: number; travelTollsEur?: number; location?: string; assetBaseUrl?: string } = {},
): string {
  const locale = options.locale || 'ca-ES';
  // Idioma del document derivat del locale (ca-ES → ca), mai hardcoded.
  const lang = locale.split('-')[0] || 'ca';
  const nomPrincipal = escHtml(client.nom);
  const empresa = client.empresa ? escHtml(client.empresa) : '';
  const eventDesc = client.eventDesc ? escHtml(client.eventDesc) : '';
  const salutacio = client.salutacio || copy.intro.greetingDefault;
  // Salutació monocapa des de la copy (mai «Hola» hardcoded): {name} → nom del client.
  const greetingHtml = escHtml(copy.intro.greeting.split('{name}').join(client.nom));

  const producteBlocs = products
    .map((p, i) => buildProductBlock(p, i + 1, copy, locale, options.logoDataUri, false, options.assetBaseUrl))
    .join('\n');

  const proposalBloc = buildProposalBlock(products, copy, locale, options.travelKm ?? 0, options.travelTollsEur ?? 0, options.location);

  const salutacioHtml = escHtml(salutacio).replace(/\n\n/g, '<br><br>');

  return `<!DOCTYPE html>
<html lang="${lang}">
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
    .intro-page {
      page-break-after: always;
      break-after: page;
      padding: 76px 0 90px;
    }
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
    .producte-media {
      grid-column: 1 / -1; margin: -4px 0 2px; padding: 8px;
      border: 1px solid var(--o-line); background: rgba(255,255,255,0.18);
    }
    .producte-media img { display: block; width: 100%; height: 230px; object-fit: cover; object-position: center; }
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
    .resum-list { list-style: none; margin-bottom: 34px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .resum-card {
      min-height: 128px;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      align-content: space-between;
      gap: 18px;
      padding: 18px 20px;
      border: 1px solid var(--o-line);
      background: rgba(255,255,255,0.20);
    }
    .resum-card-main { display: grid; gap: 8px; }
    .resum-card-num {
      font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
      color: var(--o-gold);
    }
    .resum-card h3 { font-size: 25px; line-height: 1.08; font-weight: 600; color: var(--o-ink); }
    .resum-card-cat {
      display: inline-block; width: fit-content; font-family: 'Inter', Arial, sans-serif;
      font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--o-ink-mute); font-weight: 600;
    }
    .resum-card-price { border-top: 1px solid var(--o-line-soft); padding-top: 14px; }
    .resum-card-price span {
      display: block; font-family: 'Inter', Arial, sans-serif; font-size: 9px; font-weight: 600;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--o-gold); margin-bottom: 4px;
    }
    .resum-card-preu { display: block; font-size: 21px; font-weight: 600; color: var(--o-ink); letter-spacing: 0.005em; }
    .resum-card-preu--mida { color: var(--o-ink-mute); font-style: italic; }

    /* ---------- DESPLAÇAMENT (dins la pàgina de proposta) ---------- */
    .bud-group-label { font-family: 'Inter', Arial, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--o-gold); margin: 34px 0 10px; }
    /* Desplaçament = mini-capítol: mateixa estructura de marcador que els capítols
       (columna esquerra amb marca + filet vertical) però amb un punt fosc en comptes
       del numeral gran — l'ancora com un producte sense ser-ho. */
    .bud-travel { display: flex; align-items: stretch; gap: 26px; margin-top: 38px; }
    .bud-travel-marker { display: flex; flex-direction: column; align-items: center; width: 30px; flex-shrink: 0; padding-top: 8px; }
    .bud-travel-dot { width: 18px; height: 18px; border-radius: 50%; background: var(--o-carbon); flex-shrink: 0; }
    .bud-travel-rule { width: 1px; flex: 1; min-height: 24px; background: var(--o-line); margin-top: 12px; }
    .bud-travel-main { flex: 1; min-width: 0; }
    /* Títol del mini-capítol: serif, com els títols dels capítols (·producte-nom),
       una mica més contingut perquè és una secció de suport, no un producte. */
    .bud-travel-title { font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size: 34px; font-weight: 600; line-height: 1.05; color: var(--o-ink); letter-spacing: -0.01em; margin: 0 0 16px; }
    /* Cost del desplaçament: mateix llenguatge editorial que el preu dels capítols
       (mini-etiqueta daurada + número serif fosc + filet daurat), mai una caixa-factura. */
    .bud-travel-price { margin-top: 22px; border-left: 1px solid var(--o-gold-bright); padding-left: 20px; }
    .bud-travel-price-label { display: block; font-family: 'Inter', Arial, sans-serif; font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--o-gold); margin-bottom: 6px; }
    .bud-travel-price-val { display: block; font-size: 26px; font-weight: 600; color: var(--o-ink); letter-spacing: 0.005em; }
    .bud-travel-breakdown { margin-top: 14px; display: grid; gap: 7px; max-width: 420px; }
    .bud-travel-breakdown-title {
      display: block; font-family: 'Inter', Arial, sans-serif; font-size: 9px; font-weight: 600;
      letter-spacing: 0.16em; text-transform: uppercase; color: var(--o-ink-mute); margin-bottom: 2px;
    }
    .bud-travel-breakdown-row {
      display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 16px; align-items: baseline;
      font-family: 'Inter', Arial, sans-serif; font-size: 11px; line-height: 1.45; color: var(--o-ink-soft);
      border-top: 1px solid var(--o-line-soft); padding-top: 7px;
    }
    .bud-travel-breakdown-row strong { color: var(--o-ink); font-size: 12px; white-space: nowrap; }
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
      .producte-media img { height: 180px; }
      .producte-aside { border-left: 0; border-top: 1px solid var(--o-gold-bright); padding-left: 0; padding-top: 18px; }
      .producte-inclou { grid-template-columns: 1fr; }
      .producte-marker-num { font-size: 44px; }
      .portada-client-nom { font-size: 38px; }
      .portada-wordmark { font-size: 34px; }
      .resum-title { font-size: 32px; }
      .resum-list { grid-template-columns: 1fr; }
      .resum-card { min-height: 112px; }
      .bud-travel { gap: 16px; }
      .bud-travel-marker { width: 20px; padding-top: 5px; }
      .bud-travel-dot { width: 14px; height: 14px; }
      .bud-travel-title { font-size: 26px; }
      .bud-travel-price-val { font-size: 22px; }
      .bud-travel-breakdown-row { grid-template-columns: 1fr; gap: 2px; }
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
      .cta, .dossier-note, .intro-summary {
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .product-page, .resum-page { padding-top: 0; }
      .producte-media img { height: 200px; }
      .producte, .resum-card, .bud-travel, .bud-travel-price, .cta, .peu { page-break-inside: avoid; }
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
    ${greetingHtml}<br><br>
    ${salutacioHtml}
  </div>

    <div class="intro-summary">
      <div><span>${escHtml(copy.intro.summaryOfferLabel)}</span><strong>${formatOfferCount(copy, products.length)}</strong></div>
      <div><span>${escHtml(copy.intro.summaryFormatLabel)}</span><strong>${escHtml(copy.intro.summaryFormatValue)}</strong></div>
      <div><span>${escHtml(copy.intro.summaryGoalLabel)}</span><strong>${escHtml(copy.intro.summaryGoalValue)}</strong></div>
    </div>
  </section>

  ${producteBlocs}

  ${proposalBloc}

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

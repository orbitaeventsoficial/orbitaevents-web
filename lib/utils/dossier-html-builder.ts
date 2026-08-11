import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { SITE_CONFIG } from '@/app/config/site-config';
import { formatCurrency } from '@/lib/constants';
import {
  INCLUDED_TRAVEL_KM,
  TRAVEL_BLOCK_KM,
  TRAVEL_BLOCK_EUR,
  calculateBillableTravelKm,
  calculateTravelBlocks,
  calculateTravelCharge,
} from '@/lib/services/travelCost';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EL DOSSIER QUE REP EL CLIENT
 *
 * Reconstruït el 2026-08-10 per ordre del propietari, amb dues queixes seves i
 * cap més:
 *
 *  1. «si li ofereixo 2 h de DJ, posa 2 h de DJ, no des de…». El catàleg diu
 *     «des de 150 €» perquè no sap quantes hores es venen. El bolo muntat sí
 *     que ho sap. Per tant, **quan hi ha bolo muntat manen les seves línies i
 *     el «des de» desapareix del document sencer**, no només del pressupost.
 *     Un preu orientatiu al costat d'un preu real no és informació: és un
 *     dubte a la cara del client.
 *
 *  2. «que no sigui kilomètric». Abans cada servei ocupava una pàgina sencera:
 *     amb els 10 dossiers reals sortien 9 pàgines de mitjana i 15 el pitjor
 *     cas. Ara els serveis són fitxes de terç de pàgina, tres per full:
 *     portada-carta + fitxes + pressupost. Amb 5 serveis, 4 pàgines; amb 11,
 *     sis.
 *
 * El preu viu en **un sol lloc** del document: la pàgina de pressupost. Les
 * fitxes expliquen què és cada cosa; el pressupost diu què val el conjunt.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type DossierClientInfo = {
  nom: string;
  telefon?: string;
  email?: string;
  empresa?: string;
  eventDesc?: string;
  salutacio?: string;
};

/** Una línia del bolo tal com està muntat a la fitxa: el que el client pagarà. */
export type DossierQuoteLine = { label: string; amount: number };

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
  resum: { kicker: string; title: string; lead: string; totalLabel: string; customSuffix: string };
  budget: {
    kicker: string;
    title: string;
    lead: string;
    servicesLabel: string;
    travelTitle: string;
    travelTo: string;
    travelTotalKm: string;
    travelIncludedKm: string;
    travelBillableKm: string;
    travelBlocks: string;
    travelIncludedAll: string;
    travelLine: string;
    travelNote: string;
    totalLabel: string;
    vatNote: string;
    /**
     * Els mateixos rètols quan el bolo ja està muntat i els preus són els de
     * veritat. «Pressupost orientatiu» i «total orientatiu» sobre unes xifres
     * tancades són la mateixa mentida que el «des de»: fan dubtar el client
     * d'un número que no és cap aproximació.
     */
    titleQuoted: string;
    totalLabelQuoted: string;
    vatNoteQuoted: string;
  };
  cta: { label: string };
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatOfferCount(copy: DossierCopy, count: number): string {
  const template = count === 1 ? copy.intro.offerCountOne : copy.intro.offerCountMany;
  return escHtml(template.split('{count}').join(String(count)));
}

/**
 * La fitxa d'un servei: què és, **l'explicació sencera**, quant dura i tot el
 * que hi va inclòs.
 *
 * No es retalla res. El que es va treure és la pàgina en blanc que hi havia
 * entre servei i servei: abans cada un ocupava un full sencer encara que
 * l'explicació fes quatre línies. Ara les fitxes s'encadenen i el full s'omple;
 * el document és tan curt com pot ser sense perdre ni una frase.
 *
 * El preu només hi surt quan **no** hi ha bolo muntat: llavors el catàleg és
 * l'única orientació que tenim i val més dir «des de» que no dir res. Si hi ha
 * bolo, el preu és el del pressupost i aquí no se'n parla.
 */
function buildServiceCard(
  product: AnimacioProduct,
  num: number,
  copy: DossierCopy,
  locale: string,
  showCataloguePrice: boolean,
): string {
  const explicacio = product.descripcio
    .map((paragraf) => `<p>${escHtml(paragraf)}</p>`)
    .join('');

  /* La foto del que es contracta.
     Les fitxes ja en portaven i el document no en feia servir ni una: qui rebia
     el dossier llegia la descripció d'una nit sense veure-la. Quan el producte
     no en té, la fitxa es queda com estava; no s'hi posa cap imatge de mostra. */
  const foto = product.image
    ? `<div class="fitxa-foto"><img src="${escHtml(product.image)}" alt="${escHtml(product.nom)}" loading="lazy"></div>`
    : '';

  const inclou = product.inclou
    .map((item) => `<li>${escHtml(item)}</li>`)
    .join('');

  const durada = product.durada
    ? `<span class="fitxa-dada"><span>${escHtml(copy.chapter.durationLabel)}</span> ${escHtml(product.durada)}</span>`
    : '';

  const preu = showCataloguePrice
    ? `<span class="fitxa-preu">${
        typeof product.priceFrom === 'number'
          ? `${escHtml(copy.chapter.priceFromPrefix)} ${escHtml(formatCurrency(product.priceFrom, locale))}`
          : escHtml(copy.chapter.priceCustom)
      }</span>`
    : '';

  const categoria = product.categoria
    ? `<span class="fitxa-cat">${escHtml(product.categoria)}</span>`
    : '';

  const nota = product.noInclou
    ? `<p class="fitxa-nota"><span>${escHtml(copy.chapter.noteLabel)}</span> ${escHtml(product.noInclou)}</p>`
    : '';

  /* Sense numerar.
     Això no és una seqüència: ningú contracta el DJ «primer» i la decoració
     «segona». Numerar-ho era decorar. El que sí que diu alguna cosa és de què
     va cada peça, i per això mana la categoria. */
  return `
      <article class="fitxa${foto ? ' fitxa--amb-foto' : ''}">
        ${foto}
        <div class="fitxa-cos">
          <div class="fitxa-titol-fila">
            <h3 class="fitxa-nom">${escHtml(product.nom)}</h3>
            ${categoria}
          </div>
          ${explicacio ? `<div class="fitxa-desc">${explicacio}</div>` : ''}
          ${inclou
            ? `<div class="fitxa-inclou-bloc">
            <h4>${escHtml(copy.chapter.includesTitle)}</h4>
            <ul class="fitxa-inclou">${inclou}</ul>
          </div>`
            : ''}
          ${nota}
        </div>
        <div class="fitxa-marge">
          ${durada}
          ${preu}
        </div>
      </article>`;
}

/**
 * Els serveis, en flux continu.
 *
 * No es reparteixen en fulls per endavant: cada fitxa demana no partir-se pel
 * mig i la impressora omple les pàgines. Una fitxa curta i una de llarga poden
 * compartir full; abans cadascuna en gastava un de sencer.
 */
function buildServiceFlow(
  products: AnimacioProduct[],
  copy: DossierCopy,
  locale: string,
  showCataloguePrice: boolean,
): string {
  if (products.length === 0) return '';

  const cards = products
    .map((product, index) =>
      buildServiceCard(product, index + 1, copy, locale, showCataloguePrice))
    .join('');

  /**
   * L'entrada del catàleg explica que els preus són «un punt de partida». Amb
   * el bolo muntat això és fals: els preus del final són els de veritat. Val
   * més no dir res que dir una frase que contradiu el pressupost.
   */
  const entrada = showCataloguePrice
    ? `<p class="full-entrada">${escHtml(copy.resum.lead)}</p>`
    : '';

  return `
  <section class="flux">
    <header class="full-cap">
      <span class="full-kicker">${escHtml(copy.resum.kicker)}</span>
      <h2 class="full-titol">${escHtml(copy.resum.title)}</h2>
      ${entrada}
    </header>
    <div class="fitxes">${cards}</div>
  </section>`;
}

/**
 * La pàgina del preu. L'única del document on hi ha xifres.
 *
 * Abans no es pintava si no hi havia quilòmetres de desplaçament, i això
 * deixava dossiers **sense cap preu enlloc**. Ara el desplaçament és una secció
 * de dins, no la condició per existir.
 */
function buildQuoteSheet(
  products: AnimacioProduct[],
  copy: DossierCopy,
  locale: string,
  travelKm: number,
  location: string | undefined,
  quoteLines: DossierQuoteLine[] | undefined,
  closing: string,
): string {
  const hasQuote = Boolean(quoteLines && quoteLines.length > 0);
  const money = (n: number) => escHtml(formatCurrency(n, locale));
  const fill = (tpl: string, vars: Record<string, string>) =>
    escHtml(Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), tpl));

  /**
   * Quan el bolo està muntat, les línies són el que el client pagarà. Sense
   * bolo, el catàleg és l'única orientació disponible i els serveis sense preu
   * no sumen.
   */
  const rows: DossierQuoteLine[] = hasQuote
    ? quoteLines!
    : products
        .filter((product) => typeof product.priceFrom === 'number')
        .map((product) => ({ label: product.nom, amount: product.priceFrom as number }));

  if (rows.length === 0) return '';

  const aMida = !hasQuote && products.some((product) => typeof product.priceFrom !== 'number');
  const prefix = hasQuote ? '' : `${escHtml(copy.chapter.priceFromPrefix)} `;

  let subtotal = 0;
  const serveis = rows
    .map((line) => {
      subtotal += line.amount;
      return `<li class="linia">
        <span class="linia-nom">${escHtml(line.label)}</span>
        <span class="linia-punts" aria-hidden="true"></span>
        <span class="linia-val">${money(line.amount)}</span>
      </li>`;
    })
    .join('');

  const includedOneWay = Math.round(INCLUDED_TRAVEL_KM / 2);
  const billableKm = calculateBillableTravelKm(travelKm);
  const blocks = calculateTravelBlocks(travelKm);
  const travelCharge = travelKm > 0 ? calculateTravelCharge(travelKm) : 0;
  const total = subtotal + travelCharge;

  const desplacament = travelKm > 0
    ? `<div class="grup-etiqueta">${escHtml(copy.budget.travelTitle)}</div>
    <ul class="linies">
      <li class="linia">
        <span class="linia-nom">${location ? fill(copy.budget.travelTo, { location }) : escHtml(copy.budget.travelTitle)} · ${fill(copy.budget.travelTotalKm, { km: String(travelKm) })}</span>
        <span class="linia-punts" aria-hidden="true"></span>
        <span class="linia-val linia-val--suau">${fill(copy.budget.travelIncludedKm, { km: String(INCLUDED_TRAVEL_KM) })}</span>
      </li>
      <li class="linia linia--sub">
        <span class="linia-nom">${travelCharge > 0
          ? `${fill(copy.budget.travelBillableKm, { km: String(billableKm) })} · ${fill(copy.budget.travelBlocks, { blocks: String(blocks), price: money(TRAVEL_BLOCK_EUR) })}`
          : escHtml(copy.budget.travelIncludedAll)}</span>
        <span class="linia-punts" aria-hidden="true"></span>
        <span class="linia-val">${money(travelCharge)}</span>
      </li>
    </ul>
    <p class="peu-nota">${fill(copy.budget.travelNote, { includedKm: String(includedOneWay), blockPrice: money(TRAVEL_BLOCK_EUR), blockKm: String(TRAVEL_BLOCK_KM) })}</p>`
    : '';

  return `
  <section class="full full--preu">
    <header class="full-cap">
      <span class="full-kicker">${escHtml(copy.budget.kicker)}</span>
      <h2 class="full-titol">${escHtml(hasQuote ? copy.budget.titleQuoted : copy.budget.title)}</h2>
      <p class="full-entrada">${fill(copy.budget.lead, { includedKm: String(includedOneWay) })}</p>
    </header>

    <div class="grup-etiqueta">${escHtml(copy.budget.servicesLabel)}</div>
    <ul class="linies">${serveis}</ul>

    ${desplacament}

    <div class="total">
      <span class="total-etiqueta">${escHtml(hasQuote ? copy.budget.totalLabelQuoted : copy.budget.totalLabel)}</span>
      <span class="total-xifra">${prefix}${money(total)}${aMida ? `<span class="total-mida">${escHtml(copy.resum.customSuffix)}</span>` : ''}</span>
    </div>
    <p class="peu-nota">${escHtml(hasQuote ? copy.budget.vatNoteQuoted : copy.budget.vatNote)}</p>
    ${closing}
  </section>`;
}

/**
 * Com contactar-nos. Sempre, i encara que no hi hagi cap preu.
 *
 * Vivia dins la pàgina de pressupost, i com que aquella pàgina no es pinta
 * quan no hi ha preus, hi havia dossiers que sortien **sense telèfon**. El
 * client ha de saber a qui trucar tant si veu un número com si no.
 */
function buildClosing(copy: DossierCopy, client: DossierClientInfo): string {
  return `
  <div class="tanca">
    <p class="tanca-text">${escHtml(copy.cta.label)}</p>
    <p class="tanca-contacte">${escHtml(SITE_CONFIG.business.phoneDisplay)} · ${escHtml(SITE_CONFIG.business.email)}</p>
    <p class="tanca-marca">Òrbita Events · www.${escHtml(SITE_CONFIG.web.domain)}</p>
    <p class="tanca-client">${escHtml(copy.portada.clientLabel)} ${escHtml(client.nom)}${client.empresa ? ` · ${escHtml(client.empresa)}` : ''}</p>
  </div>`;
}

export function buildDossierHtml(
  client: DossierClientInfo,
  products: AnimacioProduct[],
  copy: DossierCopy,
  options: { autoPrint?: boolean; logoDataUri?: string; locale?: string; travelKm?: number; location?: string; quoteLines?: DossierQuoteLine[] } = {},
): string {
  const locale = options.locale || 'ca-ES';
  const nom = escHtml(client.nom);
  const empresa = client.empresa ? escHtml(client.empresa) : '';
  const eventDesc = client.eventDesc ? escHtml(client.eventDesc) : '';
  const salutacio = (client.salutacio || copy.intro.greetingDefault);
  const salutacioHtml = escHtml(salutacio).replace(/\n\n/g, '</p><p>');

  /**
   * Hi ha bolo muntat? Llavors el preu del catàleg no surt enlloc: el client no
   * ha de veure «des de 150 €» al costat de les 2 hores que ha demanat.
   */
  const hasQuote = Boolean(options.quoteLines && options.quoteLines.length > 0);

  const fitxes = buildServiceFlow(products, copy, locale, !hasQuote);
  const tanca = buildClosing(copy, client);
  const preu = buildQuoteSheet(
    products,
    copy,
    locale,
    options.travelKm ?? 0,
    options.location,
    options.quoteLines,
    tanca,
  );

  return `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dossier Òrbita Events — ${nom}</title>
  <style>
    :root {
      --tinta: #211d16;
      --tinta-suau: #56503f;
      --tinta-clara: #857c68;
      --or: #a9863f;
      --or-clar: #d7b86e;
      --paper: #fbf8f1;
      --paper-fosc: #f4efe3;
      --linia: #e3dccd;
      --carbo: #14120e;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    @page { size: A4; margin: 0; }

    body {
      background: var(--paper);
      color: var(--tinta);
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 10.5pt;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Pantalla i paper no són el mateix suport ─────────────────────────
       El document es llegeix gairebé sempre a pantalla i només de tant en tant
       s'imprimeix. Fins ara manava el paper: 210 mm centrats deixaven mig
       monitor buit als costats, i l'alçada mínima d'un A4 obria un forat de
       mig full entre la carta, els serveis i el preu.

       Ara el paper mana només quan s'imprimeix. A pantalla, el document omple
       l'amplada i les parts van seguides. */
    .full {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 14mm 12mm;
      background: var(--paper);
      display: flex;
      flex-direction: column;
    }

    .flux {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 0 12mm 12mm;
      background: var(--paper);
    }

    /* A pantalla gran, el document ocupa la pantalla. Sense topall: un dossier
       obert al monitor no ha de deixar dos marges buits com si fos un full. */
    @media screen and (min-width: 900px) {
      .full, .flux { max-width: none; padding-inline: 5vw; }
    }

    /* ── Full 1 · portada i carta alhora ─────────────────────────────── */
    .full--carta { padding: 0; }

    /* La portada.
       Vaig provar de posar-hi al darrere la foto del primer servei que en
       tingués, i va sortir malament: en un dossier de Halloween hi va aparèixer
       la foto d'una festa infantil de colors. La portada d'un document que va
       al client no la pot triar el primer que passi. Fins que algú digui quina
       foto hi va, queda el carbó, que no menteix. */
    .capçal {
      background: var(--carbo);
      color: var(--paper);
      padding: 26mm 18mm 20mm;
      text-align: center;
    }
    .capçal-eyebrow {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 7.5pt;
      letter-spacing: 0.34em;
      text-transform: uppercase;
      color: var(--or-clar);
      margin-bottom: 10mm;
    }
    .capçal-logo { width: 62mm; height: auto; margin: 0 auto 9mm; display: block; }
    .capçal-marca {
      font-size: 24pt; letter-spacing: 0.04em; margin-bottom: 9mm;
    }
    .capçal-regla {
      width: 18mm; height: 1px; background: var(--or); margin: 0 auto 9mm;
    }
    .capçal-per {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 7pt; letter-spacing: 0.3em; text-transform: uppercase;
      color: rgba(251, 248, 241, 0.55);
      margin-bottom: 3mm;
    }
    .capçal-nom { font-size: 20pt; line-height: 1.2; }
    .capçal-empresa { font-size: 11pt; color: var(--or-clar); margin-top: 2mm; }
    .capçal-event {
      font-size: 10pt; font-style: italic;
      color: rgba(251, 248, 241, 0.6); margin-top: 3mm;
    }

    .carta { padding: 14mm 18mm 0; flex: 1; }
    .carta-kicker {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 7pt; letter-spacing: 0.3em; text-transform: uppercase;
      color: var(--or); margin-bottom: 4mm;
    }
    .carta-titol {
      font-size: 19pt; line-height: 1.25; max-width: 130mm; margin-bottom: 8mm;
    }
    .carta-text p { margin-bottom: 4mm; color: var(--tinta-suau); }
    .carta-text p:first-child { color: var(--tinta); }

    .fets {
      display: flex; gap: 0; margin-top: 10mm;
      border-top: 1px solid var(--linia); border-bottom: 1px solid var(--linia);
    }
    .fets > div {
      flex: 1; padding: 5mm 4mm;
      border-right: 1px solid var(--linia);
    }
    .fets > div:last-child { border-right: 0; }
    .fets span {
      display: block;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 6.5pt; letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--tinta-clara); margin-bottom: 2mm;
    }
    .fets strong { font-size: 10.5pt; font-weight: normal; }

    .carta-peu {
      padding: 8mm 18mm 12mm;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 7pt; letter-spacing: 0.24em; text-transform: uppercase;
      color: var(--tinta-clara);
    }

    /* ── Fulls de fitxes ──────────────────────────────────────────────── */
    .full-cap { margin-bottom: 9mm; }
    .full-cap--continua { margin-bottom: 6mm; }
    .full-kicker {
      display: block;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 7pt; letter-spacing: 0.3em; text-transform: uppercase;
      color: var(--or); margin-bottom: 3mm;
    }
    .full-titol { font-size: 17pt; line-height: 1.25; margin-bottom: 3mm; }
    .full-entrada { color: var(--tinta-suau); max-width: 140mm; }

    .fitxes { display: flex; flex-direction: column; gap: 6mm; }

    .fitxa {
      display: flex; gap: 6mm;
      padding: 6mm;
      background: var(--paper-fosc);
      border-left: 2px solid var(--or);
      page-break-inside: avoid; break-inside: avoid;
    }

    /* La foto del servei.
       Quan n'hi ha, mana ella: ocupa un terç de la fitxa i el text s'hi posa al
       costat. Una foto d'un bolo real explica en un segon el que un paràgraf
       no acaba d'explicar mai. */
    .fitxa--amb-foto { padding: 0; gap: 0; align-items: stretch; }
    .fitxa-foto {
      flex: 0 0 40%;
      align-self: stretch;
      overflow: hidden;
      background: var(--carbo);
    }
    /* La foto acompanya l'alçada del text, ni més ni menys. Amb un terra massa
       alt, una fitxa de tres línies s'inflava; amb un sostre, la foto deixava
       una franja negra a sota. Ni l'un ni l'altre: que segueixi el text. */
    .fitxa-foto img {
      display: block;
      width: 100%; height: 100%;
      min-height: 40mm;
      object-fit: cover;
    }
    .fitxa--amb-foto .fitxa-cos { padding: 8mm; }
    .fitxa--amb-foto .fitxa-marge { padding: 8mm 8mm 8mm 0; }

    /* La foto canvia de banda a cada fitxa. Set targetes idèntiques una sota
       l'altra es llegeixen com un formulari; alternades, es llegeixen com una
       proposta. */
    .fitxa--amb-foto:nth-of-type(even) { flex-direction: row-reverse; }
    .fitxa--amb-foto:nth-of-type(even) .fitxa-marge { padding: 8mm 0 8mm 8mm; }

    /* A mòbil no hi caben dues columnes: la foto passa a dalt. */
    @media screen and (max-width: 700px) {
      .fitxa--amb-foto,
      .fitxa--amb-foto:nth-of-type(even) { flex-direction: column; }
      .fitxa-foto { flex-basis: auto; }
      .fitxa-foto img { min-height: 40mm; max-height: 55mm; }
      .fitxa--amb-foto .fitxa-marge,
      .fitxa--amb-foto:nth-of-type(even) .fitxa-marge { padding: 0 8mm 8mm; }
    }

    .fitxa-cos { flex: 1; min-width: 0; }
    .fitxa-titol-fila {
      display: flex; align-items: baseline; gap: 4mm; margin-bottom: 2mm;
    }
    .fitxa-nom { font-size: 13pt; font-weight: normal; line-height: 1.2; }
    .fitxa-cat {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 6.5pt; letter-spacing: 0.16em; text-transform: uppercase;
      color: var(--tinta-clara); white-space: nowrap;
    }
    .fitxa-desc { color: var(--tinta-suau); }
    .fitxa-desc p { margin-bottom: 2.5mm; }
    .fitxa-inclou-bloc { margin-top: 3mm; }
    .fitxa-inclou-bloc h4 {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 6.5pt; font-weight: 700; letter-spacing: 0.2em;
      text-transform: uppercase; color: var(--tinta-clara); margin-bottom: 2mm;
    }
    .fitxa-inclou { list-style: none; display: flex; flex-wrap: wrap; gap: 1.5mm 5mm; }
    /* Dues columnes per als punts curts, i fila sencera per als llargs.
       Una llista d'onze personatges encaixonada a mitja columna es llegia com
       una escala; així ocupa el que necessita i prou. */
    .fitxa-inclou li {
      font-size: 9pt; color: var(--tinta-suau);
      padding-left: 4mm; position: relative;
      flex: 1 1 calc(50% - 5mm);
      min-width: 55mm;
    }
    .fitxa-inclou li::before {
      content: '·'; position: absolute; left: 1mm; color: var(--or);
    }
    .fitxa-nota { font-size: 8.5pt; color: var(--tinta-clara); margin-top: 3mm; }
    .fitxa-nota span {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 6.5pt; letter-spacing: 0.16em; text-transform: uppercase;
    }
    .fitxa-marge {
      min-width: 30mm; text-align: right;
      display: flex; flex-direction: column; gap: 2mm;
    }
    .fitxa-dada {
      font-family: Helvetica, Arial, sans-serif; font-size: 8.5pt;
      color: var(--tinta-suau);
    }
    .fitxa-dada span {
      display: block; font-size: 6.5pt; letter-spacing: 0.16em;
      text-transform: uppercase; color: var(--tinta-clara);
    }
    .fitxa-preu { font-size: 11pt; color: var(--or); }

    /* ── Full de preu ─────────────────────────────────────────────────── */
    .grup-etiqueta {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 6.5pt; letter-spacing: 0.24em; text-transform: uppercase;
      color: var(--tinta-clara);
      margin: 8mm 0 3mm;
    }
    .linies { list-style: none; }
    .linia {
      display: flex; align-items: baseline; gap: 3mm;
      padding: 2.5mm 0; border-bottom: 1px solid var(--linia);
      page-break-inside: avoid; break-inside: avoid;
    }
    .linia--sub .linia-nom { color: var(--tinta-clara); font-size: 9.5pt; }
    .linia-nom { flex: 0 1 auto; }
    .linia-punts { flex: 1 1 auto; border-bottom: 1px dotted var(--linia); }
    .linia-val { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .linia-val--suau { color: var(--tinta-clara); font-size: 9.5pt; }

    .total {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-top: 8mm; padding: 6mm;
      background: var(--carbo); color: var(--paper);
    }
    .total-etiqueta {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 7pt; letter-spacing: 0.24em; text-transform: uppercase;
      color: var(--or-clar);
    }
    .total-xifra { font-size: 18pt; font-variant-numeric: tabular-nums; }
    .total-mida { font-size: 9pt; color: var(--or-clar); margin-left: 3mm; }

    .peu-nota { font-size: 8.5pt; color: var(--tinta-clara); margin-top: 3mm; }

    .tancament {
      width: 210mm; margin: 0 auto; padding: 0 18mm 18mm;
      background: var(--paper);
    }
    .tanca {
      padding-top: 10mm;
      border-top: 1px solid var(--linia); text-align: center;
      page-break-inside: avoid; break-inside: avoid;
    }
    .tanca-text { font-size: 12pt; margin-bottom: 3mm; }
    .tanca-contacte { font-size: 11pt; color: var(--or); margin-bottom: 4mm; }
    .tanca-marca, .tanca-client {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--tinta-clara);
    }
    .tanca-client { margin-top: 2mm; }

    @media print {
      .capçal, .total {
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .fitxa { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

      /* Aquí sí que mana l'A4: amplada exacta, full propi per a la carta i per
         al preu, i cap fitxa partida per la meitat. */
      .full, .flux { width: 210mm; max-width: none; margin: 0 auto; }
      .full { min-height: 297mm; padding: 20mm 18mm 16mm; }
      .flux { padding: 20mm 18mm 12mm; }
      .full--carta { padding: 0; page-break-after: always; break-after: page; }
      .full--preu { page-break-before: always; break-before: page; }
      .fitxa-foto { page-break-inside: avoid; break-inside: avoid; }
    }
  </style>
  ${options.autoPrint ? '<script>window.addEventListener("load", function(){ window.print(); });</script>' : ''}
</head>
<body>

<section class="full full--carta">
  <div class="capçal">
    <div class="capçal-eyebrow">${escHtml(copy.portada.eyebrow)}</div>
    ${options.logoDataUri
      ? `<img class="capçal-logo" src="${options.logoDataUri}" alt="Òrbita Events" />`
      : '<div class="capçal-marca">Òrbita Events</div>'}
    <div class="capçal-regla"></div>
    <div class="capçal-per">${escHtml(copy.portada.clientLabel)}</div>
    <div class="capçal-nom">${nom}</div>
    ${empresa ? `<div class="capçal-empresa">${empresa}</div>` : ''}
    ${eventDesc ? `<div class="capçal-event">${eventDesc}</div>` : ''}
  </div>

  <div class="carta">
    <div class="carta-kicker">${escHtml(copy.intro.kicker)}</div>
    <h1 class="carta-titol">${escHtml(copy.intro.title)}</h1>
    <div class="carta-text">
      <p>Hola ${nom},</p>
      <p>${salutacioHtml}</p>
    </div>
    <div class="fets">
      <div><span>${escHtml(copy.intro.summaryOfferLabel)}</span><strong>${formatOfferCount(copy, products.length)}</strong></div>
      <div><span>${escHtml(copy.intro.summaryFormatLabel)}</span><strong>${escHtml(copy.intro.summaryFormatValue)}</strong></div>
      <div><span>${escHtml(copy.intro.summaryGoalLabel)}</span><strong>${escHtml(copy.intro.summaryGoalValue)}</strong></div>
    </div>
  </div>

  <div class="carta-peu">${escHtml(copy.portada.bottom)}</div>
</section>

${fitxes}

${preu}

${preu ? "" : `<div class="tancament">${tanca}</div>`}

</body>
</html>`;
}

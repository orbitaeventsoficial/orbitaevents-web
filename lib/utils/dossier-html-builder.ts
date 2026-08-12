import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { masqueradeCharacter, isCharacterProduct, fotoPropiaDe, teFotoPropia, type MasqueradeCharacter } from '@/lib/constants/masquerade-characters';
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
 * La decoració del dossier. El contingut no canvia: els mateixos productes,
 * els mateixos preus i el mateix ordre. Només canvia la roba del document.
 *
 * Els colors del Halloween són els que el propietari ja va decidir al dossier
 * del web nou (`orbitaevents-cat`, CommercialDossierDocument): paper negre,
 * taronja de carabassa i lletra crema. No se n'ha inventat cap.
 */
export type DossierTema = 'general' | 'halloween';

function paleta(tema: DossierTema): string {
  if (tema === 'halloween') {
    return [
      '      --tinta: #f7eee2;',
      '      --tinta-suau: #cbbdae;',
      '      --tinta-clara: #9b8b7d;',
      '      --or: #f47a36;',
      '      --or-clar: #ffa168;',
      '      --paper: #100d13;',
      '      --paper-fosc: #1a141e;',
      '      --linia: #3a2b33;',
      '      --carbo: #140f16;',
      // Lletra sobre fons fosc (portada). Al tema clar el paper ja fa aquest
      // paper; al fosc, el paper també és fosc i el text hi desapareixeria.
      '      --sobre-fosc: #f7eee2;',
      // El bloc del total és el que crida: a Halloween, carabassa amb lletra fosca.
      '      --total-fons: #f47a36;',
      '      --total-lletra: #140f16;',
      // Sobre la carabassa, l'or no es llegeix: l'etiqueta va amb la mateixa
      // tinta fosca del total, una mica apagada.
      '      --total-etiqueta: rgba(20, 15, 22, 0.68);',
    ].join('\n');
  }
  return [
    '      --tinta: #211d16;',
    '      --tinta-suau: #56503f;',
    '      --tinta-clara: #857c68;',
    '      --or: #a9863f;',
    '      --or-clar: #d7b86e;',
    '      --paper: #fbf8f1;',
    '      --paper-fosc: #f4efe3;',
    '      --linia: #e3dccd;',
    '      --carbo: #14120e;',
    '      --sobre-fosc: #fbf8f1;',
    '      --total-fons: #14120e;',
    '      --total-lletra: #fbf8f1;',
    '      --total-etiqueta: #d7b86e;',
  ].join('\n');
}

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
  /** El mostrari de personatges: només surt si el bolo en porta. */
  characters?: { title: string; lead: string };
};


/**
 * Una teranyina de cantonada, dibuixada aquí mateix.
 *
 * No és una imatge: és un dibuix vectorial dins del document. Així el PDF i el
 * correu la porten sempre, sense anar a buscar cap fitxer, i s'imprimeix neta a
 * qualsevol mida. Només surt al tema de Halloween.
 */
function teranyina(classe: string): string {
  return `<svg class="teranyina ${classe}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round">
      <path d="M0 0 L120 0 M0 0 L0 120 M0 0 L110 110 M0 0 L60 118 M0 0 L118 60 M0 0 L30 120 M0 0 L120 30"/>
      <path d="M22 0 Q13 13 0 22 M46 0 Q27 27 0 46 M72 0 Q42 42 0 72 M100 0 Q58 58 0 100"/>
    </g>
  </svg>`;
}


/**
 * El poble, tret del resum de l'esdeveniment.
 *
 * El resum és text lliure —«2026-09-05 · 00:00-00:03 · Viladecans · 80 pax»— i
 * al pressupost sortia sencer darrere d'un «Fins a», que es llegia com una
 * broma. Aquí es treuen les parts que no són un lloc: dates, hores i persones.
 * Si no en queda res reconeixible, no es diu cap destí abans que dir-ne un de
 * fals.
 */
function pobleDe(resum?: string): string | undefined {
  if (!resum) return undefined;
  const parts = resum.split('·').map((t) => t.trim()).filter(Boolean);
  const nomes = parts.filter((t) => !/^\d{4}-\d{2}-\d{2}$/.test(t)
    && !/^\d{1,2}[:.]\d{2}/.test(t)
    && !/\d+\s*(pax|persones|personas|guests)/i.test(t)
    && !/^\d+$/.test(t));
  const poble = nomes[nomes.length - 1];
  return poble && poble.length > 1 ? poble : undefined;
}

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
/**
 * El preu pactat d'aquest servei, si el bolo el porta.
 *
 * Les línies del pressupost surten dels mateixos productes, però amb el nom
 * escrit a mà i, de vegades, amb el proveïdor enganxat o les hores al darrere
 * («DJ · 3 hores»). Per això es comparen normalitzats i n'hi ha prou que un
 * contingui l'altre. Si no es reconeix, no s'inventa cap preu: la fitxa es
 * queda sense i el pressupost del final continua dient la veritat.
 */
function preuDeLaLinia(product: AnimacioProduct, quoteLines?: DossierQuoteLine[]): number | undefined {
  if (!quoteLines || quoteLines.length === 0) return undefined;
  const net = (text: string) => text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const nom = net(product.nom);
  if (!nom) return undefined;
  const linia = quoteLines.find((l) => {
    const etiqueta = net(l.label);
    return etiqueta === nom || etiqueta.startsWith(nom) || etiqueta.includes(nom) || nom.includes(etiqueta);
  });
  return linia?.amount;
}

function buildServiceCard(
  product: AnimacioProduct,
  num: number,
  copy: DossierCopy,
  locale: string,
  showCataloguePrice: boolean,
  preuAcordat?: number,
  personatgesTriats?: readonly MasqueradeCharacter[],
): string {
  const explicacio = product.descripcio
    .map((paragraf) => `<p>${escHtml(paragraf)}</p>`)
    .join('');

  /* La foto del que es contracta.
     Les fitxes ja en portaven i el document no en feia servir ni una: qui rebia
     el dossier llegia la descripció d'una nit sense veure-la. Quan el producte
     no en té, la fitxa es queda com estava; no s'hi posa cap imatge de mostra. */
  const imatge = product.image || fotoPropiaDe(product.nom);
  const granPresidint = teFotoPropia(product.nom);
  const foto = imatge
    ? `<div class="fitxa-foto"><img src="${escHtml(imatge)}" alt="${escHtml(product.nom)}" loading="lazy"></div>`
    : '';

  const inclou = product.inclou
    .map((item) => `<li>${escHtml(item)}</li>`)
    .join('');

  /* Els personatges triats per a aquest bolo.
     Quan el servei va amb personatge, el client ha de veure quins li van: un
     nom sol no diu res i una foto genèrica no és la seva festa. */
  const personatges = (personatgesTriats ?? []).length > 0
    ? `${copy.characters ? `<div class="fitxa-tria"><h4>${escHtml(copy.characters.title)}</h4><p>${escHtml(copy.characters.lead)}</p></div>` : ''}
      <div class="fitxa-personatges">${(personatgesTriats ?? [])
        .map((p) => `<figure class="personatge">
            <img src="${escHtml(p.foto)}" alt="${escHtml(p.nom)}" loading="lazy">
            <figcaption>${escHtml(p.nom)}</figcaption>
          </figure>`)
        .join('')}</div>`
    : '';

  const durada = product.durada
    ? `<span class="fitxa-dada"><span>${escHtml(copy.chapter.durationLabel)}</span> ${escHtml(product.durada)}</span>`
    : '';

  /* El preu de cada peça.
     Amb bolo muntat, el preu que surt a la fitxa és el pactat per aquell
     servei —el mateix que després es repeteix al pressupost—, no el «des de»
     del catàleg. Sense bolo, el catàleg és l'única orientació que tenim. */
  const preu = typeof preuAcordat === 'number'
    ? `<span class="fitxa-preu">${escHtml(formatCurrency(preuAcordat, locale))}</span>`
    : showCataloguePrice
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
      <article class="fitxa${foto ? ' fitxa--amb-foto' : ''}${granPresidint ? ' fitxa--presidida' : ''}">
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
          ${personatges}
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
  quoteLines?: DossierQuoteLine[],
  personatges?: readonly string[],
): string {
  if (products.length === 0) return '';

  const triats = (personatges ?? []).map(masqueradeCharacter).filter((c): c is MasqueradeCharacter => Boolean(c));
  const cards = products
    .map((product, index) =>
      buildServiceCard(product, index + 1, copy, locale, showCataloguePrice, preuDeLaLinia(product, quoteLines), isCharacterProduct(product.nom) ? triats : undefined))
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
  options: { autoPrint?: boolean; logoDataUri?: string; coverImage?: string; locale?: string; travelKm?: number; location?: string; quoteLines?: DossierQuoteLine[]; tema?: DossierTema; personatges?: readonly string[] } = {},
): string {
  const locale = options.locale || 'ca-ES';
  const tema: DossierTema = options.tema === 'halloween' ? 'halloween' : 'general';
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

  const fitxes = buildServiceFlow(products, copy, locale, !hasQuote, options.quoteLines, options.personatges);
  const tanca = buildClosing(copy, client);
  const preu = buildQuoteSheet(
    products,
    copy,
    locale,
    options.travelKm ?? 0,
    pobleDe(options.location),
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
${paleta(tema)}
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
      position: relative;
      background: var(--carbo);
      color: var(--sobre-fosc);
      padding: 26mm 18mm 20mm;
      text-align: center;
    }

    /* Amb foto de portada. El vel fosc no és decoració: sense ell, el nom del
       client competeix amb la fotografia i no es llegeix cap dels dos. */
    .capçal--foto { background-size: cover; background-position: center; }
    .capçal--foto::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(10,9,7,0.78) 0%, rgba(10,9,7,0.66) 45%, rgba(10,9,7,0.90) 100%);
    }
    .capçal--foto > * { position: relative; z-index: 1; }
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

    /* La portada, a pantalla, creix amb la pantalla.
       En paper la mida és la que és, però en un monitor de 1400 px una portada
       amb el nom a 20 punts es queda petita al mig de tot aquell negre: el nom
       del client és el que ha de manar quan s'obre el document. */
    @media screen and (min-width: 900px) {
      .capçal { padding: 6vw 5vw 5vw; }
      .capçal-logo { width: min(30vw, 120mm); margin-bottom: 4vw; }
      .capçal-nom { font-size: clamp(20pt, 4.4vw, 46pt); letter-spacing: -0.015em; }
      .capçal-event { font-size: clamp(10pt, 1.25vw, 15pt); margin-top: 5mm; }
      .capçal-empresa { font-size: clamp(11pt, 1.5vw, 18pt); }
      .capçal-eyebrow { font-size: clamp(7.5pt, 0.85vw, 11pt); }
      .capçal-per { font-size: clamp(7pt, 0.8vw, 10pt); }
      .capçal-regla { width: 26mm; margin-bottom: 4vw; }
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
      display: flex; gap: 5mm;
      padding: 5mm;
      background: var(--paper-fosc);
      border-left: 2px solid var(--or);
      page-break-inside: avoid; break-inside: avoid;
    }

    /* La foto del servei.
       Quan n'hi ha, mana ella: ocupa un terç de la fitxa i el text s'hi posa al
       costat. Una foto d'un bolo real explica en un segon el que un paràgraf
       no acaba d'explicar mai. */
    .fitxa--amb-foto { padding: 0; gap: 0; align-items: stretch; }
    /* Proporció fixa.
       Les fotos venen del mòbil i n'hi ha de verticals. Sense proporció, una
       de vertical estirava la fitxa fins a mig full amb tres línies de text al
       costat. Amb la proporció fixada, la fitxa fa el mateix tant si la foto és
       dreta com ajaguda, i el retall el fa la foto, no la pàgina. */
    .fitxa-foto {
      /* La foto acompanya l'alçada del text, no al revés: una fitxa de tres
         línies no ha de fer mig full perquè la imatge demani lloc. */
      flex: 0 0 24%;
      align-self: stretch;
      min-height: 28mm;
      overflow: hidden;
      background: var(--paper-fosc);
    }
    /* La foto sencera, sense retallar.
       Omplint la caixa, la imatge s'estirava i el que sobrava es tallava: als
       personatges, el que sobrava era la cara. Ara la foto es veu entera dins
       la caixa i el que sobra és fons del mateix color de la fitxa. */
    .fitxa-foto img {
      display: block;
      width: 100%; height: 100%;
      object-fit: contain;
    }
    /* Els personatges que van a aquest bolo: foto petita i nom a sota. */
    .fitxa-personatges {
      display: flex; flex-wrap: wrap; gap: 3mm;
      margin-top: 4mm;
    }
    /* Prou grans per veure'ls la cara: són l'únic que el client ha de triar. */
    .personatge { width: 40mm; }
    /* Cada foto conserva la seva forma: n'hi ha de dretes i d'ajagudes. Amb
       una caixa de mida fixa, o es tallaven o quedaven perdudes al mig d'una
       franja buida. Amb l'amplada manada i l'alçada lliure, es veuen senceres
       i tan grans com poden. */
    .personatge img {
      display: block; width: 100%; height: auto;
      background: var(--paper);
    }
    .personatge figcaption {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 7pt; color: var(--tinta-suau);
      margin-top: 1.5mm; text-align: center;
    }

    .fitxa--amb-foto .fitxa-cos { padding: 6mm; }
    .fitxa--amb-foto .fitxa-marge { padding: 6mm 6mm 6mm 0; }

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
      .fitxa-foto { aspect-ratio: auto; }
      .fitxa-foto img { min-height: 32mm; max-height: 44mm; }
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
    /* El preu no s'amaga: és el que el client busca amb els ulls. */
    .fitxa-preu { font-size: 15pt; font-weight: 700; color: var(--or); letter-spacing: -0.01em; }

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
    .linia-val { font-variant-numeric: tabular-nums; white-space: nowrap; font-size: 12pt; font-weight: 700; }
    .linia-val--suau { color: var(--tinta-clara); font-size: 9.5pt; }

    .total {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-top: 8mm; padding: 6mm;
      background: var(--total-fons); color: var(--total-lletra);
    }
    .total-etiqueta {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 7pt; letter-spacing: 0.24em; text-transform: uppercase;
      color: var(--total-etiqueta);
    }
    .total-xifra { font-size: 24pt; font-weight: 700; font-variant-numeric: tabular-nums; }
    .total-mida { font-size: 9pt; color: var(--total-etiqueta); margin-left: 3mm; }

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


    /* ── Halloween ────────────────────────────────────────────────────────
       La decoració no és un caprici: aquest dossier el rep algú que ja ha
       decidit que vol una festa de por. Les teranyines són dibuix vectorial,
       s'imprimeixen i no demanen cap fitxer. Al tema general no n'hi ha cap. */
    .tema-halloween .full--carta { position: relative; }
    .teranyina { position: absolute; top: 0; z-index: 2; width: 46mm; height: 46mm; color: var(--or); opacity: .32; pointer-events: none; }
    .teranyina--esq { left: 0; }
    .teranyina--dre { right: 0; transform: scaleX(-1); }
    .tema-halloween .capçal { position: relative; overflow: hidden; }
    .tema-halloween .fitxa { position: relative; overflow: hidden; }
    .tema-halloween .fitxa::after {
      content: ''; position: absolute; right: -12mm; bottom: -14mm;
      width: 34mm; height: 34mm; border-radius: 50%;
      background: radial-gradient(circle, rgba(244,122,54,.16), transparent 70%);
      pointer-events: none;
    }
    .tema-halloween .full--preu { position: relative; }
    /* La boira de sota del pressupost: el mateix efecte de fum baix que fem al bolo. */
    .tema-halloween .full--preu::before {
      content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 40mm;
      background: linear-gradient(to top, rgba(244,122,54,.10), transparent);
      pointer-events: none;
    }

    /* L'espectacle amb imatge pròpia: la seva foto presideix la fitxa, a dalt
       i a tot l'ample. Una miniatura al costat del text no ven un espectacle. */
    .fitxa--presidida, .fitxa--presidida:nth-of-type(even) { flex-direction: column; padding: 0; }
    .fitxa--presidida .fitxa-foto {
      flex: none; width: 100%; align-self: stretch;
      min-height: 0; max-height: 105mm; background: var(--carbo);
    }
    .fitxa--presidida .fitxa-foto img { width: 100%; height: auto; max-height: 105mm; object-fit: contain; }
    .fitxa--presidida .fitxa-cos { padding: 6mm; }
    .fitxa--presidida .fitxa-marge { padding: 0 6mm 6mm; text-align: left; flex-direction: row; gap: 8mm; }

    /* El mostrari de personatges: el client tria cara, no nom. */
    .fitxa-tria { margin-top: 5mm; }
    .fitxa-tria h4 {
      font-family: Helvetica, Arial, sans-serif; font-size: 8pt;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--or);
    }
    .fitxa-tria p { font-size: 9.5pt; color: var(--tinta-suau); margin-top: 1mm; }

    @media print {
      .capçal, .total {
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .fitxa { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .teranyina, .tema-halloween .fitxa::after, .tema-halloween .full--preu::before {
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }

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
<body class="${tema === 'halloween' ? 'tema-halloween' : ''}">

<section class="full full--carta">
  ${tema === 'halloween' ? teranyina('teranyina--esq') + teranyina('teranyina--dre') : ''}
  <div class="capçal${options.coverImage ? ' capçal--foto' : ''}"${options.coverImage ? ` style="background-image:url('${escHtml(options.coverImage)}')"` : ''}>
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

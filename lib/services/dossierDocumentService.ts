import 'server-only';
import { getManagedImageOverride } from '@/lib/services/imageManagerService';
import { IMAGE_MANAGER_PLACEMENTS } from '@/app/admin/image-manager/image-manager-config';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EL DOSSIER DEL CLIENT · AUTORITAT ÚNICA
 *
 * Hi havia dos documents amb el mateix nom i dues implementacions separades:
 * un HTML fet a `dossier-html-builder.ts` i un PDF dibuixat a mà amb jsPDF a
 * `dossierCompositePdfService.ts`. Eren dos dibuixos del mateix quadre, i per
 * construcció no podien coincidir mai. A sobre, l'enviament per correu cridava
 * el constructor d'HTML **sense logo i sense les línies de preu**, o sigui que
 * el client rebia una versió pelada del que s'havia aprovat a la pantalla.
 *
 * Ordre del propietari (2026-08-10): «el que previsualitzo és el que es grava»,
 * «que s'enviï com a PDF adjunt idèntic» i «que el previsualitzador sigui d'una
 * cosa real creada».
 *
 * Per això aquí només hi ha una funció que fabrica el document, i surt sempre
 * del dossier **desat**: mateixes dades, mateixes opcions, mateix idioma.
 * Previsualitzar, baixar i enviar en són tres consumidors; no n'hi ha cap més.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { prisma } from '@/lib/prisma';
import { toIntlLocale } from '@/lib/constants';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { getDossierCopy, getOrbitaDossierProducts } from '@/lib/constants/dossier-copy';
import {
  collaboratorProductToAnimacioProduct,
  getDossierCollaboratorProductsByIds,
} from '@/lib/services/collaboratorProductService';
import {
  buildDossierHtml,
  type DossierClientInfo,
  type DossierQuoteLine,
} from '@/lib/utils/dossier-html-builder';
import { readLogoDataUri } from '@/lib/utils/dossier-logo';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { DOSSIER_LOCALES, type DossierLocale } from '@/lib/constants/dossier-locales';

/**
 * La foto del bolo desada amb el dossier.
 *
 * Viu a la columna `lineSnapshot`, que fins avui estava declarada al model i no
 * l'escrivia ni la llegia ningú. Sense això el servidor no podia refer el
 * document que s'havia vist a la pantalla: li faltaven els preus i els
 * quilòmetres.
 */
export type DossierLineSnapshot = {
  travelKm?: number;
  lines?: DossierQuoteLine[];
};

export function parseLineSnapshot(value: unknown): DossierLineSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const km = Number(raw.travelKm);
  const lines = Array.isArray(raw.lines)
    ? raw.lines
        .filter((line): line is Record<string, unknown> =>
          Boolean(line) && typeof line === 'object' && !Array.isArray(line))
        .map((line) => ({ label: String(line.label ?? ''), amount: Number(line.amount) }))
        .filter((line) => line.label !== '' && Number.isFinite(line.amount))
    : undefined;
  return {
    travelKm: Number.isFinite(km) && km > 0 ? km : undefined,
    lines: lines && lines.length > 0 ? lines : undefined,
  };
}

/**
 * El client no ha de saber de qui subcontractem.
 *
 * Les línies del bolo es guarden amb el nom del proveïdor enganxat —«Bingo
 * Musical (Masquerade Events)»— perquè a dins serveix per saber qui ho porta i
 * quant costa. Al document que surt de casa, aquell nom sobra: el client
 * contracta Òrbita.
 *
 * Només es retallen els noms de proveïdor **coneguts**. Res de treure tot el
 * que hi ha entre parèntesis o després d'un punt volat: «DJ · 2 hores» ha de
 * quedar intacte.
 */
export function netejaEtiquetaComercial(label: string, proveidors: readonly string[]): string {
  let net = label;
  for (const proveidor of proveidors) {
    const nom = proveidor.trim();
    if (!nom) continue;
    const escapat = nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    net = net
      .replace(new RegExp(`\\s*\\(\\s*${escapat}\\s*\\)`, 'gi'), '')
      .replace(new RegExp(`\\s*[·–—-]\\s*${escapat}\\b`, 'gi'), '');
  }
  return net.replace(/\s{2,}/g, ' ').trim();
}

function dossierLocaleOf(value?: string | null): DossierLocale {
  const candidate = (value || '').toLowerCase().slice(0, 2) as DossierLocale;
  return DOSSIER_LOCALES.includes(candidate) ? candidate : 'es';
}

export type DossierDocument = {
  html: string;
  filename: string;
  locale: DossierLocale;
  nom: string;
  email: string | null;
  productNames: string[];
};

/**
 * El document d'un dossier desat. Una sola porta.
 *
 * `autoPrint` només serveix per a la finestra de previsualització del navegador
 * quan la persona vol imprimir-lo a mà; no canvia ni una lletra del contingut.
 */
export async function buildDossierDocument(
  id: string,
  options: { autoPrint?: boolean } = {},
): Promise<DossierDocument | null> {
  const dossier = await prisma.dossier.findUnique({
    where: { id },
    include: { lead: { select: { preferredLocale: true } } },
  });
  if (!dossier) return null;

  // Mana la llengua amb què es va fer el document. El lead pot canviar de
  // llengua després, i un dossier ja enviat no es pot reescriure sol en una
  // altra. Els dossiers anteriors a aquesta columna cauen a la del lead.
  const locale = dossierLocaleOf(dossier.locale ?? dossier.lead?.preferredLocale);
  const [allProducts, orbitaProducts, copy] = await Promise.all([
    getAnimacioProducts(locale),
    getOrbitaDossierProducts(locale),
    getDossierCopy(locale),
  ]);
  const collaboratorProducts = await getDossierCollaboratorProductsByIds(dossier.productIds);
  const products = [
    ...orbitaProducts.filter((product) => dossier.productIds.includes(product.id)),
    ...allProducts.filter((product) => dossier.productIds.includes(product.id)),
    ...collaboratorProducts.map(collaboratorProductToAnimacioProduct),
  ];

  const client: DossierClientInfo = {
    nom: dossier.nom,
    empresa: dossier.empresa ?? undefined,
    telefon: dossier.telefon ?? undefined,
    email: dossier.email ?? undefined,
    eventDesc: dossier.eventDesc ?? undefined,
    salutacio: dossier.salutacio ?? undefined,
  };

  const snapshot = parseLineSnapshot(dossier.lineSnapshot);

  /** Els noms que no han de sortir al document: qui ens ho subcontracta. */
  const proveidors = Array.from(new Set(
    products
      .map((product) => product.sourceProviderName)
      .filter((nom): nom is string => Boolean(nom) && nom !== 'Òrbita Events'),
  ));
  const linies = snapshot.lines?.map((line) => ({
    ...line,
    label: netejaEtiquetaComercial(line.label, proveidors),
  }));

  // La portada la tria el propietari des del gestor d'imatges. Si la casella és
  // buida, la portada queda negra: cap foto és millor que la foto equivocada.
  const portada = await getManagedImageOverride('dossier.portada');
  const portadaDeclarada = IMAGE_MANAGER_PLACEMENTS
    .find((p) => p.key === 'dossier.portada')?.fallback;

  const html = buildDossierHtml(client, products, copy, {
    autoPrint: options.autoPrint,
    logoDataUri: readLogoDataUri(),
    coverImage: portada?.src || portadaDeclarada || undefined,
    locale: toIntlLocale(locale),
    quoteLines: linies,
    travelKm: snapshot.travelKm,
    location: dossier.eventDesc ?? undefined,
  });

  const slug = dossier.nom
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'dossier';

  return {
    html,
    filename: `dossier-orbita-${slug}.pdf`,
    locale,
    nom: dossier.nom,
    email: dossier.email,
    productNames: products.map((product) => product.nom),
  };
}

/**
 * El mateix document amb dades donades, per al catàleg de Studio.
 *
 * Studio no previsualitza cap dossier real: ensenya com queda el document amb
 * tot el catàleg i un client de mostra. Ha de passar pel mateix constructor que
 * la resta, o tornaríem a tenir dues versions del mateix paper.
 */
export async function buildDossierHtmlFor(input: {
  client: DossierClientInfo;
  products: AnimacioProduct[];
  locale?: DossierLocale;
}): Promise<string> {
  const locale = input.locale ?? 'ca';
  const copy = await getDossierCopy(locale);
  return buildDossierHtml(input.client, input.products, copy, {
    logoDataUri: readLogoDataUri(),
    locale: toIntlLocale(locale),
  });
}

/**
 * El document a imprimir, dient-li d'on penja el web.
 *
 * Les fotos del dossier van amb camí relatiu (`/img/…`). El navegador que fa el
 * PDF rep l'HTML solt, sense pàgina de la qual penjar, i sense això no sap on
 * anar-les a buscar: el PDF sortia sense fotos mentre la previsualització les
 * ensenyava. Amb el `<base>`, els dos miren el mateix lloc.
 */
function ambBaseHref(html: string, baseUrl?: string): string {
  if (!baseUrl) return html;
  if (/<base\s/i.test(html)) return html;
  return html.replace(/<head(\s[^>]*)?>/i, (etiqueta) => `${etiqueta}<base href="${baseUrl.replace(/"/g, '&quot;')}">`);
}

/**
 * L'HTML imprès a PDF, no redibuixat.
 *
 * És l'única manera que el PDF sigui idèntic a la previsualització: el mateix
 * document, passat pel motor d'impressió d'un navegador. Redibuixar-lo amb una
 * llibreria de PDF ens tornaria a deixar dos dibuixos que divergeixen.
 *
 * Si el navegador no hi és, això **falla i es veu**. Enviar un document
 * diferent del que s'ha aprovat seria pitjor que no enviar-ne cap.
 */
export async function renderDossierPdf(html: string, baseUrl?: string): Promise<Buffer> {
  const { chromium } = await import('playwright-core');

  /**
   * El navegador és el del sistema, no un de descarregat.
   *
   * A producció el posa Nix i arriba per `CHROMIUM_PATH` (vegeu
   * `railway.toml`). En local, si ningú l'ha declarat, s'agafa el Chrome que ja
   * hi ha instal·lat. Així el desplegament no engreixa 150 MB per fer un PDF.
   */
  const executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(
    executablePath
      ? { executablePath, args: ['--no-sandbox'] }
      : { channel: 'chrome', args: ['--no-sandbox'] },
  );
  try {
    const page = await browser.newPage();
    await page.setContent(ambBaseHref(html, baseUrl), { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

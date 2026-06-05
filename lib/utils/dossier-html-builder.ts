import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { SITE_CONFIG } from '@/app/config/site-config';

export type DossierClientInfo = {
  nom: string;
  telefon?: string;
  email?: string;
  empresa?: string;
  eventDesc?: string;
  salutacio?: string;
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatOfferCount(count: number): string {
  return count === 1 ? '1 proposta activada' : `${count} propostes activades`;
}

function buildProductBlock(product: AnimacioProduct, num: number, logoDataUri?: string, isLast = false): string {
  const descripcio = product.descripcio
    .map((p) => `<p>${escHtml(p)}</p>`)
    .join('\n      ');

  const inclou = product.inclou
    .map((item) => `<li>${escHtml(item)}</li>`)
    .join('\n      ');

  const noInclou = product.noInclou
    ? `<div class="dossier-note"><span>Nota</span><p>${escHtml(product.noInclou)}</p></div>`
    : '';

  const duration = product.durada ? `<span>${escHtml(product.durada)}</span>` : '';

  return `
  <section class="product-page${isLast ? ' product-page--last' : ''}">
  ${logoDataUri ? `<div class="product-page-header"><img src="${logoDataUri}" alt="Òrbita Events"></div>` : ''}
  <div class="producte">
    <div class="producte-header">
      <div>
        <span class="producte-num">Capítol ${String(num).padStart(2, '0')}</span>
        <h2 class="producte-nom">${escHtml(product.nom)}</h2>
      </div>
      ${duration}
    </div>
    <div class="producte-desc">
      ${descripcio}
    </div>
    <h3>Què aporta a l'experiència</h3>
    <ul class="producte-inclou">
      ${inclou}
    </ul>
    ${noInclou}
  </div>
  </section>`;
}

export function buildDossierHtml(
  client: DossierClientInfo,
  products: AnimacioProduct[],
  options: { autoPrint?: boolean; logoDataUri?: string } = {},
): string {
  const nomPrincipal = escHtml(client.nom);
  const empresa = client.empresa ? escHtml(client.empresa) : '';
  const eventDesc = client.eventDesc ? escHtml(client.eventDesc) : '';
  const salutacio =
    client.salutacio ||
    `Gràcies per contactar amb nosaltres. T'enviem aquest dossier com una primera mirada editorial a les experiències que podem activar per al vostre esdeveniment.\n\nEl dossier explica el to, el ritme i el valor de cada proposta. La fitxa comercial amb preus, condicions i extres es pot adjuntar a continuació amb només els serveis seleccionats per a l'oferta real.`;

  const producteBlocs = products
    .map((p, i) => buildProductBlock(p, i + 1, options.logoDataUri, i === products.length - 1))
    .join('\n');

  const salutacioHtml = escHtml(salutacio).replace(/\n\n/g, '<br><br>');

  return `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dossier Òrbita Events — ${nomPrincipal}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, Arial, sans-serif; background: #fff; color: #2a261e; font-size: 14px; line-height: 1.55; font-variant-numeric: tabular-nums; }
    .page { max-width: 794px; margin: 0 auto; padding: 54px 60px 64px; }
    .intro-page { min-height: 100vh; page-break-after: always; break-after: page; }
    .intro-kicker { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #a9863f; margin-bottom: 22px; }
    .intro-title { font-size: 38px; line-height: 1.04; font-weight: 700; max-width: 620px; margin-bottom: 28px; color: #191713; }
    .salutacio { border-top: 2px solid #d7b86e; padding-top: 24px; font-size: 15px; color: #4f493f; line-height: 1.85; max-width: 620px; }
    .intro-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 42px; }
    .intro-summary div { border: 1px solid #ded7ca; padding: 16px; min-height: 92px; }
    .intro-summary span { display: block; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #a9863f; margin-bottom: 8px; font-weight: 700; }
    .intro-summary strong { display: block; font-size: 15px; line-height: 1.35; color: #2a261e; }
    .product-page { page-break-after: always; break-after: page; }
    .product-page--last { page-break-after: auto; break-after: auto; }
    .product-page-header { background: #1a1a1a; border-bottom: 2px solid #d7b86e; padding: 14px 18px; margin-bottom: 30px; }
    .product-page-header img { display: block; width: 220px; max-width: 48%; height: auto; }
    .producte { margin-bottom: 44px; page-break-inside: avoid; }
    .producte-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 24px; border-bottom: 1px solid #ded7ca; padding-bottom: 18px; }
    .producte-header > span { color: #a9863f; border: 1px solid #d7b86e; padding: 6px 10px; font-size: 12px; font-weight: 700; white-space: nowrap; }
    .producte-num { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #a9863f; }
    .producte-nom { font-size: 34px; line-height: 1.08; font-weight: 700; color: #2a261e; margin-top: 6px; }
    .producte-desc { font-size: 15px; color: #4f493f; line-height: 1.85; margin-bottom: 30px; max-width: 620px; }
    .producte-desc p + p { margin-top: 14px; }
    .producte h3 { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #a9863f; margin-bottom: 16px; }
    .producte-inclou { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px; font-size: 13.5px; margin-bottom: 24px; list-style: none; }
    .producte-inclou li { display: flex; align-items: flex-start; gap: 8px; color: #2a261e; }
    .producte-inclou li::before { content: '•'; color: #d7b86e; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .dossier-note { border-left: 2px solid #d7b86e; padding-left: 14px; margin-top: 22px; color: #6a6256; }
    .dossier-note span { display: block; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #a9863f; font-weight: 700; margin-bottom: 5px; }
    .dossier-note p { font-size: 13px; font-style: italic; }
    .cta { background: #fff; color: #2a261e; border: 1px solid #d7b86e; padding: 18px 24px; border-radius: 5px; margin-top: 36px; text-align: center; }
    .cta p { font-size: 13px; color: #6a6256; margin-bottom: 6px; }
    .cta strong { font-size: 15px; color: #2a261e; display: block; }
    .peu { margin-top: 56px; border-top: 1px solid #e0d8c8; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 13px; color: #888; }
    .peu-marca { font-size: 15px; font-weight: 700; color: #1a1a1a; letter-spacing: 0.04em; }
    .peu-web { margin-top: 4px; }
    .peu-contact { text-align: right; line-height: 1.7; }
    .peu-contact a { color: #b8860b; text-decoration: none; }
    .portada { background: #050505; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; page-break-after: always; break-after: page; padding: 80px 60px 60px; position: relative; color: #fff; }
    .portada::before { content: ''; position: absolute; inset: 32px; border: 1px solid rgba(215,184,110,0.28); pointer-events: none; }
    .portada-logo { width: 300px; max-width: 70vw; display: block; margin: 0 auto 52px; }
    .portada-wordmark { font-size: 28px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; margin-bottom: 52px; }
    .portada-divider { width: 56px; height: 2px; background: #b8860b; margin: 0 auto 44px; }
    .portada-client { text-align: center; }
    .portada-client-label { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.42); margin-bottom: 18px; }
    .portada-client-nom { font-size: 42px; line-height: 1.05; font-weight: 700; letter-spacing: 0.02em; color: #fff; margin-bottom: 12px; font-family: Inter, Arial, sans-serif; }
    .portada-client-empresa { font-size: 16px; color: #b8860b; margin-bottom: 16px; letter-spacing: 0.02em; }
    .portada-client-event { font-size: 14px; color: rgba(255,255,255,0.55); }
    .portada-bottom { position: absolute; bottom: 52px; left: 0; right: 0; text-align: center; font-size: 11px; color: rgba(255,255,255,0.25); letter-spacing: 0.18em; text-transform: uppercase; }
    @media print {
      body { font-size: 13px; }
      .portada { background: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .product-page-header { background: #1a1a1a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 24px 32px; }
      .cta { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
  ${options.autoPrint ? '<script>window.addEventListener("load", function(){ window.print(); });</script>' : ''}
</head>
<body>

<div class="portada">
  ${options.logoDataUri ? `<img class="portada-logo" src="${options.logoDataUri}" alt="Òrbita Events" />` : '<div class="portada-wordmark">Òrbita Events</div>'}
  <div class="portada-divider"></div>
  <div class="portada-client">
    <div class="portada-client-label">Dossier preparat per a</div>
    <div class="portada-client-nom">${nomPrincipal}</div>
    ${empresa ? `<div class="portada-client-empresa">${empresa}</div>` : ''}
    ${eventDesc ? `<div class="portada-client-event">${eventDesc}</div>` : ''}
  </div>
  <div class="portada-bottom">Dossier de propostes · Òrbita Events</div>
</div>

<div class="page">
  <section class="intro-page">
    <div class="intro-kicker">Una mirada a l'experiència</div>
    <h1 class="intro-title">Un dossier per imaginar l'esdeveniment abans de parlar de números.</h1>

  <div class="salutacio">
    Hola ${nomPrincipal},<br><br>
    ${salutacioHtml}
  </div>

    <div class="intro-summary">
      <div><span>Oferta</span><strong>${formatOfferCount(products.length)}</strong></div>
      <div><span>Format</span><strong>Dossier narratiu + catàleg comercial seleccionat</strong></div>
      <div><span>Objectiu</span><strong>Fer que el client entengui valor abans de comparar preus</strong></div>
    </div>
  </section>

  ${producteBlocs}

  <div class="cta">
    <p>Per confirmar disponibilitat o per a qualsevol dubte</p>
    <strong>${SITE_CONFIG.business.phoneDisplay} · ${SITE_CONFIG.business.email}</strong>
  </div>

  <div class="peu">
    <div>
      <div class="peu-marca">Òrbita Events</div>
      <div class="peu-web">www.orbitaevents.com</div>
    </div>
    <div class="peu-contact">
      Dossier preparat per a ${nomPrincipal}${empresa ? `<br>${empresa}` : ''}${eventDesc ? `<br>${eventDesc}` : ''}
    </div>
  </div>

</div>
</body>
</html>`;
}

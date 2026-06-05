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

function buildProductBlock(product: AnimacioProduct, num: number, logoDataUri?: string, isLast = false): string {
  const descripcio = product.descripcio
    .map((p) => `<p>${escHtml(p)}</p>`)
    .join('\n      ');

  const inclou = product.inclou
    .map((item) => `<div class="inclou-item">${escHtml(item)}</div>`)
    .join('\n      ');

  const noInclou = product.noInclou
    ? `<p class="no-inclou">${escHtml(product.noInclou)}</p>`
    : '';

  let pricing = '';
  if (product.trams && product.trams.length > 0) {
    const rows = product.trams
      .map(
        (t) =>
          `<tr>
              <td>${escHtml(t.participants)}</td>
              <td>${escHtml(t.team)}</td>
              <td class="preu-cell">${t.price !== null ? `${Math.round(t.price)}€` : '—'}</td>
            </tr>`,
      )
      .join('\n');
    pricing = `
    <div class="preus-titol">Preus segons nombre de participants</div>
    <table>
      <thead>
        <tr>
          <th>Participants</th>
          <th>Equip</th>
          <th>Preu</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
  }

  if (product.djOptions && product.djOptions.length > 0) {
    const cards = product.djOptions
      .map(
        (opt) => `
        <div class="dj-card">
          <div class="dj-card-hores">${escHtml(opt.label)}</div>
          <div class="dj-card-preu">${opt.price !== null ? `${Math.round(opt.price)}€` : '—'}</div>
          <div class="dj-card-label">${escHtml(opt.sublabel)}</div>
        </div>`,
      )
      .join('\n');
    pricing = `
    <div class="preus-titol" style="margin-top:20px;">Preus per durada</div>
    <div class="dj-grid">${cards}
    </div>`;
  }

  return `
  <section class="product-page${isLast ? ' product-page--last' : ''}">
  ${logoDataUri ? `<div class="product-page-header"><img src="${logoDataUri}" alt="Òrbita Events"></div>` : ''}
  <div class="producte">
    <div class="producte-header">
      <span class="producte-num">Proposta ${String(num).padStart(2, '0')}</span>
      <span class="producte-nom">${escHtml(product.nom)}</span>
    </div>
    <div class="producte-desc">
      ${descripcio}
    </div>
    <div class="producte-inclou">
      ${inclou}
    </div>
    ${noInclou}
    ${pricing}
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
    `Gràcies per contactar amb nosaltres. T'enviem aquest dossier amb les nostres propostes d'animació pensades per al vostre event. Cada producte és independent — podeu triar el que millor s'adapti al format i a les ganes del vostre grup.\n\nQualsevol dubte, estem a la vostra disposició.`;

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
    .page { max-width: 794px; margin: 0 auto; padding: 46px 60px 64px; }
    .salutacio { background: #fff; border: 1px solid #ded7ca; border-left: 3px solid #d7b86e; padding: 18px 20px; margin-top: 36px; font-size: 13px; color: #4f493f; line-height: 1.7; }
    .product-page { page-break-after: always; break-after: page; }
    .product-page--last { page-break-after: auto; break-after: auto; }
    .product-page-header { background: #1a1a1a; border-bottom: 2px solid #d7b86e; padding: 14px 18px; margin-bottom: 30px; }
    .product-page-header img { display: block; width: 220px; max-width: 48%; height: auto; }
    .producte { margin-bottom: 44px; page-break-inside: avoid; }
    .producte-header { display: flex; align-items: baseline; gap: 16px; margin-bottom: 12px; }
    .producte-num { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #a9863f; }
    .producte-nom { font-size: 24px; font-weight: 700; color: #2a261e; }
    .producte-desc { font-size: 13px; color: #4f493f; line-height: 1.7; margin-bottom: 20px; }
    .producte-desc p + p { margin-top: 10px; }
    .producte-inclou { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13.5px; margin-bottom: 20px; }
    .inclou-item { display: flex; align-items: flex-start; gap: 8px; color: #2a261e; }
    .inclou-item::before { content: '•'; color: #d7b86e; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .no-inclou { font-size: 13px; color: #777; font-style: italic; margin-bottom: 20px; }
    .preus-titol { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #888; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    thead tr { background: #fff; color: #2a261e; border-top: 2px solid #d7b86e; border-bottom: 1px solid #ded7ca; }
    thead th { padding: 10px 14px; text-align: left; font-weight: 700; font-size: 12px; letter-spacing: 0.03em; }
    tbody tr { background: #fff; }
    tbody td { padding: 10px 14px; border-bottom: 1px solid #e8e0d0; color: #333; }
    .preu-cell { font-weight: 700; color: #1a1a1a; font-size: 15px; }
    .dj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .dj-card { border: 1px solid #ded7ca; border-top: 2px solid #d7b86e; border-radius: 5px; padding: 16px; text-align: center; background: #fff; }
    .dj-card-hores { font-size: 13px; color: #888; margin-bottom: 4px; }
    .dj-card-preu { font-size: 24px; font-weight: 700; color: #1a1a1a; }
    .dj-card-label { font-size: 12px; color: #555; margin-top: 4px; }
    .cta { background: #fff; color: #2a261e; border: 1px solid #d7b86e; padding: 18px 24px; border-radius: 5px; margin-top: 36px; text-align: center; }
    .cta p { font-size: 13px; color: #6a6256; margin-bottom: 6px; }
    .cta strong { font-size: 15px; color: #2a261e; display: block; }
    .peu { margin-top: 56px; border-top: 1px solid #e0d8c8; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 13px; color: #888; }
    .peu-marca { font-size: 15px; font-weight: 700; color: #1a1a1a; letter-spacing: 0.04em; }
    .peu-contact { text-align: right; line-height: 1.7; }
    .peu-contact a { color: #b8860b; text-decoration: none; }
    .portada { background: #000; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; page-break-after: always; break-after: page; padding: 80px 60px 60px; position: relative; }
    .portada-logo { width: 300px; max-width: 70vw; display: block; margin: 0 auto 52px; }
    .portada-divider { width: 56px; height: 2px; background: #b8860b; margin: 0 auto 44px; }
    .portada-client { text-align: center; }
    .portada-client-nom { font-size: 30px; font-weight: 700; letter-spacing: 0.02em; color: #fff; margin-bottom: 10px; font-family: Inter, Arial, sans-serif; }
    .portada-client-empresa { font-size: 16px; color: #b8860b; margin-bottom: 16px; letter-spacing: 0.02em; }
    .portada-client-event { font-size: 14px; color: rgba(255,255,255,0.55); }
    .portada-bottom { position: absolute; bottom: 52px; left: 0; right: 0; text-align: center; font-size: 11px; color: rgba(255,255,255,0.25); letter-spacing: 0.18em; text-transform: uppercase; }
    @media print {
      body { font-size: 13px; }
      .portada { background: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .product-page-header { background: #1a1a1a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 24px 32px; }
      .cta { background: #1a1a1a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead tr { background: #1a1a1a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
  ${options.autoPrint ? '<script>window.addEventListener("load", function(){ window.print(); });</script>' : ''}
</head>
<body>

${options.logoDataUri ? `
<div class="portada">
  <img class="portada-logo" src="${options.logoDataUri}" alt="Òrbita Events" />
  <div class="portada-divider"></div>
  <div class="portada-client">
    <div class="portada-client-nom">${nomPrincipal}</div>
  </div>
  <div class="portada-bottom">Dossier de propostes · Òrbita Events</div>
</div>
` : ''}

<div class="page">

  ${producteBlocs}

  <div class="salutacio">
    Hola ${nomPrincipal},<br><br>
    ${salutacioHtml}
  </div>

  <div class="cta">
    <p>Per confirmar disponibilitat o per a qualsevol dubte</p>
    <strong>${SITE_CONFIG.business.phoneDisplay} · ${SITE_CONFIG.business.email}</strong>
  </div>

  <div class="peu">
    <div>
      <div class="peu-marca">Òrbita Events</div>
      <div style="margin-top:4px;">www.orbitaevents.com</div>
    </div>
    <div class="peu-contact">
      Dossier preparat per a ${nomPrincipal}${empresa ? `<br>${empresa}` : ''}${eventDesc ? `<br>${eventDesc}` : ''}
    </div>
  </div>

</div>
</body>
</html>`;
}

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

function buildProductBlock(product: AnimacioProduct, num: number): string {
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
              <td class="preu-cell">${t.price !== null ? `${t.price}€` : '—'}</td>
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
          <div class="dj-card-preu">${opt.price !== null ? `${opt.price}€` : '—'}</div>
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
  </div>`;
}

export function buildDossierHtml(
  client: DossierClientInfo,
  products: AnimacioProduct[],
  options: { autoPrint?: boolean; logoDataUri?: string } = {},
): string {
  const nomPrincipal = escHtml(client.nom);
  const empresa = client.empresa ? escHtml(client.empresa) : '';
  const telefon = client.telefon ? escHtml(client.telefon) : '';
  const email = client.email ? escHtml(client.email) : '';
  const eventDesc = client.eventDesc ? escHtml(client.eventDesc) : '';
  const salutacio =
    client.salutacio ||
    `Gràcies per contactar amb nosaltres. T'enviem aquest dossier amb les nostres propostes d'animació pensades per al vostre event. Cada producte és independent — podeu triar el que millor s'adapti al format i a les ganes del vostre grup.\n\nQualsevol dubte, estem a la vostra disposició.`;

  const headerClient = empresa
    ? `<strong>${nomPrincipal} — ${empresa}</strong>`
    : `<strong>${nomPrincipal}</strong>`;

  const producteBlocs = products
    .map((p, i) => buildProductBlock(p, i + 1))
    .join('\n\n  <hr class="separador">\n');

  const salutacioHtml = escHtml(salutacio).replace(/\n\n/g, '<br><br>');

  return `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dossier Òrbita Events — ${nomPrincipal}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: #fff; color: #1a1a1a; font-size: 15px; line-height: 1.6; }
    .page { max-width: 780px; margin: 0 auto; padding: 48px 48px 64px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 24px; margin-bottom: 32px; }
    .brand { font-size: 22px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .brand span { color: #b8860b; }
    .header-meta { text-align: right; font-size: 13px; color: #555; line-height: 1.8; }
    .header-meta strong { color: #1a1a1a; font-size: 14px; }
    .salutacio { background: #faf8f3; border-left: 4px solid #b8860b; padding: 20px 24px; margin-bottom: 40px; font-size: 14.5px; color: #333; line-height: 1.8; }
    .producte { margin-bottom: 44px; page-break-inside: avoid; }
    .producte-header { display: flex; align-items: baseline; gap: 16px; margin-bottom: 12px; }
    .producte-num { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #b8860b; }
    .producte-nom { font-size: 22px; font-weight: 700; color: #1a1a1a; }
    .producte-desc { font-size: 14.5px; color: #333; line-height: 1.8; margin-bottom: 20px; }
    .producte-desc p + p { margin-top: 10px; }
    .producte-inclou { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13.5px; margin-bottom: 20px; }
    .inclou-item { display: flex; align-items: flex-start; gap: 8px; color: #333; }
    .inclou-item::before { content: '✓'; color: #b8860b; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .no-inclou { font-size: 13px; color: #777; font-style: italic; margin-bottom: 20px; }
    .preus-titol { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #888; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    thead tr { background: #1a1a1a; color: #fff; }
    thead th { padding: 10px 14px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.03em; }
    tbody tr:nth-child(odd) { background: #faf8f3; }
    tbody tr:nth-child(even) { background: #fff; }
    tbody td { padding: 10px 14px; border-bottom: 1px solid #e8e0d0; color: #333; }
    .preu-cell { font-weight: 700; color: #b8860b; font-size: 15px; }
    .separador { border: none; border-top: 1px solid #e0d8c8; margin: 40px 0; }
    .dj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .dj-card { border: 1px solid #e0d8c8; border-radius: 8px; padding: 16px; text-align: center; background: #faf8f3; }
    .dj-card-hores { font-size: 13px; color: #888; margin-bottom: 4px; }
    .dj-card-preu { font-size: 24px; font-weight: 700; color: #b8860b; }
    .dj-card-label { font-size: 12px; color: #555; margin-top: 4px; }
    .cta { background: #1a1a1a; color: #fff; padding: 20px 28px; border-radius: 8px; margin-top: 40px; text-align: center; }
    .cta p { font-size: 14px; color: #ccc; margin-bottom: 6px; }
    .cta strong { font-size: 16px; color: #f0d070; display: block; }
    .peu { margin-top: 56px; border-top: 1px solid #e0d8c8; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 13px; color: #888; }
    .peu-marca { font-size: 15px; font-weight: 700; color: #1a1a1a; letter-spacing: 0.04em; }
    .peu-contact { text-align: right; line-height: 1.7; }
    .peu-contact a { color: #b8860b; text-decoration: none; }
    .portada { background: #000; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; page-break-after: always; break-after: page; padding: 80px 60px 60px; position: relative; }
    .portada-logo { width: 300px; max-width: 70vw; display: block; margin: 0 auto 52px; }
    .portada-divider { width: 56px; height: 2px; background: #b8860b; margin: 0 auto 44px; }
    .portada-client { text-align: center; }
    .portada-client-nom { font-size: 30px; font-weight: 700; letter-spacing: 0.04em; color: #fff; margin-bottom: 10px; font-family: 'Georgia', serif; }
    .portada-client-empresa { font-size: 16px; color: #b8860b; margin-bottom: 16px; letter-spacing: 0.02em; }
    .portada-client-event { font-size: 14px; color: rgba(255,255,255,0.55); }
    .portada-bottom { position: absolute; bottom: 52px; left: 0; right: 0; text-align: center; font-size: 11px; color: rgba(255,255,255,0.25); letter-spacing: 0.18em; text-transform: uppercase; }
    @media print {
      body { font-size: 13px; }
      .portada { background: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
    <div class="portada-client-nom">${nomPrincipal}${empresa ? `<br><span style="font-size:20px;font-weight:400;">${empresa}</span>` : ''}</div>
    ${eventDesc ? `<div class="portada-client-event">${eventDesc}</div>` : ''}
  </div>
  <div class="portada-bottom">Dossier de propostes · Òrbita Events</div>
</div>
` : ''}

<div class="page">

  <div class="header">
    <div>
      <div class="brand">Òrbita <span>Events</span></div>
      <div style="font-size:13px;color:#777;margin-top:4px;">Animació i entreteniment professional</div>
    </div>
    <div class="header-meta">
      ${headerClient}<br>
      ${telefon}<br>
      ${email}${eventDesc ? `<br>${eventDesc}` : ''}
    </div>
  </div>

  <div class="salutacio">
    Hola ${nomPrincipal},<br><br>
    ${salutacioHtml}
  </div>

  ${producteBlocs}

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

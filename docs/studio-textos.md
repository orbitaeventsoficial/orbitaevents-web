# `/studio` — Tots els textos visibles (inventari literal)

> Estat: **arxiu de referència**. L'operativa principal de Studio viu a
> `docs/studio-fitxa-tecnica-handoff.md`; aquest fitxer només conserva l'inventari literal de textos.
>
> Tot el text que apareix a la fitxa tècnica `http://localhost:3000/studio`, transcrit literalment.
> Útil perquè alguns textos viuen darrere pestanyes (switcher de PDFs) o acordions (emails plegats).
> Font: `app/studio/StudioShowroom.tsx`.

---

## Capçalera
- Eyebrow: **Studio · fitxa tècnica**
- Títol: **Sistema visual Òrbita**
- Subtítol: *Tots els tokens, components, comunicacions i documents que defineixen l'aspecte i la veu del nou admin. Tot el que el client veu i tot el que l'admin manipula passa per aquí.*
- Stats: **16** seccions · **17** tokens · **16** icones · **8** comunicacions · **5** documents

## Menú lateral (TOC)
0. Marca · 1. Paleta · 2. Tipografia · 3. Spacing & Radii · 4. Iconografia · 5. Actius del repo · 6. Botons · 7. Inputs · 8. Cards · 9. Estats · 10. Alertes · 11. Responsive · 12. Layout · 13. To de veu · 14. Comunicacions · 15. PDFs
- Marca lateral: **Òrbita** · Sistema · v0.4
- Peu: ← Admin actual

---

## 00 · Marca
Intro: *Logotip, nom, regles d'ús · principi: sobri i únic*

Card 1 (fons fosc): logo `orbitalockupwhite.svg`
- Actiu: `orbitalockupwhite.svg`
- Símbol: Planeta + òrbita
- Color: blanc sobre #07090d
- Ús: Headers, fons foscos

Card 2 (fons or): logo `orbitalockupdark.svg`
- Actiu: `orbitalockupdark.svg`
- Variant: Sobre fons or (invertit)
- Ús: Headers de marca, PDFs
- Espai mínim: 16px al voltant

✓ Sí: Logo + nom junts en headers principals · Sol logo en mides petites (favicon, badges) · Color or pur o ink invertit
✗ No: Mai canviar la proporció del símbol · Mai posar el logo sobre fons sorollós · Mai usar el daurat amb degradats

## 01 · Paleta
Intro: *17 tokens · 4 grups · sobris i sense neon*

**Fons · 4 capes de profunditat**
- Fons absolut — `--o-bg` — #07090d — Body, viewport base
- Superfície — `--o-surface` — #0e1219 — Sidebar, command bar
- Card / elev-1 — `--o-elev-1` — #141923 — Targetes principals
- Raised / elev-2 — `--o-elev-2` — #1c2230 — Hover, botons secondary
- Popover / elev-3 — `--o-elev-3` — #252b3a — Tooltips, dropdowns

**Text · 4 nivells de jerarquia**
- Primari — `--o-text` — #f5f7fa — Títols, valors clau
- Secundari — `--o-text-2` — #a2acba — Body, descripcions
- Terciari — `--o-text-3` — #6b7585 — Labels, captions
- Subtle — `--o-text-4` — #4a525e — Disabled, separadors

**Marca · Òrbita (or sobri)**
- Accent (or) — `--o-accent` — #d4a857 — CTA primary, focus
- Accent fosc — `--o-accent-deep` — #b8923f — Borders, ombres
- Ink — `--o-accent-ink` — #1a1208 — Text sobre or

**Estats funcionals · semàntica clara**
- Info — `--o-info` — #5fb7e8 — Nous, notificacions
- Èxit — `--o-success` — #3ec57b — Confirmats, guanyats
- Atenció — `--o-warning` — #e8a93a — Pendents, atenció
- Crític — `--o-danger` — #e2596a — Errors, perduts, urgents

## 02 · Tipografia
Intro: *Inter (sans) per a UI · JetBrains Mono per a dades/codis · 7 nivells · numerals tabulars*
- Display — 32 / 700 / -0.025em — "Òrbita Events" — Títol pàgina
- Title — 22 / 700 / -0.02em — "Pipeline · Juny" — Títol secció
- Heading — 18 / 600 — "Configuració general" — Card title
- Body — 14 / 400 — "Exemple · Boda · 120 pax · 14 jun" — Text llarg
- Small — 12 / 500 — "Última actualització fa 3 minuts" — Meta, hints
- Caption — 11 / 700 / 0.06em UP — "PIPELINE · 8 LEADS" — Labels, eyebrows
- Mono — JetBrains Mono · 12 — "14 jun · 120 pax · 22:00" — Dades, codis, IDs

## 03 · Spacing & Radii
Intro: *Base 4px · escala geomètrica · zero gaps fora del sistema*
- Spacing: `--o-1` 4px · `--o-2` 8px · `--o-3` 12px · `--o-4` 16px · `--o-5` 20px · `--o-6` 24px · `--o-8` 32px · `--o-10` 40px · `--o-12` 48px
- Radii: `--o-r-sm` 6px (pills, tags) · `--o-r-md` 10px (botons, inputs) · `--o-r-lg` 14px (cards) · `--o-r-xl` 20px (modals) · `--o-r-pill` (badges, dots)

## 04 · Iconografia
Intro: *16 icones · stroke 1.5-2px · arrodoniments · 16×16 base · monolínia*
Noms: pipeline · calendari · clients · inbox · mail · phone · whatsapp · pdf · search · plus · cog · alert · check · cross · arrow-right · sparkle

## 05 · Actius del repo
Intro: *Favicons, icones PWA i imatge social — fitxers reals servits des de /public*

**Logotips de marca · /public/img**
- orbitalockupwhite.svg — Lockup principal · fons foscos
- orbitalockupdark.svg — Lockup · fons clars
- orbitalockupmono.svg — Lockup monocrom
- orbitawordmark.svg — Només text · wordmark
- orbita-glyph.svg — Símbol sol · glyph
- orbita-glyph-anim.svg — Glyph animat (SVG)
- orbitaglyphgold.webp — Glyph daurat
- orbitaglyphblack.svg — Glyph negre · fons clars
- logoplanetatextdreta.svg — Planeta + text a la dreta
- logosoloplaneta.svg — Només planeta

**Vectorials · SVG**: favicon.svg (Favicon principal) · icon.svg (App icon PWA/Apple) · favicon-halloween.svg (Variant estacional) · favicon-mon-magic.svg (Variant temàtica Món Màgic)

**Raster · PNG**: favicon-16/32/48/64/96/128/144/180/192/256/512.png · apple-touch-icon.png

**Meta · ICO + Open Graph**: favicon.ico (Legacy IE/fallback) · og-default.jpg (Open Graph 1200×630)

## 06 · Botons
Intro: *4 variants · 3 mides · primary amb relleu 3D real*
- Primary: SM · Acció principal · Acció gran · Disabled
- Secondary: SM · Secundària · Gran · Disabled
- Ghost: SM · Ghost · Gran
- Danger: SM · Eliminar · Eliminar gran

## 07 · Inputs
Intro: *Text · select · textarea · search · focus daurat · disabled visible*
- Text (placeholder "Exemple") · Select (Boda / Comunió) · Search ("Cercar...") · Disabled ("No disponible") · Textarea ("Notes internes...")

## 08 · Cards i panels
Intro: *Card base · panel amb to · tint subtil segons importància*
- Card base (badge "neutre"): *Contenidor general. Padding generós, border subtle.*
- Card amb to (badge "accent"): *Variant amb tint per indicar importància o estat.*

## 09 · Estats
Intro: *Sempre el mateix to per al mateix significat — vocabulari únic a tot l'admin*
- Neutre · Nou · Contactat · Negociant · Guanyat · Perdut

## 10 · Alertes i banners
Intro: *Una sola alerta visible alhora. Mai un panell d'alertes.*
- Crític: "Ara atens · crític" — *1 lead fa 3 dies sense contactar — Exemple · Boda · 14 jun*
- Atenció: "Ara atens · atenció" — *Pressupost enviat fa 5 dies sense resposta — Exemple · Empresa*

## 11 · Responsive
Intro: *4 breakpoints · mobile-first · el sidebar es plega abans dels 900px*
- Mobile (< 600px): 1 col · sidebar collapsed · stats stack
- Tablet (600-900px): 2 cols · sidebar horizontal
- Laptop (900-1200px): 3-4 cols · sidebar fix
- Desktop (> 1200px): 4-5 cols · pipeline complet

## 12 · Layout estàndard
Intro: *Sidebar slim 200px · Main amb command bar fixa · Content scrollejable*
- Sidebar: Òrbita · Leads · Reserves (actiu) · Clients · Safata · Config
- Main: ⌘ Command bar (omnipresent) · Capçalera de pàgina · Contingut principal · Stats bar (KPIs compactes)

## 13 · To de veu (al client)
Intro: *Càlid, directe, sense disclaimers · senyal de marca quan el client llegeix*

✓ Sí:
- Tutejant, càlid
- Una idea per frase
- Català/Castellà/Anglès segons preferredLocale
- Acabar amb una signatura curta "Òrbita Events"
- Subjectes específics: "Reserva confirmada R2026-014"
- Tota acció amb un sol botó/enllaç visible

✗ No:
- De vostè, distant
- Frases-paràgraf de 4 línies
- Mesclar idiomes en el mateix correu
- Banners de marca o disclaimers legals al peu
- Subjectes vagues: "Notícies", "Actualització"
- Múltiples CTAs competidors al mateix mail

## 14 · Comunicacions automàtiques (8 emails)
Intro: *8 plantilles d'email · disparades per esdeveniments del sistema · editables a /admin/email-templates*

### welcome — locales: ca, es, en
- Trigger: Quan es crea un client per primera vegada
- Subject: `Benvingut a Òrbita Events, {{clientName}}`
- Body:
  > Hola {{clientName}},
  > Gràcies per confiar en Òrbita Events. Som aquí per a tot el que necessitis: pressupostos, dubtes, idees per al teu event.
  > El meu directe és aquest mateix correu — qualsevol cosa, escriu-nos.
  > Òrbita Events

### booking_confirmation — locales: ca, es, en
- Trigger: Quan es confirma una reserva (estat → CONFIRMED)
- Subject: `Reserva confirmada {{reference}} · {{eventDate}}`
- Body:
  > Hola {{clientName}}, La teva reserva ja és nostra:
  > — Referència: {{reference}} — Data: {{eventDate}} · {{startTime}} a {{endTime}} — Tipus: {{eventType}} — Pack: {{packName}} — Lloc: {{location}} — Total: {{total}}€ — Senyal pagada: {{depositAmount}}€
  > T'esperem. Òrbita Events

### admin_booking_notification — locales: ca
- Trigger: Notifica a l'admin quan entra una reserva nova
- Subject: `🔔 Nova reserva: {{reference}}`
- Body:
  > Nova reserva entrada: — {{clientName}} ({{clientEmail}} · {{clientPhone}}) — Event: {{eventType}} — Data: {{eventDate}} — Lloc: {{location}} — Pack: {{packName}} — Total: {{total}}€

### payment_reminder — locales: ca, es, en
- Trigger: Quan queden N dies per l'event i hi ha pagament pendent
- Subject: `Recordatori de pagament · {{reference}}`
- Body:
  > Hola {{clientName}}, Tens pendents {{pendingAmount}}€ per la reserva {{reference}}.
  > L'event és el {{eventDate}} — queden {{daysUntilEvent}} dies. Quan vulguis tanquem-ho. Òrbita Events

### post_event — locales: ca, es, en
- Trigger: N dies després de l'event (cron diari)
- Subject: `Com va anar el teu event, {{clientName}}?`
- Body:
  > Hola {{clientName}}, Esperem que {{packName}} del {{eventDate}} t'agradés.
  > Ens deixaries la teva opinió? Ens ajuda molt per millorar i per altres parelles/empreses que ens consulten.
  > 👉 {{reviewUrl}} · Google: {{googleReviewUrl}} · Gràcies — Òrbita Events

### testimonial_reminder — locales: ca, es, en
- Trigger: Si no ha deixat ressenya passats N dies del post_event
- Subject: `Encara tens un minut, {{clientName}}?`
- Body:
  > Hola {{clientName}}, No t'oblidis deixar la teva opinió a {{reviewUrl}}. És el millor que pots fer per nosaltres. Gràcies.

### testimonial_received — locales: ca, es, en
- Trigger: Quan el client envia el testimoni des de la web
- Subject: `Gràcies per la teva opinió, {{clientName}}`
- Body:
  > Hola {{clientName}}, Hem rebut el teu testimoni. El revisarem i el publicarem ben aviat. Gràcies de tot cor. Òrbita Events

### testimonial_approved — locales: ca, es, en
- Trigger: Quan un admin aprova un testimoni
- Subject: `🎁 La teva ressenya és viu — codi descompte regal`
- Body:
  > Hola {{clientName}}, El teu testimoni ja és publicat. Com a regal, et donem aquest codi:
  > {{discountCode}} ({{discountAmount}}€) · Per al teu proper event amb nosaltres. Gràcies — Òrbita Events

## 15 · Documents PDF
Intro: *Previsualització fidel del contingut real · reprodueix lib/pdf-utils.ts (tema fosc + or, A4)*
Switcher: **Pressupost · Contracte · Catàleg de serveis · Informe executiu**

### Pressupost (tema fosc)
- Capçalera: Òrbita Events · PRESSUPOST · Referència OE-LX9K2A · Data 22/05/2026 · Validesa 15 dies
- Client: Marta Soler i Jordi Vila · marta.soler@email.com · 612 345 678
- Detalls: Casament · Lloc: Mas de Sant Lleí, Vallromanes · Horari 18:00–02:00 · Data 14 de juny de 2026 · Convidats 120
- Pack seleccionat: Pack Premium Boda · 8 hores · 1.890,00€
- Què inclou: DJ professional tota la nit · Equip de so line-array · Il·luminació intel·ligent + focus mòbils · Photocall amb attrezzo · Màquina de fum de terra · Tècnic present durant tot l'event
- Extres: Photobooth amb impressió il·limitada +350€ · Saxo en directe (45 min) +280€
- Resum econòmic: Pack base 1.890,00€ · Extres 630,00€ · Desplaçament 90,00€ (38,0 km totals · 18,0 km facturables · 1 tram) · Descompte -120,00€ (Reserva anticipada) · **TOTAL 2.490,00€**
- Condicions: Reserva amb senyal del 30% per bloquejar la data · Resta del pagament 7 dies abans de l'event · Preu vàlid 15 dies des de l'emissió · Inclou muntatge i desmuntatge d'equips
- Peu: Preus sense IVA. · Validesa: 15 dies · orbitaevents.com · info@orbitaevents.com · +34 699 12 10 23

### Contracte (tema fosc)
- Capçalera: Òrbita Events · CONTRACTE DE PRESTACIÓ DE SERVEIS · Referència OE-C-2026-014 · Data 22 de maig de 2026
- Les parts — Prestador: Òrbita Events · NIF B-00000000 · info@orbitaevents.com. Client: Marta Soler i Jordi Vila · NIF 00000000X · marta.soler@email.com · 612 345 678
- Detalls del servei: Tipus Casament · Data 14 de juny de 2026 · Horari 18:00-02:00 · Lloc Mas de Sant Lleí, Vallromanes · Convidats 120 · Pack contractat Pack Premium Boda (8h)
- Resum econòmic: Subtotal 2.490,00€ · IVA (21%) 522,90€ · **TOTAL 3.012,90€**
- Condicions de pagament: Aval (dipòsit) 903,87€ · Resta 2.109,03€ · IBAN ES00 0000 0000 0000 0000 0000
- Clàusules legals: Ambdues parts declaren tenir capacitat legal suficient · En cas de força major, ambdues parts queden alliberades sense penalització · Controvèrsies: jutjats i tribunals de Granollers (Barcelona) · Dades tractades segons RGPD (UE) 2016/679 i LOPDGDD 3/2018
- Signatures: El Prestador · El Client (Signat digitalment)

### Catàleg de serveis (tema clar)
- Banda: CATÀLEG DE SERVEIS · Casaments
- Els Nostres Packs:
  - Pack Essencial — 990€ — 5 hores — DJ professional · Equip de so i micròfon · Il·luminació de pista — Ideal per: celebracions íntimes
  - Pack Premium Boda — 1.890€ — 8 hores — [MÉS POPULAR] — DJ + tècnic tota la nit · So line-array + il·luminació intel·ligent · Photocall amb attrezzo — Ideal per: casaments de 80 a 150 convidats
  - Pack Estrella — 2.690€ — 10 hores — [PREMIUM] — Tot el Premium + cabina DJ premium · Espectacle de llum i efectes · Coordinació musical personalitzada — Ideal per: grans esdeveniments
- Extres Disponibles: Photobooth (350€) · Saxo en directe (280€) · Màquina de fum pesat (120€) · Espurnes fredes (190€) · Pantalla LED (450€) · Hora extra (Consultar)
- Contacta'ns: Tens dubtes? Escriu-nos sense compromís!
- Peu: Barcelona · Girona · Catalunya · orbitaevents.com · info@orbitaevents.com · +34 699 12 10 23

### Informe executiu (tema clar)
- Banda: INFORME EXECUTIU · Generat el 22 de maig de 2026
- Indicadors principals: Clients 248 · Leads oberts 32 · Reserves tancades 41 · Ingressos (EUR) 86.400 · Pipeline brut 142.000 · Forecast ponderat 58.300 · SLA trencats 3
- Embut comercial: Nou 18 · Contactat 12 · Negociant 7 · Guanyat 41 · Perdut 22
- Conversió per origen: Web (64, 21, 32,8%, 2.180,00) · Instagram (48, 14, 29,2%, 1.940,00) · Referits (22, 11, 50,0%, 2.560,00) · Google (31, 9, 29,0%, 2.020,00)
- Marge: Ingressos totals 86.400,00€ · Cost total 41.700,00€ · Marge brut 44.700,00€ · Taxa marge 51,7%
- Peu: Òrbita Events · Informe intern · orbitaevents.com

### Índex de documents (PDF_DOCS)
- Pressupost — generateQuotePDF · tema fosc
- Contracte — generateContractPDF · tema fosc
- Catàleg de serveis — generateServiceBrochure · tema clar
- Informe executiu — exportExecutiveReportPdf · tema clar
- Factura — generada via Holded (integració externa)

---

## Peu de pàgina
*Òrbita Studio · sistema visual v0.4 · 16 seccions · 8 comunicacions · 5 documents*

## HUD (cantonada inferior dreta)
*Studio v0.4 · fitxa tècnica · admin actual*

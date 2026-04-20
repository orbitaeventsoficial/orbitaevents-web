import fs from 'node:fs';
const file = 'D:/orbitaevents/app/admin/bookings/[id]/page.tsx';
let c = fs.readFileSync(file, 'utf8');
const replacements = [
  ['ParalÂ·lelitzar totes les queries secundÃ ries', 'Paral·lelitzar totes les queries secundàries'],
  [' Â· ', ' · '],
  ['En progrÃ©s', 'En progrés'],
  ['InformaciÃ³ del Client', 'Informació del Client'],
  ['TelÃ¨fon', 'Telèfon'],
  ['Veure lead original â†’', 'Veure lead original ->'],
  ['Mes accions â–¾', 'Mes accions v'],
  ['Ãºltim esdeveniment', 'últim esdeveniment'],
  ['UbicaciÃ³', 'Ubicació'],
  [' Ã— ', ' x '],
  ['Resum EconÃ²mic', 'Resum Econòmic'],
  ['âœ“ Pagat', 'Pagat'],
  ['âœ— Pendent', 'Pendent'],
  ['â—‹ Pendent', 'Pendent'],
  ['Checklist de preparaciÃ³', 'Checklist de preparació'],
  ['Pressupost â†’ Contracte â†’ Factura', 'Pressupost -> Contracte -> Factura'],
  ['AcciÃ³', 'Acció'],
  ["Lectura can├▓nica de l'activitat operativa d'aquesta reserva.", "Lectura canonica de l'activitat operativa d'aquesta reserva."],
  ['┬À', '·'],
  ['âœ“ Completat', 'Completat'],
  ['âœ“ NPS:', 'NPS:'],
  ['âœ“ Codi:', 'Codi:']
];
for (const [a,b] of replacements) c = c.split(a).join(b);
fs.writeFileSync(file, c, 'utf8');

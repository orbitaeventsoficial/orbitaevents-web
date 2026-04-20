import fs from 'node:fs';
const file = 'D:/orbitaevents/app/admin/bookings/[id]/page.tsx';
let c = fs.readFileSync(file, 'utf8');
c = c.split(' Â· ').join(' · ');
c = c.split('Veure lead original ->').join('Veure lead original');
fs.writeFileSync(file, c, 'utf8');

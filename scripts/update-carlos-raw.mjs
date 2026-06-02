import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');
import { readFileSync } from 'fs';

// Llegeix DATABASE_URL de .env o .env.local
function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    try {
      const lines = readFileSync(f, 'utf-8').split('\n');
      for (const line of lines) {
        const m = line.match(/^DATABASE_URL="?([^"]+)"?/);
        if (m) return m[1];
      }
    } catch {}
  }
}

const url = loadEnv();
if (!url) { console.error('DATABASE_URL no trobat'); process.exit(1); }

const client = new Client({ connectionString: url });
await client.connect();

const res = await client.query(`
  UPDATE collaborators
  SET
    "costPerHour" = 100,
    specialty     = 'Presentador d''esdeveniments',
    notes         = 'Tarifa: 100€/h com a presentador. Per a Bingo Musical o Batalla Musical (1,5h): 150€ Carlos + ~50€ tècnic de so + material = 200€ total. Usable de forma independent per a qualsevol presentació.'
  WHERE id = 'carlos-lucas-fernandez'
  RETURNING id, name, "costPerHour", specialty
`);

if (res.rows.length) {
  const r = res.rows[0];
  console.log(`OK: ${r.name} — ${r.costPerHour}€/h — ${r.specialty}`);
} else {
  console.log('Carlos no trobat, inserint...');
  await client.query(`
    INSERT INTO collaborators (id, name, company, phone, specialty, commission_pct, pricing_model, cost_per_hour, notes, is_active, created_at, updated_at)
    VALUES (
      'carlos-lucas-fernandez',
      'Carlos Lucas Fernández',
      'Masquerade Events',
      '691748306',
      'Presentador d''esdeveniments',
      0,
      'DISCOUNT',
      100,
      'Tarifa: 100€/h com a presentador. Per a Bingo Musical o Batalla Musical (1,5h): 150€ Carlos + ~50€ tècnic de so + material = 200€ total.',
      true,
      NOW(), NOW()
    )
  `);
  console.log('Creat!');
}

await client.end();

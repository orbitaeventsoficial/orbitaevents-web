// Scan ALL translation files for hardcoded data (prices, years, phones, emails, km)
const fs = require('fs');
const path = require('path');

const LOCALES = ['ca', 'es', 'en'];

function scan(obj, filepath, keyPath = '') {
  for (const [k, v] of Object.entries(obj)) {
    const p = keyPath ? `${keyPath}.${k}` : k;
    if (typeof v === 'string') {
      const prices = v.match(/\d+\s*€/g);
      const years = v.match(/\b20[2-3]\d\b/g);
      const phones = v.match(/\+?\d{2,3}\s?\d{3}\s?\d{2,3}\s?\d{2,3}/g);
      const emails = v.match(/[\w.-]+@[\w.-]+\.\w+/g);
      const kms = v.match(/\d+\s*km/gi);
      const hours = v.match(/\d+\s*h(?:ores?|oras?|ours?)?/gi);
      const pcts = v.match(/\d+\s*%/g);
      if (prices || years || phones || emails || kms || hours || pcts) {
        console.log(`[${filepath}] ${p}`);
        if (prices) console.log(`  PREUS: ${prices.join(', ')}`);
        if (years) console.log(`  ANYS: ${years.join(', ')}`);
        if (phones) console.log(`  TEL: ${phones.join(', ')}`);
        if (emails) console.log(`  EMAIL: ${emails.join(', ')}`);
        if (kms) console.log(`  KM: ${kms.join(', ')}`);
        if (hours) console.log(`  HORES: ${hours.join(', ')}`);
        if (pcts) console.log(`  %: ${pcts.join(', ')}`);
        console.log(`  TEXT: ${v.substring(0, 120)}`);
        console.log('');
      }
    } else if (typeof v === 'object' && v !== null) {
      scan(v, filepath, p);
    }
  }
}

for (const locale of LOCALES) {
  const filepath = path.join(__dirname, '..', 'messages', `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  console.log(`\n========== ${locale.toUpperCase()} ==========\n`);
  scan(data, locale);
}

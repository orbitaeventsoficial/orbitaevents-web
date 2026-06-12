import 'dotenv/config';
import { getGoogleAdsConfigStatus, getGoogleAdsReport } from './lib/analytics/google-ads';

(async () => {
  const status = await getGoogleAdsConfigStatus();
  console.log('CONFIG ready:', status.ready);
  if (!status.ready) {
    console.log('Motiu:', status.reason);
    console.log('Falta:', status.missing.join(', '));
    return;
  }
  try {
    const r = await getGoogleAdsReport();
    if (!r) { console.log('Report null (config incompleta)'); return; }
    const cost = r.totals.costMicros / 1_000_000;
    const prevCost = r.previousTotals.costMicros / 1_000_000;
    const conv = r.totals.conversions;
    console.log(`\n=== Google Ads · últims 30 dies (${r.currencyCode}) ===`);
    console.log(`Despesa:      ${cost.toFixed(2)} €`);
    console.log(`Clics:        ${r.totals.clicks}`);
    console.log(`Impressions:  ${r.totals.impressions}`);
    console.log(`Conversions:  ${conv}`);
    console.log(`CAC real:     ${conv > 0 ? (cost / conv).toFixed(2) + ' €/conv' : 'n/d (0 conversions)'}`);
    console.log(`(període anterior: ${prevCost.toFixed(2)} €)`);
    console.log(`\nTop campanyes:`);
    for (const c of r.campaigns.slice(0, 6)) {
      console.log(`  · ${c.name}: ${(c.costMicros / 1_000_000).toFixed(2)}€ · ${c.clicks} clics · ${c.conversions} conv`);
    }
  } catch (e) {
    console.log('ERROR cridant l\'API:', e instanceof Error ? e.message : e);
  }
})();

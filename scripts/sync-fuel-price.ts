/**
 * Sincronitzar preu benzina MITECO → cost/km vehicle
 * ====================================================
 * Consulta el preu real de la benzina via MITECO i actualitza el cost per km.
 *
 * Executar: npx tsx scripts/sync-fuel-price.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Config vehicle (mateixos valors que fuelReferenceService.ts)
const CONSUM_L_100 = 7.5;           // litres/100km
const MAINTENANCE_COST_PER_KM = 0.03; // €/km manteniment

async function main() {
  console.log('⛽ Sincronitzant preu benzina MITECO...\n');

  // 1. Obtenir preu actual de la BD
  const currentSetting = await prisma.setting.findUnique({ where: { key: 'fuel.latestPrice' } });
  const currentPrice = currentSetting ? parseFloat(currentSetting.value) : 0;

  // 2. Intentar obtenir preu MITECO
  let newPrice = currentPrice;
  try {
    const url = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarworkerantes/BusquedaCarworkerantes/json/EstacionesTerrestres/';
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    if (res.ok) {
      const data = await res.json();
      const stations = data?.ListaEESSPrecio || [];

      // Filtrar estacions de Barcelona amb preu Gasolina 95
      const bcnStations = stations.filter((s: Record<string, string>) =>
        (s['Provincia'] || '').includes('BARCELONA') &&
        s['Precio Gasolina 95 E5'] &&
        parseFloat(s['Precio Gasolina 95 E5'].replace(',', '.')) > 0
      );

      if (bcnStations.length > 0) {
        const prices = bcnStations.map((s: Record<string, string>) =>
          parseFloat(s['Precio Gasolina 95 E5'].replace(',', '.'))
        );
        newPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        console.log(`  Preu mitjà Barcelona: ${newPrice.toFixed(3)} €/L (${bcnStations.length} estacions)`);
      }
    }
  } catch (e) {
    console.log(`  ⚠️  No s'ha pogut connectar a MITECO: ${e instanceof Error ? e.message : 'error'}`);
    if (currentPrice > 0) {
      console.log(`  Usant últim preu conegut: ${currentPrice.toFixed(3)} €/L`);
      newPrice = currentPrice;
    } else {
      newPrice = 1.55; // Fallback
      console.log(`  Usant fallback: ${newPrice} €/L`);
    }
  }

  // 3. Calcular cost/km
  const fuelCostPerKm = (newPrice * CONSUM_L_100) / 100;
  const totalCostPerKm = fuelCostPerKm + MAINTENANCE_COST_PER_KM;

  // 4. Guardar a BD
  await prisma.setting.upsert({
    where: { key: 'fuel.latestPrice' },
    update: { value: newPrice.toFixed(3) },
    create: { key: 'fuel.latestPrice', value: newPrice.toFixed(3), type: 'STRING', category: 'fuel', label: 'Últim preu benzina €/L' },
  });

  await prisma.setting.upsert({
    where: { key: 'fuel.costPerKm' },
    update: { value: totalCostPerKm.toFixed(4) },
    create: { key: 'fuel.costPerKm', value: totalCostPerKm.toFixed(4), type: 'STRING', category: 'fuel', label: 'Cost per km vehicle' },
  });

  await prisma.setting.upsert({
    where: { key: 'fuel.lastSync' },
    update: { value: new Date().toISOString() },
    create: { key: 'fuel.lastSync', value: new Date().toISOString(), type: 'STRING', category: 'fuel', label: 'Última sincronització benzina' },
  });

  console.log('\n  📊 Resum:');
  console.log(`     Preu benzina: ${newPrice.toFixed(3)} €/L`);
  console.log(`     Consum: ${CONSUM_L_100} L/100km`);
  console.log(`     Cost combustible: ${fuelCostPerKm.toFixed(4)} €/km`);
  console.log(`     Manteniment: ${MAINTENANCE_COST_PER_KM} €/km`);
  console.log(`     Cost total/km: ${totalCostPerKm.toFixed(4)} €/km`);
  console.log(`     Canvi vs anterior: ${currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice * 100).toFixed(1) + '%' : 'primer sync'}`);
  console.log('\n✅ Preu actualitzat!');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

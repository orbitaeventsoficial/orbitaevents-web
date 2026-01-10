#!/usr/bin/env node

/**
 * Debug SerpAPI - Ver qué resultados devuelve
 */

const SERPAPI_KEY = process.env.SERPAPI_KEY || '405144fe936ef97166aeebfd73cad9c15848b739b6350ef9925d95c9ec27a2a9';

const queries = [
  'Òrbita events',
  'Orbita events',
  'Òrbita events Barcelona',
  '41.392668,2.140189',
];

const dataIds = [
  '0x47897fcbaf577f7b:0xb374b10df06e2077',
  '0xb374b10df06e2077',
];

console.log('═══════════════════════════════════════════════════════════');
console.log('DEBUG SERPAPI - Òrbita events');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: Búsquedas normales
console.log('📍 TEST 1: Búsquedas por query\n');
for (const query of queries) {
  console.log(`\n🔍 Query: "${query}"`);
  console.log('─'.repeat(60));

  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.log('❌ Error:', data.error);
      continue;
    }

    if (!data.local_results || data.local_results.length === 0) {
      console.log('⚠️  No se encontraron resultados');
      continue;
    }

    console.log(`✅ Encontrados ${data.local_results.length} resultados:\n`);

    data.local_results.slice(0, 5).forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   Rating: ${r.rating || 'N/A'} (${r.reviews || 0} reviews)`);
      console.log(`   Tipo: ${r.type || 'N/A'}`);
      console.log(`   Data ID: ${r.data_id || 'N/A'}`);
      console.log(`   Place ID: ${r.place_id || 'N/A'}`);
      if (r.description) console.log(`   Descripción: ${r.description.substring(0, 80)}...`);
      console.log('');
    });

  } catch (error) {
    console.log('❌ Error de red:', error.message);
  }
}

// Test 2: Búsqueda por data_id
console.log('\n\n📍 TEST 2: Búsqueda directa por data_id\n');
for (const dataId of dataIds) {
  console.log(`\n🔍 Data ID: "${dataId}"`);
  console.log('─'.repeat(60));

  const url = `https://serpapi.com/search.json?engine=google_maps&data_id=${dataId}&api_key=${SERPAPI_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.log('❌ Error:', data.error);
      continue;
    }

    if (data.place_results) {
      const p = data.place_results;
      console.log('✅ Negocio encontrado:');
      console.log(`   Nombre: ${p.title}`);
      console.log(`   Rating: ${p.rating || 'N/A'} (${p.reviews || 0} reviews)`);
      console.log(`   Tipo: ${p.type || 'N/A'}`);
      console.log(`   Dirección: ${p.address || 'N/A'}`);
      console.log(`   Data ID: ${p.data_id || 'N/A'}`);
    } else {
      console.log('⚠️  No se encontró place_results');
      console.log('Claves disponibles:', Object.keys(data).join(', '));
    }

  } catch (error) {
    console.log('❌ Error de red:', error.message);
  }
}

console.log('\n\n═══════════════════════════════════════════════════════════');
console.log('FIN DEBUG');
console.log('═══════════════════════════════════════════════════════════');

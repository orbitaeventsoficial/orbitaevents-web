#!/usr/bin/env node

/**
 * Sync Google Reviews - Build Script
 * ===================================
 * 
 * S'executa durant el build per obtenir ressenyes de Google.
 * 
 * Configuració a Vercel:
 * - SERPAPI_KEY (recomanat, 100 gratis/mes)
 * - O OUTSCRAPER_KEY (25 gratis/mes)
 * 
 * Ús:
 * - node scripts/sync-reviews.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUSINESS_NAME = 'Òrbita Events Granollers';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔄 Sincronitzant ressenyes de Google...');
console.log('═══════════════════════════════════════════════════════════════');

// ═══════════════════════════════════════════════════════════════════════════
// SERPAPI
// ═══════════════════════════════════════════════════════════════════════════
async function fetchFromSerpAPI() {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.log('[SerpAPI] No API key');
    return null;
  }

  try {
    console.log('[SerpAPI] Buscant negoci...');
    
    // Buscar el negoci
    const searchUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(BUSINESS_NAME)}&api_key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (searchData.error) {
      console.log('[SerpAPI] Error:', searchData.error);
      return null;
    }

    const place = searchData.local_results?.[0];
    if (!place) {
      console.log('[SerpAPI] Negoci no trobat');
      return null;
    }

    console.log(`[SerpAPI] Trobat: ${place.title} (${place.rating}⭐, ${place.reviews} reviews)`);

    // Obtenir ressenyes
    const reviewsUrl = `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${place.place_id}&api_key=${apiKey}`;
    const reviewsRes = await fetch(reviewsUrl);
    const reviewsData = await reviewsRes.json();

    if (reviewsData.error) {
      console.log('[SerpAPI] Error obtenint ressenyes:', reviewsData.error);
      return null;
    }

    const reviews = (reviewsData.reviews || []).map(r => ({
      author_name: r.user?.name || 'Anònim',
      rating: r.rating || 5,
      text: r.snippet || '',
      time: r.iso_date ? new Date(r.iso_date).getTime() / 1000 : Date.now() / 1000,
      relative_time_description: r.date || 'Recentment',
      profile_photo_url: r.user?.thumbnail,
    }));

    console.log(`[SerpAPI] ✅ ${reviews.length} ressenyes obtingudes`);
    
    return {
      rating: place.rating || 5,
      total: place.reviews || reviews.length,
      reviews,
    };
  } catch (error) {
    console.error('[SerpAPI] Error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTSCRAPER
// ═══════════════════════════════════════════════════════════════════════════
async function fetchFromOutscraper() {
  const apiKey = process.env.OUTSCRAPER_KEY;
  if (!apiKey) {
    console.log('[Outscraper] No API key');
    return null;
  }

  try {
    console.log('[Outscraper] Obtenint ressenyes...');
    
    const url = `https://api.outscraper.com/maps/reviews-v3?query=${encodeURIComponent(BUSINESS_NAME)}&reviewsLimit=50&async=false`;
    
    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey },
    });
    
    const data = await res.json();
    const place = data.data?.[0];
    
    if (!place) {
      console.log('[Outscraper] Negoci no trobat');
      return null;
    }

    console.log(`[Outscraper] Trobat: ${place.name} (${place.rating}⭐)`);

    const reviews = (place.reviews_data || []).map(r => ({
      author_name: r.author_title || 'Anònim',
      rating: r.review_rating || 5,
      text: r.review_text || '',
      time: r.review_datetime_utc ? new Date(r.review_datetime_utc).getTime() / 1000 : Date.now() / 1000,
      relative_time_description: r.review_ago || 'Recentment',
      profile_photo_url: r.author_image,
    }));

    console.log(`[Outscraper] ✅ ${reviews.length} ressenyes obtingudes`);

    return {
      rating: place.rating || 5,
      total: place.reviews || reviews.length,
      reviews,
    };
  } catch (error) {
    console.error('[Outscraper] Error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  let data = null;

  // Intentar SerpAPI primer
  data = await fetchFromSerpAPI();
  
  // Si falla, intentar Outscraper
  if (!data) {
    data = await fetchFromOutscraper();
  }

  // Si no tenim res, crear fitxer buit
  if (!data) {
    console.log('');
    console.log('⚠️  No s\'han pogut obtenir ressenyes automàticament.');
    console.log('');
    console.log('📋 Per activar sincronització automàtica:');
    console.log('');
    console.log('   1. SerpAPI (100 gratis/mes):');
    console.log('      → https://serpapi.com');
    console.log('      → Afegeix SERPAPI_KEY a Vercel');
    console.log('');
    console.log('   2. Outscraper (25 gratis/mes):');
    console.log('      → https://outscraper.com');
    console.log('      → Afegeix OUTSCRAPER_KEY a Vercel');
    console.log('');
    
    data = {
      rating: 5,
      total: 0,
      reviews: [],
    };
  }

  // Guardar a JSON
  const outputDir = join(process.cwd(), 'public', 'data');
  const outputPath = join(outputDir, 'google-reviews.json');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const output = {
    lastUpdated: new Date().toISOString(),
    rating: data.rating,
    total: data.total,
    reviews: data.reviews,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log('');
  console.log(`💾 Guardat a public/data/google-reviews.json`);
  console.log(`   Rating: ${data.rating}⭐`);
  console.log(`   Ressenyes: ${data.reviews.length}`);
  console.log('');
  console.log('✅ Sincronització completada!');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);

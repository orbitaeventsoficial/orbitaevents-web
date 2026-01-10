#!/usr/bin/env node

/**
 * Sync Google Reviews - Build Script
 * Se ejecuta durante el build para obtener resenas de Google.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUSINESS_SEARCH_QUERIES = [
  'Òrbita events DJ Barcelona',
  'Orbita events discomovil',
  'Òrbita events fiestas',
  '@41.392668,2.140189',
];

const EXACT_BUSINESS_NAME = 'Òrbita events';
const BUSINESS_NAME = EXACT_BUSINESS_NAME;

console.log('============================================');
console.log('Sincronizando resenas de Google...');
console.log('============================================');

async function fetchFromSerpAPI() {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.log('[SerpAPI] No API key');
    return null;
  }

  try {
    // Place ID de Òrbita events
    const PLACE_ID = 'ChIJe39Xr8t/iUcRdyBu8A2xdLM';

    console.log('[SerpAPI] Buscando negocio con Place ID...');
    console.log(`[SerpAPI] Place ID: ${PLACE_ID}`);

    // Método 1: Búsqueda por knowledge graph
    const kgUrl = `https://serpapi.com/search.json?engine=google&q=orbita+events+granollers&location=Granollers,Catalonia,Spain&google_domain=google.es&hl=es&gl=es&api_key=${apiKey}`;
    const kgRes = await fetch(kgUrl);
    const kgData = await kgRes.json();

    if (kgData.knowledge_graph) {
      const kg = kgData.knowledge_graph;
      console.log(`[SerpAPI] Encontrado: ${kg.title} (${kg.rating}, ${kg.review_count} reviews)`);

      // Obtener reseñas usando Google Maps Reviews con place_id
      const reviewsUrl = `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${PLACE_ID}&api_key=${apiKey}&hl=es`;
      const reviewsRes = await fetch(reviewsUrl);
      const reviewsData = await reviewsRes.json();

      if (reviewsData.error) {
        console.log('[SerpAPI] Error obteniendo resenas:', reviewsData.error);
        console.log('[SerpAPI] Intentando método alternativo...');
      }

      const reviews = (reviewsData.reviews || []).map(r => ({
        author_name: r.user?.name || 'Anónimo',
        rating: r.rating || 5,
        text: r.snippet || r.text || '',
        time: r.iso_date ? new Date(r.iso_date).getTime() / 1000 : Date.now() / 1000,
        relative_time_description: r.date || 'Recientemente',
        profile_photo_url: r.user?.thumbnail,
      }));

      console.log(`[SerpAPI] ${reviews.length} resenas obtenidas`);

      return {
        rating: kg.rating || 5,
        total: kg.review_count || reviews.length,
        reviews,
      };
    }

    // Fallback: búsqueda por queries
    console.log('[SerpAPI] Fallback: Buscando por queries...');

    let place = null;
    for (const query of BUSINESS_SEARCH_QUERIES) {
      console.log(`[SerpAPI] Probando: "${query}"...`);
      const searchUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.error) {
        console.log('[SerpAPI] Error:', searchData.error);
        continue;
      }

      place = searchData.local_results?.find((r) => {
        const title = r.title?.toLowerCase() || "";
        const type = r.type?.toLowerCase() || "";
        const queryName = EXACT_BUSINESS_NAME.toLowerCase();

        // Filtrar inmobiliarias y solo buscar eventos/DJ
        const isRealEstate = title.includes('real estate') || type.includes('real estate');
        const isEvents = type.includes('event') || type.includes('dj') ||
                        r.description?.toLowerCase().includes('event') ||
                        r.description?.toLowerCase().includes('dj');

        return !isRealEstate && (
          title === queryName ||
          (title.includes('òrbita') || title.includes('orbita')) && isEvents
        );
      });

      if (!place && searchData.local_results?.length > 0) {
        place = searchData.local_results[0];
      }

      if (place) {
        console.log(`[SerpAPI] Encontrado con "${query}"`);
        break;
      }
    }

    if (!place) {
      console.log('[SerpAPI] Negocio no encontrado con ninguna busqueda');
      return null;
    }

    console.log(`[SerpAPI] Encontrado: ${place.title} (${place.rating}, ${place.reviews} reviews)`);

    const reviewsUrl = `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${place.place_id}&api_key=${apiKey}`;
    const reviewsRes = await fetch(reviewsUrl);
    const reviewsData = await reviewsRes.json();

    if (reviewsData.error) {
      console.log('[SerpAPI] Error obteniendo resenas:', reviewsData.error);
      return null;
    }

    const reviews = (reviewsData.reviews || []).map(r => ({
      author_name: r.user?.name || 'Anonimo',
      rating: r.rating || 5,
      text: r.snippet || '',
      time: r.iso_date ? new Date(r.iso_date).getTime() / 1000 : Date.now() / 1000,
      relative_time_description: r.date || 'Recientemente',
      profile_photo_url: r.user?.thumbnail,
    }));

    console.log(`[SerpAPI] ${reviews.length} resenas obtenidas`);

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

async function fetchFromOutscraper() {
  const apiKey = process.env.OUTSCRAPER_KEY;
  if (!apiKey) {
    console.log('[Outscraper] No API key');
    return null;
  }

  try {
    console.log('[Outscraper] Obteniendo resenas...');

    const url = `https://api.outscraper.com/maps/reviews-v3?query=${encodeURIComponent(BUSINESS_NAME)}&reviewsLimit=50&async=false`;

    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey },
    });

    const data = await res.json();
    const place = data.data?.[0];

    if (!place) {
      console.log('[Outscraper] Negocio no encontrado');
      return null;
    }

    console.log(`[Outscraper] Encontrado: ${place.name} (${place.rating})`);

    const reviews = (place.reviews_data || []).map(r => ({
      author_name: r.author_title || 'Anonimo',
      rating: r.review_rating || 5,
      text: r.review_text || '',
      time: r.review_datetime_utc ? new Date(r.review_datetime_utc).getTime() / 1000 : Date.now() / 1000,
      relative_time_description: r.review_ago || 'Recientemente',
      profile_photo_url: r.author_image,
    }));

    console.log(`[Outscraper] ${reviews.length} resenas obtenidas`);

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

async function main() {
  let data = null;

  data = await fetchFromSerpAPI();

  if (!data) {
    data = await fetchFromOutscraper();
  }

  if (!data) {
    console.log('');
    console.log('No se han podido obtener resenas automaticamente.');
    console.log('');
    console.log('Para activar sincronizacion automatica:');
    console.log('');
    console.log('1. SerpAPI (100 gratis/mes):');
    console.log('   https://serpapi.com');
    console.log('   Anade SERPAPI_KEY a Vercel');
    console.log('');
    console.log('2. Outscraper (25 gratis/mes):');
    console.log('   https://outscraper.com');
    console.log('   Anade OUTSCRAPER_KEY a Vercel');
    console.log('');

    data = {
      rating: 5,
      total: 0,
      reviews: [],
    };
  }

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
  console.log('Guardado en public/data/google-reviews.json');
  console.log(`Rating: ${data.rating}`);
  console.log(`Resenas: ${data.reviews.length}`);
  console.log('');
  console.log('Sincronizacion completada.');
  console.log('============================================');
}

main().catch(console.error);

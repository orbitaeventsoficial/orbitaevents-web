// Add English translations for all blog posts
// Generates EN translations based on ES content structure
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// English translations for each post slug
const EN_TRANSLATIONS: Record<string, { title: string; excerpt: string; metaTitle: string; metaDescription: string }> = {
  'cuanto-cuesta-dj-boda-barcelona-2025': {
    title: 'How Much Does a Wedding DJ Cost in Barcelona in 2026: Complete Price Guide',
    excerpt: 'Discover the real prices for hiring a professional DJ for your wedding in Barcelona. Pack comparison, what each service includes, and tips for choosing the best option.',
    metaTitle: 'Wedding DJ Price Barcelona 2026 | Complete Rate Guide',
    metaDescription: 'Find out how much a wedding DJ costs in Barcelona in 2026. Prices from €250, service comparison and tips for choosing the best DJ for your wedding.',
  },
  'diferencias-discomovil-dj-profesional': {
    title: 'Mobile Disco vs Professional DJ: Key Differences You Should Know',
    excerpt: 'Understand the real differences between a mobile disco service and a professional DJ. Equipment, experience, pricing and which one suits your event best.',
    metaTitle: 'Mobile Disco vs Professional DJ | Complete Comparison',
    metaDescription: 'Mobile disco or professional DJ? Discover the key differences in equipment, experience and pricing to choose the best option for your event.',
  },
  'ideas-musica-primer-baile-boda': {
    title: 'First Dance Song Ideas: The Ultimate Guide for Your Wedding',
    excerpt: 'Find the perfect first dance song for your wedding. From classic romantic ballads to modern hits, discover options for every style of couple.',
    metaTitle: 'First Dance Songs for Weddings 2026 | Top Ideas',
    metaDescription: 'Looking for the perfect first dance song? Browse our curated list of romantic, modern and original songs for your wedding first dance.',
  },
  'efectos-especiales-bodas-humo-chispas': {
    title: 'Special Effects for Weddings: Smoke, Cold Sparks and More',
    excerpt: 'Transform your wedding with professional special effects. Low fog, cold sparklers, CO2 cannons and confetti — discover what each effect offers and when to use it.',
    metaTitle: 'Wedding Special Effects Barcelona | Smoke, Sparks & More',
    metaDescription: 'Professional special effects for weddings in Barcelona. Low fog, cold sparklers, CO2 effects. Create unforgettable moments at your celebration.',
  },
  'tendencias-bodas-barcelona-2025': {
    title: 'Wedding Trends in Barcelona 2025: Everything You Need to Know',
    excerpt: 'Discover the latest wedding trends in Barcelona. From music and lighting to decoration and entertainment, stay ahead of the curve for your celebration.',
    metaTitle: 'Wedding Trends Barcelona 2025 | Complete Guide',
    metaDescription: 'The latest wedding trends in Barcelona for 2025. Music, lighting, entertainment and decoration ideas for your perfect celebration.',
  },
  '50-mejores-canciones-primer-baile-boda': {
    title: '50 Best First Dance Songs for Your Wedding',
    excerpt: 'The ultimate playlist of 50 first dance songs organized by style: romantic, modern, international and fun. Find the one that tells your love story.',
    metaTitle: '50 Best First Dance Songs | Wedding Playlist 2026',
    metaDescription: 'Discover the 50 best first dance songs for weddings. From Ed Sheeran to Elvis, find the perfect song for your special moment.',
  },
  'ideas-decoracion-fiesta-halloween-casa': {
    title: 'Halloween Party Decoration Ideas: Complete Home Guide',
    excerpt: 'Transform your home into a haunted house with these professional Halloween decoration ideas. DIY tips, lighting effects and spooky atmosphere tricks.',
    metaTitle: 'Halloween Party Decoration Ideas | Home Guide',
    metaDescription: 'Best Halloween party decoration ideas for your home. Professional tips for lighting, atmosphere and spooky effects that will impress your guests.',
  },
  'guia-organizar-fiesta-cumpleanos-adultos': {
    title: 'How to Organize an Adult Birthday Party: Complete Guide',
    excerpt: 'Everything you need to plan the perfect adult birthday party. Venue, music, catering, entertainment and timeline tips from event professionals.',
    metaTitle: 'Adult Birthday Party Guide | Planning Tips 2026',
    metaDescription: 'Complete guide to organizing an adult birthday party. Professional tips for music, venue, entertainment and creating an unforgettable celebration.',
  },
  'musica-cena-empresa-playlist-perfecta': {
    title: 'Music for Corporate Dinners: The Perfect Playlist Guide',
    excerpt: 'Create the ideal musical atmosphere for your corporate dinner. Professional playlists for cocktails, dinner and after-dinner, adapted to every moment.',
    metaTitle: 'Corporate Dinner Music | Professional Playlist Guide',
    metaDescription: 'Professional music guide for corporate dinners. Curated playlists for cocktails, dinner and networking moments. Create the perfect atmosphere.',
  },
  'mejores-masias-bodas-barcelona-girona': {
    title: 'Best Masías for Weddings in Barcelona and Girona',
    excerpt: 'Discover the most beautiful country estates (masías) for weddings in Barcelona and Girona. Capacity, style, pricing and insider tips from event professionals.',
    metaTitle: 'Best Wedding Venues Barcelona & Girona | Masías Guide',
    metaDescription: 'Top masías and country estates for weddings in Barcelona and Girona. Compare venues, capacity, style and prices for your dream wedding.',
  },
  'fiesta-tematica-harry-potter-mundo-magico': {
    title: 'Harry Potter Theme Party: Complete Wizarding World Guide',
    excerpt: 'Create a magical Harry Potter themed party with professional tips. Decoration, music, activities and special effects to transport your guests to Hogwarts.',
    metaTitle: 'Harry Potter Theme Party | Complete Planning Guide',
    metaDescription: 'Plan the ultimate Harry Potter theme party. Professional tips for decoration, music, activities and magical effects for an unforgettable wizarding experience.',
  },
  'cuantas-horas-dj-necesito-boda': {
    title: 'How Many Hours of DJ Do You Need for a Wedding?',
    excerpt: 'Calculate the ideal DJ hours for your wedding. From cocktail to closing, we break down the timeline and how to optimize your entertainment budget.',
    metaTitle: 'How Many DJ Hours for a Wedding? | Planning Guide',
    metaDescription: 'Find out exactly how many hours of DJ you need for your wedding. Timeline breakdown, pricing per hour and tips to optimize your entertainment budget.',
  },
  'dj-corporatiu-barcelona-empreses': {
    title: 'Corporate DJ in Barcelona: Professional Event Entertainment',
    excerpt: 'Professional DJ services for corporate events in Barcelona. Product launches, team building, galas and company parties with premium sound and lighting.',
    metaTitle: 'Corporate DJ Barcelona | Professional Event Entertainment',
    metaDescription: 'Professional corporate DJ services in Barcelona. Premium sound, lighting and entertainment for company events, galas and team building activities.',
  },
  'dj-girona-events-festes': {
    title: 'DJ Services in Girona: Events and Parties on the Costa Brava',
    excerpt: 'Professional DJ and entertainment services in Girona and Costa Brava. Weddings, private parties and corporate events with premium equipment.',
    metaTitle: 'DJ Girona & Costa Brava | Events & Parties',
    metaDescription: 'Professional DJ services in Girona and Costa Brava. Weddings, parties and events with premium sound, lighting and entertainment.',
  },
  'alquiler-equipo-sonido-iluminacion-barcelona': {
    title: 'Sound and Lighting Equipment Rental in Barcelona',
    excerpt: 'Professional sound and lighting equipment rental for events in Barcelona. PA systems, LED lights, moving heads and DJ equipment with technical support.',
    metaTitle: 'Sound & Lighting Rental Barcelona | Professional Equipment',
    metaDescription: 'Rent professional sound and lighting equipment in Barcelona. PA systems, LED lighting, moving heads. Delivery, setup and technical support included.',
  },
  'checklist-dj-casament-boda': {
    title: 'Wedding DJ Checklist: Everything to Prepare Before Your Big Day',
    excerpt: 'The complete checklist for coordinating with your wedding DJ. Music preferences, timeline, special songs, announcements and all the details that matter.',
    metaTitle: 'Wedding DJ Checklist | Complete Preparation Guide',
    metaDescription: 'Essential wedding DJ checklist. Song lists, timeline coordination, special moments and all the details to ensure perfect music at your wedding.',
  },
  'iluminacion-bodas-guia-efectos-ambientes': {
    title: 'Wedding Lighting: Complete Guide to Effects and Atmospheres',
    excerpt: 'Discover how professional lighting transforms your wedding. From moving heads to wash LEDs, we explain every effect and when to use it.',
    metaTitle: 'Wedding Lighting Barcelona 2026 | Effects Guide',
    metaDescription: 'Complete wedding lighting guide in Barcelona. Moving heads, LED wash, uplighting and more. Transform your celebration with professional lighting.',
  },
  '10-errores-contratar-dj-evento': {
    title: '10 Common Mistakes When Hiring a DJ for Your Event',
    excerpt: 'Avoid the most common pitfalls when booking a DJ. From not checking references to ignoring the venue acoustics, learn from others\' mistakes.',
    metaTitle: '10 DJ Hiring Mistakes to Avoid | Expert Advice',
    metaDescription: 'Don\'t make these 10 common mistakes when hiring a DJ for your event. Expert advice on contracts, equipment, experience and what to look for.',
  },
  'bodas-tematicas-crear-fiesta-inolvidable': {
    title: 'Themed Weddings: How to Create an Unforgettable Celebration',
    excerpt: 'From vintage to tropical, discover how to plan a themed wedding that reflects your personality. Ideas for decoration, music and entertainment.',
    metaTitle: 'Themed Weddings Guide | Create Your Dream Celebration',
    metaDescription: 'Plan an unforgettable themed wedding. Ideas for vintage, bohemian, tropical and modern themes with matching music, decor and entertainment.',
  },
  'musica-eventos-corporativos-cocktail-fiesta': {
    title: 'Music for Corporate Events: From Cocktails to Dance Floor',
    excerpt: 'Professional music programming for corporate events. Create the right atmosphere for networking, dinner and celebration with the perfect soundtrack.',
    metaTitle: 'Corporate Event Music | Professional DJ Guide',
    metaDescription: 'Professional music guide for corporate events. Cocktail ambiance, dinner sets and party programming. Create the perfect corporate entertainment.',
  },
  'efectos-especiales-fiestas-co2-bengalas': {
    title: 'Special Effects for Parties: CO2, Cold Sparks and More',
    excerpt: 'Take your party to the next level with professional special effects. CO2 cannons, cold sparklers, confetti and laser shows explained.',
    metaTitle: 'Party Special Effects | CO2, Sparks & Laser Guide',
    metaDescription: 'Professional special effects for parties and events. CO2 cannons, cold sparklers, confetti, laser. Safe, spectacular effects that wow your guests.',
  },
  'como-organizar-fiesta-fin-ano-perfecta': {
    title: 'How to Organize the Perfect New Year\'s Eve Party',
    excerpt: 'Plan an unforgettable New Year\'s Eve celebration. From venue and music to the countdown and special effects, a complete guide from event professionals.',
    metaTitle: 'New Year\'s Eve Party Guide | Planning Tips',
    metaDescription: 'Organize the perfect New Year\'s Eve party. Professional tips for music, effects, countdown and creating an unforgettable celebration.',
  },
  'sonido-profesional-vs-casero-diferencia': {
    title: 'Professional vs Home Sound Systems: The Real Difference',
    excerpt: 'Why professional sound matters for events. Compare PA systems, audio quality and coverage to understand what makes the difference at your celebration.',
    metaTitle: 'Professional vs Home Sound | Event Audio Guide',
    metaDescription: 'Professional vs home sound systems for events. Understand the real difference in quality, power and coverage that makes your event sound amazing.',
  },
  'mejores-canciones-cada-momento-boda': {
    title: 'Best Songs for Every Moment of Your Wedding',
    excerpt: 'The perfect soundtrack for every wedding moment. From the ceremony entrance to the last dance, curated playlists for each part of your celebration.',
    metaTitle: 'Wedding Songs for Every Moment | Complete Playlist',
    metaDescription: 'Curated wedding playlists for every moment: ceremony, cocktail, dinner, first dance, party. The perfect soundtrack for your perfect day.',
  },
  'fiestas-cumpleanos-adultos-ideas-2026': {
    title: 'Adult Birthday Party Ideas 2026: Trends and Inspiration',
    excerpt: 'Fresh ideas for adult birthday parties in 2026. Themes, entertainment, music and decoration trends to create a celebration that stands out.',
    metaTitle: 'Adult Birthday Party Ideas 2026 | Trends & Inspiration',
    metaDescription: 'Top adult birthday party ideas for 2026. Latest trends in themes, entertainment, music and decoration for unforgettable celebrations.',
  },
  'discomovil-profesional-diferencia': {
    title: 'What Makes a Professional Mobile Disco Different?',
    excerpt: 'Not all mobile discos are the same. Discover what separates a professional service from amateur setups: equipment, experience and the details that matter.',
    metaTitle: 'Professional Mobile Disco | What Makes the Difference',
    metaDescription: 'What makes a professional mobile disco stand out? Equipment quality, DJ experience, lighting and sound that transform any event into an unforgettable party.',
  },
  'tendencias-bodas-barcelona-2026': {
    title: 'Wedding Trends Barcelona 2026: The Complete Guide',
    excerpt: 'Stay ahead with the latest wedding trends for 2026 in Barcelona. Sustainability, micro-weddings, immersive entertainment and the new aesthetics.',
    metaTitle: 'Wedding Trends Barcelona 2026 | The Complete Guide',
    metaDescription: 'Discover the top wedding trends in Barcelona for 2026. Sustainability, immersive entertainment, micro-weddings and the latest in music and lighting.',
  },
  'guia-organizar-evento-empresa-exitoso': {
    title: 'How to Organize a Successful Corporate Event: Complete Guide',
    excerpt: 'Step-by-step guide to planning a successful corporate event. Venue selection, entertainment, catering coordination and timeline management from professionals.',
    metaTitle: 'Corporate Event Planning Guide | Step by Step',
    metaDescription: 'Complete guide to organizing successful corporate events. Professional tips for venue, entertainment, catering and timeline management.',
  },
};

async function main() {
  console.log('Adding English translations...\n');

  // Check if EN translations already exist
  const existingEn = await prisma.blogPostTranslation.count({ where: { locale: 'en' } });
  if (existingEn > 0) {
    console.log(`Already ${existingEn} EN translations exist. Skipping.`);
    await prisma.$disconnect();
    return;
  }

  // Get all posts with their ES translations (for content)
  const posts = await prisma.blogPost.findMany({
    include: {
      translations: {
        where: { locale: 'es' },
      },
    },
  });

  let created = 0;
  for (const post of posts) {
    const enData = EN_TRANSLATIONS[post.slug];
    const esTranslation = post.translations[0];

    if (!enData || !esTranslation) {
      console.log(`  ⚠️ Skipping ${post.slug} (no EN data or no ES translation)`);
      continue;
    }

    // Use ES content as base (HTML with internal links already using locale-aware routing)
    // Replace Spanish link text patterns with English equivalents
    let content = esTranslation.content
      .replace(/Consulta nuestros/g, 'Check our')
      .replace(/Ver más/g, 'See more')
      .replace(/Solicita presupuesto/g, 'Get a quote')
      .replace(/Configura tu pack/g, 'Configure your pack')
      .replace(/configurador de precios/g, 'price configurator')
      .replace(/packs de DJ para bodas/g, 'wedding DJ packs')
      .replace(/En Orbita Events/g, 'At Orbita Events')
      .replace(/nuestro equipo/g, 'our team')
      .replace(/contacta con nosotros/g, 'contact us');

    await prisma.blogPostTranslation.create({
      data: {
        postId: post.id,
        locale: 'en',
        title: enData.title,
        excerpt: enData.excerpt,
        content,
        metaTitle: enData.metaTitle,
        metaDescription: enData.metaDescription,
      },
    });

    console.log(`  ✅ ${post.slug}`);
    created++;
  }

  console.log(`\nDone! ${created} EN translations created.`);
  await prisma.$disconnect();
}

main();

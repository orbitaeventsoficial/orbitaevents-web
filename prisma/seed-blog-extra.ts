// prisma/seed-blog-extra.ts
// 12 blog posts SEO addicionals per Orbita Events
// Març 2026

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📝 Iniciant seed dels blog posts extra...\n');

  const blogPosts = [
    // ═══════════════════════════════════════════════════════════════════════════
    // 1. ILUMINACIÓN PARA BODAS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'iluminacion-bodas-guia-efectos-ambientes',
      author: 'Òrbita Events',
      category: 'bodas',
      tags: ['bodas', 'iluminación', 'efectos', 'ambiente', 'barcelona'],
      isPublished: true,
      publishedAt: new Date('2025-10-12'),
      readingTime: 7,
      translations: [
        {
          locale: 'es',
          title: 'Iluminación para Bodas: Guía Completa de Efectos y Ambientes',
          excerpt: 'Descubre cómo la iluminación profesional transforma tu boda. Desde cabezas móviles hasta wash de color, te explicamos cada efecto y cuándo usarlo.',
          metaTitle: 'Iluminación para Bodas Barcelona 2026 | Guía de Efectos',
          metaDescription: 'Guía completa de iluminación para bodas en Barcelona. Cabezas móviles, wash LED, uplighting y más. Transforma tu celebración con luz profesional.',
          content: `<h2>Cómo la Iluminación Transforma tu Boda</h2>

<p>La <strong>iluminación profesional</strong> es uno de los elementos que más impacto tiene en una boda. Puede transformar una sala sencilla en un espacio mágico, crear ambientes íntimos durante la cena y convertir la pista de baile en una auténtica discoteca.</p>

<p>En esta guía te explicamos los diferentes tipos de iluminación para bodas, cuándo usar cada efecto y cómo elegir el servicio adecuado para tu celebración.</p>

<h2>Tipos de Iluminación para Bodas</h2>

<h3>1. Uplighting (Iluminación Ambiental)</h3>
<p>Los focos LED de suelo proyectan luz hacia arriba por las paredes, creando un ambiente envolvente. Puedes elegir colores que combinen con la decoración de tu boda: dorado para elegancia, rosa para romanticismo, azul para un toque moderno.</p>
<p><strong>Ideal para:</strong> Cocktail, cena y momentos tranquilos.</p>

<h3>2. Cabezas Móviles</h3>
<p>Son los focos robotizados que ves en conciertos y festivales. Crean haces de luz dinámicos que dan vida a la pista de baile. En <a href="/es/servicios">Orbita Events</a> utilizamos cabezas móviles beam y spot de última generación.</p>
<p><strong>Ideal para:</strong> Fiesta y baile, primer baile especial.</p>

<h3>3. Wash LED</h3>
<p>Focos de gran cobertura que bañan zonas amplias con color. Son perfectos para crear transiciones de ambiente entre la cena y la fiesta.</p>

<h3>4. Gobos Personalizados</h3>
<p>Proyecciones de vuestros nombres, fecha de boda o monograma sobre el suelo o las paredes. Un detalle premium que da un toque muy personal.</p>

<h3>5. Guirnaldas de Bombillas (String Lights)</h3>
<p>Las clásicas guirnaldas de bombillas Edison crean un ambiente cálido y acogedor, perfecto para bodas al aire libre en masías de Barcelona y Girona.</p>

<h2>Efectos de Luz para Momentos Especiales</h2>

<h3>Primer Baile</h3>
<p>Combinamos un <strong>spot follow</strong> (foco que os sigue) con una base de wash suave. Si añadís <a href="/es/servicios">humo bajo</a>, el efecto es de película: bailaréis literalmente sobre las nubes.</p>

<h3>Entrada de los Novios</h3>
<p>Un flash de cabezas móviles sincronizado con la música crea un momento épico. Añadid <strong>bengalas frías</strong> y la entrada será inolvidable.</p>

<h3>Hora Loca / Fiesta</h3>
<p>Aquí desplegamos todo: cabezas móviles, strobo, láser y efectos de CO2. La pista de baile se convierte en una discoteca profesional.</p>

<h2>Cuánto Cuesta la Iluminación para una Boda</h2>

<p>Los precios varían según la complejidad:</p>
<ul>
<li><strong>Iluminación básica (incluida en packs DJ):</strong> Focos LED de colores + cabezas móviles estándar</li>
<li><strong>Iluminación premium (200-400€ extra):</strong> Uplighting perimetral + gobos + efectos especiales</li>
<li><strong>Iluminación arquitectónica (500-1000€):</strong> Diseño completo con guirnaldas, uplighting y efectos sincronizados</li>
</ul>

<p>En nuestros <a href="/es/packs">packs de DJ para bodas</a> ya incluimos iluminación profesional con cabezas móviles y focos LED. Si quieres algo más personalizado, usa nuestro <a href="/es/configurador">configurador de precios</a> para ver opciones.</p>

<h2>Consejos para la Iluminación de tu Boda</h2>

<ul>
<li><strong>Visita el espacio de noche:</strong> La iluminación existente del venue afecta al resultado final</li>
<li><strong>Piensa en transiciones:</strong> La luz debe cambiar con el ritmo del evento: cálida en cena, dinámica en fiesta</li>
<li><strong>Coordina con el fotógrafo:</strong> Una buena iluminación también mejora las fotos</li>
<li><strong>No escatimes en potencia:</strong> Mejor sobrar que faltar, especialmente en espacios grandes</li>
</ul>

<p><strong>¿Quieres ver cómo quedaría la iluminación en tu boda?</strong> <a href="/es/contacto">Contacta con nosotros</a> y te preparamos una propuesta personalizada.</p>`
        },
        {
          locale: 'ca',
          title: "Il·luminació per Casaments: Guia Completa d'Efectes i Ambients",
          excerpt: "Descobreix com la il·luminació professional transforma el teu casament. Des de caps mòbils fins a wash de color, t'expliquem cada efecte i quan usar-lo.",
          metaTitle: "Il·luminació per Casaments Barcelona 2026 | Guia d'Efectes",
          metaDescription: "Guia completa d'il·luminació per casaments a Barcelona. Caps mòbils, wash LED, uplighting i més. Transforma la teva celebració amb llum professional.",
          content: `<h2>Com la Il·luminació Transforma el teu Casament</h2>

<p>La <strong>il·luminació professional</strong> és un dels elements que més impacte té en un casament. Pot transformar una sala senzilla en un espai màgic, crear ambients íntims durant el sopar i convertir la pista de ball en una autèntica discoteca.</p>

<h2>Tipus d'Il·luminació per Casaments</h2>

<h3>1. Uplighting (Il·luminació Ambiental)</h3>
<p>Els focus LED de terra projecten llum cap amunt per les parets, creant un ambient envoltant. Pots triar colors que combinin amb la decoració.</p>

<h3>2. Caps Mòbils</h3>
<p>Focus robotitzats que creen feixos de llum dinàmics. A <a href="/ca/servicios">Orbita Events</a> utilitzem caps mòbils beam i spot d'última generació.</p>

<h3>3. Wash LED</h3>
<p>Focus de gran cobertura que banyen zones àmplies amb color.</p>

<h3>4. Gobos Personalitzats</h3>
<p>Projeccions dels vostres noms o monograma sobre el terra o les parets.</p>

<h3>5. Guirnaldes de Bombetes (String Lights)</h3>
<p>Creen un ambient càlid i acollidor, perfecte per casaments a l'aire lliure en masies.</p>

<h2>Efectes de Llum per Moments Especials</h2>

<h3>Primer Ball</h3>
<p>Spot follow amb wash suau. Amb <a href="/ca/servicios">fum baix</a>, ballareu sobre els núvols.</p>

<h3>Entrada dels Nuvis</h3>
<p>Flash de caps mòbils sincronitzat amb la música i bengales fredes.</p>

<h2>Quant Costa</h2>
<ul>
<li><strong>Bàsica (inclosa en packs):</strong> Focus LED + caps mòbils</li>
<li><strong>Premium (200-400€):</strong> Uplighting + gobos + efectes</li>
<li><strong>Arquitectònica (500-1000€):</strong> Disseny complet</li>
</ul>

<p>Als nostres <a href="/ca/packs">packs de DJ</a> ja incloem il·luminació professional. Usa el <a href="/ca/configurador">configurador</a> per personalitzar.</p>

<p><strong>Vols veure com quedaria?</strong> <a href="/ca/contacto">Contacta amb nosaltres</a>.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. ERRORES AL CONTRATAR DJ
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: '10-errores-contratar-dj-evento',
      author: 'Òrbita Events',
      category: 'consejos',
      tags: ['dj', 'errores', 'consejos', 'eventos'],
      isPublished: true,
      publishedAt: new Date('2025-11-05'),
      readingTime: 6,
      translations: [
        {
          locale: 'es',
          title: '10 Errores que Debes Evitar al Contratar un DJ para tu Evento',
          excerpt: 'Contratar un DJ parece sencillo, pero hay trampas que pueden arruinar tu fiesta. Te explicamos los 10 errores más comunes y cómo evitarlos.',
          metaTitle: '10 Errores al Contratar DJ | Guía para No Equivocarte',
          metaDescription: 'Evita los errores más comunes al contratar un DJ para tu boda o evento. Desde no pedir referencias hasta no firmar contrato. Guía completa.',
          content: `<h2>No Cometas Estos Errores al Contratar tu DJ</h2>

<p>Contratar un DJ para tu boda o evento puede parecer simple: buscas en internet, comparas precios y listo. Pero la realidad es que hay muchos detalles que pueden marcar la diferencia entre una fiesta increíble y una noche decepcionante.</p>

<p>Después de años organizando eventos en Barcelona y Girona, en <a href="/es/servicios">Orbita Events</a> hemos visto todos los errores posibles. Aquí te contamos los 10 más frecuentes.</p>

<h2>Error 1: Elegir Solo por Precio</h2>
<p>El precio más bajo casi nunca es la mejor opción. Un DJ que cobra 100€ probablemente usa equipo viejo, no tiene seguro y desaparecerá si surge un problema. <strong>Invierte en calidad.</strong></p>

<h2>Error 2: No Pedir Vídeos de Eventos Anteriores</h2>
<p>Las fotos de equipo no te dicen nada sobre cómo es el DJ en acción. Pide vídeos reales de bodas o fiestas.</p>

<h2>Error 3: No Reunirte en Persona</h2>
<p>El DJ estará presente durante horas en tu evento. Si no conectáis, se notará.</p>

<h2>Error 4: No Especificar la Música que Quieres</h2>
<p>Tan importante es decir qué géneros te gustan como cuáles no quieres bajo ningún concepto.</p>

<h2>Error 5: Olvidar Preguntar por el Equipo</h2>
<p>¿Qué potencia tiene el sonido? ¿Qué iluminación incluye? Para 100+ invitados necesitas mínimo <strong>4000W</strong>.</p>

<h2>Error 6: No Firmar Contrato</h2>
<p>Sin contrato no hay garantía. Horarios, equipo, precio, cancelación: todo por escrito.</p>

<h2>Error 7: Contratar un DJ de Discoteca para una Boda</h2>
<p>Las bodas tienen protocolo: primer baile, corte de tarta, discursos. Necesitas experiencia en eventos privados.</p>

<h2>Error 8: No Preguntar por el Desplazamiento</h2>
<p>En <a href="/es/packs">nuestros packs</a> incluimos desplazamiento gratuito en 25 km.</p>

<h2>Error 9: Dejar la Música para el Final</h2>
<p>Contacta con el DJ al menos 2-3 meses antes para planificar bien.</p>

<h2>Error 10: No Pedir Seguro de Responsabilidad Civil</h2>
<p>Un DJ profesional siempre tiene seguro. Pídelo.</p>

<p>En <a href="/es/servicios">Orbita Events</a> todos nuestros servicios incluyen contrato, seguro, equipo de respaldo y reunión previa. <a href="/es/configurador">Configura tu pack</a> o <a href="/es/contacto">contacta con nosotros</a>.</p>`
        },
        {
          locale: 'ca',
          title: "10 Errors que Has d'Evitar en Contractar un DJ pel teu Event",
          excerpt: "Contractar un DJ sembla senzill, però hi ha paranys que poden arruïnar la teva festa. T'expliquem els 10 errors més comuns.",
          metaTitle: "10 Errors en Contractar DJ | Guia per No Equivocar-te",
          metaDescription: "Evita els errors més comuns en contractar un DJ per al teu casament o event.",
          content: `<h2>No Cometis Aquests Errors</h2>

<p>A <a href="/ca/servicios">Orbita Events</a> hem vist tots els errors possibles. Aquí t'expliquem els 10 més freqüents.</p>

<h2>Error 1: Triar Només per Preu</h2>
<p>El preu més baix gairebé mai és la millor opció.</p>

<h2>Error 2: No Demanar Vídeos</h2>
<p>Demana vídeos reals d'events anteriors.</p>

<h2>Error 3: No Reunir-te en Persona</h2>
<p>Si no connecteu, es notarà.</p>

<h2>Error 4: No Especificar la Música</h2>
<p>Directrius clares de gèneres que vols i que no.</p>

<h2>Error 5: No Preguntar per l'Equip</h2>
<p>Mínimo <strong>4000W</strong> per 100+ convidats.</p>

<h2>Error 6: No Signar Contracte</h2>
<p>Tot per escrit.</p>

<h2>Error 7: DJ de Discoteca per un Casament</h2>
<p>Necessites experiència en events privats.</p>

<h2>Error 8: No Preguntar pel Desplaçament</h2>
<p>Als nostres <a href="/ca/packs">packs</a> incloem 25 km gratuïts.</p>

<h2>Error 9: Deixar la Música pel Final</h2>
<p>Contacta 2-3 mesos abans.</p>

<h2>Error 10: No Demanar Assegurança</h2>
<p>Un DJ professional sempre en té.</p>

<p>A <a href="/ca/servicios">Orbita Events</a> incloem contracte, assegurança i equip de recanvi. <a href="/ca/configurador">Configura el teu pack</a>.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. BODAS TEMÁTICAS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'bodas-tematicas-crear-fiesta-inolvidable',
      author: 'Òrbita Events',
      category: 'tendencias',
      tags: ['bodas', 'temáticas', 'tendencias', 'decoración', 'barcelona'],
      isPublished: true,
      publishedAt: new Date('2025-12-03'),
      readingTime: 8,
      translations: [
        {
          locale: 'es',
          title: 'Bodas Temáticas: Cómo Crear una Fiesta Inolvidable',
          excerpt: 'Las bodas temáticas son la tendencia que arrasa en Barcelona. Desde bodas rústicas hasta fiestas de los 80, te damos ideas y consejos.',
          metaTitle: 'Bodas Temáticas Barcelona 2026 | Ideas e Inspiración',
          metaDescription: 'Ideas para bodas temáticas en Barcelona: rústica, vintage, tropical, años 80, Halloween y más.',
          content: `<h2>Bodas Temáticas: La Tendencia que lo Cambia Todo</h2>

<p>Las <strong>bodas temáticas</strong> permiten crear una experiencia única que refleja la personalidad de la pareja. En <a href="/es/servicios">Orbita Events</a> hemos participado en bodas de todo tipo.</p>

<h2>Ideas que Funcionan</h2>

<h3>Boda Rústica / Boho</h3>
<p>Guirnaldas Edison, música acústica en cocktail y folk-pop en la fiesta. Equipo de sonido discreto, iluminación cálida.</p>

<h3>Boda Vintage Años 20 / Gran Gatsby</h3>
<p>Jazz, swing, glamour. Iluminación art deco con gobos geométricos. Del jazz suave al electroswing.</p>

<h3>Boda Años 80</h3>
<p>Neones, láser, éxitos de los 80. Efectos de humo, strobo y LED multicolor. Michael Jackson, Queen, Madonna.</p>

<h3>Boda Tropical</h3>
<p>Reggaetón, salsa, bachata. Iluminación en ámbar, naranja y verde. Máquina de burbujas.</p>

<h3>Boda Halloween</h3>
<p>Humo bajo para el primer baile, iluminación en morado y naranja, CO2 y bengalas frías. Consulta nuestra <a href="/es/tematica">página de fiestas temáticas</a>.</p>

<h3>Boda Festival</h3>
<p>Escenario con backline, DJ + música en directo, zonas chill-out y food trucks.</p>

<h2>Cómo Adaptar Música e Iluminación</h2>
<ul>
<li><strong>Cocktail:</strong> Música suave acorde con la temática</li>
<li><strong>Cena:</strong> Volumen bajo, iluminación cálida, canciones temáticas sin molestar</li>
<li><strong>Fiesta:</strong> Luces dinámicas, efectos especiales, playlist temática a tope</li>
</ul>

<h2>Presupuesto</h2>
<ul>
<li>Iluminación temática: +150-300€</li>
<li>Efectos especiales: +100-250€</li>
<li>Playlist personalizada: incluida en el servicio</li>
</ul>

<p>Usa nuestro <a href="/es/configurador">configurador</a> o <a href="/es/contacto">cuéntanos tu idea</a> y la hacemos realidad.</p>`
        },
        {
          locale: 'ca',
          title: 'Casaments Temàtics: Com Crear una Festa Inoblidable',
          excerpt: "Els casaments temàtics són la tendència que arrasa a Barcelona. Des de casaments rústics fins a festes dels 80.",
          metaTitle: 'Casaments Temàtics Barcelona 2026 | Idees i Inspiració',
          metaDescription: 'Idees per casaments temàtics a Barcelona: rústic, vintage, tropical, anys 80, Halloween i més.',
          content: `<h2>Casaments Temàtics: La Tendència que ho Canvia Tot</h2>

<p>A <a href="/ca/servicios">Orbita Events</a> hem participat en casaments de tot tipus.</p>

<h3>Casament Rústic / Boho</h3>
<p>Guirnaldes Edison, música acústica en cocktail, folk-pop a la festa.</p>

<h3>Casament Vintage Anys 20</h3>
<p>Jazz, swing i glamur. Il·luminació art deco.</p>

<h3>Casament Anys 80</h3>
<p>Neons, làser, èxits dels 80. Fum, estrobo i LED multicolor.</p>

<h3>Casament Tropical</h3>
<p>Reggaeton, salsa, batxata. Il·luminació càlida.</p>

<h3>Casament Halloween</h3>
<p>Fum baix, il·luminació lila i taronja, CO2 i bengales fredes.</p>

<p>Usa el nostre <a href="/ca/configurador">configurador</a> o <a href="/ca/contacto">explica'ns la teva idea</a>.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. MÚSICA EVENTOS CORPORATIVOS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'musica-eventos-corporativos-cocktail-fiesta',
      author: 'Òrbita Events',
      category: 'eventos',
      tags: ['corporativo', 'música', 'empresa', 'teambuilding', 'barcelona'],
      isPublished: true,
      publishedAt: new Date('2025-12-20'),
      readingTime: 6,
      translations: [
        {
          locale: 'es',
          title: 'Guía de Música para Eventos Corporativos: Del Cocktail a la Fiesta',
          excerpt: 'La música en eventos de empresa marca la diferencia. Cómo elegir la playlist perfecta para cada momento de tu evento corporativo.',
          metaTitle: 'Música para Eventos Corporativos Barcelona | Guía Completa',
          metaDescription: 'Cómo elegir la música para tu evento de empresa en Barcelona. Del cocktail networking a la cena de gala y la fiesta final.',
          content: `<h2>La Música que tu Evento Corporativo Necesita</h2>

<p>La música en un <strong>evento corporativo</strong> es una herramienta estratégica que potencia el networking y crea experiencias memorables. En <a href="/es/servicios">Orbita Events</a> llevamos años con empresas de Barcelona.</p>

<h2>Música por Fases</h2>

<h3>1. Recepción y Networking (60-90 min)</h3>
<p>Lounge, deep house suave, jazz contemporáneo. Volumen bajo para conversación.</p>

<h3>2. Cena de Gala (90-120 min)</h3>
<p>Smooth jazz, soul clásico, pop acústico. Micrófono inalámbrico para discursos.</p>

<h3>3. Premiación / Presentación</h3>
<p>Temas épicos para entradas, aplausos musicalizados, spot follow para premiados.</p>

<h3>4. Fiesta (2-4 horas)</h3>
<p>Pop internacional, hits actuales, clásicos bailables. Sonido de alta potencia, iluminación dinámica, efectos opcionales.</p>

<h2>Errores Comunes</h2>
<ul>
<li>Música demasiado alta durante networking</li>
<li>No tener micrófono para discursos</li>
<li>Playlist automática sin DJ que controle</li>
<li>Ignorar la diversidad de edades/culturas</li>
</ul>

<p>Consulta nuestros <a href="/es/packs">packs corporativos desde 450€</a> o usa el <a href="/es/configurador">configurador</a>.</p>

<p><strong>¿Organizas un evento de empresa?</strong> <a href="/es/contacto">Hablemos</a>.</p>`
        },
        {
          locale: 'ca',
          title: "Guia de Música per Events Corporatius: Del Cocktail a la Festa",
          excerpt: "La música en events d'empresa marca la diferència. Com triar la playlist perfecta per cada moment.",
          metaTitle: 'Música per Events Corporatius Barcelona | Guia Completa',
          metaDescription: "Com triar la música pel teu event d'empresa a Barcelona.",
          content: `<h2>La Música que el teu Event Corporatiu Necessita</h2>

<p>A <a href="/ca/servicios">Orbita Events</a> portem anys amb empreses de Barcelona.</p>

<h3>1. Recepció i Networking</h3>
<p>Lounge, deep house suau, jazz contemporani. Volum baix.</p>

<h3>2. Sopar de Gala</h3>
<p>Jazz, soul clàssic. Micro per discursos.</p>

<h3>3. Premiació</h3>
<p>Temes èpics, spot follow per premiats.</p>

<h3>4. Festa</h3>
<p>Pop internacional, hits actuals, clàssics ballables.</p>

<p>Consulta els nostres <a href="/ca/packs">packs corporatius des de 450€</a> o usa el <a href="/ca/configurador">configurador</a>.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. EFECTOS ESPECIALES
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'efectos-especiales-fiestas-co2-bengalas',
      author: 'Òrbita Events',
      category: 'tecnologia',
      tags: ['efectos', 'CO2', 'bengalas', 'tecnología', 'fiestas'],
      isPublished: true,
      publishedAt: new Date('2026-01-08'),
      readingTime: 7,
      translations: [
        {
          locale: 'es',
          title: 'Efectos Especiales para Fiestas: CO2, Bengalas Frías, Humo Bajo y Más',
          excerpt: 'Los efectos especiales transforman cualquier fiesta. Te explicamos cada efecto, cuándo usarlo y cuánto cuesta.',
          metaTitle: 'Efectos Especiales Fiestas | CO2, Bengalas, Humo Bajo',
          metaDescription: 'Guía completa de efectos especiales para fiestas y bodas. Cañones de CO2, bengalas frías, humo bajo, confeti. Precios.',
          content: `<h2>Efectos Especiales que Transforman tu Fiesta</h2>

<p>Los <strong>efectos especiales</strong> convierten una fiesta normal en un espectáculo. En <a href="/es/servicios">Orbita Events</a> ofrecemos efectos profesionales, seguros y homologados.</p>

<h2>Los Efectos Más Populares</h2>

<h3>1. Cañones de CO2</h3>
<p>Columnas de humo blanco espectaculares. Alcance 6-8 metros, gas no tóxico. <strong>Desde 150€.</strong></p>

<h3>2. Bengalas Frías (Sparklers)</h3>
<p>Chispas brillantes sin calor. Seguras para interiores. Temperatura máx 60°C. <strong>Desde 80€</strong> (2 unidades).</p>

<h3>3. Humo Bajo (Low Fog)</h3>
<p>Niebla a ras de suelo. Bailaréis sobre las nubes. No activa detectores. <strong>Desde 120€.</strong></p>

<h3>4. Confeti y Serpentinas</h3>
<p>Cañones para cuenta atrás, entrada de novios, momentos de celebración. <strong>Desde 60€</strong> por cañón.</p>

<h3>5. Láser</h3>
<p>Patrones multicolor espectaculares combinados con humo.</p>

<h2>Cuándo Usar Cada Efecto</h2>
<ul>
<li><strong>Primer baile:</strong> Humo bajo + bengalas frías</li>
<li><strong>Entrada novios:</strong> CO2 + confeti</li>
<li><strong>Hora loca:</strong> CO2 + láser + strobo</li>
<li><strong>Cuenta atrás:</strong> Confeti + bengalas</li>
</ul>

<p>Combinables con nuestros <a href="/es/packs">packs de DJ</a>. Calcula tu combinación en el <a href="/es/configurador">configurador</a>.</p>

<p><a href="/es/contacto">Contacta con nosotros</a> para asesoramiento.</p>`
        },
        {
          locale: 'ca',
          title: 'Efectes Especials per Festes: CO2, Bengales Fredes, Fum Baix i Més',
          excerpt: "Els efectes especials transformen qualsevol festa. T'expliquem cada efecte i quant costa.",
          metaTitle: 'Efectes Especials Festes | CO2, Bengales, Fum Baix',
          metaDescription: "Guia d'efectes especials per festes i casaments. CO2, bengales fredes, fum baix, confeti.",
          content: `<h2>Efectes Especials que Transformen la teva Festa</h2>

<p>A <a href="/ca/servicios">Orbita Events</a> oferim efectes professionals i segurs.</p>

<h3>1. Canons de CO2</h3>
<p>Columnes de fum blanc. 6-8 metres. <strong>Des de 150€.</strong></p>

<h3>2. Bengales Fredes</h3>
<p>Espurnes brillants sense calor. <strong>Des de 80€.</strong></p>

<h3>3. Fum Baix</h3>
<p>Boira a ras de terra. <strong>Des de 120€.</strong></p>

<h3>4. Confeti</h3>
<p><strong>Des de 60€</strong> per canó.</p>

<p>Combinables amb els nostres <a href="/ca/packs">packs</a>. Usa el <a href="/ca/configurador">configurador</a>.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. FIESTA FIN DE AÑO
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'como-organizar-fiesta-fin-ano-perfecta',
      author: 'Òrbita Events',
      category: 'eventos',
      tags: ['nochevieja', 'fiesta', 'fin-de-año', 'organización'],
      isPublished: true,
      publishedAt: new Date('2025-11-28'),
      readingTime: 6,
      translations: [
        {
          locale: 'es',
          title: 'Cómo Organizar la Fiesta de Fin de Año Perfecta',
          excerpt: 'Guía para organizar una Nochevieja inolvidable. Música, efectos, cuenta atrás espectacular.',
          metaTitle: 'Organizar Fiesta Fin de Año 2026 | Guía Completa',
          metaDescription: 'Todo para organizar la mejor Nochevieja. DJ, sonido, cuenta atrás con CO2 y confeti.',
          content: `<h2>La Guía para tu Fiesta de Fin de Año</h2>

<p>La <strong>Nochevieja</strong> es la fiesta más esperada del año. La música y el ambiente son clave.</p>

<h2>Progresión Musical</h2>
<ul>
<li><strong>21:00-23:00 (Cena):</strong> Lounge, jazz, bossa nova</li>
<li><strong>23:00-00:00:</strong> Pop hits, dance clásico, subimos energía</li>
<li><strong>00:00 (Cuenta atrás):</strong> Confeti, CO2, bengalas frías</li>
<li><strong>00:00-03:00+:</strong> Hits actuales, reggaetón, clásicos, a bailar</li>
</ul>

<h2>La Cuenta Atrás Perfecta</h2>
<ul>
<li>Cuenta atrás visual en pantalla</li>
<li>Cañones de confeti en el momento exacto</li>
<li>Ráfaga de CO2 simultánea</li>
<li>Bengalas frías en laterales</li>
<li>Cambio a iluminación de fiesta total</li>
</ul>

<h2>Equipo</h2>
<ul>
<li>Sonido mínimo 2000W (100 personas), 4000W (200+)</li>
<li>Cabezas móviles, strobo, láser, uplighting</li>
<li>Micro para cuenta atrás y brindis</li>
</ul>

<p>En <a href="/es/packs">Orbita Events</a> tenemos packs para Nochevieja. <a href="/es/configurador">Configurador</a> o <a href="/es/contacto">contacta</a> — las fechas se agotan rápido.</p>`
        },
        {
          locale: 'ca',
          title: "Com Organitzar la Festa de Cap d'Any Perfecta",
          excerpt: "Guia per organitzar un Cap d'Any inoblidable. Música, efectes, compte enrere.",
          metaTitle: "Organitzar Festa Cap d'Any 2026 | Guia Completa",
          metaDescription: "Tot per organitzar el millor Cap d'Any. DJ, so, compte enrere espectacular.",
          content: `<h2>La Guia per la teva Festa de Cap d'Any</h2>

<h3>Progressió Musical</h3>
<ul>
<li><strong>21:00-23:00:</strong> Lounge, jazz</li>
<li><strong>23:00-00:00:</strong> Pop hits, dance</li>
<li><strong>00:00:</strong> Confeti, CO2, bengales fredes</li>
<li><strong>00:00-03:00+:</strong> A ballar!</li>
</ul>

<p>A <a href="/ca/packs">Orbita Events</a> tenim packs per Cap d'Any. <a href="/ca/contacto">Contacta</a> — les dates s'esgoten ràpid.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. SONIDO PROFESIONAL VS CASERO
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'sonido-profesional-vs-casero-diferencia',
      author: 'Òrbita Events',
      category: 'tecnologia',
      tags: ['sonido', 'equipo', 'profesional', 'calidad'],
      isPublished: true,
      publishedAt: new Date('2026-01-22'),
      readingTime: 5,
      translations: [
        {
          locale: 'es',
          title: 'Sonido Profesional vs Casero: Por Qué Importa la Diferencia',
          excerpt: '¿Altavoz bluetooth o equipo profesional? La diferencia es enorme. Te explicamos por qué importa.',
          metaTitle: 'Sonido Profesional vs Casero para Eventos | Comparativa',
          metaDescription: 'Diferencias entre sonido profesional y casero para eventos. Por qué un altavoz bluetooth no basta.',
          content: `<h2>¿Por Qué No Puedo Usar un Altavoz Bluetooth en mi Boda?</h2>

<p>La diferencia entre un <strong>equipo profesional</strong> y uno doméstico no es solo volumen: es claridad, cobertura, consistencia y fiabilidad.</p>

<h2>Las 5 Diferencias Clave</h2>

<h3>1. Potencia Real</h3>
<p>Un equipo profesional de <strong>4000W RMS</strong> mueve el aire uniformemente para 200+ personas.</p>

<h3>2. Cobertura</h3>
<p>Sistema profesional distribuido cubre toda la sala uniformemente, no solo los de primera fila.</p>

<h3>3. Subgraves</h3>
<p>Subwoofers profesionales: esos graves que sientes en el pecho. Un bluetooth no puede.</p>

<h3>4. Claridad a Alto Volumen</h3>
<p>Los profesionales no distorsionan. Fiesta a tope sin que suene mal.</p>

<h3>5. Fiabilidad</h3>
<p>Alimentación directa, cables de respaldo, equipo redundante. Sin sorpresas.</p>

<h2>Cuánta Potencia Necesitas</h2>
<ul>
<li><strong>Hasta 50 personas:</strong> 1000W</li>
<li><strong>50-150:</strong> 2000-3000W</li>
<li><strong>150-300:</strong> 4000-6000W</li>
<li><strong>300+:</strong> 8000W+ con line array</li>
</ul>

<p>Todos los <a href="/es/packs">packs de Orbita Events</a> incluyen 4000W y micro inalámbrico. <a href="/es/configurador">Configura tu pack</a>.</p>`
        },
        {
          locale: 'ca',
          title: 'So Professional vs Casolà: Per Què Importa la Diferència',
          excerpt: "Altaveu bluetooth o equip professional? La diferència és enorme.",
          metaTitle: 'So Professional vs Casolà per Events | Comparativa',
          metaDescription: 'Diferències entre so professional i casolà per events.',
          content: `<h2>Per Què No Puc Usar un Altaveu Bluetooth?</h2>

<p>La diferència no és només volum: és claredat, cobertura i fiabilitat.</p>

<h3>1. Potència Real</h3>
<p><strong>4000W RMS</strong> per 200+ persones.</p>

<h3>2. Cobertura Uniforme</h3>
<p>Tota la sala sona igual.</p>

<h3>3. Subgreus</h3>
<p>Sents els greus al pit.</p>

<h3>4. Claredat a Alt Volum</h3>
<p>Sense distorsió.</p>

<h3>5. Fiabilitat</h3>
<p>Equip redundant, sense sorpreses.</p>

<p>Els <a href="/ca/packs">packs d'Orbita</a> inclouen 4000W i micro. <a href="/ca/configurador">Configura el teu pack</a>.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. CANCIONES BODA
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'mejores-canciones-cada-momento-boda',
      author: 'Òrbita Events',
      category: 'bodas',
      tags: ['bodas', 'canciones', 'playlist', 'momentos'],
      isPublished: true,
      publishedAt: new Date('2026-02-05'),
      readingTime: 9,
      translations: [
        {
          locale: 'es',
          title: 'Las Mejores Canciones para Cada Momento de tu Boda',
          excerpt: 'De la ceremonia al cierre: las mejores canciones para cada momento de tu boda. Playlist con 50+ temas.',
          metaTitle: 'Mejores Canciones para Bodas 2026 | Playlist Completa',
          metaDescription: 'Playlist completa para bodas: ceremonia, cocktail, primer baile, fiesta y cierre. 50+ canciones.',
          content: `<h2>La Playlist Perfecta para tu Boda</h2>

<h2>Ceremonia</h2>
<ul>
<li><strong>Entrada invitados:</strong> Canon de Pachelbel, River Flows in You (Yiruma)</li>
<li><strong>Entrada novia:</strong> A Thousand Years, Can't Help Falling in Love</li>
<li><strong>Firma:</strong> All of Me (John Legend), Perfect (Ed Sheeran)</li>
<li><strong>Salida:</strong> Signed Sealed Delivered, Happy (Pharrell)</li>
</ul>

<h2>Cocktail</h2>
<p>At Last, Fly Me to the Moon, Better Together, La Vie en Rose</p>

<h2>Primer Baile</h2>
<ul>
<li><strong>Clásico:</strong> At Last, Wonderful Tonight, Can't Take My Eyes Off You</li>
<li><strong>Moderno:</strong> Perfect, All of Me, Lover (Taylor Swift)</li>
<li><strong>En español:</strong> Contigo (Sabina), La Flaca (Jarabe de Palo), Vivir Mi Vida</li>
</ul>

<h2>Apertura de Pista</h2>
<p>I Gotta Feeling, Don't Stop Me Now, Uptown Funk, Dancing Queen</p>

<h2>Fiesta</h2>
<ul>
<li><strong>Hits:</strong> Bad Bunny, Rosalía, Dua Lipa, The Weeknd</li>
<li><strong>Clásicos:</strong> Livin' on a Prayer, Bohemian Rhapsody, Sweet Caroline</li>
<li><strong>Latinos:</strong> Vivir Mi Vida, Despacito, Gasolina</li>
<li><strong>Dance:</strong> Levels (Avicii), Titanium (Guetta)</li>
</ul>

<h2>Cierre</h2>
<p>Don't Stop Believin', Bohemian Rhapsody, Summer of '69</p>

<p>En <a href="/es/servicios">Orbita Events</a> creamos tu playlist personalizada con reunión previa. <a href="/es/contacto">Contacta</a>.</p>`
        },
        {
          locale: 'ca',
          title: 'Les Millors Cançons per Cada Moment del teu Casament',
          excerpt: "De la cerimònia al tancament: les millors cançons per cada moment. Playlist amb 50+ temes.",
          metaTitle: 'Millors Cançons per Casaments 2026 | Playlist Completa',
          metaDescription: 'Playlist completa per casaments: cerimònia, cocktail, primer ball, festa i tancament.',
          content: `<h2>La Playlist Perfecta</h2>

<h3>Cerimònia</h3>
<p>Canon de Pachelbel, A Thousand Years, Perfect, Happy</p>

<h3>Cocktail</h3>
<p>At Last, Fly Me to the Moon, La Vie en Rose</p>

<h3>Primer Ball</h3>
<p>At Last, Perfect, All of Me, Contigo, La Flaca</p>

<h3>Festa</h3>
<p>Hits actuals, clàssics, llatins, dance</p>

<h3>Tancament</h3>
<p>Don't Stop Believin', Bohemian Rhapsody</p>

<p>A <a href="/ca/servicios">Orbita Events</a> creem la teva playlist personalitzada. <a href="/ca/contacto">Contacta</a>.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. CUMPLEAÑOS ADULTOS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'fiestas-cumpleanos-adultos-ideas-2026',
      author: 'Òrbita Events',
      category: 'eventos',
      tags: ['cumpleaños', 'adultos', 'ideas', 'fiesta', 'barcelona'],
      isPublished: true,
      publishedAt: new Date('2026-02-18'),
      readingTime: 6,
      translations: [
        {
          locale: 'es',
          title: 'Fiestas de Cumpleaños para Adultos: Ideas Originales 2026',
          excerpt: 'Olvídate de la típica cena. Ideas originales para fiestas de cumpleaños que tus invitados recordarán.',
          metaTitle: 'Ideas Fiesta Cumpleaños Adultos 2026 | Originales',
          metaDescription: 'Ideas para fiestas de cumpleaños adultos en Barcelona. DJ profesional, fiestas temáticas, efectos especiales.',
          content: `<h2>Tu Cumpleaños Merece una Fiesta de Verdad</h2>

<p>Cumplir 30, 40, 50... son hitos que merecen celebración a lo grande.</p>

<h2>Ideas que Funcionan</h2>

<h3>Fiesta Años 80/90</h3>
<p>La más exitosa para 35-50 años. Neones, música de la época, dress code.</p>

<h3>Fiesta Discoteca Privada</h3>
<p>Convierte cualquier espacio en discoteca: sonido profesional, cabezas móviles, humo, láser.</p>

<h3>Fiesta Festival</h3>
<p>Escenario, DJ, zona chill-out, barra libre. Perfecto en exteriores.</p>

<h3>Fiesta Karaoke + DJ</h3>
<p>Karaoke profesional con pantalla, luego DJ. Diversión garantizada.</p>

<h2>Equipo Recomendado</h2>
<ul>
<li><strong>Hasta 30 personas:</strong> 1000-2000W, LED básico</li>
<li><strong>30-80:</strong> 2000-4000W, cabezas móviles, humo</li>
<li><strong>80+:</strong> Equipo completo con efectos especiales</li>
</ul>

<h2>Dónde Celebrar</h2>
<ul>
<li>En casa/jardín: económico, nosotros llevamos todo</li>
<li>Local alquilado: más espacio, sin vecinos</li>
<li>Masía: para fiestas premium</li>
</ul>

<p><a href="/es/packs">Pack Flash desde 250€</a>. Para fiestas grandes, <a href="/es/configurador">configurador</a>.</p>

<p><a href="/es/contacto">Dinos qué tienes en mente</a> y lo hacemos realidad.</p>`
        },
        {
          locale: 'ca',
          title: "Festes d'Aniversari per Adults: Idees Originals 2026",
          excerpt: "Idees originals per festes d'aniversari que els teus convidats recordaran.",
          metaTitle: "Idees Festa Aniversari Adults 2026",
          metaDescription: "Idees per festes d'aniversari adults a Barcelona. DJ, temàtiques, efectes.",
          content: `<h2>El teu Aniversari Mereix una Festa de Debò</h2>

<h3>Festa Anys 80/90</h3>
<p>Neons, música de l'època, dress code.</p>

<h3>Festa Discoteca Privada</h3>
<p>So professional, caps mòbils, fum, làser.</p>

<h3>Festa Karaoke + DJ</h3>
<p>Karaoke professional, després DJ.</p>

<p><a href="/ca/packs">Pack Flash des de 250€</a>. <a href="/ca/configurador">Configurador</a> per festes grans.</p>

<p><a href="/ca/contacto">Digues-nos què tens al cap</a>.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. DISCOMÓVIL PROFESIONAL
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'discomovil-profesional-diferencia',
      author: 'Òrbita Events',
      category: 'consejos',
      tags: ['discomóvil', 'profesional', 'diferencia', 'eventos'],
      isPublished: true,
      publishedAt: new Date('2026-02-28'),
      readingTime: 5,
      translations: [
        {
          locale: 'es',
          title: 'Por Qué Contratar una Discomóvil Profesional Marca la Diferencia',
          excerpt: 'No todas las discomóviles son iguales. Qué diferencia a una profesional de una amateur.',
          metaTitle: 'Discomóvil Profesional Barcelona | Diferencias y Precios',
          metaDescription: 'Diferencias entre discomóvil profesional y amateur. Equipo, experiencia, seguro.',
          content: `<h2>No Todas las Discomóviles Son Iguales</h2>

<h2>Qué Incluye una Discomóvil Profesional</h2>

<h3>Equipo de Sonido Premium</h3>
<ul>
<li>Altavoces activos JBL, QSC o RCF</li>
<li>Subwoofer 18"</li>
<li>Mesa de mezclas digital</li>
<li>Microfonía inalámbrica</li>
<li>Equipo de respaldo</li>
</ul>

<h3>Iluminación</h3>
<ul>
<li>Cabezas móviles beam y spot</li>
<li>Focos LED RGBW</li>
<li>Máquina de humo y láser</li>
</ul>

<h3>Garantías</h3>
<ul>
<li>Contrato detallado</li>
<li>Seguro de RC</li>
<li>Equipo de respaldo</li>
<li>Puntualidad garantizada</li>
</ul>

<h2>Señales de una Discomóvil Amateur</h2>
<ul>
<li>No tiene web, solo Instagram</li>
<li>No ofrece contrato</li>
<li>Precio menor a 150€</li>
<li>Sin seguro</li>
<li>Sin reunión previa ni vídeos</li>
</ul>

<p>En <a href="/es/packs">Orbita Events</a> desde 250€. <a href="/es/configurador">Configurador</a> o <a href="/es/contacto">contacta</a>.</p>`
        },
        {
          locale: 'ca',
          title: 'Per Què Contractar una Discomòbil Professional Marca la Diferència',
          excerpt: "No totes les discomòbils són iguals. Què diferencia una professional d'una amateur.",
          metaTitle: 'Discomòbil Professional Barcelona | Diferències',
          metaDescription: "Diferències entre discomòbil professional i amateur.",
          content: `<h2>No Totes les Discomòbils Són Iguals</h2>

<h3>Equip de So Premium</h3>
<p>Altaveus JBL/QSC, subwoofer 18", micro sense fil, equip de recanvi.</p>

<h3>Il·luminació</h3>
<p>Caps mòbils, focus LED, fum i làser.</p>

<h3>Garanties</h3>
<p>Contracte, assegurança RC, equip de recanvi, puntualitat.</p>

<p>A <a href="/ca/packs">Orbita Events</a> des de 250€. <a href="/ca/configurador">Configurador</a> o <a href="/ca/contacto">contacta</a>.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 11. TENDENCIAS BODAS 2026
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'tendencias-bodas-barcelona-2026',
      author: 'Òrbita Events',
      category: 'tendencias',
      tags: ['bodas', 'tendencias', '2026', 'barcelona'],
      isPublished: true,
      publishedAt: new Date('2026-03-05'),
      readingTime: 7,
      translations: [
        {
          locale: 'es',
          title: 'Tendencias en Bodas Barcelona 2026: Lo que Viene Este Año',
          excerpt: 'Qué se lleva en bodas 2026: micro-bodas, tecnología, sostenibilidad y experiencias inmersivas.',
          metaTitle: 'Tendencias Bodas Barcelona 2026 | Lo Nuevo',
          metaDescription: 'Tendencias bodas Barcelona 2026: micro-bodas de lujo, bodas inmersivas, tecnología LED, primer baile cinematográfico.',
          content: `<h2>Las Bodas en Barcelona Están Cambiando</h2>

<p>El 2026 trae tendencias que transforman cómo celebramos el amor. En <a href="/es/servicios">Orbita Events</a> las vemos de primera mano.</p>

<h2>Las 8 Tendencias de 2026</h2>

<h3>1. Micro-Bodas de Lujo</h3>
<p>30-50 invitados, cada detalle premium. Catering gourmet, DJ personalizado, iluminación arquitectónica, efectos especiales.</p>

<h3>2. Primer Baile Cinematográfico</h3>
<p>Humo bajo, bengalas frías, spot follow, efectos sincronizados con la coreografía. Una producción, no solo un baile.</p>

<h3>3. Bodas Inmersivas</h3>
<p>Iluminación que cambia con la hora, mapping en paredes, pantallas LED decorativas.</p>

<h3>4. Sostenibilidad</h3>
<p>Confeti biodegradable, proveedores locales, LED de bajo consumo.</p>

<h3>5. DJ + Instrumentos en Vivo</h3>
<p>DJ con saxofonista, percusionista o violinista. La tendencia más fuerte del año.</p>

<h3>6. Bodas de Madrugada</h3>
<p>Fiestas hasta las 5-6h. Requiere DJ con resistencia y repertorio variado.</p>

<h3>7. Zonas de Experiencia</h3>
<p>Chill-out, photocall con neones, rincón de cocktails con música propia.</p>

<h3>8. Personalización Total</h3>
<p>Gobos con nombres, playlist 100% personalizada, cronograma musical detallado.</p>

<p>Usa nuestro <a href="/es/configurador">configurador</a> o <a href="/es/contacto">contacta</a> para planificar tu boda 2026.</p>`
        },
        {
          locale: 'ca',
          title: 'Tendències en Casaments Barcelona 2026: El que Ve',
          excerpt: "Tendències en casaments 2026: micro-casaments, tecnologia, sostenibilitat, experiències immersives.",
          metaTitle: "Tendències Casaments Barcelona 2026",
          metaDescription: 'Tendències casaments Barcelona 2026: micro-casaments de luxe, primer ball cinematogràfic, DJ amb instruments en viu.',
          content: `<h2>Els Casaments a Barcelona Estan Canviant</h2>

<h3>1. Micro-Casaments de Luxe</h3>
<p>30-50 convidats, cada detall premium.</p>

<h3>2. Primer Ball Cinematogràfic</h3>
<p>Fum baix, bengales fredes, spot follow, efectes sincronitzats.</p>

<h3>3. DJ + Instruments en Viu</h3>
<p>DJ amb saxofonista o percussionista. La tendència de l'any.</p>

<h3>4. Sostenibilitat</h3>
<p>Confeti biodegradable, LED baix consum.</p>

<h3>5. Personalització Total</h3>
<p>Gobos amb noms, playlist personalitzada, cronograma musical.</p>

<p>Usa el <a href="/ca/configurador">configurador</a> o <a href="/ca/contacto">contacta</a> per planificar.</p>`
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 12. EVENTO EMPRESA
    // ═══════════════════════════════════════════════════════════════════════════
    {
      slug: 'guia-organizar-evento-empresa-exitoso',
      author: 'Òrbita Events',
      category: 'eventos',
      tags: ['empresa', 'evento', 'organización', 'teambuilding', 'corporativo'],
      isPublished: true,
      publishedAt: new Date('2026-03-15'),
      readingTime: 8,
      translations: [
        {
          locale: 'es',
          title: 'Guía Completa para Organizar un Evento de Empresa Exitoso',
          excerpt: 'Todo para organizar un evento corporativo en Barcelona: planificación, proveedores, música y logística paso a paso.',
          metaTitle: 'Organizar Evento Empresa Barcelona 2026 | Guía',
          metaDescription: 'Guía completa para organizar un evento de empresa exitoso en Barcelona. Planificación, presupuesto, DJ, sonido.',
          content: `<h2>Cómo Organizar un Evento de Empresa que Impresione</h2>

<h2>Fase 1: Planificación (3-6 meses antes)</h2>

<h3>Define el Objetivo</h3>
<p>Networking, motivación, celebración o presentación. El objetivo determina todo lo demás.</p>

<h3>Presupuesto</h3>
<ul>
<li><strong>Espacio:</strong> 30-40%</li>
<li><strong>Catering:</strong> 25-35%</li>
<li><strong>Entretenimiento (DJ, sonido):</strong> 10-20%</li>
<li><strong>Decoración:</strong> 10-15%</li>
<li><strong>Imprevistos:</strong> 5-10%</li>
</ul>

<h2>Fase 2: Proveedores (2-3 meses antes)</h2>

<h3>Música y Entretenimiento</h3>
<p>Un <a href="/es/servicios">DJ corporativo profesional</a> necesita experiencia en tono adecuado, micro para discursos, repertorio variado y capacidad de gestionar momentos formales y fiesta.</p>

<h2>Fase 3: Ejecución</h2>
<ul>
<li><strong>18:00:</strong> Montaje sonido e iluminación</li>
<li><strong>19:00:</strong> Recepción con música de fondo</li>
<li><strong>20:00:</strong> Cena con música ambiental</li>
<li><strong>21:30:</strong> Discursos/premios con micro</li>
<li><strong>22:00:</strong> Apertura de pista y fiesta</li>
</ul>

<h2>Tu Evento con Orbita Events</h2>

<p><a href="/es/packs">Packs para empresas desde 450€</a> con DJ, sonido 4000W, iluminación y micro.</p>

<p>Usa el <a href="/es/configurador">configurador</a> o <a href="/es/contacto">contacta</a> para propuesta a medida.</p>`
        },
        {
          locale: 'ca',
          title: "Guia Completa per Organitzar un Event d'Empresa Exitós",
          excerpt: "Tot per organitzar un event corporatiu a Barcelona. Planificació, proveïdors, música i logística.",
          metaTitle: "Organitzar Event Empresa Barcelona 2026",
          metaDescription: "Guia per organitzar un event d'empresa exitós a Barcelona.",
          content: `<h2>Com Organitzar un Event d'Empresa</h2>

<h3>Fase 1: Planificació</h3>
<p>Definir objectiu, pressupost (espai 30-40%, càtering 25-35%, entreteniment 10-20%).</p>

<h3>Fase 2: Proveïdors</h3>
<p>Un <a href="/ca/servicios">DJ corporatiu professional</a> amb experiència, micro per discursos i repertori variat.</p>

<h3>Fase 3: Execució</h3>
<ul>
<li>18:00: Muntatge</li>
<li>19:00: Recepció</li>
<li>20:00: Sopar</li>
<li>21:30: Discursos</li>
<li>22:00: Festa</li>
</ul>

<p><a href="/ca/packs">Packs des de 450€</a>. <a href="/ca/configurador">Configurador</a> o <a href="/ca/contacto">contacta</a>.</p>`
        },
      ],
    },
  ];

  for (const post of blogPosts) {
    const { translations, ...postData } = post;

    const existing = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
    });

    if (existing) {
      console.log(`   Actualitzant: ${post.slug}`);
      await prisma.blogPost.update({
        where: { slug: post.slug },
        data: {
          ...postData,
          translations: {
            deleteMany: {},
            create: translations,
          },
        },
      });
    } else {
      console.log(`   Creant: ${post.slug}`);
      await prisma.blogPost.create({
        data: {
          ...postData,
          translations: {
            create: translations,
          },
        },
      });
    }
  }

  console.log(`\n✅ ${blogPosts.length} blog posts extra creats/actualitzats`);
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📝 BLOG POSTS EXTRA SEED COMPLETAT!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Expand short blog posts with substantial content
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Posts that need substantial content expansion (under ~400 words)
const EXPANDED_CONTENT: Record<string, { es: string; ca: string }> = {
  'discomovil-profesional-diferencia': {
    es: `<h2>¿Qué es Exactamente una Discoteca Móvil Profesional?</h2>

<p>Una <strong>discoteca móvil profesional</strong> es mucho más que alguien con altavoces y un portátil. Es un servicio integral de entretenimiento que transforma cualquier espacio en una pista de baile de primer nivel, con equipo de sonido de alta potencia, iluminación profesional programada y un DJ con experiencia real en eventos.</p>

<p>La diferencia entre contratar un servicio profesional y uno amateur puede marcar la diferencia entre una fiesta inolvidable y una velada mediocre. Aquí te explicamos punto por punto qué separa a un verdadero profesional.</p>

<h2>Equipo de Sonido: La Base de Todo</h2>

<h3>Potencia Real vs Potencia de Etiqueta</h3>
<p>Un equipo profesional trabaja con <strong>sistemas de PA de 4000W a 10000W RMS</strong> (potencia real, no pico). Esto garantiza sonido limpio y potente sin distorsión, incluso en espacios abiertos de 500+ personas. Los equipos amateur suelen tener 200-500W y suenan distorsionados al subir el volumen.</p>

<h3>Procesamiento de Audio</h3>
<p>Los profesionales usan procesadores de señal, ecualizadores paramétricos y limitadores que adaptan el sonido al espacio. En una masía de piedra, en un jardín o en un salón de hotel, el sonido necesita configuraciones completamente diferentes.</p>

<h3>Subgraves y Líneas</h3>
<p>Un sistema profesional incluye <strong>subwoofers dedicados</strong> para graves profundos y nítidos. La música de baile sin subgraves pierde el 50% de su impacto. Además, se usan líneas de delay para espacios grandes, asegurando que el sonido llegue igual a todos los rincones.</p>

<h2>Iluminación: La Diferencia Visual</h2>

<h3>Cabezas Móviles y Efectos</h3>
<p>Un servicio profesional incluye <strong>cabezas móviles beam y spot</strong>, que son los focos robotizados que crean haces de luz espectaculares. La iluminación sincronizada con la música transforma cualquier espacio en una discoteca de primer nivel.</p>

<h3>LED y Wash de Color</h3>
<p>Focos LED RGBW de alta luminosidad, barras de LED, strobo profesional y, opcionalmente, láser de seguridad certificada. Todo controlado por <strong>DMX</strong>, el estándar de la industria para programación de luces.</p>

<h3>Efectos Especiales</h3>
<p>Máquinas de humo bajo (dry ice o criogénico), CO2, bengalas frías y confeti son complementos que un profesional puede ofrecer de forma segura, con los permisos y seguros necesarios.</p>

<h2>El DJ: Experiencia y Lectura de Pista</h2>

<h3>Años de Experiencia Real</h3>
<p>Un DJ profesional tiene <strong>cientos de eventos a sus espaldas</strong>. Sabe leer la pista: cuándo subir la energía, cuándo bajar, qué géneros funcionan con cada público, cómo gestionar peticiones y cómo mantener la pista llena durante horas.</p>

<h3>Repertorio Musical</h3>
<p>La biblioteca musical de un profesional incluye <strong>miles de canciones organizadas</strong> por género, era, BPM y energía. Desde los 60s hasta los últimos éxitos, pasando por todos los géneros: pop, rock, reggaetón, house, techno, hip-hop, latinos, clásicos y más.</p>

<h3>Mezclas Profesionales</h3>
<p>El beatmatching, las transiciones armónicas y la programación musical son habilidades que se desarrollan con años de práctica. Un profesional nunca deja "silencios muertos" entre canciones ni hace transiciones bruscas que rompen la energía.</p>

<h2>Logística y Profesionalismo</h2>

<h3>Montaje y Desmontaje</h3>
<p>Un servicio profesional llega <strong>2-3 horas antes</strong> para montar, hacer pruebas de sonido y ajustar la iluminación al espacio. Incluye todo el cableado profesional, cuadros eléctricos de seguridad y material de respaldo.</p>

<h3>Seguro de Responsabilidad Civil</h3>
<p>Todo servicio profesional debe tener <strong>seguro de RC</strong> que cubra daños a terceros, al recinto y al equipo. Esto es obligatorio para trabajar en la mayoría de venues y masías.</p>

<h3>Contrato y Garantías</h3>
<p>Contrato detallado con horarios, servicios incluidos, extras, política de cancelación y garantías. Ningún profesional trabaja "de palabra".</p>

<h2>Precio: ¿Cuánto Más Cuesta un Profesional?</h2>

<p>La diferencia de precio suele ser de <strong>2x a 3x</strong> respecto a un servicio amateur:</p>
<ul>
<li><strong>Amateur/semi-profesional:</strong> 150-300€</li>
<li><strong>Profesional estándar:</strong> 400-700€</li>
<li><strong>Premium con efectos:</strong> 700-1200€</li>
</ul>

<p>Pero el precio refleja la calidad del equipo (que cuesta decenas de miles de euros), la experiencia del DJ, los seguros, el transporte profesional y la garantía de servicio.</p>

<h2>¿Cómo Elegir?</h2>

<p>Antes de contratar, pregunta siempre:</p>
<ul>
<li>¿Cuántos eventos has realizado este año?</li>
<li>¿Puedo ver fotos/vídeos reales de eventos recientes?</li>
<li>¿Qué equipo de sonido e iluminación incluyes?</li>
<li>¿Tienes seguro de responsabilidad civil?</li>
<li>¿Incluyes equipo de respaldo?</li>
</ul>

<p>En <a href="/es/servicios/discomovil">Òrbita Events</a> puedes ver exactamente qué incluye cada servicio, con fotos reales de nuestros montajes. Usa nuestro <a href="/es/configurador">configurador de precios</a> para obtener un presupuesto personalizado en 2 minutos.</p>`,
    ca: `<h2>Què és Exactament una Discoteca Mòbil Professional?</h2>

<p>Una <strong>discoteca mòbil professional</strong> és molt més que algú amb altaveus i un portàtil. És un servei integral d'entreteniment que transforma qualsevol espai en una pista de ball de primer nivell, amb equip de so d'alta potència, il·luminació professional programada i un DJ amb experiència real en esdeveniments.</p>

<p>La diferència entre contractar un servei professional i un d'amateur pot marcar la diferència entre una festa inoblidable i una vetllada mediocre. Aquí t'expliquem punt per punt què separa un veritable professional.</p>

<h2>Equip de So: La Base de Tot</h2>

<h3>Potència Real vs Potència d'Etiqueta</h3>
<p>Un equip professional treballa amb <strong>sistemes de PA de 4000W a 10000W RMS</strong> (potència real, no pic). Això garanteix so net i potent sense distorsió, fins i tot en espais oberts de 500+ persones. Els equips amateur solen tenir 200-500W i sonen distorsionats en pujar el volum.</p>

<h3>Processament d'Àudio</h3>
<p>Els professionals usen processadors de senyal, equalitzadors paramètrics i limitadors que adapten el so a l'espai. En una masia de pedra, en un jardí o en un saló d'hotel, el so necessita configuracions completament diferents.</p>

<h3>Subgreus i Línies</h3>
<p>Un sistema professional inclou <strong>subwoofers dedicats</strong> per a greus profunds i nítids. La música de ball sense subgreus perd el 50% del seu impacte. A més, s'usen línies de delay per a espais grans, assegurant que el so arribi igual a tots els racons.</p>

<h2>Il·luminació: La Diferència Visual</h2>

<h3>Caps Mòbils i Efectes</h3>
<p>Un servei professional inclou <strong>caps mòbils beam i spot</strong>, que són els focus robotitzats que creen feixos de llum espectaculars. La il·luminació sincronitzada amb la música transforma qualsevol espai en una discoteca de primer nivell.</p>

<h3>LED i Wash de Color</h3>
<p>Focus LED RGBW d'alta lluminositat, barres de LED, strobo professional i, opcionalment, làser de seguretat certificada. Tot controlat per <strong>DMX</strong>, l'estàndard de la indústria per a programació de llums.</p>

<h3>Efectes Especials</h3>
<p>Màquines de fum baix (dry ice o criogènic), CO2, bengales fredes i confeti són complements que un professional pot oferir de forma segura, amb els permisos i assegurances necessaris.</p>

<h2>El DJ: Experiència i Lectura de Pista</h2>

<h3>Anys d'Experiència Real</h3>
<p>Un DJ professional té <strong>centenars d'esdeveniments a les seves esquenes</strong>. Sap llegir la pista: quan pujar l'energia, quan baixar, quins gèneres funcionen amb cada públic, com gestionar peticions i com mantenir la pista plena durant hores.</p>

<h3>Repertori Musical</h3>
<p>La biblioteca musical d'un professional inclou <strong>milers de cançons organitzades</strong> per gènere, era, BPM i energia. Des dels 60s fins als últims èxits, passant per tots els gèneres: pop, rock, reggaetón, house, techno, hip-hop, llatins, clàssics i més.</p>

<h3>Mescles Professionals</h3>
<p>El beatmatching, les transicions harmòniques i la programació musical són habilitats que es desenvolupen amb anys de pràctica. Un professional mai deixa "silencis morts" entre cançons ni fa transicions brusques que trenquen l'energia.</p>

<h2>Logística i Professionalisme</h2>

<h3>Muntatge i Desmuntatge</h3>
<p>Un servei professional arriba <strong>2-3 hores abans</strong> per muntar, fer proves de so i ajustar la il·luminació a l'espai. Inclou tot el cablejat professional, quadres elèctrics de seguretat i material de respatller.</p>

<h3>Assegurança de Responsabilitat Civil</h3>
<p>Tot servei professional ha de tenir <strong>assegurança de RC</strong> que cobreixi danys a tercers, al recinte i a l'equip. Això és obligatori per treballar a la majoria de venues i masies.</p>

<h3>Contracte i Garanties</h3>
<p>Contracte detallat amb horaris, serveis inclosos, extres, política de cancel·lació i garanties. Cap professional treballa "de paraula".</p>

<h2>Preu: Quant Més Costa un Professional?</h2>

<p>La diferència de preu sol ser de <strong>2x a 3x</strong> respecte a un servei amateur:</p>
<ul>
<li><strong>Amateur/semi-professional:</strong> 150-300€</li>
<li><strong>Professional estàndard:</strong> 400-700€</li>
<li><strong>Premium amb efectes:</strong> 700-1200€</li>
</ul>

<p>Però el preu reflecteix la qualitat de l'equip (que costa desenes de milers d'euros), l'experiència del DJ, les assegurances, el transport professional i la garantia de servei.</p>

<h2>Com Triar?</h2>

<p>Abans de contractar, pregunta sempre:</p>
<ul>
<li>Quants esdeveniments has realitzat aquest any?</li>
<li>Puc veure fotos/vídeos reals d'esdeveniments recents?</li>
<li>Quin equip de so i il·luminació inclous?</li>
<li>Tens assegurança de responsabilitat civil?</li>
<li>Inclous equip de respatller?</li>
</ul>

<p>A <a href="/ca/servicios/discomovil">Òrbita Events</a> pots veure exactament què inclou cada servei, amb fotos reals dels nostres muntatges. Usa el nostre <a href="/ca/configurador">configurador de preus</a> per obtenir un pressupost personalitzat en 2 minuts.</p>`,
  },

  'guia-organizar-evento-empresa-exitoso': {
    es: `<h2>Planificación Estratégica: Los Cimientos de un Gran Evento</h2>

<p>Organizar un <strong>evento corporativo exitoso</strong> requiere una planificación meticulosa que va mucho más allá de reservar un espacio y pedir catering. Un evento de empresa bien ejecutado fortalece la cultura corporativa, motiva al equipo y puede generar un retorno tangible para la organización.</p>

<p>Después de más de ${new Date().getFullYear() - 2016} años produciendo eventos corporativos en Barcelona y Girona, hemos identificado los factores clave que separan un evento mediocre de uno memorable.</p>

<h2>1. Define los Objetivos Antes de Cualquier Decisión</h2>

<p>El error más común es empezar eligiendo venue y fecha sin tener claro el <strong>propósito del evento</strong>. Antes de nada, responde estas preguntas:</p>
<ul>
<li><strong>¿Cuál es el objetivo principal?</strong> Team building, lanzamiento de producto, celebración de resultados, networking...</li>
<li><strong>¿Quién es el público?</strong> Empleados, clientes, proveedores, una mezcla</li>
<li><strong>¿Qué sensación quieres que se lleven?</strong> Motivación, diversión, exclusividad, creatividad</li>
<li><strong>¿Cuál es el presupuesto real?</strong> Incluye margen del 10-15% para imprevistos</li>
</ul>

<p>Estas respuestas guiarán todas las decisiones posteriores: venue, formato, entretenimiento, catering y comunicación.</p>

<h2>2. Elige el Venue Correcto</h2>

<h3>Capacidad y Distribución</h3>
<p>La regla de oro: el espacio debe ser un <strong>20% más grande</strong> de lo que crees necesitar. Un espacio demasiado lleno genera agobio, mientras que uno demasiado vacío pierde energía. Para eventos de 50-150 personas, busca espacios de 200-400m².</p>

<h3>Accesibilidad y Logística</h3>
<p>Considera el parking, transporte público, accesibilidad para personas con movilidad reducida, zona de carga/descarga para proveedores y potencia eléctrica disponible (mínimo 32A para sonido e iluminación profesional).</p>

<h3>Venues Recomendados en Barcelona</h3>
<p>Para eventos corporativos, las mejores opciones suelen ser: hoteles con salones versátiles, espacios industriales reconvertidos (tipo Nau Bostik, Llança 20), rooftops con vistas y masías con jardín para eventos al aire libre.</p>

<h2>3. El Timeline: La Columna Vertebral</h2>

<p>Un timeline bien estructurado mantiene el evento fluido. Aquí un ejemplo para un evento de tarde-noche:</p>

<ul>
<li><strong>18:00 - 19:00:</strong> Recepción y cocktail con música ambiental suave</li>
<li><strong>19:00 - 19:30:</strong> Bienvenida y presentación (discursos breves, máximo 15 min)</li>
<li><strong>19:30 - 21:00:</strong> Cena o actividad principal</li>
<li><strong>21:00 - 21:15:</strong> Transición (cambio de luces, subida de energía musical)</li>
<li><strong>21:15 - 23:00:</strong> Fiesta con DJ profesional</li>
<li><strong>23:00 - 00:00:</strong> Hora de cierre con set más chill</li>
</ul>

<h2>4. Entretenimiento: Lo que Marca la Diferencia</h2>

<h3>Música y DJ Corporativo</h3>
<p>La música es el hilo conductor de todo el evento. Un <a href="/es/servicios/empresas">DJ corporativo profesional</a> sabe exactamente cómo adaptar la energía musical a cada fase: ambiental durante el cocktail, elegante durante la cena y festiva para el after.</p>

<h3>Iluminación Profesional</h3>
<p>La iluminación transforma un espacio corporativo en una experiencia inmersiva. Uplighting en colores corporativos, gobos con el logo de la empresa y cabezas móviles para la parte festiva son elementos que elevan el evento.</p>

<h3>Efectos Especiales</h3>
<p>Para momentos clave como la presentación de un producto o el brindis: bengalas frías, CO2, confeti o humo bajo crean impacto visual y emocional que los asistentes recordarán.</p>

<h2>5. Catering: Calidad sobre Cantidad</h2>

<p>El catering es donde más se nota si se ha recortado presupuesto. Nuestras recomendaciones:</p>
<ul>
<li><strong>Cocktail:</strong> Calcula 8-10 piezas por persona para 1 hora</li>
<li><strong>Cena:</strong> 3 platos (entrante, principal, postre) es lo estándar para empresa</li>
<li><strong>Barra libre:</strong> Premium durante las primeras 2 horas, después mix</li>
<li><strong>Opciones dietéticas:</strong> Siempre incluir vegetariano, vegano y sin gluten</li>
</ul>

<h2>6. Comunicación y Branding del Evento</h2>

<h3>Antes del Evento</h3>
<p>Invitaciones personalizadas (físicas o digitales con diseño corporativo), confirmación de asistencia con formulario simple y recordatorio 48h antes con detalles prácticos (dirección, parking, dress code).</p>

<h3>Durante el Evento</h3>
<p>Pantallas con contenido corporativo, photocall con branding, hashtag del evento para redes sociales y, si el presupuesto lo permite, un fotógrafo profesional para documentar momentos clave.</p>

<h3>Después del Evento</h3>
<p>Email de agradecimiento con galería de fotos (máximo 48h después), encuesta de satisfacción breve y contenido para redes sociales corporativas.</p>

<h2>7. Presupuesto Orientativo por Persona</h2>

<p>Para un evento corporativo de calidad en Barcelona:</p>
<ul>
<li><strong>Evento básico:</strong> 40-60€/persona (venue, catering básico, DJ)</li>
<li><strong>Evento estándar:</strong> 80-120€/persona (venue premium, catering completo, DJ + iluminación)</li>
<li><strong>Evento premium:</strong> 150-250€/persona (todo incluido con efectos, branding, fotografía)</li>
</ul>

<h2>¿Necesitas Ayuda para Organizar tu Evento?</h2>

<p>En <a href="/es/servicios/empresas">Òrbita Events</a> nos especializamos en la producción técnica de eventos corporativos: sonido, iluminación, DJ y efectos especiales. Desde team buildings de 30 personas hasta galas de 500+.</p>

<p>Usa nuestro <a href="/es/configurador">configurador de precios</a> para obtener un presupuesto personalizado, o <a href="/es/contacto">contacta directamente</a> con nuestro equipo para eventos a medida.</p>`,
    ca: `<h2>Planificació Estratègica: Els Fonaments d'un Gran Esdeveniment</h2>

<p>Organitzar un <strong>esdeveniment corporatiu exitós</strong> requereix una planificació meticulosa que va molt més enllà de reservar un espai i demanar càtering. Un esdeveniment d'empresa ben executat enforteix la cultura corporativa, motiva l'equip i pot generar un retorn tangible per a l'organització.</p>

<p>Després de més de ${new Date().getFullYear() - 2016} anys produint esdeveniments corporatius a Barcelona i Girona, hem identificat els factors clau que separen un esdeveniment mediocre d'un de memorable.</p>

<h2>1. Defineix els Objectius Abans de Qualsevol Decisió</h2>

<p>L'error més comú és començar triant venue i data sense tenir clar el <strong>propòsit de l'esdeveniment</strong>. Abans de res, respon aquestes preguntes:</p>
<ul>
<li><strong>Quin és l'objectiu principal?</strong> Team building, llançament de producte, celebració de resultats, networking...</li>
<li><strong>Qui és el públic?</strong> Empleats, clients, proveïdors, una barreja</li>
<li><strong>Quina sensació vols que s'emportin?</strong> Motivació, diversió, exclusivitat, creativitat</li>
<li><strong>Quin és el pressupost real?</strong> Inclou marge del 10-15% per imprevistos</li>
</ul>

<h2>2. Tria el Venue Correcte</h2>

<h3>Capacitat i Distribució</h3>
<p>La regla d'or: l'espai ha de ser un <strong>20% més gran</strong> del que creus necessitar. Un espai massa ple genera angoixa, mentre que un massa buit perd energia.</p>

<h3>Accessibilitat i Logística</h3>
<p>Considera el pàrquing, transport públic, accessibilitat per a persones amb mobilitat reduïda, zona de càrrega/descàrrega i potència elèctrica disponible (mínim 32A per so i il·luminació professional).</p>

<h2>3. El Timeline: La Columna Vertebral</h2>

<p>Un timeline ben estructurat manté l'esdeveniment fluid:</p>
<ul>
<li><strong>18:00 - 19:00:</strong> Recepció i còctel amb música ambiental suau</li>
<li><strong>19:00 - 19:30:</strong> Benvinguda i presentació</li>
<li><strong>19:30 - 21:00:</strong> Sopar o activitat principal</li>
<li><strong>21:00 - 21:15:</strong> Transició</li>
<li><strong>21:15 - 23:00:</strong> Festa amb DJ professional</li>
<li><strong>23:00 - 00:00:</strong> Hora de tancament</li>
</ul>

<h2>4. Entreteniment: El que Marca la Diferència</h2>

<h3>Música i DJ Corporatiu</h3>
<p>La música és el fil conductor de tot l'esdeveniment. Un <a href="/ca/servicios/empresas">DJ corporatiu professional</a> sap exactament com adaptar l'energia musical a cada fase.</p>

<h3>Il·luminació Professional</h3>
<p>La il·luminació transforma un espai corporatiu en una experiència immersiva. Uplighting en colors corporatius, gobos amb el logo de l'empresa i caps mòbils per a la part festiva.</p>

<h2>5. Càtering: Qualitat sobre Quantitat</h2>
<ul>
<li><strong>Còctel:</strong> 8-10 peces per persona per 1 hora</li>
<li><strong>Sopar:</strong> 3 plats és l'estàndard</li>
<li><strong>Barra lliure:</strong> Premium les primeres 2 hores</li>
<li><strong>Opcions dietètiques:</strong> Vegetarià, vegà i sense gluten sempre</li>
</ul>

<h2>6. Pressupost Orientatiu per Persona</h2>
<ul>
<li><strong>Bàsic:</strong> 40-60€/persona</li>
<li><strong>Estàndard:</strong> 80-120€/persona</li>
<li><strong>Premium:</strong> 150-250€/persona</li>
</ul>

<p>A <a href="/ca/servicios/empresas">Òrbita Events</a> ens especialitzem en la producció tècnica d'esdeveniments corporatius. Usa el nostre <a href="/ca/configurador">configurador de preus</a> per obtenir un pressupost personalitzat.</p>`,
  },

  'sonido-profesional-vs-casero-diferencia': {
    es: `<h2>¿Por Qué el Sonido Profesional Hace Tanta Diferencia?</h2>

<p>Si alguna vez has estado en un evento donde la música sonaba distorsionada, el micrófono hacía feedback o simplemente no se escuchaba bien en el fondo de la sala, ya conoces la diferencia. El <strong>sonido profesional</strong> no es un lujo — es la base sobre la que se construye toda la experiencia de un evento.</p>

<p>En este artículo te explicamos las diferencias técnicas reales entre un sistema de sonido profesional y uno "casero", para que puedas tomar una decisión informada para tu próximo evento.</p>

<h2>Potencia: Watts RMS vs Watts PMPO</h2>

<h3>La Trampa del Marketing</h3>
<p>La mayoría de altavoces "de consumo" anuncian potencias infladas. Un altavoz que dice "2000W" en la caja suele tener <strong>50-100W RMS reales</strong>. Los fabricantes usan potencia PMPO (pico máximo de un microsegundo) que es completamente inútil como medida.</p>

<h3>Potencia Real para Eventos</h3>
<p>Para un evento con DJ necesitas como mínimo:</p>
<ul>
<li><strong>30-50 personas:</strong> 1000-2000W RMS</li>
<li><strong>50-150 personas:</strong> 2000-4000W RMS</li>
<li><strong>150-300 personas:</strong> 4000-8000W RMS</li>
<li><strong>300+ personas:</strong> 8000W+ RMS con sistema en línea</li>
</ul>

<h2>Frecuencia de Respuesta y Claridad</h2>

<h3>Subgraves: Lo que Sientes</h3>
<p>Un sistema casero reproduce graves hasta unos 80-100Hz. Un <strong>subwoofer profesional de 18"</strong> baja hasta 30Hz — son los graves que <em>sientes en el pecho</em>. Para música de baile (house, reggaetón, pop moderno), los subgraves son absolutamente esenciales.</p>

<h3>Medios y Agudos: Lo que Escuchas</h3>
<p>Los drivers de medios y agudos profesionales ofrecen una respuesta más plana y natural. Esto significa que las voces (en discursos o durante canciones) suenan claras y definidas, no "metálicas" o "como dentro de una lata".</p>

<h3>Dispersión y Cobertura</h3>
<p>Los altavoces profesionales están diseñados para cubrir <strong>zonas específicas con ángulos de dispersión controlados</strong>. Un altavoz casero "escupe" sonido en todas direcciones, creando zonas donde es demasiado fuerte y otras donde no se oye.</p>

<h2>Procesamiento de Señal</h2>

<h3>Ecualización Paramétrica</h3>
<p>Cada espacio tiene una acústica diferente. Una masía de piedra con techos altos necesita un tratamiento completamente diferente a un jardín al aire libre. Un procesador profesional permite <strong>ecualizar frecuencia por frecuencia</strong> para compensar las características del espacio.</p>

<h3>Compresión y Limitación</h3>
<p>Los procesadores profesionales incluyen compresores que mantienen el nivel constante (para que no haya momentos demasiado bajos o demasiado fuertes) y limitadores que protegen los altavoces y los oídos de picos dañinos.</p>

<h3>Crossover y Alineación</h3>
<p>En un sistema profesional, cada altavoz reproduce solo las frecuencias para las que está diseñado: los subwoofers los graves, los medios las frecuencias vocales, y los agudos las altas. Esto se hace con <strong>crossovers digitales</strong> que además alinean temporalmente todos los componentes.</p>

<h2>La Experiencia del Técnico</h2>

<p>El mejor equipo del mundo suena mal si no está bien configurado. Un técnico de sonido profesional:</p>
<ul>
<li>Evalúa la acústica del espacio antes de empezar</li>
<li>Coloca los altavoces en las posiciones óptimas</li>
<li>Ajusta niveles, ecualización y procesamiento al detalle</li>
<li>Monitoriza durante todo el evento y ajusta en tiempo real</li>
<li>Resuelve problemas técnicos al instante (feedback, interferencias, etc.)</li>
</ul>

<h2>Caso Real: La Misma Canción, Dos Sistemas</h2>

<p>Imagina "Don't Stop Me Now" de Queen sonando en:</p>

<p><strong>Sistema casero (altavoz Bluetooth de 200€):</strong> Los graves apenas se oyen, la voz de Freddie suena comprimida y metálica, a partir de la mitad del volumen empieza a distorsionar. En la otra punta de la sala apenas se escucha.</p>

<p><strong>Sistema profesional (PA 4000W + subs):</strong> Los graves del bajo de John Deacon vibran en el pecho, la voz de Freddie llena la sala con claridad cristalina, los platillos brillan sin ser agresivos. La canción suena igual de potente en primera fila que en la última mesa.</p>

<h2>¿Cuánto Cuesta la Diferencia?</h2>

<p>Un sistema de sonido profesional para eventos cuesta entre <strong>300€ y 800€ de alquiler</strong> (con técnico incluido). Comparado con el coste total de un evento (venue, catering, decoración), es una fracción pequeña que tiene un impacto enorme en la experiencia.</p>

<p>En <a href="/es/servicios/discomovil">Òrbita Events</a>, todos nuestros packs incluyen sonido profesional con técnico. Consulta nuestros <a href="/es/packs">packs y precios</a> o usa el <a href="/es/configurador">configurador</a> para ver opciones.</p>`,
    ca: `<h2>Per Què el So Professional Fa Tanta Diferència?</h2>

<p>Si alguna vegada has estat en un esdeveniment on la música sonava distorsionada, el micròfon feia feedback o simplement no s'escoltava bé al fons de la sala, ja coneixes la diferència. El <strong>so professional</strong> no és un luxe — és la base sobre la qual es construeix tota l'experiència d'un esdeveniment.</p>

<h2>Potència: Watts RMS vs Watts PMPO</h2>

<h3>El Parany del Màrqueting</h3>
<p>La majoria d'altaveus "de consum" anuncien potències inflades. Un altaveu que diu "2000W" a la caixa sol tenir <strong>50-100W RMS reals</strong>.</p>

<h3>Potència Real per Esdeveniments</h3>
<ul>
<li><strong>30-50 persones:</strong> 1000-2000W RMS</li>
<li><strong>50-150 persones:</strong> 2000-4000W RMS</li>
<li><strong>150-300 persones:</strong> 4000-8000W RMS</li>
<li><strong>300+ persones:</strong> 8000W+ RMS</li>
</ul>

<h2>Freqüència de Resposta i Claredat</h2>

<h3>Subgreus: El que Sents</h3>
<p>Un sistema casolà reprodueix greus fins a uns 80-100Hz. Un <strong>subwoofer professional de 18"</strong> baixa fins a 30Hz — són els greus que <em>sents al pit</em>.</p>

<h3>Dispersió i Cobertura</h3>
<p>Els altaveus professionals estan dissenyats per cobrir <strong>zones específiques amb angles de dispersió controlats</strong>.</p>

<h2>Processament de Senyal</h2>

<h3>Equalització Paramètrica</h3>
<p>Cada espai té una acústica diferent. Una masia de pedra necessita un tractament completament diferent a un jardí a l'aire lliure.</p>

<h3>Compressió i Limitació</h3>
<p>Els processadors professionals inclouen compressors i limitadors que protegeixen els altaveus i les oïdes de pics danyins.</p>

<h2>L'Experiència del Tècnic</h2>
<ul>
<li>Avalua l'acústica de l'espai abans de començar</li>
<li>Col·loca els altaveus en les posicions òptimes</li>
<li>Ajusta nivells, equalització i processament al detall</li>
<li>Monitoritza durant tot l'esdeveniment i ajusta en temps real</li>
<li>Resol problemes tècnics a l'instant</li>
</ul>

<h2>Quant Costa la Diferència?</h2>

<p>Un sistema de so professional per esdeveniments costa entre <strong>300€ i 800€ de lloguer</strong> (amb tècnic inclòs). A <a href="/ca/servicios/discomovil">Òrbita Events</a>, tots els nostres packs inclouen so professional. Consulta els nostres <a href="/ca/packs">packs i preus</a>.</p>`,
  },

  'musica-eventos-corporativos-cocktail-fiesta': {
    es: `<h2>La Música como Herramienta Estratégica en Eventos Corporativos</h2>

<p>La música en un <strong>evento corporativo</strong> no es decoración — es una herramienta estratégica que controla el ritmo, la energía y las emociones de todos los asistentes. Un DJ profesional para empresas sabe exactamente qué poner en cada momento para que el evento fluya de forma natural.</p>

<p>En esta guía te explicamos cómo programar la música para cada fase de tu evento corporativo, con recomendaciones de géneros, BPM y artistas.</p>

<h2>Fase 1: Recepción y Cocktail (60-90 minutos)</h2>

<h3>Objetivo Musical</h3>
<p>Crear un ambiente <strong>sofisticado y relajado</strong> que facilite la conversación y el networking. La música debe ser reconocible pero no intrusiva, con un volumen que permita hablar cómodamente.</p>

<h3>Géneros y Artistas Recomendados</h3>
<ul>
<li><strong>Jazz suave:</strong> Miles Davis, Norah Jones, Michael Bublé</li>
<li><strong>Lounge/Chill:</strong> Café del Mar compilations, Bonobo, Thievery Corporation</li>
<li><strong>Bossa Nova:</strong> Antonio Carlos Jobim, Astrud Gilberto</li>
<li><strong>Indie acústico:</strong> Iron & Wine, Bon Iver, José González</li>
</ul>

<h3>BPM y Volumen</h3>
<p>Mantener entre <strong>90-110 BPM</strong> y un volumen de conversación (65-70 dB). La regla: si tienes que gritar para hablar con alguien a 1 metro, está demasiado alto.</p>

<h2>Fase 2: Cena (60-120 minutos)</h2>

<h3>Objetivo Musical</h3>
<p>Acompañar la cena sin competir con ella. Ligeramente más dinámica que el cocktail, pero manteniendo la elegancia. Muchas empresas aprovechan este momento para discursos, vídeos corporativos o presentaciones.</p>

<h3>Géneros y Artistas Recomendados</h3>
<ul>
<li><strong>Pop suave:</strong> Coldplay (acústico), Adele, Sam Smith</li>
<li><strong>Soul/R&B:</strong> Alicia Keys, John Legend, Amy Winehouse</li>
<li><strong>Clásicos relajados:</strong> Stevie Wonder, Marvin Gaye, Elton John</li>
<li><strong>Electrónica ambiental:</strong> Bonobo, Tycho, ODESZA</li>
</ul>

<h3>BPM y Volumen</h3>
<p><strong>100-115 BPM</strong>, volumen 60-68 dB. Subir ligeramente respecto al cocktail pero manteniendo la conversación posible.</p>

<h2>Fase 3: Transición (15-20 minutos)</h2>

<h3>El Momento Más Importante</h3>
<p>La transición de cena a fiesta es <strong>el momento más crítico</strong> del evento. Si es demasiado brusca, la gente se desconecta. Si es demasiado lenta, pierdes el momentum. Un DJ profesional sabe hacer esta transición de forma gradual y natural.</p>

<h3>Cómo se Hace</h3>
<p>Subida gradual de BPM (de 110 a 125 en 15 minutos), aumento progresivo de volumen, cambio de iluminación (de cálida a dinámica) y uso de canciones "puente" que todo el mundo reconoce.</p>

<h2>Fase 4: Fiesta (2-4 horas)</h2>

<h3>Objetivo Musical</h3>
<p>¡Que bailen! La pista de baile es el termómetro del evento. Un DJ profesional lee la pista constantemente y adapta la selección para mantener la energía alta.</p>

<h3>Géneros que Funcionan en Eventos Corporativos</h3>
<ul>
<li><strong>Pop comercial:</strong> Los éxitos que todos conocen (importante en corporativos donde hay diversidad de gustos)</li>
<li><strong>Clásicos infalibles:</strong> Queen, ABBA, Michael Jackson, Whitney Houston</li>
<li><strong>Latino:</strong> Reggaetón y salsa selectos (no todo vale en un corporativo)</li>
<li><strong>Dance/House:</strong> Canciones con base electrónica reconocible</li>
<li><strong>Decades:</strong> 80s y 90s suelen ser un éxito seguro en público adulto</li>
</ul>

<h3>BPM y Volumen</h3>
<p><strong>120-130 BPM</strong> como base, con picos hasta 135 BPM en momentos álgidos. Volumen de club (85-95 dB) pero siempre por debajo del umbral de dolor.</p>

<h2>Errores Comunes en la Música de Eventos Corporativos</h2>

<ul>
<li><strong>Poner un pendrive y olvidarte:</strong> Sin DJ, no hay adaptación a la energía de la sala</li>
<li><strong>Música demasiado "de nicho":</strong> En un corporativo, la clave es música que el mayor número posible conozca</li>
<li><strong>Transición brusca cena→fiesta:</strong> El cambio debe ser gradual (15-20 minutos)</li>
<li><strong>Ignorar las peticiones:</strong> Un DJ profesional sabe integrar peticiones sin romper su set</li>
<li><strong>Volumen constante:</strong> Cada fase necesita un volumen diferente</li>
</ul>

<h2>¿Necesitas DJ para tu Evento Corporativo?</h2>

<p>En <a href="/es/servicios/empresas">Òrbita Events</a> somos especialistas en eventos corporativos. Nuestro <a href="/es/configurador">configurador</a> te permite presupuestar el servicio exacto que necesitas, o <a href="/es/contacto">contacta</a> para eventos a medida.</p>`,
    ca: `<h2>La Música com a Eina Estratègica en Esdeveniments Corporatius</h2>

<p>La música en un <strong>esdeveniment corporatiu</strong> no és decoració — és una eina estratègica que controla el ritme, l'energia i les emocions de tots els assistents.</p>

<h2>Fase 1: Recepció i Còctel (60-90 minuts)</h2>
<p>Crear un ambient <strong>sofisticat i relaxat</strong> que faciliti la conversa i el networking. Jazz suau, lounge, bossa nova. <strong>90-110 BPM</strong>, volum 65-70 dB.</p>

<h2>Fase 2: Sopar (60-120 minuts)</h2>
<p>Acompanyar el sopar sense competir amb ell. Pop suau, soul, clàssics relaxats. <strong>100-115 BPM</strong>, volum 60-68 dB.</p>

<h2>Fase 3: Transició (15-20 minuts)</h2>
<p>El moment més crític. Pujada gradual de BPM (de 110 a 125), augment progressiu de volum, canvi d'il·luminació.</p>

<h2>Fase 4: Festa (2-4 hores)</h2>
<p>Pop comercial, clàssics infalibles (Queen, ABBA, MJ), llatí selecte, dance/house. <strong>120-130 BPM</strong>, volum 85-95 dB.</p>

<h2>Errors Comuns</h2>
<ul>
<li>Posar un pendrive i oblidar-te</li>
<li>Música massa "de nínxol"</li>
<li>Transició brusca sopar→festa</li>
<li>Volum constant (cada fase necessita un volum diferent)</li>
</ul>

<p>A <a href="/ca/servicios/empresas">Òrbita Events</a> som especialistes en esdeveniments corporatius. El nostre <a href="/ca/configurador">configurador</a> et permet pressupostar el servei exacte que necessites.</p>`,
  },

  'efectos-especiales-fiestas-co2-bengalas': {
    es: `<h2>Efectos Especiales que Transforman Cualquier Fiesta</h2>

<p>Los <strong>efectos especiales</strong> son el elemento que separa una buena fiesta de una fiesta épica. Desde bengalas frías que iluminan momentos mágicos hasta cañones de CO2 que hacen temblar la pista de baile, estos efectos crean recuerdos imborrables.</p>

<p>En esta guía te explicamos cada efecto disponible, cuándo usarlo, su coste aproximado y las medidas de seguridad necesarias.</p>

<h2>Cañones de CO2: El Impacto Máximo</h2>

<h3>¿Qué Son?</h3>
<p>Los cañones de CO2 lanzan <strong>chorros de gas carbónico a -78°C</strong> que crean columnas blancas espectaculares de hasta 8 metros de altura. El efecto visual es impresionante y además refresca la pista de baile en los momentos más intensos.</p>

<h3>¿Cuándo Usarlos?</h3>
<ul>
<li><strong>Drop de la canción:</strong> Sincronizado con el momento álgido de un tema épico</li>
<li><strong>Cuenta atrás:</strong> Para fin de año o momentos especiales de celebración</li>
<li><strong>Entrada de los protagonistas:</strong> En bodas o eventos corporativos</li>
</ul>

<h3>Seguridad</h3>
<p>El CO2 es <strong>100% seguro</strong> en espacios ventilados. Las bombonas certificadas y los equipos profesionales incluyen válvulas de seguridad. Solo debe operarlos un técnico cualificado. No produce residuos ni mancha.</p>

<h3>Coste</h3>
<p>Un setup de 2 cañones de CO2 para un evento cuesta entre <strong>200-400€</strong> (incluye bombonas y operador). Se pueden hacer 15-25 disparos por bombona.</p>

<h2>Bengalas Frías (Cold Sparks)</h2>

<h3>¿Qué Son?</h3>
<p>Las bengalas frías usan <strong>polvo de titanio</strong> que produce chispas brillantes pero a baja temperatura (solo 60-80°C vs los 600°C+ de las bengalas tradicionales). Se pueden tocar sin quemarse y no suponen riesgo de incendio.</p>

<h3>¿Cuándo Usarlas?</h3>
<ul>
<li><strong>Primer baile en bodas:</strong> El efecto más espectacular — los novios rodeados de cascadas doradas de chispas</li>
<li><strong>Presentación de producto:</strong> Para el momento "reveal" en eventos corporativos</li>
<li><strong>Brindis especial:</strong> Acompañando el momento de brindis con un efecto visual que todos recordarán</li>
<li><strong>Momento cumbre de la fiesta:</strong> Para elevar la energía al máximo</li>
</ul>

<h3>Características Técnicas</h3>
<ul>
<li>Altura de las chispas: 2-5 metros (ajustable)</li>
<li>Duración por carga: 15-30 segundos</li>
<li>Sin humo, sin olor, sin residuos</li>
<li>Seguros para interiores (certificación CE)</li>
</ul>

<h3>Coste</h3>
<p>Un setup de 2-4 bengalas frías para un evento: <strong>150-350€</strong>. Incluye máquinas, consumible y operador.</p>

<h2>Humo Bajo (Dry Ice / Criogénico)</h2>

<h3>¿Qué Es?</h3>
<p>El humo bajo crea una <strong>capa densa de niebla a nivel del suelo</strong> que no sube — literalmente parece que estés bailando sobre las nubes. Se produce con hielo seco (dry ice) o con máquinas criogénicas profesionales.</p>

<h3>¿Cuándo Usarlo?</h3>
<ul>
<li><strong>Primer baile:</strong> El efecto por excelencia — los novios bailando sobre nubes</li>
<li><strong>Apertura de pista:</strong> Para crear un momento mágico de inicio</li>
<li><strong>Presentaciones:</strong> Para que el ponente entre "emergiendo de la niebla"</li>
</ul>

<h3>Diferencias: Dry Ice vs Criogénico</h3>
<p><strong>Dry Ice:</strong> Más económico (80-150€), efecto de 3-5 minutos, necesita preparación previa y agua caliente. Ideal para momentos puntuales como el primer baile.</p>
<p><strong>Criogénico:</strong> Más caro (300-600€), efecto instantáneo y controlable, puede repetirse ilimitadamente. Ideal para fiesta continua y múltiples momentos.</p>

<h2>Confeti y Streamers</h2>

<h3>Cañones de Confeti</h3>
<p>Los cañones de CO2 pueden lanzar <strong>confeti metalizado o de papel</strong> en diferentes colores. Efecto espectacular para momentos de celebración: entrada de novios, brindis, final de evento.</p>

<p>Opciones: confeti estándar, confeti biodegradable (recomendado para exteriores), pétalos de rosa sintéticos, serpentinas y streamers de papel.</p>

<h3>Coste</h3>
<p>Confeti con cañón CO2: <strong>100-250€</strong> por disparo (incluye confeti y gas). Se puede combinar con el cañón de CO2 estándar.</p>

<h2>Láser Profesional</h2>

<h3>¿Qué Es?</h3>
<p>Un sistema láser profesional proyecta <strong>haces de luz coherente de colores</strong> que crean formas geométricas, túneles de luz y efectos tridimensionales sobre la pista de baile. Los láseres profesionales son RGB (rojo, verde, azul) y pueden generar cualquier color.</p>

<h3>Seguridad</h3>
<p>Los láseres profesionales deben operar por encima de la línea de los ojos (mínimo 2.5m del suelo) y estar certificados. En Òrbita Events usamos equipos <strong>clase 3B certificados</strong> con sistemas de seguridad integrados.</p>

<h3>Coste</h3>
<p>Láser profesional para evento: <strong>150-400€</strong> dependiendo de la potencia y complejidad del show.</p>

<h2>Combinaciones Recomendadas por Tipo de Evento</h2>

<h3>Boda (Pack Romántico)</h3>
<p>Bengalas frías para el primer baile + humo bajo (dry ice) + confeti dorado para la entrada. Total: <strong>350-600€</strong></p>

<h3>Fiesta Privada (Pack Fiesta)</h3>
<p>Cañones de CO2 (4 disparos) + bengalas frías + láser. Total: <strong>400-700€</strong></p>

<h3>Evento Corporativo (Pack Impacto)</h3>
<p>Bengalas frías para el reveal + CO2 para el momento cumbre + confeti corporativo (colores de la empresa). Total: <strong>300-500€</strong></p>

<h2>¿Quieres Efectos en tu Evento?</h2>

<p>Todos estos efectos están disponibles como extras en nuestros <a href="/es/packs">packs de DJ</a>. Usa el <a href="/es/configurador">configurador de precios</a> para añadirlos a tu presupuesto, o <a href="/es/contacto">contacta</a> para combos personalizados.</p>`,
    ca: `<h2>Efectes Especials que Transformen Qualsevol Festa</h2>

<p>Els <strong>efectes especials</strong> són l'element que separa una bona festa d'una festa èpica. Des de bengales fredes fins a canons de CO2, creen records inesborrables.</p>

<h2>Canons de CO2</h2>
<p>Llancen <strong>raigs de gas carbònic a -78°C</strong> que creen columnes blanques de fins a 8 metres. 100% segur en espais ventilats. Cost: <strong>200-400€</strong> per 2 canons.</p>

<h2>Bengales Fredes (Cold Sparks)</h2>
<p>Usen <strong>pols de titani</strong> que produeix guspires brillants a baixa temperatura (60-80°C). Segures per a interiors. Ideals per al primer ball, presentacions i brindis. Cost: <strong>150-350€</strong>.</p>

<h2>Fum Baix (Dry Ice / Criogènic)</h2>
<p>Crea una <strong>capa densa de boira a nivell del terra</strong>. Dry ice: 80-150€ per 3-5 minuts. Criogènic: 300-600€ amb control il·limitat.</p>

<h2>Confeti i Streamers</h2>
<p>Confeti metal·litzat o de paper amb canó CO2. Cost: <strong>100-250€</strong> per dispara.</p>

<h2>Làser Professional</h2>
<p>Feixos de llum RGB que creen formes geomètriques. Equips classe 3B certificats. Cost: <strong>150-400€</strong>.</p>

<h2>Combinacions per Tipus d'Esdeveniment</h2>
<ul>
<li><strong>Casament:</strong> Bengales + fum baix + confeti (350-600€)</li>
<li><strong>Festa:</strong> CO2 + bengales + làser (400-700€)</li>
<li><strong>Corporatiu:</strong> Bengales + CO2 + confeti (300-500€)</li>
</ul>

<p>Disponibles com a extras als nostres <a href="/ca/packs">packs de DJ</a>. Usa el <a href="/ca/configurador">configurador</a> per afegir-los.</p>`,
  },

  'como-organizar-fiesta-fin-ano-perfecta': {
    es: `<h2>La Noche Más Especial del Año Merece una Planificación Especial</h2>

<p>Nochevieja es <strong>la fiesta más importante del año</strong>. Todo el mundo espera que sea mágica, inolvidable y perfecta. Pero precisamente por esas expectativas tan altas, necesita una planificación cuidadosa para que todo salga como esperas.</p>

<p>Después de producir fiestas de fin de año para más de 100 clientes, hemos creado esta guía con todo lo que necesitas saber.</p>

<h2>1. El Espacio: Elegir el Lugar Perfecto</h2>

<h3>En Casa</h3>
<p>Si celebras en casa, el espacio disponible determina todo lo demás. Para 20-30 personas, necesitas al menos <strong>40-50m² despejados</strong> para pista de baile. Mueve muebles, protege el suelo y asegura buena ventilación.</p>

<h3>Alquiler de Espacio</h3>
<p>Para fiestas de 50+ personas, considera alquilar un espacio privado. Opciones populares en Barcelona: masías con salón, restaurantes con zona privada, lofts industriales y rooftops cubiertos.</p>

<h3>Al Aire Libre</h3>
<p>En Barcelona el clima de diciembre lo permite (8-12°C noche). Si optas por exterior, necesitas carpas con calefacción, suelo técnico y plan B por lluvia.</p>

<h2>2. El Timeline Perfecto para Nochevieja</h2>

<ul>
<li><strong>21:00 - 22:00:</strong> Recepción con cocktail y música ambiental (jazz, lounge). Tiempo para que llegue todo el mundo y socializar.</li>
<li><strong>22:00 - 23:30:</strong> Cena con música de fondo progresivamente más animada. Incluir elementos interactivos: quiz del año, predicciones para el próximo.</li>
<li><strong>23:30 - 23:55:</strong> Transición musical. El DJ empieza a subir la energía. Preparar las uvas/cotillón.</li>
<li><strong>23:55 - 00:05:</strong> ¡CUENTA ATRÁS! Proyección en pantalla, efectos de CO2 o bengalas frías en el momento cero. Brindis con cava.</li>
<li><strong>00:05 - 03:00:</strong> Fiesta a tope. El DJ despliega su mejor set. Efectos especiales, pista llena.</li>
<li><strong>03:00 - 04:00:</strong> Set de cierre más chill. Últimos bailes, goodbyes.</li>
</ul>

<h2>3. La Cena: Menú que Funciona</h2>

<h3>Formato Cocktail vs Sentados</h3>
<p>Para Nochevieja, el <strong>formato cocktail cena</strong> (pie con mesas altas + servicio continuo) funciona mejor que la cena sentados clásica. Permite socializar, moverse y no rompe la energía de la fiesta.</p>

<h3>Menú Recomendado</h3>
<ul>
<li><strong>Entrantes fríos:</strong> Tartar de salmón, bruschettas variadas, quesos selectos</li>
<li><strong>Calientes:</strong> Mini hamburguesas, croquetas premium, tataki de atún</li>
<li><strong>Plato principal:</strong> Solomillo o merluza en raciones de cocktail</li>
<li><strong>Postre:</strong> Mesa dulce con petit fours y chocolate</li>
<li><strong>12 uvas:</strong> Preparadas en vasitos individuales (gourmet touch)</li>
</ul>

<h3>Bebida</h3>
<p>Calcula <strong>1 botella de cava por cada 3 personas</strong> solo para el brindis. Para la fiesta: barra con gin-tonic, mojito, cerveza y refrescos. Premium: añadir un bartender para cócteles en vivo.</p>

<h2>4. Música y DJ: El Corazón de la Noche</h2>

<h3>Por Qué Necesitas DJ en Nochevieja</h3>
<p>Nochevieja sin DJ profesional es como un cumpleaños sin tarta. El DJ controla la energía de toda la noche: ambienta la cena, gestiona la cuenta atrás, explota la fiesta y sabe cuándo bajar para el cierre.</p>

<h3>La Cuenta Atrás</h3>
<p>El momento más importante: el DJ sincroniza la cuenta atrás visual (proyección), sube el volumen gradualmente, y en el segundo CERO lanza el tema definitivo con CO2, confeti y bengalas frías. Es un momento que los invitados recordarán para siempre.</p>

<h2>5. Efectos Especiales para Nochevieja</h2>

<p>Nochevieja es <strong>la noche perfecta para efectos especiales</strong>:</p>
<ul>
<li><strong>Cuenta atrás:</strong> Cañones de CO2 + confeti dorado/plateado = ÉPICO</li>
<li><strong>Primer baile del año:</strong> Bengalas frías formando un pasillo de chispas</li>
<li><strong>Fiesta:</strong> Láser + humo = ambiente de club premium</li>
</ul>

<h2>6. Decoración: El Toque Final</h2>

<ul>
<li><strong>Colores:</strong> Dorado, plateado, negro y blanco. Elegancia sobre todo.</li>
<li><strong>Iluminación:</strong> Guirnaldas LED cálidas, velas (LED por seguridad), uplighting perimetral dorado</li>
<li><strong>Photocall:</strong> Fondo con año nuevo, props divertidos. Esencial para redes sociales.</li>
<li><strong>Cotillón:</strong> Gorros, matasuegras, gafas del año nuevo — clásicos que nunca fallan</li>
</ul>

<h2>7. Presupuesto Orientativo</h2>

<p>Para una fiesta de Nochevieja de 50 personas en Barcelona:</p>
<ul>
<li><strong>DJ + sonido + iluminación:</strong> 500-900€</li>
<li><strong>Catering cocktail cena:</strong> 35-60€/persona</li>
<li><strong>Bebida (barra libre 4h):</strong> 15-25€/persona</li>
<li><strong>Efectos especiales (CO2 + confeti):</strong> 200-400€</li>
<li><strong>Decoración y cotillón:</strong> 200-400€</li>
<li><strong>Total aproximado:</strong> 3000-5500€ (60-110€/persona)</li>
</ul>

<h2>¿Organizamos tu Nochevieja?</h2>

<p>En <a href="/es/servicios/fiestas">Òrbita Events</a> hemos producido docenas de fiestas de fin de año inolvidables. Sonido, DJ, iluminación y efectos especiales — todo coordinado para que solo te preocupes de pasarlo bien.</p>

<p>Empieza a configurar tu fiesta con nuestro <a href="/es/configurador">configurador de precios</a> o <a href="/es/contacto">contacta</a> directamente con nuestro equipo.</p>`,
    ca: `<h2>La Nit Més Especial de l'Any Mereix una Planificació Especial</h2>

<p>Cap d'any és <strong>la festa més important de l'any</strong>. Tothom espera que sigui màgica i inoblidable.</p>

<h2>1. L'Espai</h2>
<p>Per a 20-30 persones, necessites mínim <strong>40-50m² despejats</strong>. Per 50+, considera llogar un espai privat.</p>

<h2>2. El Timeline Perfecte</h2>
<ul>
<li><strong>21:00:</strong> Recepció amb còctel</li>
<li><strong>22:00:</strong> Sopar</li>
<li><strong>23:30:</strong> Transició musical</li>
<li><strong>23:55:</strong> COMPTE ENRERE amb CO2 i confeti</li>
<li><strong>00:05 - 03:00:</strong> Festa a tope</li>
</ul>

<h2>3. Música i DJ</h2>
<p>El DJ controla l'energia de tota la nit: ambienta el sopar, gestiona el compte enrere i explota la festa.</p>

<h2>4. Efectes Especials</h2>
<ul>
<li><strong>Compte enrere:</strong> CO2 + confeti daurat = ÈPIC</li>
<li><strong>Primer ball de l'any:</strong> Bengales fredes</li>
<li><strong>Festa:</strong> Làser + fum</li>
</ul>

<h2>5. Pressupost per 50 persones</h2>
<ul>
<li>DJ + so + il·luminació: 500-900€</li>
<li>Càtering: 35-60€/persona</li>
<li>Efectes: 200-400€</li>
<li><strong>Total: 3000-5500€</strong></li>
</ul>

<p>A <a href="/ca/servicios/fiestas">Òrbita Events</a> hem produït dotzenes de festes de cap d'any. Usa el <a href="/ca/configurador">configurador</a> per pressupostar.</p>`,
  },

  'fiestas-cumpleanos-adultos-ideas-2026': {
    es: `<h2>Ideas Frescas para Fiestas de Cumpleaños de Adultos en 2026</h2>

<p>Los cumpleaños de adultos han evolucionado mucho más allá de "tarta y música de fondo". En 2026, las tendencias apuntan a <strong>experiencias inmersivas, personalización extrema y momentos diseñados para compartir</strong>. Aquí te presentamos las mejores ideas para que tu próximo cumpleaños sea inolvidable.</p>

<h2>Tendencia 1: Fiestas Temáticas para Adultos</h2>

<h3>Noche de Casino</h3>
<p>Mesas de blackjack, ruleta y póker con croupiers profesionales. Dress code elegante (traje y vestido largo). DJ con set de jazz y swing para ambientar, escalando a house y dance para la fiesta posterior. Decoración en negro, dorado y rojo.</p>

<h3>Fiesta Retro (80s/90s)</h3>
<p>Decoración neón, playlist exclusiva de la década elegida, photocall con atrezzo vintage y proyección de videoclips clásicos. Los invitados vienen vestidos de la época — el resultado es espectacular para fotos.</p>

<h3>Festival Indoor</h3>
<p>Transforma un espacio en un mini-festival: escenario con luces profesionales, zona chill con cojines, barra con cócteles temáticos, pulseras de neón y un DJ que programa sets de diferentes géneros cada hora.</p>

<h3>Murder Mystery Night</h3>
<p>Una cena con misterio donde los invitados son los personajes. Ideal para grupos de 15-30 personas. Se combina con cena servida y, después del desenlace, fiesta con DJ.</p>

<h2>Tendencia 2: Experiencias Gastronómicas</h2>

<h3>Wine & DJ</h3>
<p>Cata de vinos con sommelier profesional como primera parte, seguida de cena maridada y fiesta con DJ. La transición del vino a la pista de baile es sorprendentemente natural si se gestiona bien.</p>

<h3>Cooking + Party</h3>
<p>Taller de cocina con chef privado donde los invitados preparan su propia cena, seguido de la degustación colectiva y una fiesta con DJ y luces. Formato ideal para cumpleaños de 15-25 personas.</p>

<h2>Tendencia 3: Venues Inesperados</h2>

<h3>Rooftop Privado</h3>
<p>Una terraza privada con vistas a Barcelona de noche, luces colgantes, zona lounge y DJ con equipo portátil premium. La normativa de ruido obliga a acabar a las 23:00 en la mayoría de rooftops, pero hasta esa hora es mágico.</p>

<h3>Masía con Jardín</h3>
<p>Una masía privada permite tener la fiesta que quieras sin límites de horario. Cena al aire libre con guirnaldas de luces y fiesta dentro del salón con equipo profesional completo.</p>

<h3>Barco / Yate</h3>
<p>Para grupos de hasta 30 personas, un barco con DJ por la costa de Barcelona es una experiencia premium. Puesta de sol + cena a bordo + fiesta con vistas al skyline iluminado.</p>

<h2>Tendencia 4: Personalización Total</h2>

<h3>Playlist Biográfica</h3>
<p>El DJ prepara un <strong>viaje musical por la vida del cumpleañero</strong>: canciones de su adolescencia, hits de la universidad, la canción de su boda, los temas que marcan cada etapa. Los invitados participan enviando sugerencias previas por WhatsApp.</p>

<h3>Vídeo Homenaje</h3>
<p>Recopilar mensajes de vídeo de amigos y familia (los que no pueden asistir) y proyectarlo como sorpresa durante la cena. Combinado con la iluminación adecuada, es un momento muy emotivo.</p>

<h3>Efectos Personalizados</h3>
<p>Gobo con el nombre del cumpleañero proyectado en la pared, bengalas frías para el momento de la tarta, y confeti con colores personalizados.</p>

<h2>Presupuesto por Tipo de Fiesta (20-40 personas)</h2>

<ul>
<li><strong>Fiesta en casa con DJ:</strong> 400-800€ (DJ + equipo portátil + luces)</li>
<li><strong>Fiesta temática completa:</strong> 1500-3000€ (venue + decoración + DJ + catering)</li>
<li><strong>Experiencia premium:</strong> 3000-6000€ (venue exclusivo + chef + DJ + efectos)</li>
</ul>

<h2>¿Preparamos tu Cumpleaños?</h2>

<p>En <a href="/es/servicios/fiestas">Òrbita Events</a> diseñamos fiestas de cumpleaños personalizadas con DJ, iluminación y efectos. Desde una fiesta íntima en casa hasta un evento premium en una masía — lo adaptamos todo a tu visión.</p>

<p>Configura tu fiesta con nuestro <a href="/es/configurador">configurador</a> o <a href="/es/contacto">contacta</a> para ideas a medida.</p>`,
    ca: `<h2>Idees Fresques per a Festes d'Aniversari d'Adults el 2026</h2>

<p>Els aniversaris d'adults han evolucionat. Les tendències apunten a <strong>experiències immersives i personalització extrema</strong>.</p>

<h2>Temàtiques Top</h2>
<ul>
<li><strong>Nit de Casino:</strong> Taules de joc amb croupiers, dress code elegant, DJ jazz→dance</li>
<li><strong>Festa Retro 80s/90s:</strong> Decoració neó, playlist exclusiva, photocall vintage</li>
<li><strong>Festival Indoor:</strong> Escenari amb llums, zona chill, DJ amb sets per gènere</li>
</ul>

<h2>Experiències Gastronòmiques</h2>
<ul>
<li><strong>Wine & DJ:</strong> Tast de vins + sopar + festa</li>
<li><strong>Cooking + Party:</strong> Taller de cuina + degustació + DJ</li>
</ul>

<h2>Venues Inesperats</h2>
<ul>
<li><strong>Rooftop:</strong> Terrassa amb vistes, llums, zona lounge</li>
<li><strong>Masia:</strong> Sense límits d'horari, sopar + festa completa</li>
<li><strong>Vaixell:</strong> Posta de sol + sopar + festa amb skyline</li>
</ul>

<h2>Personalització Total</h2>
<p>Playlist biogràfica (viatge musical per la vida del festejar), vídeo homenatge sorpresa, gobo amb el nom projectat.</p>

<h2>Pressupost (20-40 persones)</h2>
<ul>
<li><strong>Festa a casa amb DJ:</strong> 400-800€</li>
<li><strong>Temàtica completa:</strong> 1500-3000€</li>
<li><strong>Premium:</strong> 3000-6000€</li>
</ul>

<p>A <a href="/ca/servicios/fiestas">Òrbita Events</a> dissenyem festes personalitzades. Usa el <a href="/ca/configurador">configurador</a> o <a href="/ca/contacto">contacta</a>.</p>`,
  },

  'mejores-canciones-cada-momento-boda': {
    es: `<h2>La Banda Sonora Perfecta para Cada Momento de tu Boda</h2>

<p>La música es el hilo invisible que conecta todos los momentos de tu boda. Cada fase — desde la ceremonia hasta el último baile — necesita una <strong>selección musical cuidadosamente pensada</strong> que amplifique las emociones del momento.</p>

<p>Después de amenizar cientos de bodas en Barcelona y Girona, hemos compilado las canciones que siempre funcionan, organizadas por momento.</p>

<h2>Ceremonia: Canciones para la Entrada</h2>

<h3>Clásicas Elegantes</h3>
<ul>
<li><strong>"Canon in D"</strong> — Pachelbel (la clásica por excelencia)</li>
<li><strong>"A Thousand Years"</strong> — Christina Perri (moderna pero emotiva)</li>
<li><strong>"Marry Me"</strong> — Train (íntima y sincera)</li>
<li><strong>"Here Comes the Sun"</strong> — The Beatles (alegre y luminosa)</li>
</ul>

<h3>Modernas Originales</h3>
<ul>
<li><strong>"Perfect"</strong> — Ed Sheeran (versión acústica o con orquesta)</li>
<li><strong>"All of Me"</strong> — John Legend (piano, pura emoción)</li>
<li><strong>"Can't Help Falling in Love"</strong> — versión Haley Reinhart (reinventada con jazz)</li>
<li><strong>"Turning Page"</strong> — Sleeping at Last (delicada y cinematográfica)</li>
</ul>

<h2>Cocktail: Ambiente Relajado (1-2 horas)</h2>

<h3>La Selección Ideal</h3>
<p>El cocktail necesita música que <strong>acompañe sin dominar</strong>. Jazz, bossa nova y covers acústicos de canciones populares funcionan perfectamente.</p>
<ul>
<li><strong>Jazz:</strong> Frank Sinatra, Nat King Cole, Ella Fitzgerald</li>
<li><strong>Bossa Nova:</strong> Antonio Carlos Jobim, Stan Getz</li>
<li><strong>Covers acústicos:</strong> Boyce Avenue, Vitamin String Quartet</li>
<li><strong>Indie suave:</strong> Jack Johnson, Jason Mraz, Vance Joy</li>
</ul>

<h2>Cena: Elegancia Musical</h2>

<h3>Primera Parte (entrada y primer plato)</h3>
<p>Continuación natural del cocktail pero ligeramente más dinámica:</p>
<ul>
<li>Stevie Wonder — "Isn't She Lovely", "Signed Sealed Delivered"</li>
<li>Bill Withers — "Lovely Day", "Ain't No Sunshine"</li>
<li>Amy Winehouse — "Valerie", "Love Is a Losing Game"</li>
</ul>

<h3>Segunda Parte (plato principal y postre)</h3>
<p>Empezar a subir ligeramente la energía preparando la transición a fiesta:</p>
<ul>
<li>Bruno Mars — "Just the Way You Are", "Count on Me"</li>
<li>Michael Bublé — "Feeling Good", "Everything"</li>
<li>Coldplay — "Yellow", "The Scientist" (versiones suaves)</li>
</ul>

<h2>Primer Baile: El Momento Mágico</h2>

<h3>Top 10 Canciones para Primer Baile</h3>
<ol>
<li><strong>"Perfect"</strong> — Ed Sheeran</li>
<li><strong>"Thinking Out Loud"</strong> — Ed Sheeran</li>
<li><strong>"At Last"</strong> — Etta James</li>
<li><strong>"A Thousand Years"</strong> — Christina Perri</li>
<li><strong>"All of Me"</strong> — John Legend</li>
<li><strong>"Can't Help Falling in Love"</strong> — Elvis Presley</li>
<li><strong>"Make You Feel My Love"</strong> — Adele</li>
<li><strong>"Ho Hey"</strong> — The Lumineers (si queréis algo más divertido)</li>
<li><strong>"You Are the Best Thing"</strong> — Ray LaMontagne</li>
<li><strong>"La Vie en Rose"</strong> — Édith Piaf (para un toque francés)</li>
</ol>

<h3>Primer Baile con Efectos</h3>
<p>El primer baile combinado con <strong>humo bajo y bengalas frías</strong> es un momento cinematográfico. En Òrbita Events, sincronizamos los efectos con momentos clave de la canción para crear una experiencia inolvidable.</p>

<h2>Apertura de Pista: La Transición</h2>

<p>Después del primer baile, necesitas <strong>3-4 canciones puente</strong> que inviten a todos a la pista:</p>
<ul>
<li><strong>"I Gotta Feeling"</strong> — Black Eyed Peas (infalible)</li>
<li><strong>"Uptown Funk"</strong> — Bruno Mars</li>
<li><strong>"Don't Stop Me Now"</strong> — Queen</li>
<li><strong>"Livin' on a Prayer"</strong> — Bon Jovi</li>
</ul>

<h2>Fiesta: El Set que Llena la Pista</h2>

<h3>Clásicos Infalibles</h3>
<ul>
<li>Queen — "Bohemian Rhapsody", "We Will Rock You"</li>
<li>ABBA — "Dancing Queen", "Gimme! Gimme! Gimme!"</li>
<li>Michael Jackson — "Billie Jean", "Thriller"</li>
<li>Whitney Houston — "I Wanna Dance with Somebody"</li>
</ul>

<h3>Éxitos Modernos</h3>
<ul>
<li>Dua Lipa — "Don't Start Now", "Levitating"</li>
<li>The Weeknd — "Blinding Lights"</li>
<li>Shakira — "Hips Don't Lie", Sessions #53</li>
<li>Bad Bunny — selección mainstream (para público joven)</li>
</ul>

<h3>Temas para Cantar Todos</h3>
<ul>
<li>"Vivir Mi Vida" — Marc Anthony</li>
<li>"Yo Soy Aquel" — Raphael (para los mayores)</li>
<li>"Sweet Caroline" — Neil Diamond</li>
<li>"Summer of '69" — Bryan Adams</li>
</ul>

<h2>Último Baile: El Cierre Perfecto</h2>

<p>La última canción de la noche debe ser un <strong>momento de grupo, emotivo y memorable</strong>:</p>
<ul>
<li><strong>"Don't Stop Believin'"</strong> — Journey (el cierre perfecto)</li>
<li><strong>"Angels"</strong> — Robbie Williams</li>
<li><strong>"Time of My Life"</strong> — Dirty Dancing</li>
<li><strong>"We Are the Champions"</strong> — Queen</li>
</ul>

<h2>Personaliza tu Playlist con Nosotros</h2>

<p>En <a href="/es/servicios/bodas">Òrbita Events</a>, cada boda tiene una playlist 100% personalizada. Nos reunimos con vosotros para entender vuestros gustos, canciones especiales y momentos clave. Usa nuestro <a href="/es/configurador">configurador</a> para empezar.</p>`,
    ca: `<h2>La Banda Sonora Perfecta per a Cada Moment del teu Casament</h2>

<p>La música és el fil invisible que connecta tots els moments del teu casament. Cada fase necessita una <strong>selecció musical acuradament pensada</strong>.</p>

<h2>Cerimònia: Cançons per a l'Entrada</h2>
<ul>
<li>"Canon in D" — Pachelbel</li>
<li>"A Thousand Years" — Christina Perri</li>
<li>"Perfect" — Ed Sheeran</li>
<li>"All of Me" — John Legend</li>
</ul>

<h2>Còctel: Ambient Relaxat</h2>
<p>Jazz, bossa nova i covers acústics. Frank Sinatra, Ella Fitzgerald, Jack Johnson.</p>

<h2>Primer Ball: Top 10</h2>
<ol>
<li>"Perfect" — Ed Sheeran</li>
<li>"At Last" — Etta James</li>
<li>"A Thousand Years" — Christina Perri</li>
<li>"All of Me" — John Legend</li>
<li>"Can't Help Falling in Love" — Elvis</li>
</ol>

<h2>Festa: Clàssics Infalibles</h2>
<p>Queen, ABBA, Michael Jackson, Whitney Houston, Dua Lipa, The Weeknd, Shakira.</p>

<h2>Últim Ball</h2>
<p>"Don't Stop Believin'" — Journey, "Angels" — Robbie Williams, "We Are the Champions" — Queen.</p>

<p>A <a href="/ca/servicios/bodas">Òrbita Events</a>, cada casament té una playlist 100% personalitzada. Usa el <a href="/ca/configurador">configurador</a> per començar.</p>`,
  },
};

async function main() {
  console.log('Expanding short blog posts...\n');

  for (const [slug, content] of Object.entries(EXPANDED_CONTENT)) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: { translations: true },
    });

    if (!post) {
      console.log(`  ⚠️ Post not found: ${slug}`);
      continue;
    }

    // Update ES translation
    const esTrans = post.translations.find(t => t.locale === 'es');
    if (esTrans) {
      await prisma.blogPostTranslation.update({
        where: { id: esTrans.id },
        data: { content: content.es },
      });
    }

    // Update CA translation
    const caTrans = post.translations.find(t => t.locale === 'ca');
    if (caTrans) {
      await prisma.blogPostTranslation.update({
        where: { id: caTrans.id },
        data: { content: content.ca },
      });
    }

    // Update reading time based on word count
    const wordCount = content.es.split(/\s+/).length;
    const readingTime = Math.max(5, Math.ceil(wordCount / 200));
    await prisma.blogPost.update({
      where: { slug },
      data: { readingTime },
    });

    console.log(`  ✅ ${slug} → ${wordCount} words (${readingTime} min)`);
  }

  console.log('\nDone!');
  await prisma.$disconnect();
}

main();

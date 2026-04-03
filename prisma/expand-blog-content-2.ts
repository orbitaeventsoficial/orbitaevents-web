// Expand remaining short blog posts (batch 2)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXPANDED_CONTENT: Record<string, { es: string; ca: string }> = {
  'tendencias-bodas-barcelona-2026': {
    es: `<h2>Las Tendencias que Definirán las Bodas en Barcelona en 2026</h2>

<p>El mundo de las bodas evoluciona constantemente, y <strong>Barcelona</strong> se mantiene como uno de los destinos más innovadores para celebraciones nupciales. En 2026, las parejas buscan experiencias más personalizadas, sostenibles y tecnológicamente integradas que nunca.</p>

<h2>Micro-Bodas y Celebraciones Íntimas</h2>

<h3>Menos Invitados, Más Experiencia</h3>
<p>La tendencia de las <strong>micro-bodas</strong> (entre 30 y 80 invitados) se consolida en 2026. Las parejas prefieren invertir más por invitado, ofreciendo experiencias gastronómicas premium, entretenimiento de alta calidad y detalles personalizados que serían imposibles con 200 personas.</p>

<h3>Venues Exclusivos</h3>
<p>Con menos invitados, se abren opciones de <strong>espacios más exclusivos</strong>: restaurantes con estrella Michelin, masías boutique, azoteas privadas con vistas al mar o incluso barcos. Barcelona ofrece una variedad inigualable de venues íntimos y con carácter.</p>

<h2>Sostenibilidad Real, No de Escaparate</h2>

<h3>Proveedores Km0</h3>
<p>Las parejas de 2026 exigen <strong>sostenibilidad verificable</strong>: flores de temporada y proximidad, catering con producto local, decoración reutilizable o compostable. Ya no basta con decir "somos eco", hay que demostrarlo.</p>

<h3>Tecnología al Servicio del Medio Ambiente</h3>
<p>La <strong>iluminación LED de bajo consumo</strong>, los sistemas de sonido eficientes y la reducción de impresiones (invitaciones digitales, menús con QR) forman parte del compromiso medioambiental sin sacrificar la estética.</p>

<h2>Entretenimiento Inmersivo</h2>

<h3>Más Allá del DJ Tradicional</h3>
<p>En 2026, el entretenimiento de bodas va más allá de la música. Se integran <strong>experiencias inmersivas</strong>: mapping de proyección, instalaciones de luz interactivas, photo experiences con IA y momentos coreografiados que involucran a todos los invitados.</p>

<h3>Momentos Instagrameables Diseñados</h3>
<p>Cada celebración incluye al menos 2-3 <strong>"momentos wow"</strong> diseñados para ser compartidos: una entrada con bengalas frías, un primer baile con humo bajo, una lluvia de confeti dorado. El DJ y el equipo de iluminación coordinan estos momentos para maximizar su impacto visual.</p>

<h3>Sets Musicales Temáticos</h3>
<p>En lugar de una fiesta genérica, las parejas piden <strong>bloques musicales temáticos</strong>: una hora de Motown, un set de música latina, un bloque indie o electrónico. Cada bloque tiene su propia iluminación y energía.</p>

<h2>La Nueva Estética Barcelona 2026</h2>

<h3>Colores Terrosos y Naturales</h3>
<p>Adiós al blanco impoluto. La paleta 2026 incluye <strong>terracota, salvia, arena y dorado mate</strong>. Colores que conectan con la naturaleza mediterránea y que el equipo de iluminación puede potenciar con wash LED en tonos cálidos.</p>

<h3>Mezcla de Texturas</h3>
<p>Madera, lino, cerámica artesanal, flores secas mezcladas con frescas. La estética 2026 es <strong>táctil y orgánica</strong>, alejándose de lo plástico y lo uniforme.</p>

<h2>Tecnología Integrada sin Ser Invasiva</h2>

<h3>Sistemas de Sonido Dirigido</h3>
<p>Los <strong>sistemas de sonido multizona</strong> permiten que la zona de cóctel tenga jazz suave mientras la pista de baile mantiene su energía. La tecnología de 2026 permite experiencias sonoras personalizadas por zona sin cables visibles.</p>

<h3>Iluminación Inteligente</h3>
<p>Los sistemas <strong>DMX avanzados</strong> permiten programar la iluminación para que evolucione con la celebración: tonos cálidos durante la cena, colores vibrantes en la fiesta, efectos dramáticos en los momentos clave. Todo controlado desde una tablet.</p>

<p>En <a href="/es/servicios">Orbita Events</a> estamos a la vanguardia de todas estas tendencias. <a href="/es/configurador">Configura tu pack</a> y descubre cómo podemos hacer tu boda 2026 inolvidable.</p>`,

    ca: `<h2>Les Tendències que Definiran els Casaments a Barcelona el 2026</h2>

<p>El món dels casaments evoluciona constantment, i <strong>Barcelona</strong> es manté com una de les destinacions més innovadores per a celebracions nupcials. El 2026, les parelles busquen experiències més personalitzades, sostenibles i tecnològicament integrades que mai.</p>

<h2>Micro-Casaments i Celebracions Íntimes</h2>

<h3>Menys Convidats, Més Experiència</h3>
<p>La tendència dels <strong>micro-casaments</strong> (entre 30 i 80 convidats) es consolida el 2026. Les parelles prefereixen invertir més per convidat, oferint experiències gastronòmiques premium, entreteniment d'alta qualitat i detalls personalitzats que serien impossibles amb 200 persones.</p>

<h3>Venues Exclusius</h3>
<p>Amb menys convidats, s'obren opcions d'<strong>espais més exclusius</strong>: restaurants amb estrella Michelin, masies boutique, terrats privats amb vistes al mar o fins i tot vaixells. Barcelona ofereix una varietat inigualable de venues íntims i amb caràcter.</p>

<h2>Sostenibilitat Real, No d'Aparador</h2>

<h3>Proveïdors Km0</h3>
<p>Les parelles de 2026 exigeixen <strong>sostenibilitat verificable</strong>: flors de temporada i proximitat, càtering amb producte local, decoració reutilitzable o compostable. Ja no n'hi ha prou amb dir "som eco", cal demostrar-ho.</p>

<h3>Tecnologia al Servei del Medi Ambient</h3>
<p>La <strong>il·luminació LED de baix consum</strong>, els sistemes de so eficients i la reducció d'impressions (invitacions digitals, menús amb QR) formen part del compromís mediambiental sense sacrificar l'estètica.</p>

<h2>Entreteniment Immersiu</h2>

<h3>Més Enllà del DJ Tradicional</h3>
<p>El 2026, l'entreteniment de casaments va més enllà de la música. S'integren <strong>experiències immersives</strong>: mapping de projecció, instal·lacions de llum interactives, photo experiences amb IA i moments coreografiats que involucren tots els convidats.</p>

<h3>Moments Instagramejables Dissenyats</h3>
<p>Cada celebració inclou almenys 2-3 <strong>"moments wow"</strong> dissenyats per ser compartits: una entrada amb bengales fredes, un primer ball amb fum baix, una pluja de confeti daurat. El DJ i l'equip d'il·luminació coordinen aquests moments per maximitzar el seu impacte visual.</p>

<h3>Sets Musicals Temàtics</h3>
<p>En lloc d'una festa genèrica, les parelles demanen <strong>blocs musicals temàtics</strong>: una hora de Motown, un set de música llatina, un bloc indie o electrònic. Cada bloc té la seva pròpia il·luminació i energia.</p>

<h2>La Nova Estètica Barcelona 2026</h2>

<h3>Colors Terrosos i Naturals</h3>
<p>Adéu al blanc impolut. La paleta 2026 inclou <strong>terracota, sàlvia, sorra i daurat mat</strong>. Colors que connecten amb la natura mediterrània i que l'equip d'il·luminació pot potenciar amb wash LED en tons càlids.</p>

<h3>Mescla de Textures</h3>
<p>Fusta, lli, ceràmica artesanal, flors seques mesclades amb fresques. L'estètica 2026 és <strong>tàctil i orgànica</strong>, allunyant-se del plàstic i l'uniforme.</p>

<h2>Tecnologia Integrada sense Ser Invasiva</h2>

<h3>Sistemes de So Dirigit</h3>
<p>Els <strong>sistemes de so multizona</strong> permeten que la zona de còctel tingui jazz suau mentre la pista de ball manté la seva energia. La tecnologia de 2026 permet experiències sonores personalitzades per zona sense cables visibles.</p>

<h3>Il·luminació Intel·ligent</h3>
<p>Els sistemes <strong>DMX avançats</strong> permeten programar la il·luminació perquè evolucioni amb la celebració: tons càlids durant el sopar, colors vibrants a la festa, efectes dramàtics en els moments clau. Tot controlat des d'una tablet.</p>

<p>A <a href="/ca/serveis">Orbita Events</a> estem a l'avantguarda de totes aquestes tendències. <a href="/ca/configurador">Configura el teu pack</a> i descobreix com podem fer el teu casament 2026 inoblidable.</p>`,
  },

  'bodas-tematicas-crear-fiesta-inolvidable': {
    es: `<h2>¿Por Qué Elegir una Boda Temática?</h2>

<p>Una <strong>boda temática</strong> es la forma perfecta de hacer que tu celebración sea verdaderamente única. En lugar de seguir una plantilla genérica, construyes una experiencia que refleja vuestra personalidad como pareja: vuestras pasiones, recuerdos compartidos o estética favorita.</p>

<p>La clave está en la coherencia: cada elemento — desde la música hasta la iluminación, pasando por la decoración y el dresscode — debe contar la misma historia. Y ahí es donde un equipo profesional marca la diferencia.</p>

<h2>Temáticas Más Populares en 2026</h2>

<h3>Vintage / Gatsby</h3>
<p>Jazz en directo o sets de swing y jazz manouche durante el cóctel, transicionando a versiones electrónicas de clásicos para la fiesta. <strong>Iluminación dorada</strong> con focos de luz cálida, candelabros y gobo patterns art déco proyectados en paredes y suelos.</p>

<h3>Boho / Mediterráneo</h3>
<p>Música acústica indie y folk para la ceremonia y cóctel, evolucionando hacia indie dance y balearic house. <strong>Guirnaldas de luces cálidas</strong>, farolillos y wash LED en tonos ámbar y terracota que potencian la estética natural.</p>

<h3>Tropical / Caribeña</h3>
<p>Reggaetón clásico, salsa, bachata y cumbia con toques de dancehall. <strong>Wash LED en verde, turquesa y rosa</strong>, con efectos de estroboscopio para los momentos de máxima energía.</p>

<h3>Festival / Coachella</h3>
<p>Sets de indie rock, electrónica y pop alternativo como en un festival real. <strong>Iluminación de concierto</strong> con moving heads, haze y efectos de color que cambian con cada canción.</p>

<h3>Romántica Clásica</h3>
<p>Cuarteto de cuerda para la ceremonia, crooners y soul durante la cena, y clásicos del pop y rock para la fiesta. <strong>Uplighting en blanco cálido y rosa pálido</strong>, con momentos de humo bajo para el primer baile.</p>

<h2>Cómo la Música Define la Temática</h2>

<p>La música es el elemento que más impacto tiene en la percepción de tu tema. Un DJ profesional puede:</p>
<ul>
<li>Crear <strong>sets personalizados</strong> que evolucionen dentro de tu temática a lo largo de la noche</li>
<li>Mezclar géneros manteniendo la coherencia estilística</li>
<li>Incorporar <strong>jingles, efectos y transiciones temáticas</strong> entre bloques musicales</li>
<li>Adaptar la energía según el momento: cocktail → cena → fiesta</li>
</ul>

<h2>Iluminación Temática: El Poder del Color</h2>

<p>La <strong>iluminación</strong> es el segundo pilar de cualquier boda temática. Con sistemas DMX profesionales se puede:</p>
<ul>
<li>Crear ambientes totalmente diferentes en un mismo espacio cambiando solo los colores</li>
<li>Proyectar <strong>patrones gobo</strong> (monogramas, formas, texturas) en paredes y suelos</li>
<li>Sincronizar la iluminación con la música para momentos de alto impacto</li>
<li>Usar <strong>humo bajo, bengalas frías y CO2</strong> en los momentos clave</li>
</ul>

<h2>Errores Comunes en Bodas Temáticas</h2>

<h3>Exceso de Temática</h3>
<p>La temática debe ser un hilo conductor, no una imposición. Si obligas a todos tus invitados a disfrazarse o saturas cada rincón, la experiencia se convierte en una fiesta de disfraces y pierde elegancia.</p>

<h3>Ignorar la Pista de Baile</h3>
<p>Por muy temática que sea tu boda, la gente quiere bailar. No sacrifiques los <strong>hits universales</strong> que llenan la pista por mantener un tema musical demasiado rígido.</p>

<h3>Iluminación Genérica</h3>
<p>Si inviertes en decoración temática pero la iluminación es genérica (blanco fluorescente), todo el esfuerzo se pierde. La luz define el 70% del ambiente.</p>

<p>En <a href="/es/servicios">Orbita Events</a> somos especialistas en crear ambientes temáticos con música e iluminación profesional. <a href="/es/configurador">Configura tu pack personalizado</a> y cuéntanos tu temática.</p>`,

    ca: `<h2>Per Què Triar un Casament Temàtic?</h2>

<p>Un <strong>casament temàtic</strong> és la forma perfecta de fer que la teva celebració sigui veritablement única. En lloc de seguir una plantilla genèrica, construeixes una experiència que reflecteix la vostra personalitat com a parella: les vostres passions, records compartits o estètica preferida.</p>

<p>La clau és la coherència: cada element — des de la música fins a la il·luminació, passant per la decoració i el dresscode — ha d'explicar la mateixa història. I aquí és on un equip professional marca la diferència.</p>

<h2>Temàtiques Més Populars el 2026</h2>

<h3>Vintage / Gatsby</h3>
<p>Jazz en directe o sets de swing i jazz manouche durant el còctel, transicionant a versions electròniques de clàssics per la festa. <strong>Il·luminació daurada</strong> amb focus de llum càlida, canelobres i gobo patterns art déco projectats a parets i terres.</p>

<h3>Boho / Mediterrani</h3>
<p>Música acústica indie i folk per la cerimònia i còctel, evolucionant cap a indie dance i balearic house. <strong>Garlandes de llums càlides</strong>, farolets i wash LED en tons ambre i terracota que potencien l'estètica natural.</p>

<h3>Tropical / Caribenya</h3>
<p>Reggaetón clàssic, salsa, bachata i cumbia amb tocs de dancehall. <strong>Wash LED en verd, turquesa i rosa</strong>, amb efectes d'estroboscopi per als moments de màxima energia.</p>

<h3>Festival / Coachella</h3>
<p>Sets d'indie rock, electrònica i pop alternatiu com en un festival real. <strong>Il·luminació de concert</strong> amb moving heads, haze i efectes de color que canvien amb cada cançó.</p>

<h3>Romàntica Clàssica</h3>
<p>Quartet de corda per la cerimònia, crooners i soul durant el sopar, i clàssics del pop i rock per la festa. <strong>Uplighting en blanc càlid i rosa pàl·lid</strong>, amb moments de fum baix pel primer ball.</p>

<h2>Com la Música Defineix la Temàtica</h2>

<p>La música és l'element que més impacte té en la percepció del teu tema. Un DJ professional pot:</p>
<ul>
<li>Crear <strong>sets personalitzats</strong> que evolucionin dins la teva temàtica al llarg de la nit</li>
<li>Barrejar gèneres mantenint la coherència estilística</li>
<li>Incorporar <strong>jingles, efectes i transicions temàtiques</strong> entre blocs musicals</li>
<li>Adaptar l'energia segons el moment: còctel → sopar → festa</li>
</ul>

<h2>Il·luminació Temàtica: El Poder del Color</h2>

<p>La <strong>il·luminació</strong> és el segon pilar de qualsevol casament temàtic. Amb sistemes DMX professionals es pot:</p>
<ul>
<li>Crear ambients totalment diferents en un mateix espai canviant només els colors</li>
<li>Projectar <strong>patrons gobo</strong> (monogrames, formes, textures) a parets i terres</li>
<li>Sincronitzar la il·luminació amb la música per moments d'alt impacte</li>
<li>Usar <strong>fum baix, bengales fredes i CO2</strong> en els moments clau</li>
</ul>

<h2>Errors Comuns en Casaments Temàtics</h2>

<h3>Excés de Temàtica</h3>
<p>La temàtica ha de ser un fil conductor, no una imposició. Si obliges tots els convidats a disfressar-se o satures cada racó, l'experiència es converteix en una festa de disfresses i perd elegància.</p>

<h3>Ignorar la Pista de Ball</h3>
<p>Per molt temàtic que sigui el teu casament, la gent vol ballar. No sacrifiquis els <strong>hits universals</strong> que omplen la pista per mantenir un tema musical massa rígid.</p>

<h3>Il·luminació Genèrica</h3>
<p>Si inverteixes en decoració temàtica però la il·luminació és genèrica (blanc fluorescent), tot l'esforç es perd. La llum defineix el 70% de l'ambient.</p>

<p>A <a href="/ca/serveis">Orbita Events</a> som especialistes en crear ambients temàtics amb música i il·luminació professional. <a href="/ca/configurador">Configura el teu pack personalitzat</a> i explica'ns la teva temàtica.</p>`,
  },

  '10-errores-contratar-dj-evento': {
    es: `<h2>Error #1: No Pedir Referencias Reales</h2>

<p>El error más común es contratar un DJ basándote solo en su web o redes sociales. Las fotos pueden ser de stock, los vídeos editados y los testimonios inventados. <strong>Pide referencias directas</strong>: nombres de parejas o empresas que hayan contratado sus servicios recientemente y contacta con ellas.</p>

<h2>Error #2: Elegir Solo por Precio</h2>

<p>Un DJ a <strong>150€ por 5 horas</strong> no puede ofrecer equipo profesional, seguro de responsabilidad civil, contrato formal y experiencia real. El precio bajo suele significar equipo amateur (altavoces domésticos), sin iluminación profesional y sin experiencia en gestión de eventos. La diferencia entre 300€ y 800€ es enorme en calidad real.</p>

<h2>Error #3: No Visitar el Venue Antes</h2>

<p>Cada espacio tiene sus particularidades acústicas. Una masía de piedra reverbera, un jardín absorbe el sonido, un salón pequeño puede saturarse fácilmente. Un DJ profesional <strong>visita el espacio</strong> (o al menos pide fotos y planos) para adaptar su equipo y configuración.</p>

<h2>Error #4: No Firmar Contrato</h2>

<p>Sin contrato, no hay garantía. El contrato debe incluir: fecha, horario exacto (montaje + evento), equipo detallado, precio total, forma de pago, política de cancelación y <strong>plan B</strong> en caso de avería o enfermedad del DJ.</p>

<h2>Error #5: No Comunicar Tus Preferencias Musicales</h2>

<p>Esperar que el DJ "ya sabrá" qué poner es un error. Un profesional te pedirá una <strong>lista de canciones imprescindibles</strong>, canciones prohibidas, géneros preferidos y el estilo general de la fiesta. Si no te lo pide, mala señal.</p>

<h2>Error #6: Ignorar la Iluminación</h2>

<p>El sonido es solo la mitad de la experiencia. Una fiesta con buena música pero <strong>luz fluorescente</strong> de techo nunca tendrá ambiente. Pregunta qué iluminación incluye el servicio: focos LED, cabezas móviles, máquina de humo. Si no incluye nada, necesitas contratarlo aparte o cambiar de DJ.</p>

<h2>Error #7: No Preguntar por el Equipo Real</h2>

<p>Pregunta marcas y modelos concretos. Un profesional estará encantado de explicarte su equipo: <strong>QSC, JBL PRX, Pioneer, Allen & Heath</strong>... Si no sabe responder o da evasivas, probablemente trabaje con equipo genérico de baja calidad.</p>

<h2>Error #8: Contratar Demasiado Tarde</h2>

<p>Los buenos DJs se reservan con <strong>6-12 meses de antelación</strong>, especialmente para temporada alta (mayo-octubre). Si buscas DJ un mes antes de tu boda, te quedarás con los que nadie ha querido o pagarás un sobreprecio.</p>

<h2>Error #9: No Definir el Timeline</h2>

<p>¿A qué hora empieza la música? ¿Cuándo es el primer baile? ¿Hay discursos? ¿Cuándo se corta la tarta? Sin un <strong>timeline claro</strong>, el DJ no puede programar la evolución musical. Y tú acabarás estresado/a coordinando sobre la marcha.</p>

<h2>Error #10: No Ver al DJ en Acción</h2>

<p>Si es posible, <strong>asiste a un evento</strong> donde el DJ esté actuando. Las demos online muestran el mejor momento, pero no cómo gestiona los momentos bajos, las peticiones difíciles o los problemas técnicos. La experiencia real es el mejor indicador.</p>

<h2>Bonus: Cómo Acertar</h2>

<p>La fórmula es simple: <strong>contrato claro + equipo profesional + experiencia demostrable + comunicación previa</strong>. Si un DJ cumple estos cuatro puntos, tienes un 95% de probabilidades de éxito.</p>

<p>En <a href="/es/servicios">Orbita Events</a> cumplimos todos estos puntos y más. <a href="/es/configurador">Configura tu pack</a> y compruébalo tú mismo.</p>`,

    ca: `<h2>Error #1: No Demanar Referències Reals</h2>

<p>L'error més comú és contractar un DJ basant-te només en la seva web o xarxes socials. Les fotos poden ser de stock, els vídeos editats i els testimonis inventats. <strong>Demana referències directes</strong>: noms de parelles o empreses que hagin contractat els seus serveis recentment i contacta amb elles.</p>

<h2>Error #2: Triar Només per Preu</h2>

<p>Un DJ a <strong>150€ per 5 hores</strong> no pot oferir equip professional, assegurança de responsabilitat civil, contracte formal i experiència real. El preu baix sol significar equip amateur (altaveus domèstics), sense il·luminació professional i sense experiència en gestió d'events. La diferència entre 300€ i 800€ és enorme en qualitat real.</p>

<h2>Error #3: No Visitar el Venue Abans</h2>

<p>Cada espai té les seves particularitats acústiques. Una masia de pedra reverbera, un jardí absorbeix el so, un saló petit es pot saturar fàcilment. Un DJ professional <strong>visita l'espai</strong> (o almenys demana fotos i plànols) per adaptar el seu equip i configuració.</p>

<h2>Error #4: No Firmar Contracte</h2>

<p>Sense contracte, no hi ha garantia. El contracte ha d'incloure: data, horari exacte (muntatge + event), equip detallat, preu total, forma de pagament, política de cancel·lació i <strong>pla B</strong> en cas d'avaria o malaltia del DJ.</p>

<h2>Error #5: No Comunicar les Teves Preferències Musicals</h2>

<p>Esperar que el DJ "ja sabrà" què posar és un error. Un professional et demanarà una <strong>llista de cançons imprescindibles</strong>, cançons prohibides, gèneres preferits i l'estil general de la festa. Si no t'ho demana, mala senyal.</p>

<h2>Error #6: Ignorar la Il·luminació</h2>

<p>El so és només la meitat de l'experiència. Una festa amb bona música però <strong>llum fluorescent</strong> de sostre mai tindrà ambient. Pregunta quina il·luminació inclou el servei: focus LED, caps mòbils, màquina de fum. Si no inclou res, necessites contractar-ho a part o canviar de DJ.</p>

<h2>Error #7: No Preguntar per l'Equip Real</h2>

<p>Pregunta marques i models concrets. Un professional estarà encantat d'explicar-te el seu equip: <strong>QSC, JBL PRX, Pioneer, Allen & Heath</strong>... Si no sap respondre o dona evasives, probablement treballi amb equip genèric de baixa qualitat.</p>

<h2>Error #8: Contractar Massa Tard</h2>

<p>Els bons DJs es reserven amb <strong>6-12 mesos d'antelació</strong>, especialment per temporada alta (maig-octubre). Si busques DJ un mes abans del casament, et quedaràs amb els que ningú ha volgut o pagaràs un sobrepreu.</p>

<h2>Error #9: No Definir el Timeline</h2>

<p>A quina hora comença la música? Quan és el primer ball? Hi ha discursos? Quan es talla el pastís? Sense un <strong>timeline clar</strong>, el DJ no pot programar l'evolució musical. I tu acabaràs estressat/da coordinant sobre la marxa.</p>

<h2>Error #10: No Veure el DJ en Acció</h2>

<p>Si és possible, <strong>assisteix a un event</strong> on el DJ estigui actuant. Les demos online mostren el millor moment, però no com gestiona els moments baixos, les peticions difícils o els problemes tècnics. L'experiència real és el millor indicador.</p>

<h2>Bonus: Com Encertar</h2>

<p>La fórmula és simple: <strong>contracte clar + equip professional + experiència demostrable + comunicació prèvia</strong>. Si un DJ compleix aquests quatre punts, tens un 95% de probabilitats d'èxit.</p>

<p>A <a href="/ca/serveis">Orbita Events</a> complim tots aquests punts i més. <a href="/ca/configurador">Configura el teu pack</a> i comprova-ho tu mateix.</p>`,
  },

  'cuantas-horas-dj-necesito-boda': {
    es: `<h2>El Timeline Típico de una Boda con DJ</h2>

<p>La pregunta de <strong>cuántas horas de DJ necesitas</strong> depende directamente del formato de tu boda. No es lo mismo una boda de mañana con brunch que una celebración clásica de tarde-noche. Aquí desglosamos cada momento.</p>

<h2>Ceremonia (1-1.5 horas)</h2>

<p>Si tu ceremonia es civil o simbólica, el DJ puede encargarse de la <strong>música de entrada, procesión, firma y salida</strong>. Esto requiere equipo específico (micrófono para el oficiante, altavoces discretos) y una coordinación precisa con el wedding planner.</p>

<p>Para ceremonias religiosas, normalmente no se necesita DJ, ya que la iglesia tiene su propio protocolo musical.</p>

<h2>Cóctel (1.5-2 horas)</h2>

<p>El cóctel es el momento de <strong>música ambiente elegante</strong>: jazz, bossa nova, lounge o indie acústico. El volumen es bajo para permitir la conversación, pero la música crea ambiente y evita silencios incómodos. Un DJ profesional adapta el estilo al tipo de evento y al espacio.</p>

<h2>Cena (1.5-2 horas)</h2>

<p>Durante la cena, la música sube ligeramente de energía pero sigue siendo de fondo. <strong>Soul, pop suave, versiones acústicas de éxitos</strong> y clásicos atemporales. El DJ también gestiona los momentos especiales: brindis, discursos, vídeos o sorpresas.</p>

<h2>Fiesta / Baile (3-5 horas)</h2>

<p>Aquí es donde el DJ realmente brilla. El bloque de fiesta suele incluir:</p>
<ul>
<li><strong>Primer baile</strong> (con o sin efectos especiales)</li>
<li><strong>Corte de tarta</strong> (con música y efectos)</li>
<li>Apertura de pista con clásicos que todo el mundo conoce</li>
<li>Bloque de energía alta: reggaetón, pop, dance</li>
<li>Bloque de clásicos y nostalgia</li>
<li>Cierre con los temazos definitivos</li>
</ul>

<h2>Desglose por Formato de Boda</h2>

<h3>Boda Clásica Tarde-Noche (7-8 horas)</h3>
<p>Cóctel (18:00-19:30) → Cena (19:30-21:30) → Fiesta (21:30-03:00). Este es el formato estándar y el que recomendamos para la mayoría de bodas en Barcelona.</p>

<h3>Boda con Ceremonia + Todo (9-10 horas)</h3>
<p>Ceremonia (17:00-18:00) → Cóctel (18:00-19:30) → Cena (19:30-21:30) → Fiesta (21:30-03:00). Si el DJ también cubre la ceremonia, necesitas el servicio completo.</p>

<h3>Boda de Día / Brunch (4-5 horas)</h3>
<p>Cóctel-comida (13:00-15:00) → Fiesta de día (15:00-18:00). Formato más corto pero igualmente intenso, con música más luminosa y festiva.</p>

<h2>¿Y el Precio por Hora?</h2>

<p>No todos los DJs cobran por hora. La mayoría ofrece <strong>packs de servicio</strong> que incluyen un número de horas determinado (normalmente 5-8h). Las horas extra suelen costar entre 80€ y 150€/hora adicional.</p>

<p>Lo que recomendamos: <strong>contrata las horas que realmente necesitas</strong> y negocia las horas extra por adelantado. Es mucho mejor tener un precio cerrado para hora extra que improvisar a las 2 de la mañana.</p>

<h2>¿Puedo Reducir Horas para Ahorrar?</h2>

<p>Puedes, pero ten en cuenta que:</p>
<ul>
<li>Si eliminas el cóctel musical, tus invitados tendrán 1.5h de silencio incómodo</li>
<li>Si acortas la fiesta, la gente se irá más tarde de lo que la música permite</li>
<li>El montaje y desmontaje ocupan 1-2h adicionales que normalmente ya están incluidas</li>
</ul>

<p><a href="/es/configurador">Configura tu pack en nuestro configurador</a> y verás exactamente cuántas horas necesitas según tu formato de boda.</p>`,

    ca: `<h2>El Timeline Típic d'un Casament amb DJ</h2>

<p>La pregunta de <strong>quantes hores de DJ necessites</strong> depèn directament del format del teu casament. No és el mateix un casament de matí amb brunch que una celebració clàssica de tarda-nit. Aquí desglossem cada moment.</p>

<h2>Cerimònia (1-1.5 hores)</h2>

<p>Si la teva cerimònia és civil o simbòlica, el DJ pot encarregar-se de la <strong>música d'entrada, processó, signatura i sortida</strong>. Això requereix equip específic (micròfon per l'oficiant, altaveus discrets) i una coordinació precisa amb el wedding planner.</p>

<p>Per cerimònies religioses, normalment no cal DJ, ja que l'església té el seu propi protocol musical.</p>

<h2>Còctel (1.5-2 hores)</h2>

<p>El còctel és el moment de <strong>música ambient elegant</strong>: jazz, bossa nova, lounge o indie acústic. El volum és baix per permetre la conversa, però la música crea ambient i evita silencis incòmodes. Un DJ professional adapta l'estil al tipus d'event i a l'espai.</p>

<h2>Sopar (1.5-2 hores)</h2>

<p>Durant el sopar, la música puja lleugerament d'energia però segueix sent de fons. <strong>Soul, pop suau, versions acústiques d'èxits</strong> i clàssics atemporals. El DJ també gestiona els moments especials: brindis, discursos, vídeos o sorpreses.</p>

<h2>Festa / Ball (3-5 hores)</h2>

<p>Aquí és on el DJ realment brilla. El bloc de festa sol incloure:</p>
<ul>
<li><strong>Primer ball</strong> (amb o sense efectes especials)</li>
<li><strong>Tall del pastís</strong> (amb música i efectes)</li>
<li>Obertura de pista amb clàssics que tothom coneix</li>
<li>Bloc d'energia alta: reggaetón, pop, dance</li>
<li>Bloc de clàssics i nostàlgia</li>
<li>Tancament amb els temasses definitius</li>
</ul>

<h2>Desglossament per Format de Casament</h2>

<h3>Casament Clàssic Tarda-Nit (7-8 hores)</h3>
<p>Còctel (18:00-19:30) → Sopar (19:30-21:30) → Festa (21:30-03:00). Aquest és el format estàndard i el que recomanem per la majoria de casaments a Barcelona.</p>

<h3>Casament amb Cerimònia + Tot (9-10 hores)</h3>
<p>Cerimònia (17:00-18:00) → Còctel (18:00-19:30) → Sopar (19:30-21:30) → Festa (21:30-03:00). Si el DJ també cobreix la cerimònia, necessites el servei complet.</p>

<h3>Casament de Dia / Brunch (4-5 hores)</h3>
<p>Còctel-dinar (13:00-15:00) → Festa de dia (15:00-18:00). Format més curt però igualment intens, amb música més lluminosa i festiva.</p>

<h2>I el Preu per Hora?</h2>

<p>No tots els DJs cobren per hora. La majoria ofereix <strong>packs de servei</strong> que inclouen un nombre d'hores determinat (normalment 5-8h). Les hores extra solen costar entre 80€ i 150€/hora addicional.</p>

<p>El que recomanem: <strong>contracta les hores que realment necessites</strong> i negocia les hores extra per endavant. És molt millor tenir un preu tancat per hora extra que improvisar a les 2 de la matinada.</p>

<h2>Puc Reduir Hores per Estalviar?</h2>

<p>Pots, però tingues en compte que:</p>
<ul>
<li>Si elimines el còctel musical, els teus convidats tindran 1.5h de silenci incòmode</li>
<li>Si escurces la festa, la gent se n'anirà més tard del que la música permet</li>
<li>El muntatge i desmuntatge ocupen 1-2h addicionals que normalment ja estan incloses</li>
</ul>

<p><a href="/ca/configurador">Configura el teu pack al nostre configurador</a> i veuràs exactament quantes hores necessites segons el format del teu casament.</p>`,
  },

  'dj-girona-events-festes': {
    es: `<h2>DJ Profesional en Girona y la Costa Brava</h2>

<p><strong>Girona</strong> se ha consolidado como uno de los destinos de eventos premium de Cataluña. Desde masías centenarias en el Empordà hasta hoteles boutique en la Costa Brava, la provincia ofrece escenarios únicos que merecen un servicio de entretenimiento a la altura.</p>

<h2>Tipos de Eventos en Girona</h2>

<h3>Bodas en Masías del Empordà</h3>
<p>Las masías de l'Empordà son los venues más demandados para bodas en Cataluña. Espacios como Can Ribas, Mas Torroella o Castell d'Empordà requieren un DJ que conozca las <strong>particularidades acústicas</strong> de estos espacios de piedra: reverberación alta, espacios abiertos contiguos y normativas de ruido específicas de cada municipio.</p>

<h3>Eventos Corporativos en la Costa Brava</h3>
<p>Hoteles como el Camiral, el Peralada Resort o el Hostal de la Gavina acogen <strong>convenciones, team buildings y galas</strong> de empresas de toda Europa. El DJ debe adaptarse a protocolos corporativos, gestionar micrófonos para ponencias y crear la transición perfecta entre la parte formal y la fiesta.</p>

<h3>Fiestas Privadas en Girona Ciudad</h3>
<p>Restaurantes, salas de eventos y espacios privados en el Barri Vell o el centro de Girona son perfectos para <strong>cumpleaños, aniversarios y celebraciones íntimas</strong>. La proximidad de vecinos requiere gestión profesional del volumen y horarios.</p>

<h2>Equipo Profesional para Venues de Girona</h2>

<h3>Sonido Adaptado al Espacio</h3>
<p>No es lo mismo sonorizar una masía de piedra con techos de 6 metros que un jardín abierto. Nuestro equipo incluye:</p>
<ul>
<li><strong>Sistemas de PA escalables</strong>: desde 2000W para fiestas íntimas hasta 10000W para grandes celebraciones</li>
<li><strong>Subwoofers cardioide</strong> que dirigen el grave hacia la pista y reducen el impacto en zonas vecinas</li>
<li><strong>Líneas de delay</strong> para jardines grandes, asegurando cobertura sonora uniforme</li>
</ul>

<h3>Iluminación para Espacios con Carácter</h3>
<p>Las masías y espacios de Girona tienen una estética propia que hay que potenciar, no competir con ella:</p>
<ul>
<li><strong>Uplighting LED</strong> en tonos cálidos que realzan la piedra</li>
<li><strong>Cabezas móviles beam</strong> para crear efectos espectaculares en techos altos</li>
<li><strong>Wash de color</strong> para transformar jardines y patios en espacios mágicos</li>
</ul>

<h2>Logística Girona: Lo que Debes Saber</h2>

<h3>Normativas de Ruido</h3>
<p>Cada municipio del Gironès y el Baix Empordà tiene <strong>ordenanzas de ruido diferentes</strong>. La mayoría limitan la música exterior a las 00:00-01:00h. Un DJ profesional conoce estas normativas y planifica la transición interior-exterior.</p>

<h3>Acceso y Montaje</h3>
<p>Muchas masías del Empordà tienen accesos complicados: caminos rurales, puertas estrechas o escaleras de piedra. Planificamos el <strong>montaje con antelación</strong>, visitando el espacio para evaluar necesidades de transporte y timing.</p>

<h3>Coordinación con el Venue</h3>
<p>Trabajamos regularmente con los principales venues de Girona y Costa Brava. Esta experiencia previa nos permite llegar con la <strong>configuración optimizada</strong> para cada espacio, ahorrando tiempo de montaje y evitando sorpresas.</p>

<p>¿Organizas un evento en Girona? <a href="/es/configurador">Configura tu pack</a> o <a href="/es/contacto">contacta con nosotros</a> para un presupuesto personalizado.</p>`,

    ca: `<h2>DJ Professional a Girona i la Costa Brava</h2>

<p><strong>Girona</strong> s'ha consolidat com una de les destinacions d'events premium de Catalunya. Des de masies centenàries a l'Empordà fins a hotels boutique a la Costa Brava, la província ofereix escenaris únics que mereixen un servei d'entreteniment a l'alçada.</p>

<h2>Tipus d'Events a Girona</h2>

<h3>Casaments a Masies de l'Empordà</h3>
<p>Les masies de l'Empordà són els venues més demandats per casaments a Catalunya. Espais com Can Ribas, Mas Torroella o Castell d'Empordà requereixen un DJ que conegui les <strong>particularitats acústiques</strong> d'aquests espais de pedra: reverberació alta, espais oberts contigus i normatives de soroll específiques de cada municipi.</p>

<h3>Events Corporatius a la Costa Brava</h3>
<p>Hotels com el Camiral, el Peralada Resort o l'Hostal de la Gavina acullen <strong>convencions, team buildings i gales</strong> d'empreses de tota Europa. El DJ s'ha d'adaptar a protocols corporatius, gestionar micròfons per ponències i crear la transició perfecta entre la part formal i la festa.</p>

<h3>Festes Privades a Girona Ciutat</h3>
<p>Restaurants, sales d'events i espais privats al Barri Vell o el centre de Girona són perfectes per <strong>aniversaris, celebracions i festes íntimes</strong>. La proximitat de veïns requereix gestió professional del volum i horaris.</p>

<h2>Equip Professional per Venues de Girona</h2>

<h3>So Adaptat a l'Espai</h3>
<p>No és el mateix sonoritzar una masia de pedra amb sostres de 6 metres que un jardí obert. El nostre equip inclou:</p>
<ul>
<li><strong>Sistemes de PA escalables</strong>: des de 2000W per festes íntimes fins a 10000W per grans celebracions</li>
<li><strong>Subwoofers cardioide</strong> que dirigeixen el greu cap a la pista i redueixen l'impacte en zones veïnes</li>
<li><strong>Línies de delay</strong> per jardins grans, assegurant cobertura sonora uniforme</li>
</ul>

<h3>Il·luminació per Espais amb Caràcter</h3>
<p>Les masies i espais de Girona tenen una estètica pròpia que cal potenciar, no competir-hi:</p>
<ul>
<li><strong>Uplighting LED</strong> en tons càlids que realcen la pedra</li>
<li><strong>Caps mòbils beam</strong> per crear efectes espectaculars en sostres alts</li>
<li><strong>Wash de color</strong> per transformar jardins i patis en espais màgics</li>
</ul>

<h2>Logística Girona: El que Has de Saber</h2>

<h3>Normatives de Soroll</h3>
<p>Cada municipi del Gironès i el Baix Empordà té <strong>ordenances de soroll diferents</strong>. La majoria limiten la música exterior a les 00:00-01:00h. Un DJ professional coneix aquestes normatives i planifica la transició interior-exterior.</p>

<h3>Accés i Muntatge</h3>
<p>Moltes masies de l'Empordà tenen accessos complicats: camins rurals, portes estretes o escales de pedra. Planifiquem el <strong>muntatge amb antelació</strong>, visitant l'espai per avaluar necessitats de transport i timing.</p>

<h3>Coordinació amb el Venue</h3>
<p>Treballem regularment amb els principals venues de Girona i Costa Brava. Aquesta experiència prèvia ens permet arribar amb la <strong>configuració optimitzada</strong> per cada espai, estalviant temps de muntatge i evitant sorpreses.</p>

<p>Organitzes un event a Girona? <a href="/ca/configurador">Configura el teu pack</a> o <a href="/ca/contacte">contacta amb nosaltres</a> per un pressupost personalitzat.</p>`,
  },
};

async function main() {
  console.log('Expanding remaining short blog posts (batch 2)...\n');

  const slugs = Object.keys(EXPANDED_CONTENT);

  for (const slug of slugs) {
    const content = EXPANDED_CONTENT[slug];

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

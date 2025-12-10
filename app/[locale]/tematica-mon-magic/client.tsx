'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';

// ═══════════════════════════════════════════════════════════════
// IMATGES - Fotos reals del casament
// ═══════════════════════════════════════════════════════════════

const IMATGES = {
  hero: '/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg',
  heroAlt: '/images/tematicas/mon-magic/hero/02-taula-veles-nuvols.jpg',
  sostre: '/images/tematicas/mon-magic/hero/03-sostre-veles-nuvols-led.jpg',
  sobreComplet: '/images/tematicas/mon-magic/productes/01-sobre-carta-oberta-complet.jpg',
  sobrePlat: '/images/tematicas/mon-magic/productes/02-sobre-personalitzat-plat.jpg',
  sobreDetall: '/images/tematicas/mon-magic/productes/03-sobre-detall-text.jpg',
  provaSocial: '/images/tematicas/mon-magic/productes/04-convidada-llegint-carta.jpg',
  sobrePergami: '/images/tematicas/mon-magic/productes/05-sobre-pergami-plat.jpg',
  mussol: '/images/tematicas/mon-magic/pergamins/01-hedwig-pergamins.jpg',
  pergaminsBilingue: '/images/tematicas/mon-magic/pergamins/02-gabia-cartell-bilingue.jpg',
  pergaminsCintes: '/images/tematicas/mon-magic/pergamins/03-pergamins-cintes-colors.jpg',
  veles: '/images/tematicas/mon-magic/decoracio/01-veles-flotants-detall.jpg',
  botigueta: '/images/tematicas/mon-magic/decoracio/02-honeydukes.jpg',
  escombres: '/images/tematicas/mon-magic/decoracio/06-escombres-quidditch-copa.jpg',
};

// ═══════════════════════════════════════════════════════════════
// CASES DE L'ESCOLA DE MÀGIA - Amb colors de lacre
// ═══════════════════════════════════════════════════════════════

const CASES_MAGIA = [
  {
    id: 'escola',
    nom: 'Escola de Màgia',
    nomEs: 'Escuela de Magia',
    color: '#1A1A1A',
    colorLacre: '#D4AF37',
    gradient: 'from-amber-600 to-amber-800',
    descripcio: "L'escut oficial amb les quatre cases",
    descripcionEs: 'El escudo oficial con las cuatro casas',
    animal: '🏰',
  },
  {
    id: 'lleons',
    nom: 'Casa dels Lleons',
    nomEs: 'Casa de los Leones',
    color: '#740001',
    colorLacre: '#740001',
    gradient: 'from-red-700 to-red-900',
    descripcio: 'Per als valents de cor',
    descripcionEs: 'Para los valientes de corazón',
    animal: '🦁',
  },
  {
    id: 'serps',
    nom: 'Casa de les Serps',
    nomEs: 'Casa de las Serpientes',
    color: '#1A472A',
    colorLacre: '#1A472A',
    gradient: 'from-green-700 to-green-900',
    descripcio: 'Per als ambiciosos i astuts',
    descripcionEs: 'Para los ambiciosos y astutos',
    animal: '🐍',
  },
  {
    id: 'teixons',
    nom: 'Casa dels Teixons',
    nomEs: 'Casa de los Tejones',
    color: '#FFD700',
    colorLacre: '#1A1A1A',
    gradient: 'from-yellow-500 to-amber-600',
    descripcio: 'Per als lleials i justos',
    descripcionEs: 'Para los leales y justos',
    animal: '🦡',
  },
  {
    id: 'aguiles',
    nom: 'Casa de les Àguiles',
    nomEs: 'Casa de las Águilas',
    color: '#0E1A40',
    colorLacre: '#0E1A40',
    gradient: 'from-blue-800 to-blue-950',
    descripcio: 'Per als savis i creatius',
    descripcionEs: 'Para los sabios y creativos',
    animal: '🦅',
  },
];

// ═══════════════════════════════════════════════════════════════
// PRODUCTES - PREUS ACTUALITZATS
// ═══════════════════════════════════════════════════════════════

const PRODUCTES = [
  {
    id: 'sobre-complet',
    nom: 'Sobre Complet Escola de Màgia',
    nomEs: 'Sobre Completo Escuela de Magia',
    emoji: '✉️',
    descripcio: "El pack d'invitació complet: sobre de paper pergamí amb text personalitzat, carta de la Directora de l'Escola, frame personalitzat per cada convidat, i lacre de cera artesanal amb el segell de la casa escollida.",
    descripcionEs: 'El pack de invitación completo: sobre de papel pergamino con texto personalizado, carta de la Directora de la Escuela, frame personalizado para cada invitado, y lacre de cera artesanal con el sello de la casa elegida.',
    preuUnitat: 10,
    preuPack: 8,
    packMinim: 50,
    destacat: true,
    caracteristiques: [
      'Paper pergamí autèntic',
      'Text personalitzat per cada convidat',
      'Carta de la Directora de l\'Escola',
      'Frame personalitzat amb nom i rol',
      'Lacre de cera artesanal',
      'Segell de la casa escollida',
    ],
    caracteristicasEs: [
      'Papel pergamino auténtico',
      'Texto personalizado para cada invitado',
      'Carta de la Directora de la Escuela',
      'Frame personalizado con nombre y rol',
      'Lacre de cera artesanal',
      'Sello de la casa elegida',
    ],
    ideal: 'Tot inclòs en un sol producte',
    idealEs: 'Todo incluido en un solo producto',
  },
  {
    id: 'pergami-amor',
    nom: "Pergamí d'Amor Màgic",
    nomEs: 'Pergamino de Amor Mágico',
    emoji: '📜',
    descripcio: "Poemes originals d'amor escrits en estil màgic, enrollats individualment i lligats amb una cinta elegant. Perfectes per decorar les taules o regalar als convidats.",
    descripcionEs: 'Poemas originales de amor escritos en estilo mágico, enrollados individualmente y atados con una cinta elegante. Perfectos para decorar las mesas o regalar a los invitados.',
    preuUnitat: 4,
    preuPack: 3,
    packMinim: 30,
    caracteristiques: [
      'Poemes originals i exclusius',
      'Enrollats individualment',
      'Lligats amb cinta elegant',
      'Paper pergamí de qualitat',
      '12 poemes en català + 12 en castellà',
      'Perfecte com a record per convidats',
    ],
    caracteristicasEs: [
      'Poemas originales y exclusivos',
      'Enrollados individualmente',
      'Atados con cinta elegante',
      'Papel pergamino de calidad',
      '12 poemas en catalán + 12 en castellano',
      'Perfecto como recuerdo para invitados',
    ],
    ideal: 'Decoració de taules i records',
    idealEs: 'Decoración de mesas y recuerdos',
  },
  {
    id: 'cartell-decoratiu',
    nom: 'Cartells Decoratius Escola de Màgia',
    nomEs: 'Carteles Decorativos Escuela de Magia',
    emoji: '🪧',
    descripcio: "Cartells temàtics per decorar l'espai: Benvinguts a la Boda, Zona d'Entrenament de Vol, senyalització màgica...",
    descripcionEs: 'Carteles temáticos para decorar el espacio: Bienvenidos a la Boda, Zona de Entrenamiento de Vuelo, señalización mágica...',
    preuUnitat: 15,
    preuPack: 12,
    packMinim: 5,
    caracteristiques: [
      'Disseny estil Consell de Màgia',
      'Impressió alta qualitat',
      'Mida A3 o A2 disponible',
      'Personalitzable amb noms',
      'Escuts de les cases màgiques',
      'Ideal per photocall',
    ],
    caracteristicasEs: [
      'Diseño estilo Consejo de Magia',
      'Impresión alta calidad',
      'Tamaño A3 o A2 disponible',
      'Personalizable con nombres',
      'Escudos de las casas mágicas',
      'Ideal para photocall',
    ],
    ideal: 'Decoració i photocall',
    idealEs: 'Decoración y photocall',
  },
];

// ═══════════════════════════════════════════════════════════════
// PACKS AMB DESCOMPTE
// ═══════════════════════════════════════════════════════════════

const PACKS = [
  {
    id: 'pack-basic',
    nom: 'Pack Bàsic "Carta Acceptació"',
    nomEs: 'Pack Básico "Carta Aceptación"',
    emoji: '📨',
    descripcio: 'El pack essencial: sobres complets per a tots els convidats + 1 cartell de benvinguda personalitzat.',
    descripcionEs: 'El pack esencial: sobres completos para todos los invitados + 1 cartel de bienvenida personalizado.',
    preuPack50: 450,
    preuPack80: 680,
    preuPack100: 800,
    estalviPercent: 10,
    caracteristiques: [
      'Sobres complets per a tots',
      '1 cartell benvinguda A2',
      'Lacre casa escollida',
      'Revisió gratuïta abans imprimir',
      'Entrega en 10-14 dies',
    ],
    caracteristicasEs: [
      'Sobres completos para todos',
      '1 cartel bienvenida A2',
      'Lacre casa elegida',
      'Revisión gratuita antes de imprimir',
      'Entrega en 10-14 días',
    ],
    ideal: 'Casaments fins a 100 convidats',
    idealEs: 'Bodas hasta 100 invitados',
  },
  {
    id: 'pack-premium',
    nom: 'Pack Premium "Gran Saló"',
    nomEs: 'Pack Premium "Gran Salón"',
    emoji: '🏆',
    descripcio: 'Tot inclòs: sobres complets + pergamins per a cada taula + pack de 5 cartells decoratius + opció multi-segell.',
    descripcionEs: 'Todo incluido: sobres completos + pergaminos para cada mesa + pack de 5 carteles decorativos + opción multi-sello.',
    preuPack50: 650,
    preuPack80: 950,
    preuPack100: 1100,
    estalviPercent: 15,
    destacat: true,
    caracteristiques: [
      'Sobres complets per a tots',
      'Pergamins per cada taula (1/taula)',
      '5 cartells decoratius A2',
      'Opció multi-segell inclosa',
      'Entrega prioritària 7-10 dies',
      'Prova física abans producció',
    ],
    caracteristicasEs: [
      'Sobres completos para todos',
      'Pergaminos para cada mesa (1/mesa)',
      '5 carteles decorativos A2',
      'Opción multi-sello incluida',
      'Entrega prioritaria 7-10 días',
      'Prueba física antes de producción',
    ],
    ideal: 'Casaments premium',
    idealEs: 'Bodas premium',
  },
];

// ═══════════════════════════════════════════════════════════════
// EXTRA: MULTI-SEGELL
// ═══════════════════════════════════════════════════════════════

const EXTRA_MULTISEGELL = {
  id: 'multi-segell',
  nom: 'Opció Multi-Segell',
  nomEs: 'Opción Multi-Sello',
  descripcio: 'Cada convidat amb el lacre del color de la seva casa assignada',
  descripcionEs: 'Cada invitado con el lacre del color de su casa asignada',
  preuExtra50: 75,
  preuExtra80: 100,
  preuExtra100: 120,
};

// ═══════════════════════════════════════════════════════════════
// FAQS ACTUALITZADES
// ═══════════════════════════════════════════════════════════════

const FAQS = [
  {
    pregunta: 'Què inclou el "Sobre Complet"?',
    resposta: "Inclou tot el que necessites: sobre de paper pergamí amb el nom del convidat, carta de la Directora de l'Escola, un frame personalitzat segons el rol del convidat (nuvi, pare, amic...), i lacre de cera artesanal amb el segell de la casa que escullis.",
    preguntaEs: '¿Qué incluye el "Sobre Completo"?',
    respuestaEs: 'Incluye todo lo que necesitas: sobre de papel pergamino con el nombre del invitado, carta de la Directora de la Escuela, un frame personalizado según el rol del invitado (novio, padre, amigo...), y lacre de cera artesanal con el sello de la casa que elijas.',
  },
  {
    pregunta: 'Puc tenir sobres amb diferents segells?',
    resposta: "Per defecte, tots els sobres porten el mateix segell (la casa que escullis). Si vols que cada convidat tingui el segell de la seva casa assignada, pots afegir l'opció Multi-Segell per un suplement de 75-120€ segons la quantitat.",
    preguntaEs: '¿Puedo tener sobres con diferentes sellos?',
    respuestaEs: 'Por defecto, todos los sobres llevan el mismo sello (la casa que elijas). Si quieres que cada invitado tenga el sello de su casa asignada, puedes añadir la opción Multi-Sello por un suplemento de 75-120€ según la cantidad.',
  },
  {
    pregunta: "Com són els pergamins d'amor?",
    resposta: "Cada pergamí és un poema original d'amor amb temàtica màgica. Venen enrollats individualment i lligats amb una cinta elegant. Són perfectes per deixar a cada seient o com a detall de taula.",
    preguntaEs: '¿Cómo son los pergaminos de amor?',
    respuestaEs: 'Cada pergamino es un poema original de amor con temática mágica. Vienen enrollados individualmente y atados con una cinta elegante. Son perfectos para dejar en cada asiento o como detalle de mesa.',
  },
  {
    pregunta: 'Quant temps triguen?',
    resposta: "El temps de producció és de 10-14 dies laborables un cop aprovada la prova digital. El Pack Premium inclou entrega prioritària en 7-10 dies. Per comandes urgents (+30%), podem entregar en 5-7 dies.",
    preguntaEs: '¿Cuánto tiempo tardan?',
    respuestaEs: 'El tiempo de producción es de 10-14 días laborables una vez aprobada la prueba digital. El Pack Premium incluye entrega prioritaria en 7-10 días. Para pedidos urgentes (+30%), podemos entregar en 5-7 días.',
  },
  {
    pregunta: 'Puc veure una prova abans?',
    resposta: "Sí! Abans d'imprimir, t'enviem una prova digital en PDF amb 3-4 sobres d'exemple. El Pack Premium inclou una prova física real abans de la producció completa.",
    preguntaEs: '¿Puedo ver una prueba antes?',
    respuestaEs: 'Sí. Antes de imprimir, te enviamos una prueba digital en PDF con 3-4 sobres de ejemplo. El Pack Premium incluye una prueba física real antes de la producción completa.',
  },
  {
    pregunta: 'Feu enviaments a tota Espanya?',
    resposta: 'Sí! Enviament a tot el territori nacional amb embalatge especial per protegir els lacres. Recollida gratuïta a Granollers. Enviament per missatger: 10-18€ segons pes.',
    preguntaEs: '¿Hacéis envíos a toda España?',
    respuestaEs: 'Sí. Envío a todo el territorio nacional con embalaje especial para proteger los lacres. Recogida gratuita en Granollers. Envío por mensajero: 10-18€ según peso.',
  },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT: Veles Flotants (Gran Saló)
// ═══════════════════════════════════════════════════════════════

function FloatingCandles() {
  const candles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${5 + (i * 6)}%`,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 2,
      size: 18 + Math.random() * 12,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {candles.map((candle) => (
        <motion.div
          key={candle.id}
          className="absolute"
          style={{ left: candle.left, top: '-50px' }}
          animate={{
            y: ['0%', '130vh'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: candle.duration * 3,
            delay: candle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <div
              className="rounded-full bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-200"
              style={{
                width: candle.size * 0.4,
                height: candle.size * 0.6,
                filter: 'blur(1px)',
                boxShadow: '0 0 25px rgba(255,200,100,0.9)',
              }}
            />
          </motion.div>
          <div
            className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-sm mx-auto"
            style={{
              width: candle.size * 0.2,
              height: candle.size,
              marginTop: -2,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function ProductesMonMagic() {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [quantitat, setQuantitat] = useState<50 | 80 | 100>(80);
  const [casaSeleccionada, setCasaSeleccionada] = useState('escola');
  const [multiSegell, setMultiSegell] = useState(false);

  const casaActual = CASES_MAGIA.find(c => c.id === casaSeleccionada) || CASES_MAGIA[0];

  // Calcular preu extra multi-segell
  const preuMultiSegell = quantitat === 50 ? EXTRA_MULTISEGELL.preuExtra50
    : quantitat === 80 ? EXTRA_MULTISEGELL.preuExtra80
    : EXTRA_MULTISEGELL.preuExtra100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#0f0f1a] to-black">

      {/* ═══ HERO ═══ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <FloatingCandles />

        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-6"
            >
              <span className="animate-pulse">⚡</span>
              <span className="text-amber-300 font-medium">
                Lacre Artesanal Real
              </span>
              <span className="animate-pulse">⚡</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              {isEs ? 'Tu Boda en el' : 'El Teu Casament al'}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                Món Màgic
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-4 max-w-3xl mx-auto">
              {isEs
                ? 'Sobres completos con carta de la Directora, texto personalizado y lacre artesanal.'
                : 'Sobres complets amb carta de la Directora, text personalitzat i lacre artesanal.'}
            </p>

            <p className="text-lg text-amber-400/80 mb-8">
              {isEs
                ? '✨ Desde 8€/sobre con todo incluido ✨'
                : '✨ Des de 8€/sobre amb tot inclòs ✨'}
            </p>

            <div className="flex justify-center gap-8 md:gap-12 flex-wrap mb-10">
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-400">10€</div>
                <div className="text-white/50 text-sm">{isEs ? 'sobre completo' : 'sobre complet'}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-400">8€</div>
                <div className="text-white/50 text-sm">pack +50</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-400">5</div>
                <div className="text-white/50 text-sm">{isEs ? 'casas' : 'cases'}</div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="#calculadora"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-lg rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                {isEs ? 'Calcular presupuesto' : 'Calcula pressupost'} 🧮
              </Link>
              <Link
                href="#casas"
                className="px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-full hover:bg-white/20 transition-all border border-white/20"
              >
                {isEs ? 'Ver las 5 casas' : 'Veure les 5 cases'} 🏰
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SECCIÓ CASES ═══ */}
      <section id="casas" className="py-16 border-t border-amber-500/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {isEs ? 'Elige tu Casa' : 'Escull la Teva Casa'}
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              {isEs
                ? 'Todos los sobres de tu pedido llevarán el lacre de la casa que elijas. ¿Quieres sellos diferentes? Añade la opción Multi-Sello.'
                : "Tots els sobres del teu encàrrec portaran el lacre de la casa que escullis. Vols segells diferents? Afegeix l'opció Multi-Segell."}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto mb-8">
            {CASES_MAGIA.map((casa, index) => (
              <motion.button
                key={casa.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setCasaSeleccionada(casa.id)}
                className={`relative p-4 rounded-xl transition-all duration-300 ${
                  casaSeleccionada === casa.id
                    ? `bg-gradient-to-b ${casa.gradient} ring-2 ring-amber-400 shadow-lg`
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-4xl mb-2">{casa.animal}</div>
                <div className="text-white font-bold">{casa.nom}</div>
                <div className="text-white/50 text-xs mt-1">
                  {isEs ? casa.descripcionEs : casa.descripcio}
                </div>
                {casaSeleccionada === casa.id && (
                  <motion.div
                    layoutId="casa-selected"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-black text-sm font-bold"
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          <motion.div
            key={casaSeleccionada}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-white/5 rounded-2xl p-6 text-center"
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{
                backgroundColor: casaActual.colorLacre,
                boxShadow: `0 0 30px ${casaActual.colorLacre}50`
              }}
            >
              {casaActual.animal}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Lacre {casaActual.nom}
            </h3>
            <p className="text-white/60 text-sm">
              {isEs ? casaActual.descripcionEs : casaActual.descripcio}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ PRODUCTES INDIVIDUALS ═══ */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            {isEs ? 'Productos' : 'Productes'}
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            {isEs
              ? 'Compra por unidades o aprovecha los packs con descuento'
              : 'Compra per unitats o aprofita els packs amb descompte'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRODUCTES.map((producte, index) => (
              <motion.div
                key={producte.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl overflow-hidden ${
                  producte.destacat
                    ? 'bg-gradient-to-b from-amber-900/40 to-amber-950/40 ring-2 ring-amber-500/50'
                    : 'bg-white/5 hover:bg-white/10'
                } transition-all duration-300`}
              >
                {producte.destacat && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-center py-2 text-sm font-bold">
                    ⭐ {isEs ? 'MÁS VENDIDO' : 'MÉS VENUT'}
                  </div>
                )}

                <div className={`p-6 ${producte.destacat ? 'pt-14' : ''}`}>
                  <div className="text-5xl mb-4 text-center">{producte.emoji}</div>

                  <h3 className="text-xl font-bold text-white mb-2 text-center">
                    {isEs ? producte.nomEs : producte.nom}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 text-center line-clamp-3">
                    {isEs ? producte.descripcionEs : producte.descripcio}
                  </p>

                  <ul className="space-y-1.5 mb-6">
                    {(isEs ? producte.caracteristicasEs : producte.caracteristiques).slice(0, 4).map((item, i) => (
                      <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-black/20 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-white/50 text-xs block">{isEs ? 'Por unidad' : 'Per unitat'}</span>
                        <span className="text-2xl font-bold text-white">{producte.preuUnitat}€</span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 text-xs block">Pack +{producte.packMinim}</span>
                        <span className="text-xl font-bold text-amber-400">{producte.preuPack}€</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/contacto?producte=${producte.id}&casa=${casaSeleccionada}`}
                    className={`block w-full py-3 rounded-xl text-center font-bold transition-all ${
                      producte.destacat
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isEs ? 'Pedir presupuesto' : 'Demana pressupost'}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PACKS ═══ */}
      <section className="py-16 border-t border-white/10 bg-gradient-to-b from-amber-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            {isEs ? 'Packs con Descuento' : 'Packs amb Descompte'}
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            {isEs
              ? 'Ahorra hasta un 15% con nuestros packs completos'
              : 'Estalvia fins a un 15% amb els nostres packs complets'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PACKS.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`rounded-2xl overflow-hidden ${
                  pack.destacat
                    ? 'bg-gradient-to-b from-amber-900/50 to-amber-950/50 ring-2 ring-amber-500'
                    : 'bg-white/5'
                }`}
              >
                {pack.destacat && (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-center py-2 font-bold">
                    🏆 {isEs ? 'RECOMENDADO' : 'RECOMANAT'} - {pack.estalviPercent}% {isEs ? 'AHORRO' : 'ESTALVI'}
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{pack.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {isEs ? pack.nomEs : pack.nom}
                      </h3>
                      {!pack.destacat && (
                        <span className="text-amber-400 text-sm">{pack.estalviPercent}% {isEs ? 'ahorro' : 'estalvi'}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-white/60 text-sm mb-6">
                    {isEs ? pack.descripcionEs : pack.descripcio}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {(isEs ? pack.caracteristicasEs : pack.caracteristiques).map((item, i) => (
                      <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                        <span className="text-amber-400">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Taula de preus */}
                  <div className="bg-black/30 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={`p-2 rounded-lg ${quantitat === 50 ? 'bg-amber-500/30 ring-1 ring-amber-500' : ''}`}>
                        <div className="text-white/50 text-xs">50 conv.</div>
                        <div className="text-lg font-bold text-white">{pack.preuPack50}€</div>
                      </div>
                      <div className={`p-2 rounded-lg ${quantitat === 80 ? 'bg-amber-500/30 ring-1 ring-amber-500' : ''}`}>
                        <div className="text-white/50 text-xs">80 conv.</div>
                        <div className="text-lg font-bold text-white">{pack.preuPack80}€</div>
                      </div>
                      <div className={`p-2 rounded-lg ${quantitat === 100 ? 'bg-amber-500/30 ring-1 ring-amber-500' : ''}`}>
                        <div className="text-white/50 text-xs">100 conv.</div>
                        <div className="text-lg font-bold text-white">{pack.preuPack100}€</div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/contacto?pack=${pack.id}&quantitat=${quantitat}&casa=${casaSeleccionada}${multiSegell ? '&multisegell=true' : ''}`}
                    className={`block w-full py-3 rounded-xl text-center font-bold transition-all ${
                      pack.destacat
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/30'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isEs ? 'Solicitar pack' : "Sol·licitar pack"}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CALCULADORA ═══ */}
      <section id="calculadora" className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white/5 rounded-2xl p-8 border border-amber-500/20">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              🧮 {isEs ? 'Calculadora Rápida' : 'Calculadora Ràpida'}
            </h2>
            <p className="text-center text-white/50 mb-6">
              {isEs ? 'Selecciona tu cantidad de invitados' : 'Selecciona la teva quantitat de convidats'}
            </p>

            {/* Selector quantitat */}
            <div className="flex justify-center gap-4 mb-8">
              {[50, 80, 100].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantitat(q as 50 | 80 | 100)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    quantitat === q
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {q} {isEs ? 'inv.' : 'conv.'}
                </button>
              ))}
            </div>

            {/* Opció Multi-Segell */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer bg-white/5 p-4 rounded-xl border border-purple-500/30">
                <input
                  type="checkbox"
                  checked={multiSegell}
                  onChange={(e) => setMultiSegell(e.target.checked)}
                  className="w-5 h-5 accent-purple-500"
                />
                <div className="flex-1">
                  <span className="text-white font-medium">
                    🎨 {isEs ? EXTRA_MULTISEGELL.nomEs : EXTRA_MULTISEGELL.nom}
                  </span>
                  <span className="text-purple-400 ml-2">(+{preuMultiSegell}€)</span>
                  <p className="text-white/50 text-sm mt-1">
                    {isEs ? EXTRA_MULTISEGELL.descripcionEs : EXTRA_MULTISEGELL.descripcio}
                  </p>
                </div>
              </label>
            </div>

            {/* Resultats */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-white/70">📨 {isEs ? 'Pack Básico' : 'Pack Bàsic'}</span>
                <span className="text-white font-bold">
                  {(quantitat === 50 ? 450 : quantitat === 80 ? 680 : 800) + (multiSegell ? preuMultiSegell : 0)}€
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-900/30 rounded-lg ring-1 ring-amber-500/50">
                <span className="text-white">🏆 {isEs ? 'Pack Premium' : 'Pack Premium'}</span>
                <span className="text-amber-400 font-bold text-xl">
                  {(quantitat === 50 ? 650 : quantitat === 80 ? 950 : 1100) + (multiSegell ? preuMultiSegell : 0)}€
                </span>
              </div>
            </div>

            <Link
              href={`/contacto?pack=premium&quantitat=${quantitat}&casa=${casaSeleccionada}${multiSegell ? '&multisegell=true' : ''}`}
              className="block w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl text-center text-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              {isEs
                ? `Solicitar presupuesto para ${quantitat} invitados`
                : `Sol·licitar pressupost per ${quantitat} convidats`}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ GALERIA FOTOS REALS ═══ */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            📸 {isEs ? 'Fotos Reales de Bodas' : 'Fotos Reals de Casaments'}
          </h2>
          <p className="text-white/60 text-center mb-10 max-w-2xl mx-auto">
            {isEs
              ? 'Mira cómo quedaron nuestros sobres en bodas reales. ¡La magia es palpable!'
              : 'Mira com van quedar els nostres sobres en casaments reals. La màgia és palpable!'}
          </p>

          {/* Grid de fotos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {/* Foto destacada gran */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden group"
            >
              <Image
                src={IMATGES.sobreComplet}
                alt="Sobre màgic obert amb carta de la Directora"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                  ⭐ {isEs ? 'Más vendido' : 'Més venut'}
                </span>
                <p className="text-white font-medium mt-2">
                  {isEs ? 'Sobre completo con carta' : 'Sobre complet amb carta'}
                </p>
              </div>
            </motion.div>

            {/* Foto producte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden aspect-square group"
            >
              <Image
                src={IMATGES.sobrePlat}
                alt="Sobre personalitzat al plat"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>

            {/* Foto prova social */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden aspect-square group"
            >
              <Image
                src={IMATGES.provaSocial}
                alt="Convidada llegint carta màgica"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <span className="text-white/90 text-xs">
                  {isEs ? '❤️ La reacción real' : '❤️ La reacció real'}
                </span>
              </div>
            </motion.div>

            {/* Foto mussol */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative rounded-2xl overflow-hidden aspect-square group"
            >
              <Image
                src={IMATGES.mussol}
                alt="Mussol amb pergamins"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>

            {/* Foto decoració escombres */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative rounded-2xl overflow-hidden aspect-square group"
            >
              <Image
                src={IMATGES.escombres}
                alt="Decoració esportiva màgica"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          </div>

          {/* Badge de fotos reals */}
          <div className="text-center mt-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/70 text-sm">
              📷 {isEs ? 'Todas las fotos son de bodas reales de nuestros clientes' : 'Totes les fotos són de casaments reals dels nostres clients'}
            </span>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            {isEs ? 'Preguntas Frecuentes' : 'Preguntes Freqüents'}
          </h2>

          <div className="max-w-2xl mx-auto space-y-3">
            {FAQS.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white/5 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                >
                  <span className="text-white font-medium">
                    {isEs ? faq.preguntaEs : faq.pregunta}
                  </span>
                  <span className="text-amber-400 text-xl">
                    {faqOpen === index ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence>
                  {faqOpen === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-4"
                    >
                      <p className="text-white/70">
                        {isEs ? faq.respuestaEs : faq.resposta}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            🪄 {isEs ? '¿Quieres el pack completo de tematización?' : 'Vols el pack complet de tematització?'}
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            {isEs
              ? 'La papelería es solo el principio. Combínala con DJ, efectos especiales, iluminación y decoración para crear una experiencia mágica completa.'
              : "La papereria és només el principi. Combina-la amb DJ, efectes especials, il·luminació i decoració per crear una experiència màgica completa."}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/configurador?tema=monmagic"
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all"
            >
              {isEs ? 'Configura evento completo' : 'Configura event complet'} ⚡
            </Link>
            <Link
              href="/contacto"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all"
            >
              {isEs ? 'Hablar con nosotros' : 'Parlar amb nosaltres'}
            </Link>
          </div>
        </div>
      </section>

      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Pack Boda Món Màgic amb Lacre Artesanal",
            "description": "Sobres complets per a casaments temàtics de màgia amb carta de la Directora, text personalitzat i lacre de cera artesanal.",
            "brand": { "@type": "Brand", "name": "Òrbita Events" },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "450",
              "highPrice": "1100",
              "priceCurrency": "EUR",
              "offerCount": "4"
            }
          })
        }}
      />
    </div>
  );
}

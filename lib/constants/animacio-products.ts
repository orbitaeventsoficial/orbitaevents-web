export type ProductPricingTier = {
  participants: string;
  team: string;
  price: number | null;
};

export type DJPricingOption = {
  label: string;
  price: number | null;
  sublabel: string;
  standalonePrice?: number | null;
};

export type AnimacioProduct = {
  id: string;
  nom: string;
  image?: string;
  descripcio: string[];
  inclou: string[];
  noInclou?: string;
  trams?: ProductPricingTier[];
  djOptions?: DJPricingOption[];
  durada?: string;
};

export const ANIMACIO_PRODUCTS: AnimacioProduct[] = [
  {
    id: 'bingo-musical',
    nom: 'Bingo Musical',
    durada: '1h30',
    descripcio: [
      "Els temazos no paren mai. Des del primer moment sonen els hits més coneguts, sempre des de l'estribillo o la part més energètica — uns 15 segons de pur temazo rere temazo, dinamitzats per un presentador que manté l'energia al màxim.",
      "Tots els participants reben el seu cartró i els seus gomets. El joc acumula fins a quatre línies simultànies, i quan les quatre estan plenes, els quatre guanyadors surten al davant per al primer repte musical. Tres rondes d'eliminació, cada cop diferent i més intensa, mentre el públic viu i anima. Al final, un únic guanyador canta bingo.",
      "Qui no vulgui participar activament pot formar part del jurat i decidir qui guanya els reptes.",
    ],
    inclou: [
      'DJ professional',
      'Altaveus i equip de so',
      'Presentador/a',
      'Cabina DJ i laptops',
      'Cartrons de bingo',
      'Gomets per a tots',
    ],
    noInclou: "* No inclou obsequis per als guanyadors — a càrrec de l'organització.",
    trams: [
      { participants: '15–60 persones', team: 'DJ + Presentador/a', price: 250 },
      { participants: '61–110 persones', team: 'DJ + Presentador/a + 1 assistent/a', price: 300 },
      { participants: '111–160 persones', team: 'DJ + Presentador/a + 2 assistents/es', price: 350 },
      { participants: '+160 persones', team: 'Pressupost a mida', price: null },
    ],
  },
  {
    id: 'batalla-musical',
    nom: 'Batalla Musical',
    durada: '1h30',
    descripcio: [
      "Una hora i mitja de pura competició musical. Els participants es divideixen en equips — noies contra nois, per edats, per taules o totalment aleatori — i s'enfronten en una sèrie de desafiaments: karaoke col·lectiu, endevina la cançó, reptes de ball, preguntes musicals, show talent... Tot dinamitzat per un presentador mentre els temazos no paren de sonar.",
      "Cada desafiament suma punts per a l'equip. Qui puntua? El públic amb els aplaudiments, un jurat escollit entre els assistents, o el presentador — s'adapta a cada moment. Qui no vulgui competir pot formar part del jurat i decidir qui guanya.",
      "Al final, un sol equip s'emporta la Batalla Musical.",
    ],
    inclou: [
      'DJ professional',
      'Altaveus i equip de so',
      'Presentador/a',
      'Cabina DJ i laptops',
      'Materials dels desafiaments',
      'Durada: 1h30',
    ],
    noInclou: "* No inclou obsequis per als guanyadors — a càrrec de l'organització.",
    trams: [
      { participants: '15–60 persones', team: 'DJ + Presentador/a', price: 250 },
      { participants: '61–110 persones', team: 'DJ + Presentador/a + 1 assistent/a', price: 300 },
      { participants: '111–160 persones', team: 'DJ + Presentador/a + 2 assistents/es', price: 350 },
      { participants: '+160 persones', team: 'Pressupost a mida', price: null },
    ],
  },
  {
    id: 'dj',
    nom: 'Servei de DJ',
    descripcio: [
      "DJ professional amb equip complet de so i il·luminació. Selecció musical adaptada al vostre event, al vostre públic i al moment del dia — des del primer tema fins a l'últim, sense talls ni buits.",
      "Ideal com a complement a qualsevol de les propostes d'animació, per al coctel, per a la festa o com a servei independent. La música és la que marca el ritme de la vetllada.",
    ],
    inclou: [
      'DJ professional',
      'Sistema de so professional (altaveus actius)',
      'Cabina DJ i laptops',
      'Il·luminació bàsica de pista',
      'Muntatge i desmuntatge inclosos',
      'Selecció musical personalitzada',
    ],
    djOptions: [
      { label: '1 hora', price: 100, sublabel: 'En pack amb animació', standalonePrice: 150 },
      { label: '2 hores', price: 200, sublabel: 'En pack amb animació', standalonePrice: 250 },
      { label: '3 hores', price: null, sublabel: 'Pressupost a mida' },
    ],
  },
  {
    id: 'sonoritzacio-cerimonia',
    nom: 'Sonorització de Cerimònia',
    descripcio: [
      "El so de la cerimònia és el primer que el vostre públic escolta — i el que marca el to de tot el dia. Ens encarreguem de tot: micròfon per a l'oficiant, so ambient i la llista de cançons que haureu triat per a cada moment.",
      "Entrada dels nuvis, lectura dels textos, firma i sortida: cada instant amb el seu so, sense feedback, sense silencis incòmodes, sense improvisació d'última hora.",
    ],
    inclou: [
      'Sistema de so adaptat a la sala o espai exterior',
      'Micròfon inalàmbric per a l\'oficiant',
      'Reproducció de llista musical personalitzada',
      'Tècnic de so durant tota la cerimònia',
      'Prova de so prèvia a l\'arribada dels convidats',
      'Muntatge i desmuntatge inclosos',
    ],
    noInclou: '* No inclou música en directe (instrument/veu). Disponible com a servei addicional — consulteu-nos.',
    trams: [
      { participants: 'Cerimònia civil o religiosa', team: 'Tècnic de so + equip', price: 180 },
      { participants: 'Cerimònia + coctel (fins a 2h)', team: 'Tècnic de so + equip', price: 280 },
      { participants: 'Necessitats especials o grans espais', team: 'Pressupost a mida', price: null },
    ],
  },
  {
    id: 'boda-sencera',
    nom: 'Boda Sencera',
    descripcio: [
      "Un sol proveïdor per a tota la música del dia. Des de la cerimònia fins a l'últim ball, sense canvis d'empresa, sense descoordi­nació, sense que ningú hagi d'estar pendent de res.",
      "Dissenyem el fil musical de tota la jornada: cerimònia sonoritzada, coctel amb ambient, i festa a tot gas. Si voleu afegir Bingo Musical o Batalla Musical, ho integrem al programa sense que el ritme de la celebració es perdi.",
      "Cada boda és diferent. Parlem, expliqueu-nos com us imagineu el dia, i us fem una proposta a mida.",
    ],
    inclou: [
      'Sonorització de la cerimònia (micròfon + so)',
      'Música de coctel / benvinguda',
      'DJ per a la festa (equip complet)',
      'Il·luminació de pista LED',
      'Coordinació amb el venue prèvia a l\'event',
      'Un sol punt de contacte per a tot el dia',
      'Muntatge i desmuntatge inclosos',
    ],
    noInclou: '* Bingo Musical o Batalla Musical disponibles com a complement. Descompte en pack — consulteu-nos.',
    trams: [
      { participants: 'Cerimònia + coctel (3h aprox.)', team: 'Tècnic so + DJ', price: 450 },
      { participants: 'Cerimònia + coctel + festa (5–6h)', team: 'Tècnic so + DJ', price: 650 },
      { participants: 'Dia sencer (+8h)', team: 'Tècnic so + DJ', price: 950 },
      { participants: 'A mida (horaris especials, multicercle)', team: 'Pressupost personalitzat', price: null },
    ],
  },
];

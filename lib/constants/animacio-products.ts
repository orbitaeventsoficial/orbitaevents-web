export type ProductPricingTier = {
  participants: string;
  team: string;
  price: number | null;
};

export type DJPricingOption = {
  label: string;
  price: number | null;
  sublabel: string;
};

export type AnimacioProduct = {
  id: string;
  nom: string;
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
      "DJ professional amb equip complet inclòs. Música en directe adaptada al vostre event i al vostre públic, sense interrupcions. Ideal com a complement a qualsevol de les propostes anteriors o com a servei independent per tancar la nit.",
    ],
    inclou: [
      'DJ professional',
      'Altaveus',
      'Cabina DJ',
      'Laptops',
    ],
    djOptions: [
      { label: '1 hora', price: 150, sublabel: 'Tot inclòs' },
      { label: '2 hores', price: 250, sublabel: 'Tot inclòs' },
      { label: 'Més hores', price: null, sublabel: 'Pressupost a mida' },
    ],
  },
];

/**
 * FAQs DINÁMICAS - ÒRBITA EVENTS
 * ==============================
 * 
 * REGLA DE ORO: CERO DATOS HARDCODEADOS
 * Todos los precios, equipos y detalles salen de packs-config.ts
 * 
 * @author Manolo - Arquitecto Digital
 */

import { SITE_CONFIG } from '@/config/site-config';
import { 
  getFAQEquipamiento, 
  getFAQDesplazamiento,
  getMinPriceByService,
  INVENTARIO,
  OFERTA_FLASH,
  getOfertaFlash,
  EXTRAS,
} from '@/config/packs-config';

// Helper para obtener precio de extra
function getPrecioExtra(extraId: string): string {
  const extra = EXTRAS.find(e => e.id === extraId);
  if (!extra) return "Consultar";
  if (extra.consultarPrecio || extra.price === null) return "Consultar precio";
  return `${extra.price}€`;
}

// Helper para obtener precio de hora extra
function getPrecioHoraExtra(): string {
  const horaExtra = EXTRAS.find(e => e.id === 'hora-extra');
  return horaExtra?.price ? `${horaExtra.price}€` : "100€";
}

export interface FAQItem {
  q: string;
  a: string;
  category: 'general' | 'reservas' | 'precios' | 'sonido' | 'iluminacion';
}

export const FAQ_DATA: FAQItem[] = [
  {
    q: "¿Qué incluye exactamente el servicio de discomóvil?",
    a: getFAQEquipamiento(),
    category: "general",
  },
  {
    q: "¿Con cuánta antelación tengo que reservar?",
    a: "Bodas: MÍNIMO 1 mes (recomendado 3 meses en temporada mayo-sept). Fiestas privadas: 15 días mínimo. Las fechas se bloquean con la señal del 50%. Consejo: no pierdas tu fecha ideal, reserva YA aunque falten meses.",
    category: "reservas",
  },
  {
    q: "¿Puedo personalizar totalmente la música?",
    a: "Sí, 100%. Nos envías tu playlist o indicaciones (Spotify, YouTube, lo que sea). Hacemos reunión previa para definir momentos críticos: entrada, primer baile, entregas, canción final. Durante el evento, el DJ lee la sala en tiempo real y ajusta. Tu evento, tu música.",
    category: "general",
  },
  {
    q: "Tengo limitador de sonido. ¿Vais a tener problemas?",
    a: `NO. Tenemos sistemas calibrados específicamente para eventos con limitación. Nuestro equipo (${INVENTARIO.altavoces.nombre} de ${INVENTARIO.altavoces.potenciaTotal}W) permite ajustar ganancia, ecualización y dinámica para sonido potente sin cortes. Experiencia demostrable en fincas y hoteles con normativa estricta. El limitador no será problema.`,
    category: "sonido",
  },
  {
    q: "¿Hacéis eventos fuera de Barcelona? (Girona, Costa Brava)",
    a: getFAQDesplazamiento(),
    category: "general",
  },
  {
    q: "¿Cómo funciona el pago y la reserva?",
    a: "50% de señal para bloquear la fecha (transferencia o Bizum). 50% restante una semana antes del evento. Emitimos factura + contrato detallado con horarios, equipamiento y condiciones. Todo transparente y por escrito. Sin pagos en efectivo el día del evento.",
    category: "precios",
  },
  {
    q: "¿Qué pasa si llueve en mi evento al aire libre?",
    a: "Nos adaptamos a cualquier situación. Si hay previsión de lluvia, protegemos el equipo con material impermeable y coordinamos contigo la mejor alternativa de ubicación o montaje. Hemos trabajado en todo tipo de condiciones sin cancelar ningún evento.",
    category: "general",
  },
  {
    q: "¿Las luces para pista de baile están incluidas?",
    a: `SÍ, siempre incluido al menos el ${INVENTARIO.iluminacion.multiefectos.nombre}. Packs mayores incluyen ${INVENTARIO.iluminacion.cabezasMoviles.nombre} con gobos, prismas y beam 6°. Programación personalizada para tu evento. Opcionales: luces ambiente adicionales, uplights para decoración, proyecciones. Las básicas SIEMPRE van incluidas.`,
    category: "iluminacion",
  },
  {
    q: "¿Puedo contratar horas extra?",
    a: `Sí, la hora extra cuesta ${getPrecioHoraExtra()}. Si la fiesta está buena y quieres seguir, nosotros también. Solo avísanos durante el evento y seguimos hasta que digas basta.`,
    category: "precios",
  },
  {
    q: "Si cancelo, ¿pierdo el dinero?",
    a: "Si cancelas con más de 30 días de antelación, devolvemos el 100% de la señal. Entre 15-30 días, devolvemos el 50%. Con menos de 15 días o el mismo día, no hay devolución ya que tenemos el equipo y el equipo reservados exclusivamente para tu fecha. En caso de fuerza mayor justificada, intentamos reprogramar para otra fecha.",
    category: "reservas",
  },
  {
    q: "¿Ofrecéis tematización para eventos especiales?",
    a: "SÍ, es nuestra especialidad. Halloween, temática mágica de escuela de brujos, años 80, noche ibicenca, lo que quieras. Incluye decoración, ambientación lumínica, música adaptada y efectos especiales. Consulta presupuesto de tematización, merece la pena para eventos inolvidables.",
    category: "general",
  },
  {
    q: "¿Qué garantía tengo de que todo saldrá bien?",
    a: `Nuestro compromiso es tu tranquilidad. Firmamos un contrato detallado, tenemos seguro de responsabilidad civil y trabajamos con equipamiento profesional. Con más de ${SITE_CONFIG.stats.eventsCompleted} eventos realizados y ${SITE_CONFIG.stats.yearsExperience} años de experiencia, trabajamos con profesionalidad para que tu evento sea perfecto. Creamos experiencias, no solo ponemos música.`,
    category: "general",
  },
  {
    q: "¿Cuánto cuesta un DJ para una boda?",
    a: `Nuestros packs de bodas empiezan desde ${getMinPriceByService('bodas')}€ (pack Essential de 3 horas para el baile final). Tenemos opciones para ceremonia + banquete + baile desde 950€. El precio varía según duración, equipamiento y efectos especiales. Pide presupuesto personalizado sin compromiso.`,
    category: "precios",
  },
  {
    q: "¿Tenéis oferta para fiestas pequeñas?",
    a: `¡Sí! Tenemos la ${OFERTA_FLASH.nombre} para fiestas de hasta ${OFERTA_FLASH.maxInvitados} personas desde solo ${getOfertaFlash()?.price || '250€'}. Incluye ${OFERTA_FLASH.duracionHoras} horas de DJ, sonido profesional e iluminación. ¡${OFERTA_FLASH.descuentoPorcentaje}% de descuento sobre precio normal!`,
    category: "precios",
  },
  {
    q: "¿Qué efectos especiales ofrecéis?",
    a: `Disponemos de: ${INVENTARIO.extras.humoBajo.nombre} (${getPrecioExtra('humo-bajo')}), ${INVENTARIO.extras.chispasFrias.nombre} (${getPrecioExtra('fuego-frio')}), ${INVENTARIO.extras.co2.nombre} (${getPrecioExtra('co2-gun')}), ${INVENTARIO.extras.burbujas.nombre} (${getPrecioExtra('burbujas')}), ${INVENTARIO.extras.confetti.nombre} (${getPrecioExtra('confetti')}), y ${INVENTARIO.extras.pantalla.nombre} (${getPrecioExtra('pantalla')}). Todos seguros para interior.`,
    category: "general",
  },
];

// Función para obtener FAQs por categoría
export function getFAQsByCategory(category: FAQItem['category']): FAQItem[] {
  return FAQ_DATA.filter(faq => faq.category === category);
}

// Función para obtener FAQs limitadas (para widgets)
export function getFAQsPreview(limit: number = 5): FAQItem[] {
  return FAQ_DATA.slice(0, limit);
}

// Schema JSON-LD para SEO
export function getFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_DATA.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      },
    })),
  };
}

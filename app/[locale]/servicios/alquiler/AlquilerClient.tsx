"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingCart, FileText } from 'lucide-react';

// Tipos
interface Equipment {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'sonido' | 'iluminacion' | 'dj' | 'efectos';
  image?: string;
}

// Catálogo de equipos
const EQUIPMENT_CATALOG: Equipment[] = [
  // SONIDO
  {
    id: 'ev-etx-35p',
    name: 'EV ETX-35P (2000W)',
    description: 'Altavoz profesional autoamplificado de 2000W. Ideal para eventos grandes.',
    price: 150,
    category: 'sonido',
  },
  {
    id: 'subwoofer-b150',
    name: 'Subwoofer B-150',
    description: 'Subwoofer profesional de 1200W para graves potentes.',
    price: 120,
    category: 'sonido',
  },
  {
    id: 'sistema-sonido-profesional',
    name: 'Sistema de Sonido Profesional',
    description: '2x EV ETX 2000W + Pioneer DDJ-REV7 + Cabina DJ + Monitor + Auriculares HDJ-X5 + 2x Luces BASH + Soporte PC + Cableado + Máquina humo + Multibox LED. Setup completo profesional.',
    price: 450,
    category: 'sonido',
  },
  {
    id: 'microfono-inalambrico',
    name: 'Micrófono Inalámbrico',
    description: 'Micrófono profesional inalámbrico de doble canal.',
    price: 40,
    category: 'sonido',
  },

  // ILUMINACIÓN
  {
    id: 'cabezas-moviles-led',
    name: 'Cabezas Móviles LED (x4)',
    description: '4 cabezas móviles LED RGBW con efectos de movimiento.',
    price: 180,
    category: 'iluminacion',
  },
  {
    id: 'laser-profesional',
    name: 'Láser Profesional RGB',
    description: 'Láser profesional multicolor con efectos automáticos.',
    price: 120,
    category: 'iluminacion',
  },
  {
    id: 'bola-espejos',
    name: 'Bola de Espejos + Foco',
    description: 'Bola de espejos 50cm con foco LED dedicado.',
    price: 30,
    category: 'iluminacion',
  },

  // DJ
  {
    id: 'pioneer-ddj-rev7',
    name: 'Controladora Pioneer DDJ-REV7',
    description: 'Controladora profesional Pioneer nivel club con motorized platters. Top de gama.',
    price: 180,
    category: 'dj',
  },
  {
    id: 'mezclador-djm-900',
    name: 'Mezclador DJM-900NXS2',
    description: 'Mezclador profesional Pioneer de 4 canales.',
    price: 200,
    category: 'dj',
  },

  // EFECTOS
  {
    id: 'maquina-humo',
    name: 'Máquina de Humo 1500W',
    description: 'Máquina de humo profesional con mando a distancia.',
    price: 60,
    category: 'efectos',
  },
  {
    id: 'maquina-burbujas',
    name: 'Máquina de Burbujas',
    description: 'Máquina de burbujas profesional con líquido incluido.',
    price: 40,
    category: 'efectos',
  },
  {
    id: 'canon-confeti',
    name: 'Cañón de Confeti',
    description: 'Cañón eléctrico de confeti con mando remoto.',
    price: 80,
    category: 'efectos',
  },
];

const CATEGORIES = [
  { id: 'todos', label: 'Todos', icon: '🎵' },
  { id: 'sonido', label: 'Sonido', icon: '🔊' },
  { id: 'iluminacion', label: 'Iluminación', icon: '💡' },
  { id: 'dj', label: 'DJ', icon: '🎧' },
  { id: 'efectos', label: 'Efectos', icon: '✨' },
];

export default function AlquilerClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [showSummary, setShowSummary] = useState(false);

  // Filtrar equipos por categoría
  const filteredEquipment = selectedCategory === 'todos'
    ? EQUIPMENT_CATALOG
    : EQUIPMENT_CATALOG.filter(eq => eq.category === selectedCategory);

  // Calcular total
  const totalPrice = Array.from(selectedEquipment).reduce((sum, id) => {
    const equipment = EQUIPMENT_CATALOG.find(eq => eq.id === id);
    return sum + (equipment?.price || 0);
  }, 0);

  // Mostrar/ocultar sticky bar
  useEffect(() => {
    setShowSummary(selectedEquipment.size > 0);
  }, [selectedEquipment]);

  // Toggle equipo
  const toggleEquipment = (id: string) => {
    const newSelected = new Set(selectedEquipment);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEquipment(newSelected);

    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'equipment_toggle', {
        equipment_id: id,
        action: newSelected.has(id) ? 'add' : 'remove',
      });
    }
  };

  // Ir al formulario de contacto
  const goToContact = () => {
    const selectedItems = Array.from(selectedEquipment)
      .map(id => {
        const eq = EQUIPMENT_CATALOG.find(e => e.id === id);
        return eq ? `${eq.name} (${eq.price}€)` : '';
      })
      .filter(Boolean)
      .join(', ');

    const params = new URLSearchParams({
      servicio: 'alquiler',
      equipos: selectedItems,
      total: totalPrice.toString(),
    });

    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'alquiler_contact_click', {
        num_items: selectedEquipment.size,
        total_price: totalPrice,
      });
    }

    window.location.href = `/contacto?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">
          Alquiler de Equipo Profesional
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">
          Selecciona el equipo que necesitas y recibe tu presupuesto al instante
        </p>
      </div>

      {/* Filtros de categoría */}
      <div className="flex flex-wrap gap-3 justify-center">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`
              px-6 py-3 rounded-full font-medium transition-all
              ${selectedCategory === category.id
                ? 'bg-gradient-to-r from-oe-gold to-oe-gold-light text-black shadow-lg scale-105'
                : 'bg-bg-surface text-text-muted hover:bg-bg-card'
              }
            `}
          >
            <span className="mr-2">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>

      {/* Grid de equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map(equipment => {
          const isSelected = selectedEquipment.has(equipment.id);
          
          return (
            <motion.div
              key={equipment.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`
                relative p-6 rounded-2xl border-2 cursor-pointer
                transition-all duration-300
                ${isSelected
                  ? 'border-oe-gold bg-oe-gold/10 shadow-lg shadow-oe-gold/20'
                  : 'border hover:border-hover bg-bg-surface'
                }
              `}
              onClick={() => toggleEquipment(equipment.id)}
            >
              {/* Checkbox visual */}
              <div className="absolute top-4 right-4">
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300
                  ${isSelected
                    ? 'border-oe-gold bg-oe-gold'
                    : 'border-text-disabled bg-transparent'
                  }
                `}>
                  {isSelected && (
                    <Check className="w-4 h-4 text-black" strokeWidth={3} />
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold pr-8">{equipment.name}</h3>
                <p className="text-sm text-text-muted">{equipment.description}</p>
                
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-2xl font-bold text-oe-gold">
                    {equipment.price}€
                  </span>
                  <span className="text-sm text-text-muted">/ día</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sticky Summary Bar */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100]
                     bg-black/95 backdrop-blur-xl
                     border-t-2 border-[var(--oe-gold)]/40
                     shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Info */}
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-white">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--oe-gold)]" />
                    <span className="text-xs sm:text-sm font-semibold text-[var(--oe-gold)]">
                      {selectedEquipment.size} {selectedEquipment.size === 1 ? 'equipo' : 'equipos'}
                    </span>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-white/20" />
                  <div>
                    <div className="text-xs text-white/70">Total (1 día)</div>
                    <div className="text-2xl sm:text-3xl font-bold text-[var(--oe-gold)]">{totalPrice}€</div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={goToContact}
                  className="
                    px-6 sm:px-8 py-3 sm:py-4
                    bg-[var(--oe-gold)] text-black rounded-full
                    font-bold text-sm sm:text-base flex items-center gap-2
                    hover:bg-[var(--oe-gold-light)] hover:shadow-2xl hover:shadow-[var(--oe-gold)]/20
                    transition-all duration-300 hover:scale-105 active:scale-95
                    shadow-lg
                  "
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Pedir Presupuesto</span>
                  <span className="sm:hidden">Presupuesto</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Información adicional */}
      <div className="mt-16 p-8 bg-bg-surface rounded-2xl border border-white/10">
        <h3 className="text-2xl font-bold mb-4">📋 Información de Alquiler</h3>
        <div className="grid md:grid-cols-2 gap-4 text-text-muted">
          <div>
            <strong className="text-text-primary">✅ Incluido:</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Transporte e instalación</li>
              <li>• Técnico durante el evento</li>
              <li>• Montaje y desmontaje</li>
            </ul>
          </div>
          <div>
            <strong className="text-text-primary">📅 Tarifas:</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• 1 día: Precio indicado</li>
              <li>• 2-3 días: -10%</li>
              <li>• +4 días: -20%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

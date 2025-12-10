"use client";

import { useRef, useEffect, useState } from 'react';
import { getAllTestimonials, type Testimonial } from '@/config/testimonials-config';
import { useTranslations } from 'next-intl';

/**
 * MARQUESINA DE TESTIMONIOS
 *
 * FILOSOFÍA: "Si no hay testimonios, no se muestra"
 * - Obtiene testimonios automáticamente desde testimonials-config.ts
 * - Si el array está vacío, el componente NO se renderiza
 * - Solo muestra reviews de 5 estrellas (configurado en site-config.ts)
 */

export default function TestimonialsMarquee() {
  const t = useTranslations('testimonials');
  const ref = useRef<HTMLDivElement | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar testimonios al montar el componente
  useEffect(() => {
    async function loadTestimonials() {
      try {
        const allTestimonials = await getAllTestimonials();
        setTestimonials(allTestimonials);
      } catch (error) {
        console.error('Error loading testimonials:', error);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    }

    loadTestimonials();
  }, []);

  // Animación de marquesina
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    el.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: 18000, iterations: Infinity, easing: 'linear' }
    );
  }, [testimonials]);

  // Si está cargando, no mostrar nada (o un skeleton)
  if (loading) {
    return null; // o <TestimonialsSkeleton /> si quieres
  }

  // ⚡ IMPORTANTE: Si no hay testimonios, NO renderizar nada
  if (testimonials.length === 0) {
    return null;
  }

  // Formatear testimonios para el marquee
  const formattedTestimonials = testimonials.map(testimonial => {
    const stars = '⭐'.repeat(testimonial.rating);
    const clientInfo = testimonial.clientName || testimonial.clientInitials || t('satisfiedClient');
    const location = testimonial.location ? `, ${testimonial.location}` : '';

    return `"${testimonial.text}" — ${clientInfo}${location} ${stars}`;
  });

  return (
    <div className="overflow-hidden border-y border-[var(--border)]">
      <div ref={ref} className="whitespace-nowrap py-6">
        {/* Duplicar el array para efecto infinito */}
        {[...formattedTestimonials, ...formattedTestimonials].map((t, i) => (
          <span key={i} className="mx-8 text-white/80">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

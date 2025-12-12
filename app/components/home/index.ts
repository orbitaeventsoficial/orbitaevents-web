// app/components/home/index.ts
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - Components Home
// ═══════════════════════════════════════════════════════════════════════════
//
// GUIA D'ÚS:
// - Components "REAL" = Connectats a BD, ZERO fake data
// - Components "BRUTAL" = Disseny espectacular però dades estàtiques
// - Components sense sufix = Originals/Legacy
//
// RECOMANACIÓ: Utilitza sempre els components REAL per la homepage!
//
// Versió: 4.0 NETEJADA - Desembre 2025
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 COMPONENTS REAL - CONNECTATS A BD - UTILITZA AQUESTS!
// ═══════════════════════════════════════════════════════════════════════════

// Hero principal amb stats i countdown REALS
export { default as HeroBrutalReal } from './HeroBrutal-REAL';

// Testimonials amb opinions REALS de clients aprovats
export { default as TestimonialsBrutalReal } from './TestimonialsBrutal-REAL';

// Secció de stats amb números REALS de la BD
export { default as StatsSectionReal } from './StatsSection-REAL';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS BRUTAL - Disseny espectacular (sense dades fake)
// ═══════════════════════════════════════════════════════════════════════════

// CTA Section amb disseny brutal - Sense dades fake
export { CTASectionBrutal } from './CTASection-BRUTAL';

// Why Us amb disseny brutal - Sense dades fake
export { WhyUsBrutal } from './WhyUs-BRUTAL';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS LEGACY - Per compatibilitat
// ═══════════════════════════════════════════════════════════════════════════

export { Stats } from './Stats';
export { Hero } from './Hero';
export { HeroCinematic } from './HeroCinematic';
export { WhyUs } from './WhyUs';
export { Testimonials } from './Testimonials';
export { CTASection } from './CTASection';

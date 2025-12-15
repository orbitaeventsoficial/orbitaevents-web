// app/fonts.ts
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - SISTEMA TIPOGRÀFIC PROFESSIONAL v2.0
// ═══════════════════════════════════════════════════════════════════════════
//
// JERARQUIA:
// - Plus Jakarta Sans: Títols (moderna, elegant, amb personalitat)
// - Inter: Text de cos (llegible, neta, professional)  
// - JetBrains Mono: Números/stats (monospace elegant)
//
// ═══════════════════════════════════════════════════════════════════════════

import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Sora } from "next/font/google";

// ═══════════════════════════════════════════════════════════════════════════
// FONT PRINCIPAL - TEXT DE COS
// Inter: La millor font per legibilitat en pantalla
// ═══════════════════════════════════════════════════════════════════════════
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
  preload: true,
});

// ═══════════════════════════════════════════════════════════════════════════
// FONT DISPLAY - TÍTOLS I HEADLINES
// Plus Jakarta Sans: Moderna, elegant, professional, amb caràcter
// ═══════════════════════════════════════════════════════════════════════════
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
  preload: true,
});

// ═══════════════════════════════════════════════════════════════════════════
// FONT MONOSPACE - NÚMEROS I STATS
// JetBrains Mono: Elegant per números alineats
// ═══════════════════════════════════════════════════════════════════════════
export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  fallback: ["Consolas", "Monaco", "monospace"],
  preload: false, // No crítica per first paint
});

// ═══════════════════════════════════════════════════════════════════════════
// FONT SORA - TÍTOLS PREMIUM
// Sora: Moderna, geomètrica, amb personalitat
// ═══════════════════════════════════════════════════════════════════════════
export const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
  preload: true,
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT COMBINAT PER AL LAYOUT
// ═══════════════════════════════════════════════════════════════════════════
export const fontVariables = `${inter.variable} ${plusJakarta.variable} ${jetbrains.variable} ${sora.variable}`;

// Per compatibilitat amb codi existent
export const outfit = plusJakarta;
export const space = inter;

// app/fonts.ts
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - SISTEMA TIPOGRÀFIC PROFESSIONAL v2.0
// ═══════════════════════════════════════════════════════════════════════════
//
// JERARQUIA:
// - Plus Jakarta Sans: Títols (moderna, elegant, amb personalitat)
// - Inter: Text de cos (llegible, neta, professional)  
// - Inter tabular: Números, dates, imports i IDs amb zeros nets
//
// ═══════════════════════════════════════════════════════════════════════════

import { Inter, Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";

// ═══════════════════════════════════════════════════════════════════════════
// FONT PRINCIPAL - TEXT DE COS
// Inter: La millor font per legibilitat en pantalla
// ═══════════════════════════════════════════════════════════════════════════
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
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
  weight: ["500", "600", "700"],
  fallback: ["system-ui", "sans-serif"],
  preload: true,
});

// ═══════════════════════════════════════════════════════════════════════════
// FONT SERIF - PÀGINES TEMÀTIQUES (Món Màgic, etc.)
// Cormorant Garamond: Elegant, clàssica, perfecta per a ambients màgics
// ═══════════════════════════════════════════════════════════════════════════
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  fallback: ["Georgia", "Times New Roman", "serif"],
  preload: false,
});

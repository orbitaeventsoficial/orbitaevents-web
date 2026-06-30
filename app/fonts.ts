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

import { Inter, Plus_Jakarta_Sans, Cormorant_Garamond, Bricolage_Grotesque, JetBrains_Mono, Manrope } from "next/font/google";

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
// FONT HEADING ADMIN - TÍTOLS "PANTALLA NEGRA" (fitxa lead i endavant)
// Bricolage Grotesque: grotesca de contrast alt, caràcter editorial, es llegeix
// com a títol de veritat en pantalla fosca. Consumida via token --o-font-heading.
// ═══════════════════════════════════════════════════════════════════════════
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
  weight: ["500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
  preload: true,
});

// ═══════════════════════════════════════════════════════════════════════════
// FONT MONO ADMIN - DADES (imports, dates, hores, €/h, refs, eyebrows)
// JetBrains Mono: mono moderna i neta amb xifres tabulars. Consumida via --o-font-mono.
// ═══════════════════════════════════════════════════════════════════════════
export const plexMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
  weight: ["400", "500", "600", "700"],
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  preload: false,
});

// ═══════════════════════════════════════════════════════════════════════════
// FONT COS ADMIN "PANTALLA NEGRA" - text/valors de la fitxa del lead i endavant
// Manrope: grotesca moderna amb caràcter, més personalitat que Inter sense perdre
// llegibilitat en pantalla densa. Consumida (scope) via --ui a .ap-ledger-fullpage.
// ═══════════════════════════════════════════════════════════════════════════
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
  preload: false,
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

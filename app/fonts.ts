// app/fonts.ts
// Combinació elegant: Outfit (títols) + Inter (text)
import { Inter, Outfit, Space_Grotesk } from "next/font/google";

// Font per text - Llegible, neta, professional
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  fallback: ["system-ui", "sans-serif"],
});

// Font per títols - Moderna, elegant, amb caràcter
export const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  fallback: ["system-ui", "sans-serif"],
});

// Font alternativa (backup)
export const space = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space",
  weight: ["400", "500", "600", "700"],
  fallback: ["serif"],
});

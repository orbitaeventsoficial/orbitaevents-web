/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "bg-main": "var(--bg-main)",
        "bg-surface": "var(--bg-surface)",
        "bg-card": "var(--bg-card)",
        "bg-glass": "var(--bg-glass)",
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        "border-glow": "var(--border-glow)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-disabled": "var(--text-disabled)",
        "oe-gold": "var(--oe-gold)",
        "oe-gold-light": "var(--oe-gold-light)",
        "oe-gold-dark": "var(--oe-gold-dark)",
        "oe-gold-bright": "var(--oe-gold-bright)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)"
      },
      fontFamily: {
        // Font principal per text
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Font per títols - Outfit
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        // Alternativa monospace per números/stats
        mono: ["JetBrains Mono", "Consolas", "monospace"]
      },
      fontSize: {
        // Mides personalitzades amb clamp per responsivitat
        "hero": ["clamp(2.5rem, 8vw, 5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "title": ["clamp(2rem, 5vw, 3.5rem)", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "subtitle": ["clamp(1.25rem, 3vw, 1.75rem)", { lineHeight: "1.4" }]
      }
      // ⬆️ Mantén el resto de tu extend aquí si quieres (keyframes, animations, etc.)
    }
  },
  plugins: []
};

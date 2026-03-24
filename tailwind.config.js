/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/constants/**/*.ts',
  ],
  theme: {
    extend: {
      // ═══════════════════════════════════════════════════════════════════
      // COLORS
      // ═══════════════════════════════════════════════════════════════════
      colors: {
        // Backgrounds
        'bg-main': 'var(--bg-main)',
        'bg-surface': 'var(--bg-surface)',
        'bg-card': 'var(--bg-card)',
        'bg-glass': 'var(--bg-glass)',
        'bg-elevated': 'var(--bg-elevated)',
        
        // Borders
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-hover': 'var(--border-hover)',
        'border-glow': 'var(--border-glow)',
        
        // Text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        
        // Brand - Gold
        'oe-gold': 'var(--oe-gold)',
        'oe-gold-light': 'var(--oe-gold-light)',
        'oe-gold-dark': 'var(--oe-gold-dark)',
        'oe-gold-bright': 'var(--oe-gold-bright)',
        
        // Brand - Accents
        'oe-amber': 'var(--oe-amber)',
        'oe-orange': 'var(--oe-orange)',
        'oe-purple': 'var(--oe-purple)',
        'oe-green': 'var(--oe-green)',
      },

      // ═══════════════════════════════════════════════════════════════════
      // TYPOGRAPHY
      // ═══════════════════════════════════════════════════════════════════
      fontFamily: {
        // Text principal - Inter
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        
        // Títols - Plus Jakarta Sans
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        
        // Números - JetBrains Mono
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },

      fontSize: {
        // Custom sizes amb clamp per responsivitat
        'hero': ['clamp(2.25rem, 7vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.035em', fontWeight: '800' }],
        'title': ['clamp(1.75rem, 5vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '700' }],
        'subtitle': ['clamp(1.125rem, 2.5vw, 1.5rem)', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '500' }],
      },

      // ═══════════════════════════════════════════════════════════════════
      // SPACING
      // ═══════════════════════════════════════════════════════════════════
      spacing: {
        'safe-top': 'var(--safe-top)',
        'safe-bottom': 'var(--safe-bottom)',
        'header': 'var(--header-height)',
        'header-scrolled': 'var(--header-height-scrolled)',
      },

      // ═══════════════════════════════════════════════════════════════════
      // BORDER RADIUS
      // ═══════════════════════════════════════════════════════════════════
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },

      // ═══════════════════════════════════════════════════════════════════
      // BOX SHADOW
      // ═══════════════════════════════════════════════════════════════════
      boxShadow: {
        'glow-gold': 'var(--shadow-glow-gold)',
        'glow-gold-intense': 'var(--shadow-glow-gold-intense)',
      },

      // ═══════════════════════════════════════════════════════════════════
      // TRANSITIONS
      // ═══════════════════════════════════════════════════════════════════
      transitionTimingFunction: {
        'out-expo': 'var(--ease-out-expo)',
        'out-quart': 'var(--ease-out-quart)',
      },

      // ═══════════════════════════════════════════════════════════════════
      // ANIMATIONS
      // ═══════════════════════════════════════════════════════════════════
      animation: {
        'fade-in-up': 'fadeInUp 0.6s var(--ease-out-expo) forwards',
        'shimmer': 'shimmer 2s infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'ring-fill': 'ringFill 0.8s ease-out forwards',
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(251, 191, 36, 0.15)' },
          '50%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)' },
        },
        ringFill: {
          from: { strokeDashoffset: 'var(--ring-circumference, 282.7)' },
          to: { strokeDashoffset: 'var(--ring-offset, 0)' },
        },
      },

      // ═══════════════════════════════════════════════════════════════════
      // SCREENS (responsive breakpoints)
      // ═══════════════════════════════════════════════════════════════════
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};

/**
 * TOKENS DE DISEÑO CENTRALIZADOS
 * Fuente única de verdad para proporciones
 *
 * @description Sistema de design tokens per mantenir consistència visual
 */

export const DESIGN = {
  // ═══════════════════════════════════════
  // ESPACIADO
  // ═══════════════════════════════════════
  spacing: {
    section: {
      sm: '5rem',     // 80px - mobile
      md: '7rem',     // 112px - tablet
      lg: '8rem',     // 128px - desktop
    },
    container: {
      sm: '1rem',     // 16px
      md: '1.5rem',   // 24px
      lg: '2rem',     // 32px
    },
    gap: {
      xs: '0.5rem',   // 8px
      sm: '1rem',     // 16px
      md: '1.5rem',   // 24px
      lg: '2rem',     // 32px
      xl: '3rem',     // 48px
    },
  },

  // ═══════════════════════════════════════
  // TIPOGRAFÍA
  // ═══════════════════════════════════════
  fontSize: {
    h1: 'clamp(2.5rem, 8vw, 6rem)',      // 40px - 96px
    h2: 'clamp(1.875rem, 5vw, 3.75rem)', // 30px - 60px
    h3: 'clamp(1.5rem, 4vw, 2.25rem)',   // 24px - 36px
    body: 'clamp(1rem, 2vw, 1.125rem)',  // 16px - 18px
    small: '0.875rem',                    // 14px
    xs: '0.75rem',                        // 12px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },

  // ═══════════════════════════════════════
  // RADIOS
  // ═══════════════════════════════════════
  radius: {
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },

  // ═══════════════════════════════════════
  // SOMBRAS
  // ═══════════════════════════════════════
  shadow: {
    sm: '0 2px 4px rgba(0,0,0,0.1)',
    md: '0 4px 12px rgba(0,0,0,0.15)',
    lg: '0 8px 24px rgba(0,0,0,0.2)',
    xl: '0 16px 48px rgba(0,0,0,0.25)',
    gold: '0 4px 15px rgba(251,191,36,0.25)',
    goldHover: '0 8px 30px rgba(251,191,36,0.4)',
    goldIntense: '0 0 40px rgba(251,191,36,0.3)',
  },

  // ═══════════════════════════════════════
  // TRANSICIONES
  // ═══════════════════════════════════════
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.22, 0.61, 0.36, 1)',
  },

  // ═══════════════════════════════════════
  // BREAKPOINTS (per referència)
  // ═══════════════════════════════════════
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ═══════════════════════════════════════
  // COLORS
  // ═══════════════════════════════════════
  colors: {
    gold: {
      DEFAULT: '#d7b86e',
      light: '#f8e5a1',
      dark: '#b9994b',
      bright: '#ffd700',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.85)',
      muted: 'rgba(255, 255, 255, 0.70)',  // Millorat de 0.65 per contrast
      disabled: 'rgba(255, 255, 255, 0.4)',
    },
    bg: {
      main: '#0a0a0b',
      surface: '#111214',
      card: '#1a1a1c',
      glass: 'rgba(17, 18, 20, 0.8)',
    },
    border: {
      DEFAULT: 'rgba(255, 255, 255, 0.08)',
      hover: 'rgba(255, 255, 255, 0.15)',
      gold: 'rgba(215, 184, 110, 0.3)',
    },
  },

  // ═══════════════════════════════════════
  // ALTURES DE CARDS
  // ═══════════════════════════════════════
  cardHeights: {
    service: 'h-72 sm:h-80 lg:h-96',  // 288/320/384
    option: 'min-h-[12rem]',           // 192px mínim
    testimonial: 'aspect-[4/3]',
  },

  // ═══════════════════════════════════════
  // ANCHOS DE CONTENEDOR
  // ═══════════════════════════════════════
  containerWidths: {
    sm: '32rem',    // 512px - texto estrecho
    md: '48rem',    // 768px - contenido normal
    lg: '64rem',    // 1024px - cards
    xl: '80rem',    // 1280px - grids
  },

  // ═══════════════════════════════════════
  // BOTONES
  // ═══════════════════════════════════════
  buttons: {
    primary: {
      sm: { padding: '0.75rem 1.5rem', fontSize: '0.875rem', radius: '0.75rem' },
      md: { padding: '1rem 2rem', fontSize: '1.125rem', radius: '1rem' },
      lg: { padding: '1.25rem 2.5rem', fontSize: '1.25rem', radius: '9999px' },
    },
    secondary: {
      padding: '0.875rem 1.75rem',
      fontSize: '1rem',
      radius: '0.875rem',
    },
  },
} as const;

// Type exports
export type DesignTokens = typeof DESIGN;
export type SpacingKey = keyof typeof DESIGN.spacing.section;
export type FontSizeKey = keyof typeof DESIGN.fontSize;
export type RadiusKey = keyof typeof DESIGN.radius;

// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // === BACKGROUNDS ===
        'bg-main': 'var(--bg-main)',
        'bg-surface': 'var(--bg-surface)',
        'bg-card': 'var(--bg-card)',
        'bg-glass': 'var(--bg-glass)',

        // === BORDERS ===
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        'border-glow': 'var(--border-glow)',

        // === TEXT ===
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-disabled': 'var(--text-disabled)',

        // === BRAND GOLD ===
        'oe-gold': 'var(--oe-gold)',
        'oe-gold-light': 'var(--oe-gold-light)',
        'oe-gold-dark': 'var(--oe-gold-dark)',
        'oe-gold-bright': 'var(--oe-gold-bright)',

        // === STATUS ===
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
      },
      
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
      },
      
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'display-sm': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-xl': ['6rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-2xl': ['7rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },
      
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      
      boxShadow: {
        'oe-gold': 'var(--shadow-gold)',
        'oe-gold-lg': 'var(--shadow-gold-lg)',
        'oe-glow': 'var(--glow-gold)',
        'oe-glow-hover': 'var(--glow-gold-hover)',
        'oe-glow-intense': 'var(--glow-gold-intense)',
        'brutal': 'var(--shadow-brutal)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'inner-glow': 'inset 0 0 20px rgba(215, 184, 110, 0.1)',
      },
      
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
        '4xl': '128px',
      },
      
      keyframes: {
        // === FLOATS ===
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        'float-x': {
          '0%, 100%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(20px)' },
        },
        
        // === BREATHING ===
        breathe: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        'breathe-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        
        // === GLOWS ===
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(215, 184, 110, 0.3)',
            transform: 'scale(1)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(215, 184, 110, 0.6), 0 0 80px rgba(215, 184, 110, 0.4)',
            transform: 'scale(1.02)',
          },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        
        // === GRADIENTS ===
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'gradient-y': {
          '0%, 100%': { backgroundPosition: '50% 0%' },
          '50%': { backgroundPosition: '50% 100%' },
        },
        'gradient-xy': {
          '0%, 100%': { backgroundPosition: '0% 0%' },
          '25%': { backgroundPosition: '100% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '75%': { backgroundPosition: '0% 100%' },
        },
        
        // === SHIMMER ===
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'shimmer-slow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        
        // === ROTATIONS ===
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        
        // === SCALES ===
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        'scale-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        
        // === SLIDES ===
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        
        // === FADE ===
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        
        // === BOUNCES ===
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-25%)' },
        },
        'bounce-horizontal': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(25%)' },
        },
        
        // === SPECIAL EFFECTS ===
        aurora: {
          '0%, 100%': { 
            opacity: '0.3', 
            transform: 'scale(1) rotate(0deg)',
            filter: 'blur(40px)',
          },
          '33%': { 
            opacity: '0.6', 
            transform: 'scale(1.1) rotate(120deg)',
            filter: 'blur(60px)',
          },
          '66%': { 
            opacity: '0.4', 
            transform: 'scale(0.9) rotate(240deg)',
            filter: 'blur(50px)',
          },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
        },
        'text-shine': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        
        // === 3D EFFECTS ===
        'flip-horizontal': {
          '0%': { transform: 'rotateY(0)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        'flip-vertical': {
          '0%': { transform: 'rotateX(0)' },
          '100%': { transform: 'rotateX(360deg)' },
        },
        tilt: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },

        // === MANOLO APORTACIÓN: GLOW TENUE WHATSAPP ===
        'ping-slow': {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
      },
      
      animation: {
        // === FLOATS ===
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 10s ease-in-out infinite',
        'float-x': 'float-x 8s ease-in-out infinite',
        
        // === BREATHING ===
        breathe: 'breathe 4s ease-in-out infinite',
        'breathe-slow': 'breathe-slow 6s ease-in-out infinite',
        
        // === GLOWS ===
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        
        // === GRADIENTS ===
        'gradient-x': 'gradient-x 8s ease infinite',
        'gradient-y': 'gradient-y 8s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        
        // === SHIMMER ===
        shimmer: 'shimmer 3s linear infinite',
        'shimmer-slow': 'shimmer-slow 8s ease-in-out infinite',
        
        // === ROTATIONS ===
        spin: 'spin 1s linear infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'spin-reverse': 'spin-reverse 1s linear infinite',
        
        // === SCALES ===
        'scale-in': 'scale-in 0.3s ease-out',
        'scale-out': 'scale-out 0.3s ease-out',
        'scale-pulse': 'scale-pulse 2s ease-in-out infinite',
        
        // === SLIDES ===
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'slide-left': 'slide-left 0.5s ease-out',
        'slide-right': 'slide-right 0.5s ease-out',
        
        // === FADE ===
        'fade-in': 'fade-in 0.6s ease-out',
        'fade-out': 'fade-out 0.6s ease-out',
        'fade-in-up': 'fade-in-up 0.8s ease-out',
        
        // === BOUNCES ===
        bounce: 'bounce 1s infinite',
        'bounce-horizontal': 'bounce-horizontal 1s infinite',
        
        // === SPECIAL ===
        aurora: 'aurora 20s ease-in-out infinite',
        confetti: 'confetti 10s linear infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        shake: 'shake 0.5s ease-in-out',
        'text-shine': 'text-shine 5s linear infinite',
        'flip-horizontal': 'flip-horizontal 1s ease-in-out',
        'flip-vertical': 'flip-vertical 1s ease-in-out',
        tilt: 'tilt 3s ease-in-out infinite',

        // === MANOLO APORTACIÓN: GLOW TENUE WHATSAPP ===
        'ping-slow': 'ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '2000': '2000ms',
      },
      
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'elastic': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      aspectRatio: {
        '4/3': '4 / 3',
        '21/9': '21 / 9',
      },
      
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
      
      blur: {
        xs: '2px',
        '3xl': '64px',
        '4xl': '128px',
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'var(--grad-mesh)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      },
    },
  },
  plugins: [],
};

export default config;

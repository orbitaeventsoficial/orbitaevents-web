// app/constants/colors.ts

export const COLORS = {
  // Brand colors
  gold: {
    DEFAULT: '#d7b86e',
    light: '#f8e5a1',
    dark: '#b9994b',
    bright: '#ffd700',
  },

  // Social media
  whatsapp: '#25D366',
  instagram: '#E4405F',
  tiktok: '#00F2EA',
  facebook: '#1877F2',

  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Backgrounds
  bgMain: '#0a0a0b',
  bgSurface: '#111214',
  bgCard: '#1a1a1c',
} as const;

export const GRADIENTS = {
  gold: 'linear-gradient(135deg, #f8e5a1 0%, #e6c57a 25%, #d7b86e 50%, #c9a55c 75%, #b9994b 100%)',
  goldIntense: 'linear-gradient(135deg, #ffd700 0%, #f8e5a1 20%, #d7b86e 40%, #b9994b 60%, #8b7355 100%)',
  halloween: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #8b0000 100%)',
} as const;

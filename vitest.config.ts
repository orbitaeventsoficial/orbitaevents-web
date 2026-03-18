import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, './vitest.server-only-stub.ts'),
      '@/config': path.resolve(__dirname, './app/config'),
      '@/components': path.resolve(__dirname, './app/components'),
      '@/data': path.resolve(__dirname, './app/data'),
      '@': path.resolve(__dirname, './'),
    },
  },
});

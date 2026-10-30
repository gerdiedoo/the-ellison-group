import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tests/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    env: {
      NEXT_PUBLIC_DATA_MODE: 'mock',
      NEXT_PUBLIC_APP_ENV: 'development',
      NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100',
      AUTH_SECRET: 'isolated-unit-test-secret-never-used-for-hosting',
    },
  },
});

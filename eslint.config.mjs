import { FlatCompat } from '@eslint/eslintrc';
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { rules: { 'react/no-unescaped-entities': 'off' } },
  {
    ignores: [
      '.next/**',
      '.next-e2e/**',
      '.next-build/**',
      '.local/**',
      'node_modules/**',
      'supabase/functions/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },
];
export default config;

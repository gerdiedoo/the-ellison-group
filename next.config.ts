import type { NextConfig } from 'next';
const storage = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;
const config: NextConfig = {
  output: 'standalone',
  outputFileTracingExcludes: {
    '/*': [
      './.local/**/*',
      './.lighthouseci/**/*',
      './test-results/**/*',
      './playwright-report/**/*',
    ],
  },
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep SEO metadata in the initial head for crawlers and HTML-only consumers.
  htmlLimitedBots: /.*/,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
    unoptimized: storage?.protocol === 'http:',
    remotePatterns: storage
      ? [
          {
            protocol: storage.protocol.replace(':', '') as 'http' | 'https',
            hostname: storage.hostname,
            port: storage.port,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
  async redirects() {
    return [
      {
        source: '/agents/james-krik',
        destination: '/agent/james-kirk',
        permanent: false,
        statusCode: 301,
      },
      {
        source: '/agent/james-krik',
        destination: '/agent/james-kirk',
        permanent: false,
        statusCode: 301,
      },
      {
        source: '/neighborhoods/hilcrest',
        destination: '/neighborhoods/hillcrest',
        permanent: false,
        statusCode: 301,
      },
      {
        source: '/privacy',
        destination: '/terms-and-conditions',
        permanent: false,
        statusCode: 301,
      },
    ].map(({ source, destination, statusCode }) => ({ source, destination, statusCode }));
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          ...(process.env.NEXT_PUBLIC_APP_ENV !== 'production'
            ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
            : []),
        ],
      },
    ];
  },
};
export default config;

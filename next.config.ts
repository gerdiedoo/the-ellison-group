import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone', reactStrictMode: true, poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'], remotePatterns: [] },
  async redirects() { return [
    { source: '/agents/james-krik', destination: '/agent/james-kirk', permanent: false, statusCode: 301 },
    { source: '/agent/james-krik', destination: '/agent/james-kirk', permanent: false, statusCode: 301 },
    { source: '/neighborhoods/hilcrest', destination: '/neighborhoods/hillcrest', permanent: false, statusCode: 301 },
    { source: '/privacy', destination: '/terms-and-conditions', permanent: false, statusCode: 301 },
  ].map(({source,destination,statusCode})=>({source,destination,statusCode})); },
  async headers() { return [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
    ...(process.env.NEXT_PUBLIC_APP_ENV !== 'production' ? [{key:'X-Robots-Tag',value:'noindex, nofollow'}] : []),
  ] }]; },
};
export default config;

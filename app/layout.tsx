import type { Metadata } from 'next';
import { env, isDev } from '@/lib/env';
import localFont from 'next/font/local';
import { Header } from '@/components/shell/header';
import { Footer } from '@/components/shell/footer';
import { SiteProvider } from '@/components/shell/site-provider';
import { MotionSystem } from '@/components/motion/reveal';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';
import './home.css';
import './search.css';
import './property.css';
import './valuation.css';
import './neighborhood.css';
import './content.css';
import './portal.css';
import './admin.css';
import './workspace.css';
import './workspace-modules.css';
import './campaign.css';
import './visitor-prompts.css';
import { PublicOnly } from '@/components/shell/public-only';
const serif = localFont({
  src: '../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2',
  variable: '--font-fraunces',
  display: 'swap',
});
const sans = localFont({
  src: '../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',
  variable: '--font-geist',
  display: 'swap',
});
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: 'The Ellison Group | Little Rock Real Estate Experts',
  description: 'Find your place in Little Rock with The Ellison Group.',
  robots: isDev ? { index: false, follow: false } : { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <NuqsAdapter>
          <SiteProvider>
            <PublicOnly>
              <Header />
            </PublicOnly>
            <main id="main">{children}</main>
            <PublicOnly>
              <Footer />
            </PublicOnly>
            <MotionSystem />
          </SiteProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}

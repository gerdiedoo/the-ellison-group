import type { Metadata } from 'next';
import { env, isDev } from '@/lib/env';
export const metadata: Metadata = { metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL), title: 'The Ellison Group | Little Rock Real Estate Experts', description: 'Find your place in Little Rock with The Ellison Group.', robots: isDev ? { index: false, follow: false } : { index: true, follow: true } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }

import type { MetadataRoute } from 'next';
import { env,isDev } from '@/lib/env';
export default function robots():MetadataRoute.Robots{return{rules:isDev?{userAgent:'*',disallow:'/'}:{userAgent:'*',allow:'/',disallow:['/admin/','/api/','/auth/','/dev/','/home-search/account','/home-search/saved/']},sitemap:isDev?undefined:`${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`};}

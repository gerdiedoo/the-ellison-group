import type { Metadata } from 'next';
import { env,isDev } from '@/lib/env';
export function metadata(title:string,path:string,description='Local knowledge. Personal attention. Your next chapter in Little Rock with The Ellison Group.'):Metadata{return{title:`${title} | The Ellison Group`,description,alternates:{canonical:path},openGraph:{title:`${title} | The Ellison Group`,description,url:path,type:'website',images:[`${env.NEXT_PUBLIC_SITE_URL}/opengraph-image`]},twitter:{card:'summary_large_image',title,description},robots:isDev?{index:false,follow:false}:{index:true,follow:true}};}

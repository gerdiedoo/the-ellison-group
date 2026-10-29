import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env, isMock } from '@/lib/env';
export async function updateSession(request:NextRequest){let response=NextResponse.next({request});if(isMock)return response;const supabase=createServerClient(process.env.SUPABASE_INTERNAL_URL||env.NEXT_PUBLIC_SUPABASE_URL!,env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>request.cookies.getAll(),setAll:(items)=>{items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});await supabase.auth.getClaims();response.headers.set('Cache-Control','private, no-store');return response;}

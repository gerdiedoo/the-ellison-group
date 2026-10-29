import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
export async function GET(request:Request){const url=new URL(request.url),code=url.searchParams.get('code');if(code){const{error}=await(await serverClient()).auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/home-search/account',url.origin));}return NextResponse.redirect(new URL('/home-search/account?error=auth',url.origin));}

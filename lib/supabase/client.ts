'use client';
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';
export function browserClient(){if(!env.NEXT_PUBLIC_SUPABASE_URL||!env.NEXT_PUBLIC_SUPABASE_ANON_KEY)throw new Error('Supabase is not configured.');return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_ANON_KEY);}

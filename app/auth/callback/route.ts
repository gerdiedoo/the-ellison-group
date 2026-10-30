import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
export async function GET(request: Request) {
  const url = new URL(request.url),
    code = url.searchParams.get('code'),
    jar = await cookies(),
    returnTo = jar.get('ellison-auth-return')?.value;
  jar.delete('ellison-auth-return');
  const safe =
    returnTo?.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')
      ? returnTo
      : '/home-search/account';
  if (code) {
    const { error } = await (await serverClient()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safe, url.origin));
  }
  return NextResponse.redirect(new URL('/home-search/account?error=auth', url.origin));
}

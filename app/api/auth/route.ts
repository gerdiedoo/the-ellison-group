import { z } from 'zod';
import { cookies } from 'next/headers';
import { isMock, env } from '@/lib/env';
import { COOKIE, signSession, currentUser } from '@/lib/auth';
import { base, mutateStore } from '@/lib/repository';
import { guard, body, apiError, ApiError, checkBot } from '@/lib/security';
import { serverClient } from '@/lib/supabase/server';
const schema = z.object({
  action: z.enum(['login', 'logout', 'google']),
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase())
    .optional(),
  code: z.string().max(200).optional(),
  return_to: z
    .string()
    .max(1000)
    .refine(
      (v) => v.startsWith('/') && !v.startsWith('//') && !v.includes('\\'),
      'Use a relative return path.',
    )
    .optional(),
  turnstile_token: z.string().default(''),
});
export async function GET() {
  try {
    return Response.json(
      { authenticated: Boolean(await currentUser()) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    await guard(request, 'auth', 10);
    const input = schema.parse(await body(request));
    const jar = await cookies();
    if (input.action === 'logout') {
      if (isMock) jar.delete(COOKIE);
      else await (await serverClient()).auth.signOut();
      return Response.json({ success: true });
    }
    if (isMock) {
      if (!input.email) throw new ApiError(400, 'Enter an email to try the demo portal.');
      const staff = Boolean(
        input.code && process.env.DEMO_ADMIN_CODE && input.code === process.env.DEMO_ADMIN_CODE,
      );
      if (input.code && !staff) throw new ApiError(403, 'The team access code is incorrect.');
      const user = await mutateStore((store) => {
        let p = store.profiles.find((p) => p.email === input.email);
        if (!p) {
          p = {
            ...base(),
            email: input.email!,
            full_name: 'Demo visitor',
            phone: '',
            role: staff ? 'admin' : 'user',
            agent_id: null,
            notification_prefs: {},
          };
          store.profiles.push(p);
        } else if (staff && p.role === 'user') p.role = 'admin';
        if (p.role !== 'user' && !staff)
          throw new ApiError(403, 'The team access code is required for this demo account.');
        return p;
      });
      jar.set(COOKIE, signSession(user.id), {
        httpOnly: true,
        secure: new URL(request.url).protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        maxAge: 604800,
      });
      return Response.json({ success: true, demo: true, role: user.role });
    }
    await checkBot(input.turnstile_token);
    const client = await serverClient();
    if (input.action === 'google') {
      if (input.return_to)
        jar.set('ellison-auth-return', input.return_to, {
          httpOnly: true,
          secure: new URL(request.url).protocol === 'https:',
          sameSite: 'lax',
          maxAge: 600,
          path: '/',
        });
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
      });
      if (error) throw error;
      return Response.json({ url: data.url });
    }
    if (!input.email) throw new ApiError(400, 'Enter your email.');
    const { error } = await client.auth.signInWithOtp({
      email: input.email,
      options: { emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
    });
    if (error) throw error;
    return Response.json({ success: true, message: 'Check your email for a secure sign-in link.' });
  } catch (error) {
    return apiError(error);
  }
}

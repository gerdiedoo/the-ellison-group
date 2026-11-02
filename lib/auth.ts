import 'server-only';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { isMock } from '@/lib/env';
import { hash, ApiError } from '@/lib/security';
import { all } from '@/lib/repository';
import { serverClient } from '@/lib/supabase/server';
import { isVercelDemoPreview } from '@/lib/preview-demo';
import type { Profile } from '@/lib/types';
export const COOKIE = 'ellison-demo-session';

const sessionSchema = z.object({
  id: z.string().uuid(),
  exp: z.number().finite(),
  profile: z
    .object({
      id: z.string().uuid(),
      email: z.string().email().max(254),
      full_name: z.string().max(150),
      role: z.enum(['user', 'agent', 'admin']),
      agent_id: z.string().uuid().nullable(),
    })
    .optional(),
});

export function signSession(id: string, profile?: Profile) {
  const payload = Buffer.from(
    JSON.stringify({
      id,
      exp: Date.now() + 7 * 86400000,
      ...(profile
        ? {
            profile: {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
              agent_id: profile.agent_id,
            },
          }
        : {}),
    }),
  ).toString('base64url');
  return `${payload}.${hash(payload)}`;
}

function readSession(value: string) {
  try {
    const [payload, signature, extra] = value.split('.');
    const expected = hash(payload);
    if (
      extra ||
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return null;
    const data = sessionSchema.parse(JSON.parse(Buffer.from(payload, 'base64url').toString()));
    if (data.exp <= Date.now() || (data.profile && data.profile.id !== data.id)) return null;
    return data;
  } catch {
    return null;
  }
}

export function verifySession(value: string): string | null {
  return readSession(value)?.id || null;
}

export async function currentUser(): Promise<Profile | null> {
  if (isMock) {
    const value = (await cookies()).get(COOKIE)?.value;
    const session = value ? readSession(value) : null;
    if (!session) return null;
    const stored = (await all('profiles', true)).find((profile) => profile.id === session.id);
    if (stored) return stored;
    // Preview functions do not share their temporary demo files. Only a verified,
    // signed identity issued after login can restore the demo session elsewhere.
    if (isVercelDemoPreview && session.profile)
      return {
        ...session.profile,
        phone: '',
        notification_prefs: {},
        created_at: new Date(session.exp - 7 * 86400000).toISOString(),
        updated_at: new Date(session.exp - 7 * 86400000).toISOString(),
      };
    return null;
  }
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client.from('profiles').select('*').eq('id', user.id).single();
  return data as Profile | null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new ApiError(401, 'Sign in to My Search Portal to continue.');
  return user;
}
export async function requireStaff() {
  const user = await requireUser();
  if (!['admin', 'agent'].includes(user.role))
    throw new ApiError(403, 'This area is reserved for the team.');
  return user;
}

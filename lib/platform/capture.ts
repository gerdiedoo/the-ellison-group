import 'server-only';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';
import { cache } from 'react';
import { all } from '@/lib/repository';
import { hash, ApiError } from '@/lib/security';
import { captureInput, assistantInput } from './schemas';
import type { Listing } from '@/lib/types';
import type { CaptureConfig } from './types';
import type { LeadData } from '@/lib/schemas';
import { publicListing } from './public-listing';
import { isPhone } from '@/lib/contact-details';
export type GateAction = 'detail' | 'save' | 'showing' | 'contact';
export const CAPTURE_COOKIE = 'ellison-capture-access';
export const getCaptureConfig = cache(async () =>
  captureInput.parse(
    (await all('site_settings', true)).find((s) => s.key === 'lead_capture')?.value,
  ),
);
export const getAssistantConfig = cache(async () =>
  assistantInput.parse(
    (await all('site_settings', true)).find((s) => s.key === 'assistant')?.value,
  ),
);
export function requiresCapture(
  listing: Pick<Listing, 'id' | 'lead_capture_required'>,
  action: GateAction,
  config: CaptureConfig,
) {
  const included =
    listing.lead_capture_required ||
    (config.enabled && (!config.property_ids.length || config.property_ids.includes(listing.id)));
  return (
    included &&
    (action === 'detail'
      ? listing.lead_capture_required || config.detail_mode === 'immediate'
      : config.actions.includes(action))
  );
}
function readGrant(token: string | undefined): string[] {
  if (!token) return [];
  try {
    const [payload, signature] = token.split('.'),
      expected = hash(`capture:${payload}`);
    if (
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return [];
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      properties: string[];
      expires: number;
    };
    return data.expires > Date.now() && Array.isArray(data.properties) ? data.properties : [];
  } catch {
    return [];
  }
}
export async function hasCaptureAccess(id: string) {
  return readGrant((await cookies()).get(CAPTURE_COOKIE)?.value).includes(id);
}
export async function grantCaptureAccess(id: string, secure: boolean) {
  const jar = await cookies(),
    properties = [...new Set([...readGrant(jar.get(CAPTURE_COOKIE)?.value), id])].slice(-30),
    payload = Buffer.from(
      JSON.stringify({ properties, expires: Date.now() + 7 * 86400000 }),
    ).toString('base64url');
  jar.set(CAPTURE_COOKIE, `${payload}.${hash(`capture:${payload}`)}`, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 604800,
  });
}
export function validateCaptureFields(data: LeadData, config: CaptureConfig) {
  if (config.required_fields.includes('full_name') && !data.first_name.trim())
    throw new ApiError(400, 'Please provide your name to continue.');
  if (config.required_fields.includes('phone') && !isPhone(data.phone))
    throw new ApiError(400, 'Please provide a valid phone number to continue.');
}
export async function publicListingRecords(listings: Listing[]) {
  const config = await getCaptureConfig(),
    granted = readGrant((await cookies()).get(CAPTURE_COOKIE)?.value);
  return listings.map(publicListing).map((l) =>
    requiresCapture(l, 'detail', config) && !granted.includes(l.id)
      ? {
          ...l,
          description: 'Connect with The Ellison Group to explore the full property details.',
          listing_features: [],
          listing_photos: l.listing_photos.slice(0, 1),
        }
      : l,
  );
}

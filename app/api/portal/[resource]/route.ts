import { isPhone } from '@/lib/contact-details';
import { normalizePhone } from '@/lib/platform/defaults';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { all, insert, update, remove, mutateStore, base } from '@/lib/repository';
import { guard, body, apiError, ApiError } from '@/lib/security';
import { isMock } from '@/lib/env';
import { serviceClient } from '@/lib/supabase/server';
import { DISCLOSURE, CONSENT_VERSION } from '@/lib/consent';
import { getCaptureConfig, hasCaptureAccess, requiresCapture } from '@/lib/platform/capture';
const searchSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  filters: z.record(z.string(), z.union([z.string().max(25000), z.number(), z.boolean()])),
  frequency: z.enum(['instant', 'daily', 'weekly']),
  channels: z
    .array(z.enum(['email', 'sms']))
    .min(1)
    .max(2),
});
type Context = { params: Promise<{ resource: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireUser(),
      { resource } = await params;
    if (resource === 'profile')
      return Response.json({
        profile: user,
        history: (await all('audit_log', true)).filter(
          (a) => a.actor_id === user.id && a.table_name === 'profiles',
        ),
      });
    if (resource === 'homes')
      return Response.json((await all('saved_homes')).filter((h) => h.user_id === user.id));
    if (resource === 'searches')
      return Response.json((await all('saved_searches')).filter((s) => s.user_id === user.id));
    throw new ApiError(404, 'Unknown portal resource.');
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    await guard(request, 'portal', 60);
    const user = await requireUser(),
      { resource } = await params,
      input = await body(request);
    if (resource === 'homes') {
      const data = z.object({ listing_id: z.string().uuid(), saved: z.boolean() }).parse(input);
      const listing = (await all('listings', true)).find(
        (l) => l.id === data.listing_id && !l.hidden && l.publication_status === 'published',
      );
      if (!listing) throw new ApiError(400, 'This listing is unavailable.');
      if (
        data.saved &&
        requiresCapture(listing, 'save', await getCaptureConfig()) &&
        !(await hasCaptureAccess(listing.id))
      )
        throw new ApiError(403, 'Complete the property introduction before saving this home.');
      if (isMock)
        await mutateStore((store) => {
          const current = store.saved_homes.find(
            (h) => h.user_id === user.id && h.listing_id === data.listing_id,
          );
          if (data.saved && !current)
            store.saved_homes.push({ ...base(), user_id: user.id, listing_id: data.listing_id });
          if (!data.saved && current)
            store.saved_homes = store.saved_homes.filter((h) => h.id !== current.id);
        });
      else {
        const client = serviceClient();
        if (data.saved) {
          const { error } = await client
            .from('saved_homes')
            .upsert(
              { ...base(), user_id: user.id, listing_id: data.listing_id },
              { onConflict: 'user_id,listing_id', ignoreDuplicates: true },
            );
          if (error) throw error;
        } else {
          const { error } = await client
            .from('saved_homes')
            .delete()
            .eq('user_id', user.id)
            .eq('listing_id', data.listing_id);
          if (error) throw error;
        }
      }
      return Response.json({ success: true });
    }
    if (resource === 'searches') {
      const data = searchSchema.parse(input);
      if (data.channels.includes('sms') && (!user.phone || user.notification_prefs.sms !== true))
        throw new ApiError(400, 'Add a phone number and opt in to SMS in your profile first.');
      const row = {
        ...base(),
        user_id: user.id,
        name: data.name,
        filters: data.filters,
        frequency: data.frequency,
        channels: data.channels,
        polygon: null,
        last_sent_at: null,
      };
      await insert('saved_searches', row);
      return Response.json(row, { status: 201 });
    }
    throw new ApiError(404, 'Unknown portal resource.');
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    await guard(request, 'portal', 60);
    const user = await requireUser(),
      { resource } = await params,
      input = await body(request);
    if (resource === 'profile') {
      const data = z
        .object({
          full_name: z.string().trim().min(1).max(100),
          phone: z.string().max(40),
          email_phone: z.boolean(),
          sms: z.boolean(),
          newsletter: z.boolean(),
        })
        .parse(input);
      if ((data.sms || data.phone) && !isPhone(data.phone))
        throw new ApiError(400, 'Please enter a valid phone number for SMS alerts.');
      const changes = {
        full_name: data.full_name,
        phone: normalizePhone(data.phone),
        notification_prefs: {
          email_phone: data.email_phone,
          sms: data.sms,
          newsletter: data.newsletter,
          disclosure_text: DISCLOSURE,
          disclosure_version: CONSENT_VERSION,
          changed_at: new Date().toISOString(),
        },
      };
      await update('profiles', user.id, changes);
      await insert('audit_log', {
        ...base(),
        actor_id: user.id,
        action: 'preferences_updated',
        table_name: 'profiles',
        record_id: user.id,
        changes: { before: user.notification_prefs, after: changes.notification_prefs },
      });
      return Response.json({ success: true });
    }
    if (resource === 'searches') {
      const data = searchSchema.extend({ id: z.string().uuid() }).parse(input);
      const row = (await all('saved_searches')).find(
        (s) => s.id === data.id && s.user_id === user.id,
      );
      if (!row) throw new ApiError(404, 'Search not found.');
      if (data.channels.includes('sms') && (!user.phone || user.notification_prefs.sms !== true))
        throw new ApiError(400, 'Opt in to SMS in your profile first.');
      await update('saved_searches', row.id, {
        name: data.name,
        filters: data.filters,
        frequency: data.frequency,
        channels: data.channels,
      });
      return Response.json({ success: true });
    }
    throw new ApiError(404, 'Unknown portal resource.');
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    await guard(request, 'portal', 60);
    const user = await requireUser(),
      { resource } = await params;
    if (resource !== 'searches') throw new ApiError(404, 'Unknown portal resource.');
    const { id } = z.object({ id: z.string().uuid() }).parse(await body(request));
    const row = (await all('saved_searches')).find((s) => s.id === id && s.user_id === user.id);
    if (!row) throw new ApiError(404, 'Search not found.');
    await remove('saved_searches', id);
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}

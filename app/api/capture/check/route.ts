import { z } from 'zod';
import { all } from '@/lib/repository';
import { apiError, ApiError } from '@/lib/security';
import { getCaptureConfig, hasCaptureAccess, requiresCapture } from '@/lib/platform/capture';
import { isMock } from '@/lib/env';
export async function GET(request: Request) {
  try {
    const url = new URL(request.url),
      id = z.string().uuid().parse(url.searchParams.get('listing_id')),
      action = z
        .enum(['detail', 'save', 'showing', 'contact'])
        .parse(url.searchParams.get('action'));
    const l = (await all('listings', true)).find(
      (l) => l.id === id && !l.hidden && l.publication_status === 'published',
    );
    if (!l) throw new ApiError(404, 'Property not found.');
    const config = await getCaptureConfig(),
      required = requiresCapture(l, action, config) && !(await hasCaptureAccess(id));
    return Response.json(
      {
        required,
        listing: { id: l.id, slug: l.slug, address_line: l.address_line, city: l.city },
        config: {
          required_fields: config.required_fields,
          allow_basic_browsing: config.allow_basic_browsing,
          google_enabled:
            config.google_enabled && !isMock && process.env.GOOGLE_OAUTH_ENABLED === 'true',
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return apiError(e);
  }
}

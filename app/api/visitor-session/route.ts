import { currentUser } from '@/lib/auth';
import { isMock } from '@/lib/env';
import { getCaptureConfig } from '@/lib/platform/capture';
import { apiError } from '@/lib/security';

export async function GET() {
  try {
    const [user, config] = await Promise.all([currentUser(), getCaptureConfig()]);
    return Response.json(
      {
        authenticated: Boolean(user),
        google_enabled:
          !isMock && config.google_enabled && process.env.GOOGLE_OAUTH_ENABLED === 'true',
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}

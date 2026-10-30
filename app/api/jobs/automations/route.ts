import { timingSafeEqual } from 'node:crypto';
import { apiError, ApiError } from '@/lib/security';
import { runDueAutomations } from '@/lib/platform/automations';
export async function POST(request: Request) {
  try {
    const expected = process.env.AUTOMATION_JOB_SECRET,
      provided = request.headers.get('authorization')?.replace(/^Bearer /, '');
    if (!expected || expected.length < 32)
      throw new ApiError(503, 'The workflow scheduler is not configured.');
    if (
      !provided ||
      Buffer.byteLength(provided) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    )
      throw new ApiError(401, 'A valid scheduler credential is required.');
    return Response.json(
      { success: true, ...(await runDueAutomations()) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiError(e);
  }
}

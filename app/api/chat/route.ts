import { z } from 'zod';
import { guard, body, apiError, checkBot } from '@/lib/security';
import { visitorSession, publicChat, visitorChat } from '@/lib/platform/chat';
const input = z
  .object({
    action: z.enum(['message', 'handoff']),
    conversation_id: z.string().uuid().optional(),
    request_id: z.string().uuid(),
    message: z.string().trim().min(1).max(3000).optional(),
    listing_id: z.string().uuid().optional(),
    property_slug: z.string().max(250).optional(),
    turnstile_token: z.string().max(4096).default(''),
  })
  .refine((v) => v.action === 'handoff' || Boolean(v.message), 'Please enter a message.');
export async function GET(request: Request) {
  try {
    const id = z
      .string()
      .uuid()
      .nullable()
      .parse(new URL(request.url).searchParams.get('conversation_id'));
    return Response.json(await publicChat(id, await visitorSession()), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    await guard(request, 'chat', 15);
    const values = input.parse(await body(request));
    await checkBot(values.turnstile_token);
    const result = await visitorChat(
      values,
      (await visitorSession(true, new URL(request.url).protocol === 'https:'))!,
    );
    return Response.json(result, {
      status: result.success ? 200 : 503,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return apiError(e);
  }
}

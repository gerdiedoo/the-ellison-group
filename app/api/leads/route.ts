import { leadSchema } from '@/lib/schemas';
import { guard, body, checkBot, apiError, ApiError } from '@/lib/security';
import { captureLead } from '@/lib/leads';
import { all, base } from '@/lib/repository';
import {
  getCaptureConfig,
  validateCaptureFields,
  grantCaptureAccess,
  requiresCapture,
} from '@/lib/platform/capture';
import { visitorSession, ownConversation } from '@/lib/platform/chat';
import { put, commit } from '@/lib/platform/transaction';
export async function POST(request: Request) {
  try {
    const meta = await guard(request, 'leads', 12);
    const data = leadSchema.parse(await body(request));
    await checkBot(data.turnstile_token);
    const listing = data.listing_id
      ? (await all('listings', true)).find(
          (l) => l.id === data.listing_id && !l.hidden && l.publication_status === 'published',
        )
      : null;
    if (data.listing_id && !listing)
      throw new ApiError(404, 'This property is no longer available.');
    const config = await getCaptureConfig();
    const captureRequired =
      listing &&
      (requiresCapture(
        listing,
        data.gate_action || (data.source === 'showing' ? 'showing' : 'contact'),
        config,
      ) ||
        requiresCapture(listing, 'detail', config));
    if (captureRequired) validateCaptureFields(data, config);
    else if (data.source !== 'newsletter' && !data.first_name)
      throw new ApiError(400, 'Please provide your name.');
    if (data.agent_id && !(await all('agents')).some((a) => a.id === data.agent_id && a.is_active))
      throw new ApiError(400, 'Choose an active agent.');
    const conversation = data.conversation_id
      ? await ownConversation(data.conversation_id, await visitorSession())
      : null;
    if (data.conversation_id && !conversation) throw new ApiError(404, 'Conversation not found.');
    const result = await captureLead(data, meta);
    if (listing && data.gate_action && captureRequired)
      await grantCaptureAccess(listing.id, new URL(request.url).protocol === 'https:');
    if (conversation)
      await commit([
        put('conversations', {
          ...conversation,
          lead_id: result.lead_id,
          updated_at: new Date().toISOString(),
        }),
        put('activities', {
          ...base(),
          lead_id: result.lead_id,
          listing_id: conversation.listing_id,
          conversation_id: conversation.id,
          actor_id: null,
          kind: 'chat_lead_captured',
          body: 'The visitor shared contact details in this conversation.',
          payload: { source_page: data.trigger_source },
          is_internal: true,
        }),
      ]);
    return Response.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

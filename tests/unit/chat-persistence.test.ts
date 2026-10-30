import { it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, getAll: () => [] }),
}));
it('persists a successful injected-provider response once, then suppresses AI after human handoff and isolates visitors', async () => {
  vi.resetModules();
  vi.stubEnv('MOCK_DATA_FILE', `.local/unit/${randomUUID()}/data.json`);
  const { visitorChat, publicChat } = await import('@/lib/platform/chat'),
    { all, base } = await import('@/lib/repository'),
    { commit, put } = await import('@/lib/platform/transaction');
  const provider = {
    respond: vi.fn(async () => ({
      reply: 'An isolated unit-provider reply.',
      property_ids: [],
      summary: 'Unit summary of the visitor request.',
      suggested_follow_up: 'A personal introduction.',
      request_human: false,
    })),
  };
  const id = randomUUID(),
    session = 'unit-session-hash';
  const first = await visitorChat(
    { action: 'message', request_id: id, message: 'I am looking for a home with a garden.' },
    session,
    provider,
  );
  expect(first.success).toBe(true);
  const cid = first.conversation!.id;
  expect((await all('conversations', true)).find((c) => c.id === cid)?.summary).toBe(
    'Unit summary of the visitor request.',
  );
  expect(first.messages.map((m) => m.role)).toEqual(['visitor', 'assistant']);
  await visitorChat(
    {
      action: 'message',
      request_id: id,
      message: 'I am looking for a home with a garden.',
      conversation_id: cid,
    },
    session,
    provider,
  );
  expect(provider.respond).toHaveBeenCalledTimes(1);
  await visitorChat(
    { action: 'handoff', request_id: randomUUID(), conversation_id: cid },
    session,
    provider,
  );
  await visitorChat(
    {
      action: 'message',
      request_id: randomUUID(),
      message: 'Please have an agent follow up.',
      conversation_id: cid,
    },
    session,
    provider,
  );
  expect(provider.respond).toHaveBeenCalledTimes(1);
  await commit([
    put('conversation_messages', {
      ...base(),
      conversation_id: cid,
      role: 'agent',
      body: 'Private unit staff note.',
      is_internal: true,
      actor_id: null,
      request_id: randomUUID(),
      provider: null,
    }),
  ]);
  expect(JSON.stringify(await publicChat(cid, session))).not.toContain('Private unit staff note.');
  await expect(publicChat(cid, 'different-session')).rejects.toMatchObject({ status: 404 });
  vi.unstubAllEnvs();
});

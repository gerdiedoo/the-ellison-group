import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateText } from 'ai';
import seed from '@/supabase/seed/data.json';
import {
  gatewayAssistant,
  publicProperty,
  groundedOutput,
  AssistantUnavailable,
  selectAssistantCatalog,
} from '@/lib/platform/assistant';
import { normalizeStore, defaultAssistant } from '@/lib/platform/defaults';
vi.mock('ai', () => ({ generateText: vi.fn(), Output: { object: vi.fn((x) => x) } }));
const record = normalizeStore(seed).listings[0],
  catalog = [publicProperty(record)],
  answer = {
    reply: 'This property has the bedroom count and price in its listing record.',
    property_ids: [record.id],
    summary: 'The visitor is exploring a property.',
    suggested_follow_up: 'Ask about their preferred showing time.',
    request_human: false,
  };
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe('the real provider boundary, with an isolated SDK stub', () => {
  it('retrieves relevant new inventory beyond the context limit and preserves the current property', () => {
    const rows = Array.from({ length: 45 }, (_, i) => ({
      ...record,
      id: `90000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      address_line: i === 44 ? '114 Garden Terrace' : 'A different address',
      description: 'Verified public description.',
    }));
    const found = selectAssistantCatalog(rows, 'Tell me about Garden Terrace', rows[12].id);
    expect(found).toHaveLength(40);
    expect(found[0].id).toBe(rows[12].id);
    expect(found.some((l) => l.id === rows[44].id)).toBe(true);
  });
  it('never invents an AI reply without configured credentials', async () => {
    vi.stubEnv('AI_GATEWAY_API_KEY', '');
    vi.stubEnv('AI_GATEWAY_MODEL', '');
    await expect(
      gatewayAssistant.respond({ config: defaultAssistant, catalog, messages: [] }),
    ).rejects.toBeInstanceOf(AssistantUnavailable);
    expect(generateText).not.toHaveBeenCalled();
  });
  it('passes only public property fields and bounded conversation context, and validates references', async () => {
    vi.stubEnv('AI_GATEWAY_API_KEY', 'unit-test-no-network');
    vi.stubEnv('AI_GATEWAY_MODEL', 'unit-test/model');
    vi.mocked(generateText).mockResolvedValue({ output: answer } as never);
    const result = await gatewayAssistant.respond({
      config: defaultAssistant,
      catalog,
      messages: [{ role: 'visitor', body: 'What can you tell me about this property?' }],
    });
    expect(result).toEqual(answer);
    const call = vi.mocked(generateText).mock.calls[0][0];
    expect(call.model).toBe('unit-test/model');
    expect(JSON.stringify(call)).not.toContain('unit-test-no-network');
    expect(publicProperty({ ...record, raw: { private_note: 'DO NOT PASS' } })).not.toHaveProperty(
      'raw',
    );
    expect(call.maxRetries).toBe(0);
    expect(call.maxOutputTokens).toBe(1200);
  });
  it('rejects an invented listing reference rather than showing a false recommendation', () => {
    expect(() =>
      groundedOutput(
        { ...answer, property_ids: ['99999999-9999-4999-8999-999999999999'] },
        catalog,
      ),
    ).toThrow(AssistantUnavailable);
  });
  it('propagates provider failures to the persisted-chat failure handler', async () => {
    vi.stubEnv('AI_GATEWAY_API_KEY', 'unit-test-no-network');
    vi.stubEnv('AI_GATEWAY_MODEL', 'unit-test/model');
    vi.mocked(generateText).mockRejectedValue(new Error('Provider timeout'));
    await expect(
      gatewayAssistant.respond({ config: defaultAssistant, catalog, messages: [] }),
    ).rejects.toThrow('Provider timeout');
  });
});

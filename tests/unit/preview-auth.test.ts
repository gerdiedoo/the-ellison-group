import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { rm, unlink } from 'node:fs/promises';
import { mockStorePath } from '@/lib/mock-store-path';

const jar = vi.hoisted(() => ({ value: '', options: {} as Record<string, unknown> }));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => (jar.value ? { value: jar.value } : undefined),
    set: (_name: string, value: string, options: Record<string, unknown>) => {
      jar.value = value;
      jar.options = options;
    },
    delete: () => {
      jar.value = '';
    },
  }),
}));
let filename: string;

beforeEach(() => {
  vi.resetModules();
  jar.value = '';
  jar.options = {};
  filename = path.join(tmpdir(), 'ellison-preview-demo', randomUUID(), 'data.json');
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('MOCK_DATA_FILE', filename);
  vi.stubEnv('AUTH_SECRET', 'isolated-preview-auth-test-secret');
  vi.stubEnv('DEMO_ADMIN_CODE', 'isolated-preview-team-code');
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(path.dirname(filename), { recursive: true, force: true });
});

function request(code?: string) {
  return new Request('https://preview.example.test/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://preview.example.test' },
    body: JSON.stringify({ action: 'login', email: 'preview-check@example.test', code }),
  });
}

describe('Vercel preview demo authentication', () => {
  it('logs in staff with the configured code and keeps the signed session after temporary files disappear', async () => {
    const { POST } = await import('@/app/api/auth/route');
    const response = await POST(request('isolated-preview-team-code'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, role: 'admin' });
    expect(jar.options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax' });
    await unlink(filename);
    const { currentUser } = await import('@/lib/auth');
    expect(await currentUser()).toMatchObject({
      email: 'preview-check@example.test',
      role: 'admin',
    });
  });
  it('rejects the wrong access code without creating a session', async () => {
    const { POST } = await import('@/app/api/auth/route');
    expect((await POST(request('wrong-code'))).status).toBe(403);
    expect(jar.value).toBe('');
  });
  it('does not let a visitor become staff by modifying the signed identity', async () => {
    const { POST } = await import('@/app/api/auth/route');
    expect((await POST(request())).status).toBe(200);
    await unlink(filename);
    const { requireStaff, currentUser } = await import('@/lib/auth');
    await expect(requireStaff()).rejects.toMatchObject({ status: 403 });
    const [payload, signature] = jar.value.split('.');
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    data.profile.role = 'admin';
    jar.value = `${Buffer.from(JSON.stringify(data)).toString('base64url')}.${signature}`;
    expect(await currentUser()).toBeNull();
  });
  it('rejects expired sessions', async () => {
    const { POST } = await import('@/app/api/auth/route');
    await POST(request('isolated-preview-team-code'));
    const { verifySession } = await import('@/lib/auth');
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 8 * 86400000);
    expect(verifySession(jar.value)).toBeNull();
    vi.restoreAllMocks();
  });
  it('uses writable temporary storage only in previews and prevents directory traversal', () => {
    expect(mockStorePath('/workspace', true)).toBe(
      path.join(tmpdir(), 'ellison-preview-demo', 'data.json'),
    );
    expect(mockStorePath('/workspace', false)).toBe('/workspace/.local/data.json');
    expect(() => mockStorePath('/workspace', true, '/etc/data.json')).toThrow();
    expect(() => mockStorePath('/workspace', false, '../data.json')).toThrow();
  });
});

import { env, isMock } from '@/lib/env';
export const dynamic = 'force-dynamic';
export async function GET() {
  let database = isMock ? 'mock-adapter' : 'unavailable';
  if (!isMock) {
    try { const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_settings?select=key&limit=1`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, signal: AbortSignal.timeout(3000), cache:'no-store' }); database = r.ok ? 'connected' : 'unavailable'; } catch { database = 'unavailable'; }
  }
  return Response.json({status:database==='unavailable'?'degraded':'ok',version:'0.1.0-prototype',environment:env.NEXT_PUBLIC_APP_ENV,gitSha:process.env.GIT_SHA || 'local',database}, {status:database==='unavailable'?503:200});
}

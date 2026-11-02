import 'server-only';
import { isMock } from '@/lib/env';

export const isVercelDemoPreview =
  isMock && process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview';

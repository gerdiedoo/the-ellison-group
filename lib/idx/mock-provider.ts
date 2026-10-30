import seed from '@/supabase/seed/data.json';
import { normalizeStore } from '@/lib/platform/defaults';
import type { IdxProvider } from './provider';
export class MockIdxProvider implements IdxProvider {
  readonly name = 'Fictional Little Rock demonstration feed';
  async sync() {
    return normalizeStore(seed).listings;
  }
}

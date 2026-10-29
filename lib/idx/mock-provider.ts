import seed from '@/supabase/seed/data.json';
import type { Listing } from '@/lib/types';
import type { IdxProvider } from './provider';
export class MockIdxProvider implements IdxProvider {readonly name='Fictional Little Rock demonstration feed';async sync(){return seed.listings as Listing[];}}

import type { IdxProvider } from './provider';
import type { Listing } from '@/lib/types';
export class ResoProvider implements IdxProvider {
  readonly name='Licensed RESO Web API';
  async sync():Promise<Listing[]> { throw new Error('RESO mapping requires a licensed feed and brokerage-approved field mapping. See TODO-INTEGRATIONS.md.'); }
}

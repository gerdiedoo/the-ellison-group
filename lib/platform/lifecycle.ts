import type { Listing } from '@/lib/types';
export function validListingTransition(before: Listing['status'], after: Listing['status']) {
  return before !== 'sold' || after === 'sold';
}

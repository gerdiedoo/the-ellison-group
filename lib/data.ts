import 'server-only';
import { cache } from 'react';
import { all } from '@/lib/repository';
import { publicListingRecords } from '@/lib/platform/capture';
import { withTeamPortrait } from '@/lib/agent-photos';
export const getListings = cache(async () =>
  publicListingRecords(
    (await all('listings', true)).filter((l) => !l.hidden && l.publication_status === 'published'),
  ),
);
export const getAgents = cache(async () =>
  (await all('agents'))
    .filter((a) => a.is_active)
    .map(withTeamPortrait)
    .sort((a, b) => a.sort_order - b.sort_order),
);
export const getNeighborhoods = cache(async () =>
  (await all('neighborhoods')).sort((a, b) => a.sort_order - b.sort_order),
);
export const getTestimonials = cache(async () =>
  (await all('testimonials')).sort((a, b) => a.sort_order - b.sort_order),
);
export const getPosts = cache(async () => all('blog_posts'));
export const getFeatured = cache(async () =>
  (await getListings())
    .filter((l) => l.is_featured && l.status !== 'sold')
    .sort((a, b) => a.featured_rank - b.featured_rank || b.list_price - a.list_price),
);

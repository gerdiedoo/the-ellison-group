import { mkdirSync, writeFileSync } from 'node:fs';
import content from '../supabase/seed/content.json' with { type: 'json' };
const now = '2026-10-01T12:00:00.000Z';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const base = (n) => ({ id: id(n), created_at: now, updated_at: now });
const names = [
  'The Heights',
  'Hillcrest',
  'Historic Downtown',
  'Chenal',
  'Maumelle',
  'Pleasant Valley',
  'Woodland Edge',
  'Ferndale',
  'Midtown',
];
const slugs = [
  'the-heights',
  'hillcrest',
  'historic-downtown',
  'chenal',
  'maumelle',
  'pleasant-valley',
  'woodland-edge',
  'ferndale',
  'midtown',
];
const coords = [
  [34.773, -92.343],
  [34.755, -92.331],
  [34.743, -92.273],
  [34.775, -92.468],
  [34.867, -92.405],
  [34.792, -92.395],
  [34.722, -92.435],
  [34.749, -92.54],
  [34.751, -92.371],
];
const store = {};
store.neighborhoods = names.map((name, i) => ({
  ...base(100 + i),
  name,
  slug: slugs[i],
  blurb: [
    'Tree-lined streets. Neighborhood favorites. A distinctly local rhythm.',
    'Historic character and a creative spirit, just minutes from everything.',
    'Riverfront paths, independent restaurants, and a city coming to life.',
    'Room to breathe, beautiful landscapes, and a welcoming west Little Rock community.',
  ][i % 4],
  hero_path: `/seed/${['house-3', 'interior', 'city', 'hero', 'garden', 'house-2', 'house-1', 'garden', 'kitchen'][i]}.jpg`,
  sort_order: i,
  lat: coords[i][0],
  lng: coords[i][1],
  boundary: null,
}));
store.agents = ['Kerry Ellison', 'James Kirk', 'Angela Stowell', 'Ericka Bertes'].map(
  (full_name, i) => ({
    ...base(10 + i),
    full_name,
    slug: full_name.toLowerCase().replaceAll(' ', '-'),
    title: [
      'Principal Broker | Real Estate Agent',
      'REALTOR®',
      'Executive Broker | Agent',
      'Transaction Coordinator',
    ][i],
    bio: content.agent_bio,
    photo_path: ['/team/kerry.avif', '/team/james.avif', '/team/angela.avif', '/team/ericka.webp'][
      i
    ],
    email: 'hello@theellisongroup.com',
    phone: '(501) 725-1227',
    license_no: i === 0 ? 'SA00046814' : '[PLACEHOLDER]',
    socials: { Instagram: 'https://www.instagram.com/theellisongroup/' },
    sort_order: i,
    is_active: true,
  }),
);
const streets = [
  'Winding Oaks Lane',
  'Cedar Grove Court',
  'Riverstone Drive',
  'Magnolia Ridge',
  'Willow Bend Lane',
  'Summit View Court',
  'Oak Hollow Drive',
  'Garden Walk',
  'Pinecrest Terrace',
  'River Bluff Lane',
];
store.listings = Array.from({ length: 40 }, (_, i) => {
  const n = store.neighborhoods[i % 9],
    land = i >= 36,
    sold = i >= 27 && i < 36;
  const price = land
    ? 45000 + (i - 36) * 18000
    : Math.round((1395000 - i * 28500 + (i % 4) * 17500) / 100) * 100;
  const address = `${110 + i * 7} ${streets[i % 10]}`;
  const city = n.slug === 'maumelle' ? 'Maumelle' : 'Little Rock';
  const zip =
    city === 'Maumelle' ? '72113' : i % 3 === 0 ? '72223' : i % 3 === 1 ? '72207' : '72205';
  const mls = `DEMO${String(260100 + i)}`;
  const lid = id(1000 + i);
  return {
    ...base(1000 + i),
    mls_id: mls,
    slug: `${address.toLowerCase().replaceAll(' ', '-')}-${city.toLowerCase().replaceAll(' ', '-')}-ar-${zip}-${mls.toLowerCase()}`,
    status: sold ? 'sold' : i === 2 || i === 7 || i === 15 ? 'pending' : 'for_sale',
    list_price: price,
    sold_price: sold ? Math.round(price * 0.97) : null,
    sold_date: sold ? '2026-09-15' : null,
    property_type: land
      ? 'Land'
      : i % 9 === 6
        ? 'Townhouse'
        : i % 9 === 2
          ? 'Condo'
          : 'Residential',
    beds: land ? 0 : 3 + (i % 3),
    baths_full: land ? 0 : 2 + (i % 3),
    baths_half: land ? 0 : i % 2,
    living_sqft: land ? 0 : 2100 + (i % 8) * 490,
    lot_acres: land ? 1.2 + (i - 36) * 0.8 : 0.2 + (i % 7) * 0.11,
    year_built: 1985 + (i % 38),
    stories: land ? 0 : 1 + (i % 2),
    address_line: address,
    city,
    state: 'AR',
    zip,
    neighborhood_id: n.id,
    lat: n.lat + (i % 4) * 0.004 - 0.006,
    lng: n.lng + (i % 5) * 0.004 - 0.006,
    description:
      '[PLACEHOLDER] An inviting demonstration home with generous gathering spaces, natural light, and room to make your own. This fictional listing exists to explore the prototype and is not offered for sale.',
    listing_agent_id: store.agents[i % 3].id,
    courtesy_of: 'The Ellison Group · demonstration listing',
    is_featured: i < 8 || land,
    featured_rank: i,
    hidden: false,
    raw: {
      demo: true,
      pool: i % 4 === 0,
      garage: (i % 3) + 1,
      hoa: 75,
      property_tax: Math.round(price * 0.009),
      architecture: 'Traditional',
    },
    synced_at: now,
    listing_photos: ['hero', 'house-1', 'interior', 'kitchen', 'house-2', 'garden'].map(
      (photo, j) => ({
        id: id(5000 + i * 10 + j),
        listing_id: lid,
        url: `/seed/${j === 0 ? ['hero', 'house-1', 'house-2', 'house-3'][i % 4] : photo}.jpg`,
        caption: `Sample photography · ${['Home exterior', 'Exterior detail', 'Living room', 'Kitchen', 'Outdoor living', 'Landscaping'][j]}`,
        sort_order: j,
        width: 1400,
        height: 900,
        blurhash: '',
      }),
    ),
    listing_features: [
      ['interior', 'Bedrooms', land ? '—' : String(3 + (i % 3))],
      ['interior', 'Flooring', 'Hardwood, tile'],
      ['interior', 'Appliances', 'Range, dishwasher'],
      ['interior', 'Fireplace', 'Living room'],
      ['area_lot', 'MLS® ID', mls],
      ['area_lot', 'Type', land ? 'Land' : 'Residential'],
      ['area_lot', 'Year built', String(1985 + (i % 38))],
      ['area_lot', 'Neighborhood', n.name],
      ['area_lot', 'Elementary school', '[PLACEHOLDER] Verify district'],
      ['exterior', 'Roof', 'Architectural shingle'],
      ['exterior', 'Parking', 'Attached garage'],
      ['exterior', 'Utilities', 'Public water, electricity'],
      ['financial', 'Real estate tax / yr', String(Math.round(price * 0.009))],
    ].map(([group, label, value], j) => ({
      id: id(9000 + i * 20 + j),
      listing_id: lid,
      group,
      label,
      value,
    })),
  };
});
store.testimonials = Array.from({ length: 6 }, (_, i) => ({
  ...base(300 + i),
  reviewer_name: `Sample client ${String.fromCharCode(65 + i)}.`,
  body: content.testimonial,
  rating: null,
  agent_id: store.agents[i % 3].id,
  source: 'placeholder',
  is_featured: true,
  sort_order: i,
}));
store.blog_posts = [
  'Farmers Market Season Comes to a Close',
  'Halloween at the Little Rock Zoo',
  'A New Trail Opens at Pinnacle Mountain',
].map((title, i) => ({
  ...base(400 + i),
  title,
  slug: [
    'farmers-market-season-close',
    'halloween-at-the-little-rock-zoo',
    'pinnacle-trail-opening',
  ][i],
  excerpt: [
    'One more reason to shop local. A look ahead at Little Rock’s changing seasons.',
    'A little fall magic for the whole family, right here in Little Rock.',
    'Fresh air, familiar views, and another way to explore the Natural State.',
  ][i],
  body_md: content.blog_body,
  cover_path: `/seed/${['kitchen', 'garden', 'garden'][i]}.jpg`,
  category: ['Local Living', 'Events', 'Outdoors'][i],
  author_id: store.agents[0].id,
  status: 'draft',
  published_at: null,
  seo: { demo: true },
}));
store.site_settings = [
  [
    'stats',
    [
      { value: 33, suffix: '+', label: 'Years of Real Estate Experience' },
      { value: 1131, suffix: '+', label: 'Closed Transactions' },
      { value: 450, prefix: '$', suffix: 'K+', label: 'Average Price' },
    ],
  ],
  [
    'contact',
    {
      phone: '(501) 725-1227',
      email: 'hello@theellisongroup.com',
      address: '12814 Cantrell Rd, Little Rock AR 72223',
      hours: 'Monday–Friday, 9 AM–5 PM · appointments available',
    },
  ],
  [
    'socials',
    {
      Instagram: 'https://www.instagram.com/theellisongroup/',
      Facebook: 'https://www.facebook.com/search/top?q=The%20Ellison%20Group%20Little%20Rock',
      LinkedIn: 'https://www.linkedin.com/search/results/companies/?keywords=The%20Ellison%20Group',
      YouTube: 'https://www.youtube.com/results?search_query=The+Ellison+Group+Little+Rock',
      'Google reviews':
        'https://www.google.com/maps/search/?api=1&query=The+Ellison+Group+12814+Cantrell+Rd+Little+Rock',
      Zillow: 'https://www.zillow.com/professionals/real-estate-agent-reviews/little-rock-ar/',
    },
  ],
  [
    'seo',
    {
      title: 'The Ellison Group | Little Rock Real Estate Experts',
      description:
        'Thoughtful guidance. Deep local roots. Find your next home in Little Rock with The Ellison Group.',
    },
  ],
  ['idx_last_synced_at', now],
].map(([key, value], i) => ({ ...base(600 + i), key, value }));
store.social_posts = ['house-3', 'interior', 'garden', 'house-2', 'kitchen', 'hero'].map(
  (photo, i) => ({
    ...base(650 + i),
    image_path: `/seed/${photo}.jpg`,
    permalink: 'https://www.instagram.com/theellisongroup/',
    alt: `Sample local-living inspiration: ${photo.replaceAll('-', ' ')}`,
    sort_order: i,
  }),
);
store.neighborhood_stats = store.neighborhoods.map((n, i) => ({
  ...base(700 + i),
  neighborhood_id: n.id,
  source: 'demo',
  payload: {
    demo: true,
    population: 3200 + i * 530,
    median_age: 36 + i,
    density: 1400 + i * 210,
    income: 58000 + i * 3500,
    walk_score: 45 + i * 4,
    transit_score: 20 + i * 3,
    households: 1200 + i * 100,
    household_size: 2.4,
    children: 28,
    gender: [49, 51],
    age_groups: [12, 18, 25, 24, 21],
    education: [15, 25, 35, 25],
    employment: [74, 26],
    commute: [15, 35, 30, 20],
  },
  fetched_at: now,
}));
store.neighborhood_pois = store.neighborhoods.flatMap((n, i) =>
  ['Restaurants', 'Shopping', 'Active', 'Beauty', 'Nightlife'].map((category, j) => ({
    ...base(800 + i * 10 + j),
    neighborhood_id: n.id,
    name: `[PLACEHOLDER] ${['Neighborhood café', 'Local market', 'Community trail', 'Neighborhood studio', 'Evening gathering spot'][j]}`,
    category,
    address: `${n.name}, Arkansas`,
    lat: n.lat,
    lng: n.lng,
    distance_mi: 0.2 + j * 0.3,
    review_count: 0,
    rating: null,
    yelp_url: `https://www.yelp.com/search?find_desc=${category}&find_loc=Little+Rock+AR`,
    fetched_at: now,
  })),
);
store.schools = store.neighborhoods.flatMap((n, i) =>
  ['Primary', 'Middle', 'High', 'Mixed'].map((level, j) => ({
    ...base(20000 + i * 10 + j),
    neighborhood_id: n.id,
    name: `[PLACEHOLDER] ${n.name} ${level} school`,
    level,
    category: 'Verify district',
    grades: ['K–5', '6–8', '9–12', 'K–12'][j],
    rating: null,
  })),
);
store.redirects = [
  ['/agents/james-krik', '/agent/james-kirk'],
  ['/agent/james-krik', '/agent/james-kirk'],
  ['/neighborhoods/hilcrest', '/neighborhoods/hillcrest'],
].map(([from_path, to_path], i) => ({ ...base(21000 + i), from_path, to_path, status_code: 301 }));
for (const name of [
  'leads',
  'consents',
  'showing_requests',
  'valuation_requests',
  'profiles',
  'saved_homes',
  'saved_searches',
  'newsletter_subscribers',
  'audit_log',
  'dev_outbox',
])
  store[name] = [];
mkdirSync('supabase/seed', { recursive: true });
writeFileSync('supabase/seed/data.json', JSON.stringify(store, null, 2));
if (process.argv.includes('--reset-mock')) {
  mkdirSync('.local', { recursive: true });
  writeFileSync('.local/data.json', JSON.stringify(store));
}
const quote = (v) =>
  v === null
    ? 'null'
    : typeof v === 'boolean'
      ? String(v)
      : typeof v === 'number'
        ? String(v)
        : `'${(typeof v === 'object' ? JSON.stringify(v) : String(v)).replaceAll("'", "''")}'`;
let sql = '-- Generated by pnpm seed. Fictional prototype data. Never a licensed MLS feed.\n';
for (const [table, rows] of Object.entries(store)) {
  for (const original of rows) {
    const row = { ...original };
    delete row.listing_photos;
    delete row.listing_features;
    if (table === 'site_settings') row.value = JSON.stringify(row.value);
    if (table === 'listings') row.geom = `SRID=4326;POINT(${row.lng} ${row.lat})`;
    const keys = Object.keys(row);
    sql += `insert into public.${table} (${keys.map((k) => `"${k}"`).join(',')}) values (${keys.map((k) => quote(row[k])).join(',')}) on conflict (id) do nothing;\n`;
    if (table === 'listings') {
      for (const [sub, records] of [
        ['listing_photos', original.listing_photos],
        ['listing_features', original.listing_features],
      ])
        for (const rec of records) {
          const ks = Object.keys(rec);
          sql += `insert into public.${sub} (${ks.map((k) => `"${k}"`).join(',')}) values (${ks.map((k) => quote(rec[k])).join(',')}) on conflict(id) do nothing;\n`;
        }
    }
  }
}
writeFileSync('supabase/seed.sql', sql);
console.log(
  `Seeded ${store.listings.length} fictional listings, ${store.neighborhoods.length} neighborhoods, ${store.agents.length} agents. SQL and mock JSON are in sync.`,
);

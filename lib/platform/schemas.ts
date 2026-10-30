import { z } from 'zod';
import { defaultCapture, defaultAssistant } from './defaults';
import { isPhone } from '@/lib/contact-details';
const id = z.string().uuid(),
  nullableId = id.nullable(),
  text = z.string().trim().max(5000),
  date = z.string().datetime({ offset: true }),
  image = z
    .string()
    .max(2000)
    .refine(
      (s) => s.startsWith('/seed/') || s.startsWith('/api/media/') || /^https:\/\//.test(s),
      'Use a local image or secure Storage URL.',
    );
export const listingInput = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: text,
    mls_id: z.string().trim().min(1).max(80),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(220),
    status: z.enum(['for_sale', 'pending', 'sold']),
    publication_status: z.enum(['draft', 'published', 'archived']),
    listing_kind: z.enum(['sale', 'rent']),
    list_price: z.coerce.number().min(0).max(1e12),
    sold_price: z.coerce.number().min(0).nullable().default(null),
    sold_date: z.string().date().nullable().default(null),
    property_type: z.enum([
      'Residential',
      'Townhouse',
      'Condo',
      'Commercial',
      'Multi-Family',
      'Land',
      'Co-Op',
      'Manufactured',
      'Other',
    ]),
    beds: z.coerce.number().int().min(0).max(100),
    baths_full: z.coerce.number().int().min(0).max(100),
    baths_half: z.coerce.number().int().min(0).max(100),
    living_sqft: z.coerce.number().min(0).max(1e8),
    lot_acres: z.coerce.number().min(0).max(1e7),
    year_built: z.coerce
      .number()
      .int()
      .min(1600)
      .max(new Date().getUTCFullYear() + 5),
    stories: z.coerce.number().int().min(0).max(200),
    address_line: z.string().trim().min(3).max(200),
    city: z.string().trim().min(1).max(100),
    state: z.string().length(2),
    zip: z.string().regex(/^\d{5}(?:-\d{4})?$/),
    neighborhood_id: id,
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    listing_agent_id: id,
    courtesy_of: z.string().max(300),
    is_featured: z.boolean(),
    featured_rank: z.coerce.number().int().min(0),
    lead_capture_required: z.boolean(),
    raw: z.record(z.string(), z.json()).default({}),
    listing_photos: z
      .array(
        z.object({
          url: image,
          caption: z.string().trim().min(1).max(300),
          width: z.number().int().positive().default(1400),
          height: z.number().int().positive().default(900),
        }),
      )
      .min(1)
      .max(60),
    listing_features: z
      .array(
        z.object({
          group: z.enum(['interior', 'area_lot', 'exterior', 'financial']),
          label: z.string().trim().min(1).max(100),
          value: z.string().max(1000),
        }),
      )
      .max(150),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'sold' && (!data.sold_price || !data.sold_date))
      ctx.addIssue({
        code: 'custom',
        path: ['sold_price'],
        message: 'Sold listings require a sold price and date.',
      });
    if (data.publication_status === 'published' && data.list_price <= 0)
      ctx.addIssue({
        code: 'custom',
        path: ['list_price'],
        message: 'Published listings require a positive price.',
      });
  });
export const leadEdit = z.object({
  stage_id: id,
  assigned_to: nullableId,
  priority: z.enum(['low', 'normal', 'high']),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  follow_up_at: date.nullable(),
  first_name: z.string().trim().max(100),
  last_name: z.string().max(100),
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .max(40)
    .refine(
      (v) => !v || isPhone(v),
      'Enter a valid phone number, with country code for international numbers.',
    ),
});
export const taskInput = z.object({
  title: z.string().trim().min(1).max(200),
  lead_id: nullableId,
  listing_id: nullableId,
  assigned_to: nullableId,
  due_at: date.nullable(),
  status: z.enum(['open', 'completed']),
  notes: text,
});
export const appointmentInput = z
  .object({
    lead_id: id,
    listing_id: nullableId,
    starts_at: date,
    ends_at: date,
    meeting_type: z.enum(['in_person', 'video']),
    kind: z.enum(['tour', 'buyer_consultation', 'seller_consultation']),
    assigned_to: nullableId,
    status: z.enum(['requested', 'confirmed', 'completed', 'cancelled']),
    notes: text,
  })
  .superRefine((v, ctx) => {
    const duration = Date.parse(v.ends_at) - Date.parse(v.starts_at);
    if (duration <= 0 || duration > 8 * 3600000)
      ctx.addIssue({
        code: 'custom',
        path: ['ends_at'],
        message: 'Appointments must end after they begin and last at most eight hours.',
      });
    if (v.kind === 'tour' && !v.listing_id)
      ctx.addIssue({
        code: 'custom',
        path: ['listing_id'],
        message: 'A property tour requires a property.',
      });
  });
export const stageInput = z.object({
  name: z.string().trim().min(1).max(80),
  sort_order: z.number().int().min(0),
  outcome: z.enum(['open', 'won', 'lost']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export const ruleInput = z.object({
  name: z.string().trim().min(1).max(150),
  event: z.enum([
    'lead_created',
    'inquiry_submitted',
    'lead_assigned',
    'appointment_scheduled',
    'follow_up_due',
    'lead_uncontacted',
  ]),
  enabled: z.boolean(),
  action: z.enum(['create_task', 'internal_notification']),
  delay_hours: z.coerce.number().min(0).max(8760),
  task_title: z.string().trim().min(1).max(200),
  assigned_to: nullableId,
});
export const templateInput = z.object({
  name: z.string().min(1).max(100),
  channel: z.enum(['email', 'sms', 'internal']),
  subject: z.string().max(200),
  body: z.string().min(1).max(5000),
});
export const campaignInput = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(['draft', 'active', 'archived']),
  utm_source: z.string().min(1).max(100),
  utm_medium: z.string().min(1).max(100),
  utm_campaign: z.string().min(1).max(100),
  description: text,
  listing_id: nullableId,
});
export const captureInput = z
  .object({
    enabled: z.boolean(),
    property_ids: z.array(id).max(1000),
    detail_mode: z.enum(['immediate', 'action']),
    allow_basic_browsing: z.boolean(),
    actions: z.array(z.enum(['save', 'showing', 'contact'])),
    required_fields: z
      .array(z.enum(['full_name', 'email', 'phone']))
      .refine((a) => a.includes('email'), 'Email is required for a consistent lead identity.'),
    google_enabled: z.boolean(),
  })
  .default(defaultCapture);
export const assistantInput = z
  .object({
    enabled: z.boolean(),
    instructions: z.string().max(3000),
    approved_faq: z.string().max(6000),
  })
  .default(defaultAssistant);
export const commandSchema = z.object({
  action: z.string().min(1).max(60),
  id: id.optional(),
  request_id: id.optional(),
  values: z.unknown().optional(),
  ids: z.array(id).min(1).max(100).optional(),
});

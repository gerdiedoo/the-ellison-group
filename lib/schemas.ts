import { isPhone } from '@/lib/contact-details';
import { z } from 'zod';
export const leadSchema = z
  .object({
    source: z.enum(['contact', 'valuation', 'showing', 'newsletter', 'agent', 'progressive']),
    first_name: z.string().trim().max(100).default(''),
    middle_name: z.string().trim().max(100).default(''),
    last_name: z.string().trim().max(100).default(''),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    phone: z.string().trim().max(40).default(''),
    interest: z.enum(['Selling & Buying', 'Selling', 'Buying', 'Renting', 'Other', '']).default(''),
    message: z.string().trim().max(5000).default(''),
    email_phone: z.boolean().default(false),
    sms: z.boolean().default(false),
    newsletter: z.boolean().default(false),
    listing_id: z.string().uuid().nullable().default(null),
    agent_id: z.string().uuid().nullable().default(null),
    trigger_source: z.string().max(1000).default(''),
    website: z.string().max(0).default(''),
    turnstile_token: z.string().max(4096).default(''),
    address: z.string().trim().max(300).default(''),
    starts_at: z.string().default(''),
    meeting_type: z.enum(['in_person', 'video']).default('in_person'),
    sqft: z.coerce.number().min(0).max(100000).default(2400),
    beds: z.coerce.number().min(0).max(20).default(3),
    baths: z.coerce.number().min(0).max(20).default(2),
    property_type: z.string().max(80).default('Residential'),
    gate_action: z.enum(['detail', 'save', 'showing', 'contact']).optional(),
    conversation_id: z.string().uuid().optional(),
    utm: z
      .record(z.string(), z.string().max(500))
      .default({})
      .transform((values) =>
        Object.fromEntries(
          Object.entries(values).filter(([key]) =>
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].includes(key),
          ),
        ),
      ),
  })
  .superRefine((v, ctx) => {
    if (v.source !== 'newsletter' && !v.gate_action && !v.first_name)
      ctx.addIssue({ code: 'custom', path: ['first_name'], message: 'Please enter your name.' });
    if (v.source === 'newsletter' && !v.newsletter)
      ctx.addIssue({
        code: 'custom',
        path: ['newsletter'],
        message: 'Please opt in to receive the newsletter.',
      });
    if (v.source === 'valuation' && !v.address)
      ctx.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Please enter the property address.',
      });
    if (v.source === 'showing' && (!v.listing_id || !v.starts_at))
      ctx.addIssue({
        code: 'custom',
        path: ['starts_at'],
        message: 'Choose a property, date, and time.',
      });
    if ((v.sms || v.phone) && !isPhone(v.phone))
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Please enter a valid phone number.',
      });
  });
export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;

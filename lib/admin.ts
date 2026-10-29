import { z } from 'zod';
const slug=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),text=z.string().max(10000),image=z.string().max(2048).refine(s=>s.startsWith('/seed/')||s.startsWith('/api/media/')||s.startsWith('https://'),'Use a local asset or a secure storage URL.');
const socials=z.record(z.string(),z.string().url().refine(v=>v.startsWith('https://'),'Social links must use HTTPS.'));
const auditFields={sort_order:z.coerce.number().int().min(0).default(0)};
export const adminSchemas={
 leads:z.object({status:z.enum(['new','contacted','closed']),assigned_to:z.string().uuid().nullable(),notes:text}),
 listings:z.object({is_featured:z.boolean(),featured_rank:z.coerce.number().int().min(0),hidden:z.boolean(),list_price:z.coerce.number().min(0)}),
 agents:z.object({slug,full_name:z.string().min(1).max(150),title:z.string().min(1).max(200),bio:text,photo_path:image,email:z.string().email(),phone:z.string().max(40),license_no:z.string().max(80),socials, ...auditFields,is_active:z.boolean()}),
 testimonials:z.object({reviewer_name:z.string().min(1).max(100),body:z.string().min(1).max(10000),rating:z.number().min(1).max(5).nullable(),agent_id:z.string().uuid().nullable(),source:z.string().max(100),is_featured:z.boolean(),...auditFields}),
 blog_posts:z.object({slug,title:z.string().min(1).max(250),excerpt:z.string().max(1000),body_md:text,cover_path:image,category:z.string().max(100),author_id:z.string().uuid().nullable(),status:z.enum(['draft','published']),published_at:z.string().datetime().nullable(),seo:z.record(z.string(),z.json())}),
 neighborhoods:z.object({slug,name:z.string().min(1).max(150),blurb:text,hero_path:image,boundary:z.json().nullable(),lat:z.coerce.number().min(-90).max(90),lng:z.coerce.number().min(-180).max(180),...auditFields}),
 social_posts:z.object({image_path:image,permalink:z.string().url().refine(s=>s.startsWith('https://')),alt:z.string().min(1).max(300),...auditFields}),
 site_settings:z.object({key:z.enum(['stats','contact','socials','seo','idx_last_synced_at']),value:z.json()}),
 redirects:z.object({from_path:z.string().regex(/^\/(?!\/)/).max(500),to_path:z.string().regex(/^\/(?!\/)/).max(500),status_code:z.union([z.literal(301),z.literal(302),z.literal(307),z.literal(308)])}),
};
export type AdminTable=keyof typeof adminSchemas;
export const adminNames:Record<AdminTable,string>={leads:'Leads inbox',listings:'Listings',agents:'Agents',testimonials:'Testimonials',blog_posts:'Blog',neighborhoods:'Neighborhoods',social_posts:'Social posts',site_settings:'Site settings',redirects:'Redirects'};
export const adminReadTables=[...Object.keys(adminSchemas),'audit_log','dev_outbox'];
export const isAdminTable=(value:string):value is AdminTable=>value in adminSchemas;
export type Field={key:string;label:string;type:'text'|'textarea'|'number'|'boolean'|'json'|'select';options?:string[];nullable?:boolean};
const field=(key:string,label:string,type:Field['type']='text',options?:string[],nullable?:boolean):Field=>({key,label,type,options,nullable});
export const adminFields:Record<AdminTable,Field[]>={
 leads:[field('status','Status','select',['new','contacted','closed']),field('assigned_to','Assigned team profile ID','text',undefined,true),field('notes','Notes','textarea')],
 listings:[field('is_featured','Featured','boolean'),field('featured_rank','Featured rank','number'),field('hidden','Hide listing','boolean'),field('list_price','Listing price','number')],
 agents:[field('full_name','Full name'),field('slug','URL slug'),field('title','Title'),field('bio','Biography','textarea'),field('photo_path','Portrait image URL'),field('email','Email'),field('phone','Phone'),field('license_no','License #'),field('socials','Social URLs (JSON)','json'),field('sort_order','Sort order','number'),field('is_active','Active','boolean')],
 testimonials:[field('reviewer_name','Reviewer name'),field('body','Full review','textarea'),field('rating','Rating 1–5','number',undefined,true),field('agent_id','Agent ID','text',undefined,true),field('source','Source / permission reference'),field('is_featured','Featured','boolean'),field('sort_order','Sort order','number')],
 blog_posts:[field('title','Title'),field('slug','URL slug'),field('excerpt','Excerpt','textarea'),field('body_md','Markdown body','textarea'),field('cover_path','Cover image URL'),field('category','Category'),field('author_id','Author agent ID','text',undefined,true),field('status','Status','select',['draft','published']),field('published_at','Published at (ISO timestamp)','text',undefined,true),field('seo','SEO (JSON)','json')],
 neighborhoods:[field('name','Name'),field('slug','URL slug'),field('blurb','Overview','textarea'),field('hero_path','Hero image URL'),field('boundary','Boundary GeoJSON MultiPolygon','json',undefined,true),field('lat','Latitude','number'),field('lng','Longitude','number'),field('sort_order','Sort order','number')],
 social_posts:[field('image_path','Image URL'),field('permalink','Instagram permalink'),field('alt','Image alt text'),field('sort_order','Sort order','number')],
 site_settings:[field('key','Setting key','select',['stats','contact','socials','seo','idx_last_synced_at']),field('value','Value (JSON)','json')],
 redirects:[field('from_path','From path'),field('to_path','To path'),field('status_code','HTTP status','number')],
};

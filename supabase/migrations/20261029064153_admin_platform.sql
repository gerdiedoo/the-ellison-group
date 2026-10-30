-- Extend the existing real estate model; no parallel property/contact database.
alter table public.profiles add column agent_id uuid references public.agents;
alter table public.listings add column publication_status text not null default 'published' check(publication_status in ('draft','published','archived')),
 add column listing_kind text not null default 'sale' check(listing_kind in ('sale','rent')),
 add column title text not null default '', add column mls_id_locked boolean not null default true,
 add column lead_capture_required boolean not null default false;
update public.listings set title=address_line,publication_status=case when hidden then 'archived' else 'published' end;
create table public.pipeline_stages(id uuid primary key default gen_random_uuid(),name text not null,sort_order int not null,outcome text not null check(outcome in ('open','won','lost')),color text not null);
insert into public.pipeline_stages(id,name,sort_order,outcome,color) values
 ('10000000-0000-4000-8000-000000000001','New',0,'open','#8b1e2d'),('10000000-0000-4000-8000-000000000002','Contacted',1,'open','#977247'),('10000000-0000-4000-8000-000000000003','Qualified',2,'open','#53694c'),('10000000-0000-4000-8000-000000000004','Appointment Scheduled',3,'open','#426773'),('10000000-0000-4000-8000-000000000005','Active Opportunity',4,'open','#776786'),('10000000-0000-4000-8000-000000000006','Converted',5,'won','#2f6b4f'),('10000000-0000-4000-8000-000000000007','Lost',6,'lost','#68675f');
alter table public.leads add column stage_id uuid not null default '10000000-0000-4000-8000-000000000001' references public.pipeline_stages,
 add column priority text not null default 'normal' check(priority in ('low','normal','high')),
 add column tags text[] not null default '{}',add column follow_up_at timestamptz,add column last_interaction_at timestamptz;
update public.leads set stage_id=case when status='contacted' then '10000000-0000-4000-8000-000000000002'::uuid when status='closed' then '10000000-0000-4000-8000-000000000006'::uuid else stage_id end,last_interaction_at=updated_at;
alter table public.showing_requests add column kind text not null default 'tour' check(kind in ('tour','buyer_consultation','seller_consultation')),
 add column assigned_to uuid references public.profiles,add column notes text not null default '',add column ends_at timestamptz;
update public.showing_requests set ends_at=starts_at+interval '30 minutes';
alter table public.showing_requests alter column ends_at set not null,alter column listing_id drop not null;
alter table public.showing_requests add constraint appointment_duration check(ends_at>starts_at and ends_at<=starts_at+interval '8 hours');
create table public.lead_identities(id uuid primary key default gen_random_uuid(),normalized_email text unique not null,lead_id uuid not null references public.leads);
insert into public.lead_identities(normalized_email,lead_id) select distinct on(lower(trim(email))) lower(trim(email)),id from public.leads order by lower(trim(email)),created_at,id;
create table public.lead_properties(id uuid primary key default gen_random_uuid(),lead_id uuid not null references public.leads,listing_id uuid not null references public.listings,source_page text not null default '',unique(lead_id,listing_id));
insert into public.lead_properties(lead_id,listing_id) select id,listing_id from public.leads where listing_id is not null on conflict do nothing;
create table public.conversations(id uuid primary key default gen_random_uuid(),session_hash text not null,lead_id uuid references public.leads,listing_id uuid references public.listings,assigned_to uuid references public.profiles,mode text not null default 'ai' check(mode in ('ai','human')),status text not null default 'open' check(status in ('open','waiting','resolved')),summary text not null default '',recommendation text not null default '',ai_status text not null default 'unconfigured' check(ai_status in ('unconfigured','ready','failed')),last_message_at timestamptz not null default now());
create table public.conversation_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.conversations,role text not null check(role in ('visitor','assistant','agent','system')),body text not null,is_internal boolean not null default false,actor_id uuid references public.profiles,request_id uuid unique,provider text);
create table public.activities(id uuid primary key default gen_random_uuid(),lead_id uuid references public.leads,listing_id uuid references public.listings,conversation_id uuid references public.conversations,actor_id uuid references public.profiles,kind text not null,body text not null,payload jsonb not null default '{}',is_internal boolean not null default true);
create table public.tasks(id uuid primary key default gen_random_uuid(),title text not null,lead_id uuid references public.leads,listing_id uuid references public.listings,assigned_to uuid references public.profiles,due_at timestamptz,status text not null default 'open' check(status in ('open','completed')),notes text not null default '',completed_at timestamptz,automation_key text unique);
create table public.automation_rules(id uuid primary key default gen_random_uuid(),name text not null,event text not null check(event in ('lead_created','inquiry_submitted','lead_assigned','appointment_scheduled','follow_up_due','lead_uncontacted')),enabled boolean not null default false,action text not null check(action in ('create_task','internal_notification')),delay_hours numeric not null default 0 check(delay_hours>=0),task_title text not null,assigned_to uuid references public.profiles);
create table public.automation_runs(id uuid primary key default gen_random_uuid(),rule_id uuid not null references public.automation_rules,event_key text not null,status text not null check(status in ('completed','failed')),result text not null,unique(rule_id,event_key));
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles,title text not null,body text not null,lead_id uuid references public.leads,read_at timestamptz);
create table public.message_templates(id uuid primary key default gen_random_uuid(),name text not null,channel text not null check(channel in ('email','sms','internal')),subject text not null default '',body text not null);
create table public.campaigns(id uuid primary key default gen_random_uuid(),name text not null,slug text unique not null,status text not null check(status in ('draft','active','archived')),utm_source text not null,utm_medium text not null,utm_campaign text not null,description text not null default '',listing_id uuid references public.listings);
do $$declare t text;begin foreach t in array array['pipeline_stages','lead_identities','lead_properties','conversations','conversation_messages','activities','tasks','automation_rules','automation_runs','notifications','message_templates','campaigns'] loop
 execute format('alter table public.%I add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now()',t);
 execute format('alter table public.%I enable row level security',t);
 execute format('create trigger touch_updated before update on public.%I for each row execute function private.touch_updated_at()',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
end loop;end$$;
create index lead_properties_listing_idx on public.lead_properties(listing_id);
create index leads_assignment_stage_idx on public.leads(assigned_to,stage_id);
create index leads_follow_up_idx on public.leads(follow_up_at) where follow_up_at is not null;
create index conversations_session_idx on public.conversations(session_hash);
create index conversations_assignment_idx on public.conversations(assigned_to,status);
create index messages_conversation_idx on public.conversation_messages(conversation_id,created_at);
create index activities_lead_idx on public.activities(lead_id,created_at);
create index tasks_assignment_due_idx on public.tasks(assigned_to,status,due_at);
create index appointments_assignment_idx on public.showing_requests(assigned_to,starts_at);
create index notifications_user_idx on public.notifications(user_id,read_at);
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin')$$;
create function private.owns_lead(lead uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.leads where id=lead and assigned_to=(select auth.uid()))$$;
create function private.owns_conversation(conversation uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.conversations where id=conversation and assigned_to=(select auth.uid()))$$;
revoke all on function private.is_admin(),private.owns_lead(uuid),private.owns_conversation(uuid) from public;
grant execute on function private.is_admin(),private.owns_lead(uuid),private.owns_conversation(uuid) to authenticated;
do $$declare t text;begin foreach t in array array['site_settings','agents','neighborhoods','listings','listing_photos','listing_features','neighborhood_stats','neighborhood_pois','schools','testimonials','blog_posts','social_posts','leads','showing_requests','valuation_requests','newsletter_subscribers','redirects','dev_outbox'] loop
 execute format('drop policy staff_access on public.%I',t);
 execute format('create policy admin_access on public.%I for all to authenticated using((select private.is_admin())) with check((select private.is_admin()))',t);
end loop;end$$;
drop policy public_listings on public.listings;
create policy public_listings on public.listings for select to anon,authenticated using(not hidden and publication_status='published');
create policy agent_listings on public.listings for all to authenticated using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='agent' and p.agent_id=listing_agent_id)) with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='agent' and p.agent_id=listing_agent_id));
create policy assigned_leads on public.leads for select to authenticated using(assigned_to=(select auth.uid()));
create policy assigned_appointments on public.showing_requests for select to authenticated using(assigned_to=(select auth.uid()));
do $$declare t text;begin foreach t in array array['pipeline_stages','lead_identities','lead_properties','conversations','conversation_messages','activities','tasks','automation_rules','automation_runs','notifications','message_templates','campaigns'] loop
 execute format('create policy admin_access on public.%I for all to authenticated using((select private.is_admin())) with check((select private.is_admin()))',t);
 execute format('grant select on public.%I to authenticated',t);
end loop;end$$;
create policy staff_stages on public.pipeline_stages for select to authenticated using((select private.is_staff()));
create policy own_lead_properties on public.lead_properties for select to authenticated using(private.owns_lead(lead_id));
create policy own_conversations on public.conversations for select to authenticated using(assigned_to=(select auth.uid()));
create policy own_messages on public.conversation_messages for select to authenticated using(private.owns_conversation(conversation_id));
create policy own_activities on public.activities for select to authenticated using(private.owns_lead(lead_id) or actor_id=(select auth.uid()));
create policy own_tasks on public.tasks for select to authenticated using(assigned_to=(select auth.uid()));
create policy own_notifications on public.notifications for select to authenticated using(user_id=(select auth.uid()));
drop policy staff_audit_read on public.audit_log;
create policy scoped_audit_read on public.audit_log for select to authenticated using((select private.is_admin()) or actor_id=(select auth.uid()));
drop policy staff_consents_read on public.consents;
create policy scoped_consents_read on public.consents for select to authenticated using((select private.is_admin()) or private.owns_lead(lead_id));

-- Server routes validate schemas and assignments before calling this service-only transaction.
create function public.platform_apply(operations jsonb,lock_key text default null) returns void language plpgsql security invoker set search_path='' as $$declare op jsonb;t text;columns text;row jsonb;begin
 if lock_key is not null then perform pg_advisory_xact_lock(hashtextextended(lock_key,0));end if;
 for op in select * from jsonb_array_elements(operations) loop
 t=op->>'table';
 if not(t=any(array['profiles','listings','listing_photos','listing_features','leads','lead_identities','lead_properties','activities','consents','showing_requests','valuation_requests','newsletter_subscribers','saved_homes','saved_searches','conversations','conversation_messages','tasks','automation_rules','automation_runs','notifications','message_templates','campaigns','pipeline_stages','site_settings','audit_log','dev_outbox'])) then raise exception 'Unsupported collection';end if;
 if op->>'action'='delete' then
  if t in ('consents','audit_log','activities','lead_identities') then raise exception 'Immutable collection';end if;
  execute format('delete from public.%I where id=$1',t) using (op->>'id')::uuid;
 else
  row=op->'record';
  if t in ('consents','audit_log','activities','automation_runs','conversation_messages','lead_identities') then execute format('insert into public.%I select (jsonb_populate_record(null::public.%I,$1)).* on conflict do nothing',t,t) using row;
  else
   select string_agg(format('%I=excluded.%I',a.attname,a.attname),',') into columns from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=t and a.attnum>0 and not a.attisdropped and a.attname not in ('id','created_at');
   execute format('insert into public.%I select (jsonb_populate_record(null::public.%I,$1)).* on conflict(id) do update set %s',t,t,columns) using row;
  end if;
 end if;end loop;end$$;
revoke all on function public.platform_apply(jsonb,text) from public,anon,authenticated;
grant execute on function public.platform_apply(jsonb,text) to service_role;

-- Canonical identity serializes concurrent inquiries without rewriting old consent records.
create or replace function public.submit_lead_bundle(payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$declare lead public.leads;item jsonb;canonical uuid;existing public.leads;begin
 perform pg_advisory_xact_lock(hashtextextended(lower(trim(payload->'lead'->>'email')),0));
 lead=jsonb_populate_record(null::public.leads,payload->'lead');
 select lead_id into canonical from public.lead_identities where normalized_email=lower(trim(lead.email));
 if canonical is null then insert into public.leads select lead.*;insert into public.lead_identities(normalized_email,lead_id) values(lower(trim(lead.email)),lead.id);canonical=lead.id;
 else select * into existing from public.leads where id=canonical;update public.leads set first_name=coalesce(nullif(lead.first_name,''),first_name),last_name=coalesce(nullif(lead.last_name,''),last_name),phone=coalesce(nullif(lead.phone,''),phone),last_interaction_at=now(),updated_at=now() where id=canonical;end if;
 for item in select * from jsonb_array_elements(payload->'consents') loop item=jsonb_set(item,'{lead_id}',to_jsonb(canonical));insert into public.consents select (jsonb_populate_record(null::public.consents,item)).*;end loop;
 if lead.listing_id is not null then insert into public.lead_properties(lead_id,listing_id,source_page) values(canonical,lead.listing_id,lead.trigger_source) on conflict(lead_id,listing_id) do nothing;end if;
 if payload->'showing'<>'null'::jsonb then item=jsonb_set(payload->'showing','{lead_id}',to_jsonb(canonical));insert into public.showing_requests select(jsonb_populate_record(null::public.showing_requests,item)).*;end if;
 if payload->'valuation'<>'null'::jsonb then item=jsonb_set(payload->'valuation','{lead_id}',to_jsonb(canonical));insert into public.valuation_requests select(jsonb_populate_record(null::public.valuation_requests,item)).*;end if;
 if(payload->>'newsletter')::boolean then insert into public.newsletter_subscribers(email,status) values(lower(trim(lead.email)),'active') on conflict(email) do update set status='active';end if;
 for item in select * from jsonb_array_elements(payload->'outbox') loop insert into public.dev_outbox select(jsonb_populate_record(null::public.dev_outbox,item)).*;end loop;
 insert into public.activities(lead_id,listing_id,kind,body,payload) values(canonical,lead.listing_id,case when existing.id is null then 'lead_created' else 'inquiry_submitted' end,'Inquiry received from '||lead.source::text,jsonb_build_object('source',lead.source,'utm',lead.utm,'message',lead.message));return canonical;end$$;

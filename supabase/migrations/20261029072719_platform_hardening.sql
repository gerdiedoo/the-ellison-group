-- Guard concurrent workflow/chat execution and close direct REST access gaps.
alter table public.conversation_messages add column reply_to uuid unique references public.conversation_messages,
 add column property_ids uuid[];
create extension if not exists btree_gist with schema extensions;
alter table public.showing_requests add constraint appointments_no_overlap exclude using gist
 (assigned_to extensions.gist_uuid_ops with =,tstzrange(starts_at,ends_at,'[)') with &&)
 where(assigned_to is not null and status in ('requested','confirmed'));
alter table public.activities drop constraint activities_listing_id_fkey;
alter table public.activities add constraint activities_listing_id_fkey foreign key(listing_id) references public.listings on delete set null;

create or replace function private.owns_lead(lead uuid) returns boolean language sql stable security definer set search_path='' as $$select private.is_staff() and exists(select 1 from public.leads where id=lead and assigned_to=(select auth.uid()))$$;
create or replace function private.owns_conversation(conversation uuid) returns boolean language sql stable security definer set search_path='' as $$select private.is_staff() and exists(select 1 from public.conversations where id=conversation and assigned_to=(select auth.uid()))$$;
create function private.owns_listing(target uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.listings l join public.profiles p on p.agent_id=l.listing_agent_id where l.id=target and p.id=(select auth.uid()) and p.role='agent')$$;
revoke all on function private.owns_listing(uuid) from public;
grant execute on function private.owns_listing(uuid) to authenticated;
drop policy own_profile on public.profiles;
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()) or (select private.is_admin()));
drop policy assigned_leads on public.leads;
create policy assigned_leads on public.leads for select to authenticated using((select private.is_staff()) and assigned_to=(select auth.uid()));
drop policy assigned_appointments on public.showing_requests;
create policy assigned_appointments on public.showing_requests for select to authenticated using((select private.is_staff()) and (assigned_to=(select auth.uid()) or private.owns_lead(lead_id)));
drop policy own_conversations on public.conversations;
create policy own_conversations on public.conversations for select to authenticated using((select private.is_staff()) and assigned_to=(select auth.uid()));
drop policy own_tasks on public.tasks;
create policy own_tasks on public.tasks for select to authenticated using((select private.is_staff()) and assigned_to=(select auth.uid()));
drop policy own_notifications on public.notifications;
create policy own_notifications on public.notifications for select to authenticated using((select private.is_staff()) and user_id=(select auth.uid()));
create policy staff_templates on public.message_templates for select to authenticated using((select private.is_staff()));
create policy active_campaigns on public.campaigns for select to anon,authenticated using(status='active');
grant select on public.campaigns to anon;

-- A signed application cookie unlocks the server-rendered DTO, not direct REST.
-- Restricted records are read only through the server's published-only boundary.
create function private.listing_is_gated(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select l.lead_capture_required or exists(select 1 from public.site_settings s where s.key='lead_capture' and s.value->>'enabled'='true' and s.value->>'detail_mode'='immediate' and (coalesce(jsonb_array_length(s.value->'property_ids'),0)=0 or s.value->'property_ids' ? target::text)) from public.listings l where l.id=target),true)
$$;
revoke all on function private.listing_is_gated(uuid) from public;
grant usage on schema private to anon;
grant execute on function private.listing_is_gated(uuid) to anon,authenticated;
drop policy public_listings on public.listings;
create policy public_listings on public.listings for select to anon,authenticated using(not hidden and publication_status='published' and not private.listing_is_gated(id));
drop policy public_read on public.listing_photos;
drop policy public_read on public.listing_features;
create policy published_photos on public.listing_photos for select to anon,authenticated using(exists(select 1 from public.listings l where l.id=listing_id and not l.hidden and l.publication_status='published' and not private.listing_is_gated(l.id)));
create policy published_features on public.listing_features for select to anon,authenticated using(exists(select 1 from public.listings l where l.id=listing_id and not l.hidden and l.publication_status='published' and not private.listing_is_gated(l.id)));
create policy assigned_photos on public.listing_photos for select to authenticated using(private.owns_listing(listing_id));
create policy assigned_features on public.listing_features for select to authenticated using(private.owns_listing(listing_id));

create or replace function public.platform_apply(operations jsonb,lock_key text default null) returns void language plpgsql security invoker set search_path='' as $$declare op jsonb;t text;columns text;row jsonb;begin
 if lock_key is not null then perform pg_advisory_xact_lock(hashtextextended(lock_key,0));end if;
 if exists(select 1 from jsonb_array_elements(operations) o join public.automation_runs r on r.rule_id=(o->'record'->>'rule_id')::uuid and r.event_key=o->'record'->>'event_key' where o->>'table'='automation_runs') then return;end if;
 if exists(select 1 from jsonb_array_elements(operations) o join public.conversation_messages m on m.request_id=(o->'record'->>'request_id')::uuid where o->>'table'='conversation_messages' and o->'record'->>'request_id' is not null) then return;end if;
 for op in select * from jsonb_array_elements(operations) where value->>'table'='conversation_messages' and value->'record'->>'role'='assistant' loop
  row=op->'record';
  if exists(select 1 from public.conversation_messages where reply_to=(row->>'reply_to')::uuid) or not exists(select 1 from public.conversations c where c.id=(row->>'conversation_id')::uuid and c.mode='ai' and c.status<>'resolved') or (select id from public.conversation_messages where conversation_id=(row->>'conversation_id')::uuid and role='visitor' order by created_at desc,id desc limit 1) is distinct from (row->>'reply_to')::uuid then return;end if;
 end loop;
 for op in select * from jsonb_array_elements(operations) loop
 t=op->>'table';
 if not(t=any(array['profiles','listings','listing_photos','listing_features','leads','lead_identities','lead_properties','activities','consents','showing_requests','valuation_requests','newsletter_subscribers','saved_homes','saved_searches','conversations','conversation_messages','tasks','automation_rules','automation_runs','notifications','message_templates','campaigns','pipeline_stages','site_settings','audit_log','dev_outbox'])) then raise exception 'Unsupported collection';end if;
 if op->>'action'='delete' then
  if t in ('consents','audit_log','activities','lead_identities','conversation_messages','automation_runs') then raise exception 'Immutable collection';end if;
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

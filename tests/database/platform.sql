-- Local development only. Every fixture and policy probe is rolled back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,role,aud,raw_user_meta_data) values
 ('90000000-0000-4000-8000-000000000001','qa-db-admin@example.invalid','authenticated','authenticated','{"full_name":"Database QA admin"}'),
 ('90000000-0000-4000-8000-000000000002','qa-db-agent@example.invalid','authenticated','authenticated','{"full_name":"Database QA agent"}'),
 ('90000000-0000-4000-8000-000000000003','qa-db-visitor@example.invalid','authenticated','authenticated','{"full_name":"Database QA visitor"}');
update public.profiles set role='admin' where id='90000000-0000-4000-8000-000000000001';
update public.profiles set role='agent',agent_id=(select id from public.agents order by id limit 1) where id='90000000-0000-4000-8000-000000000002';
insert into public.leads(id,source,first_name,email,status,assigned_to) values
 ('90000000-0000-4000-8000-000000000011','contact','Own contact','qa-db-own@example.invalid','new','90000000-0000-4000-8000-000000000002'),
 ('90000000-0000-4000-8000-000000000012','contact','Other contact','qa-db-other@example.invalid','new','90000000-0000-4000-8000-000000000001');
insert into public.listings select (jsonb_populate_record(null::public.listings,(select to_jsonb(l) from public.listings l limit 1)||jsonb_build_object('id','90000000-0000-4000-8000-000000000021','mls_id','QA-DB-OWN','slug','qa-db-own','hidden',true,'publication_status','draft','listing_agent_id',(select agent_id from public.profiles where id='90000000-0000-4000-8000-000000000002')))).*;
insert into public.listings select (jsonb_populate_record(null::public.listings,(select to_jsonb(l) from public.listings l limit 1)||jsonb_build_object('id','90000000-0000-4000-8000-000000000022','mls_id','QA-DB-OTHER','slug','qa-db-other','hidden',true,'publication_status','draft','listing_agent_id',null))).*;
insert into public.listings select (jsonb_populate_record(null::public.listings,(select to_jsonb(l) from public.listings l limit 1)||jsonb_build_object('id','90000000-0000-4000-8000-000000000023','mls_id','QA-DB-GATE','slug','qa-db-gate','hidden',false,'publication_status','published','lead_capture_required',true,'listing_agent_id',null))).*;
insert into public.listing_photos(id,listing_id,url,caption) values
 ('90000000-0000-4000-8000-000000000031','90000000-0000-4000-8000-000000000021','/seed/house-3.jpg','QA own draft'),
 ('90000000-0000-4000-8000-000000000032','90000000-0000-4000-8000-000000000022','/seed/house-3.jpg','QA other draft'),
 ('90000000-0000-4000-8000-000000000033','90000000-0000-4000-8000-000000000023','/seed/house-3.jpg','QA gated property');
insert into public.conversations(id,session_hash,lead_id,assigned_to) values('90000000-0000-4000-8000-000000000041','qa-session','90000000-0000-4000-8000-000000000011','90000000-0000-4000-8000-000000000002');
insert into public.conversation_messages(id,conversation_id,role,body) values('90000000-0000-4000-8000-000000000042','90000000-0000-4000-8000-000000000041','visitor','An actual visitor question in the isolated SQL fixture.');
insert into public.automation_rules(id,name,event,action,task_title) values('90000000-0000-4000-8000-000000000051','QA idempotency','lead_created','create_task','QA task');

set local role anon;
do $$begin
 assert not has_table_privilege('anon','public.leads','select'),'Anonymous lead access must be denied';
 assert not has_function_privilege('anon','public.platform_apply(jsonb,text)','execute'),'Anonymous mutations must be denied';
 assert (select count(*) from public.listings where id::text like '90000000-%')=0,'Draft/gated listing rows leaked';
 assert (select count(*) from public.listing_photos where id::text like '90000000-%')=0,'Draft/gated photo metadata leaked';
end$$;
reset role;
-- Global capture configuration also applies at the direct REST policy boundary.
update public.listings set lead_capture_required=false where id='90000000-0000-4000-8000-000000000023';
insert into public.site_settings(key,value) values('lead_capture','{"enabled":true,"detail_mode":"immediate","property_ids":["90000000-0000-4000-8000-000000000023"]}') on conflict(key) do update set value=excluded.value;
set local role anon;
do $$begin
 assert (select count(*) from public.listings where id='90000000-0000-4000-8000-000000000023')=0,'Global property gate was bypassed through REST';
end$$;
reset role;
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 assert (select count(*) from public.leads where id::text like '90000000-%')=0,'Ordinary visitor gained CRM access';
 assert (select count(*) from public.conversations where id::text like '90000000-%')=0,'Ordinary visitor gained inbox access';
 assert not has_function_privilege('authenticated','public.platform_apply(jsonb,text)','execute'),'Authenticated clients must not bypass server validation';
 assert not has_column_privilege('authenticated','public.profiles','role','update'),'Visitors must not grant themselves a staff role';
end$$;
reset role;
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 assert (select count(*) from public.leads where id='90000000-0000-4000-8000-000000000011')=1,'Agent cannot read own lead';
 assert (select count(*) from public.leads where id='90000000-0000-4000-8000-000000000012')=0,'Agent read another lead';
 assert (select count(*) from public.profiles where id='90000000-0000-4000-8000-000000000001')=0,'Agent read another staff profile';
 assert (select count(*) from public.listing_photos where id='90000000-0000-4000-8000-000000000031')=1,'Agent cannot read linked draft photography';
 assert (select count(*) from public.listing_photos where id='90000000-0000-4000-8000-000000000032')=0,'Agent read unrelated draft photography';
 assert (select count(*) from public.conversation_messages where id='90000000-0000-4000-8000-000000000042')=1,'Agent cannot read assigned conversation';
end$$;
reset role;
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 assert (select count(*) from public.leads where id::text like '90000000-%')=2,'Admin cannot read all fixture leads';
 assert (select count(*) from public.listing_photos where id::text like '90000000-%')=3,'Admin cannot manage all fixture photos';
end$$;
reset role;
set local role service_role;
do $$declare ops jsonb;stamp text:=now()::text;begin
 ops:=jsonb_build_array(jsonb_build_object('action','upsert','table','tasks','record',jsonb_build_object('id','90000000-0000-4000-8000-000000000052','title','QA task','status','open','notes','','automation_key','qa-one-event','created_at',stamp,'updated_at',stamp)),jsonb_build_object('action','upsert','table','automation_runs','record',jsonb_build_object('id','90000000-0000-4000-8000-000000000053','rule_id','90000000-0000-4000-8000-000000000051','event_key','qa-one-event','status','completed','result','Actual internal task created','created_at',stamp,'updated_at',stamp)));
 perform public.platform_apply(ops,'qa-automation');
 ops:=jsonb_set(jsonb_set(ops,'{0,record,id}','"90000000-0000-4000-8000-000000000054"'),'{1,record,id}','"90000000-0000-4000-8000-000000000055"');
 perform public.platform_apply(ops,'qa-automation');
 assert (select count(*) from public.tasks where automation_key='qa-one-event')=1,'Workflow created duplicate tasks';
 assert (select count(*) from public.automation_runs where event_key='qa-one-event')=1,'Workflow history duplicated';
 update public.conversations set mode='human' where id='90000000-0000-4000-8000-000000000041';
 ops:=jsonb_build_array(jsonb_build_object('action','upsert','table','conversation_messages','record',jsonb_build_object('id','90000000-0000-4000-8000-000000000043','conversation_id','90000000-0000-4000-8000-000000000041','role','assistant','body','This response must be suppressed after takeover.','is_internal',false,'reply_to','90000000-0000-4000-8000-000000000042','created_at',stamp,'updated_at',stamp)));
 perform public.platform_apply(ops,'qa-chat');
 assert not exists(select 1 from public.conversation_messages where id='90000000-0000-4000-8000-000000000043'),'Late AI response survived human takeover';
end$$;
reset role;
insert into public.showing_requests(id,lead_id,listing_id,assigned_to,starts_at,ends_at,meeting_type,status) values('90000000-0000-4000-8000-000000000061','90000000-0000-4000-8000-000000000011',null,'90000000-0000-4000-8000-000000000002','2030-01-10T15:00:00Z','2030-01-10T16:00:00Z','in_person','confirmed');
do $$begin
 begin
  insert into public.showing_requests(lead_id,assigned_to,starts_at,ends_at,meeting_type,status) values('90000000-0000-4000-8000-000000000011','90000000-0000-4000-8000-000000000002','2030-01-10T15:30:00Z','2030-01-10T16:30:00Z','in_person','requested');
  raise exception 'Overlapping appointment was incorrectly accepted';
 exception when exclusion_violation then null;end;
end$$;
rollback;
\echo 'PASS: anon/visitor/agent/admin policies, media isolation, service-only mutations, workflow idempotency, human takeover, and appointment overlap.'

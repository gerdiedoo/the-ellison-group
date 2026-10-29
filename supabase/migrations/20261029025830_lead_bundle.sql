-- One transaction keeps a lead and its consent audit, showing, valuation and outbox together.
create function public.submit_lead_bundle(payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$declare lead public.leads; item jsonb; begin
 lead=jsonb_populate_record(null::public.leads,payload->'lead');
 insert into public.leads select lead.*;
 for item in select * from jsonb_array_elements(payload->'consents') loop insert into public.consents select (jsonb_populate_record(null::public.consents,item)).*; end loop;
 if payload->'showing'<>'null'::jsonb then insert into public.showing_requests select (jsonb_populate_record(null::public.showing_requests,payload->'showing')).*; end if;
 if payload->'valuation'<>'null'::jsonb then insert into public.valuation_requests select (jsonb_populate_record(null::public.valuation_requests,payload->'valuation')).*; end if;
 if (payload->>'newsletter')::boolean then insert into public.newsletter_subscribers(email,status) values(lead.email,'active') on conflict(email) do update set status='active'; end if;
 for item in select * from jsonb_array_elements(payload->'outbox') loop insert into public.dev_outbox select (jsonb_populate_record(null::public.dev_outbox,item)).*; end loop;
 return lead.id;
end$$;
revoke all on function public.submit_lead_bundle(jsonb) from public,anon,authenticated;
grant execute on function public.submit_lead_bundle(jsonb) to service_role;

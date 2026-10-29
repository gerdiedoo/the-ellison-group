-- Remove Supabase default privileges first: ownership policies alone do not protect role columns.
revoke all on all tables in schema public from anon,authenticated;
grant select on public.listings,public.agents,public.neighborhoods,public.listing_photos,public.listing_features,public.neighborhood_stats,public.neighborhood_pois,public.schools,public.testimonials,public.blog_posts,public.social_posts,public.site_settings to anon,authenticated;
grant select on public.profiles,public.consents,public.audit_log to authenticated;
grant update(full_name,phone,notification_prefs) on public.profiles to authenticated;
grant select,insert,update,delete on public.saved_homes,public.saved_searches to authenticated;
grant select,insert,update,delete on public.site_settings,public.agents,public.neighborhoods,public.listings,public.listing_photos,public.listing_features,public.neighborhood_stats,public.neighborhood_pois,public.schools,public.testimonials,public.blog_posts,public.social_posts,public.leads,public.showing_requests,public.valuation_requests,public.newsletter_subscribers,public.redirects,public.dev_outbox to authenticated;
revoke all on public.consents,public.audit_log from anon;
revoke update,delete on public.consents,public.audit_log from service_role;


export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "agents": {
                  Row: {
                    "bio": string,"created_at": string,"email": string | null,"full_name": string,"id": string,"is_active": boolean | null,"license_no": string | null,"phone": string | null,"photo_path": string | null,"slug": string,"socials": Json | null,"sort_order": number | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bio"?: string,"created_at"?: string,"email"?: string | null,"full_name": string,"id"?: string,"is_active"?: boolean | null,"license_no"?: string | null,"phone"?: string | null,"photo_path"?: string | null,"slug": string,"socials"?: Json | null,"sort_order"?: number | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "bio"?: string,"created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string,"is_active"?: boolean | null,"license_no"?: string | null,"phone"?: string | null,"photo_path"?: string | null,"slug"?: string,"socials"?: Json | null,"sort_order"?: number | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"changes": Json | null,"created_at": string,"id": string,"record_id": string | null,"table_name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"changes"?: Json | null,"created_at"?: string,"id"?: string,"record_id"?: string | null,"table_name": string,"updated_at"?: string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"changes"?: Json | null,"created_at"?: string,"id"?: string,"record_id"?: string | null,"table_name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"blog_posts": {
                  Row: {
                    "author_id": string | null,"body_md": string | null,"category": string | null,"cover_path": string | null,"created_at": string,"excerpt": string | null,"id": string,"published_at": string | null,"seo": Json | null,"slug": string,"status": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body_md"?: string | null,"category"?: string | null,"cover_path"?: string | null,"created_at"?: string,"excerpt"?: string | null,"id"?: string,"published_at"?: string | null,"seo"?: Json | null,"slug": string,"status"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body_md"?: string | null,"category"?: string | null,"cover_path"?: string | null,"created_at"?: string,"excerpt"?: string | null,"id"?: string,"published_at"?: string | null,"seo"?: Json | null,"slug"?: string,"status"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blog_posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "agents"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "channel": Database["public"]['Enums']["consent_channel"],"created_at": string,"disclosure_text": string,"disclosure_version": string,"granted": boolean,"granted_at": string | null,"id": string,"ip_hash": string | null,"lead_id": string,"updated_at": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "channel": Database["public"]['Enums']["consent_channel"],"created_at"?: string,"disclosure_text": string,"disclosure_version": string,"granted": boolean,"granted_at"?: string | null,"id"?: string,"ip_hash"?: string | null,"lead_id": string,"updated_at"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "channel"?: Database["public"]['Enums']["consent_channel"],"created_at"?: string,"disclosure_text"?: string,"disclosure_version"?: string,"granted"?: boolean,"granted_at"?: string | null,"id"?: string,"ip_hash"?: string | null,"lead_id"?: string,"updated_at"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"dev_outbox": {
                  Row: {
                    "attachments": Json | null,"body": string | null,"channel": string,"created_at": string,"id": string,"recipient": string,"sent_at": string | null,"subject": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attachments"?: Json | null,"body"?: string | null,"channel": string,"created_at"?: string,"id"?: string,"recipient": string,"sent_at"?: string | null,"subject"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "attachments"?: Json | null,"body"?: string | null,"channel"?: string,"created_at"?: string,"id"?: string,"recipient"?: string,"sent_at"?: string | null,"subject"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"leads": {
                  Row: {
                    "agent_id": string | null,"assigned_to": string | null,"created_at": string,"email": string,"first_name": string | null,"id": string,"interest": string | null,"ip_hash": string | null,"last_name": string | null,"listing_id": string | null,"message": string | null,"middle_name": string | null,"notes": string | null,"phone": string | null,"source": Database["public"]['Enums']["lead_source"],"status": Database["public"]['Enums']["lead_status"] | null,"trigger_source": string | null,"updated_at": string,"user_agent": string | null,"utm": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "agent_id"?: string | null,"assigned_to"?: string | null,"created_at"?: string,"email": string,"first_name"?: string | null,"id"?: string,"interest"?: string | null,"ip_hash"?: string | null,"last_name"?: string | null,"listing_id"?: string | null,"message"?: string | null,"middle_name"?: string | null,"notes"?: string | null,"phone"?: string | null,"source": Database["public"]['Enums']["lead_source"],"status"?: Database["public"]['Enums']["lead_status"] | null,"trigger_source"?: string | null,"updated_at"?: string,"user_agent"?: string | null,"utm"?: Json | null
                  }
                  Update: {
                    "agent_id"?: string | null,"assigned_to"?: string | null,"created_at"?: string,"email"?: string,"first_name"?: string | null,"id"?: string,"interest"?: string | null,"ip_hash"?: string | null,"last_name"?: string | null,"listing_id"?: string | null,"message"?: string | null,"middle_name"?: string | null,"notes"?: string | null,"phone"?: string | null,"source"?: Database["public"]['Enums']["lead_source"],"status"?: Database["public"]['Enums']["lead_status"] | null,"trigger_source"?: string | null,"updated_at"?: string,"user_agent"?: string | null,"utm"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "leads_agent_id_fkey"
      columns: ["agent_id"]
isOneToOne: false
      referencedRelation: "agents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"listing_features": {
                  Row: {
                    "created_at": string,"group": Database["public"]['Enums']["feature_group"],"id": string,"label": string,"listing_id": string,"updated_at": string,"value": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"group": Database["public"]['Enums']["feature_group"],"id"?: string,"label": string,"listing_id": string,"updated_at"?: string,"value"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"group"?: Database["public"]['Enums']["feature_group"],"id"?: string,"label"?: string,"listing_id"?: string,"updated_at"?: string,"value"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "listing_features_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"listing_photos": {
                  Row: {
                    "blurhash": string | null,"caption": string | null,"created_at": string,"height": number | null,"id": string,"listing_id": string,"sort_order": number | null,"storage_path": string | null,"updated_at": string,"url": string | null,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "blurhash"?: string | null,"caption"?: string | null,"created_at"?: string,"height"?: number | null,"id"?: string,"listing_id": string,"sort_order"?: number | null,"storage_path"?: string | null,"updated_at"?: string,"url"?: string | null,"width"?: number | null
                  }
                  Update: {
                    "blurhash"?: string | null,"caption"?: string | null,"created_at"?: string,"height"?: number | null,"id"?: string,"listing_id"?: string,"sort_order"?: number | null,"storage_path"?: string | null,"updated_at"?: string,"url"?: string | null,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "listing_photos_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"listings": {
                  Row: {
                    "address_line": string,"baths_full": number | null,"baths_half": number | null,"beds": number | null,"city": string,"courtesy_of": string | null,"created_at": string,"description": string | null,"featured_rank": number | null,"geom": unknown,"hidden": boolean | null,"id": string,"is_featured": boolean | null,"lat": number | null,"list_price": number,"listing_agent_id": string | null,"living_sqft": number | null,"lng": number | null,"lot_acres": number | null,"mls_id": string,"neighborhood_id": string | null,"property_type": string,"raw": Json | null,"slug": string,"sold_date": string | null,"sold_price": number | null,"state": string | null,"status": Database["public"]['Enums']["listing_status"],"stories": number | null,"synced_at": string | null,"updated_at": string,"year_built": number | null,"zip": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line": string,"baths_full"?: number | null,"baths_half"?: number | null,"beds"?: number | null,"city": string,"courtesy_of"?: string | null,"created_at"?: string,"description"?: string | null,"featured_rank"?: number | null,"geom"?: unknown,"hidden"?: boolean | null,"id"?: string,"is_featured"?: boolean | null,"lat"?: number | null,"list_price": number,"listing_agent_id"?: string | null,"living_sqft"?: number | null,"lng"?: number | null,"lot_acres"?: number | null,"mls_id": string,"neighborhood_id"?: string | null,"property_type": string,"raw"?: Json | null,"slug": string,"sold_date"?: string | null,"sold_price"?: number | null,"state"?: string | null,"status": Database["public"]['Enums']["listing_status"],"stories"?: number | null,"synced_at"?: string | null,"updated_at"?: string,"year_built"?: number | null,"zip"?: string | null
                  }
                  Update: {
                    "address_line"?: string,"baths_full"?: number | null,"baths_half"?: number | null,"beds"?: number | null,"city"?: string,"courtesy_of"?: string | null,"created_at"?: string,"description"?: string | null,"featured_rank"?: number | null,"geom"?: unknown,"hidden"?: boolean | null,"id"?: string,"is_featured"?: boolean | null,"lat"?: number | null,"list_price"?: number,"listing_agent_id"?: string | null,"living_sqft"?: number | null,"lng"?: number | null,"lot_acres"?: number | null,"mls_id"?: string,"neighborhood_id"?: string | null,"property_type"?: string,"raw"?: Json | null,"slug"?: string,"sold_date"?: string | null,"sold_price"?: number | null,"state"?: string | null,"status"?: Database["public"]['Enums']["listing_status"],"stories"?: number | null,"synced_at"?: string | null,"updated_at"?: string,"year_built"?: number | null,"zip"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "listings_listing_agent_id_fkey"
      columns: ["listing_agent_id"]
isOneToOne: false
      referencedRelation: "agents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_neighborhood_id_fkey"
      columns: ["neighborhood_id"]
isOneToOne: false
      referencedRelation: "neighborhoods"
      referencedColumns: ["id"]
    }
                  ]
                },"neighborhood_pois": {
                  Row: {
                    "address": string | null,"category": string | null,"created_at": string,"distance_mi": number | null,"fetched_at": string | null,"id": string,"lat": number | null,"lng": number | null,"name": string,"neighborhood_id": string,"rating": number | null,"review_count": number | null,"updated_at": string,"yelp_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"category"?: string | null,"created_at"?: string,"distance_mi"?: number | null,"fetched_at"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"name": string,"neighborhood_id": string,"rating"?: number | null,"review_count"?: number | null,"updated_at"?: string,"yelp_url"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"category"?: string | null,"created_at"?: string,"distance_mi"?: number | null,"fetched_at"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"name"?: string,"neighborhood_id"?: string,"rating"?: number | null,"review_count"?: number | null,"updated_at"?: string,"yelp_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "neighborhood_pois_neighborhood_id_fkey"
      columns: ["neighborhood_id"]
isOneToOne: false
      referencedRelation: "neighborhoods"
      referencedColumns: ["id"]
    }
                  ]
                },"neighborhood_stats": {
                  Row: {
                    "created_at": string,"fetched_at": string | null,"id": string,"neighborhood_id": string,"payload": NonNullable<Json>,"source": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"fetched_at"?: string | null,"id"?: string,"neighborhood_id": string,"payload": NonNullable<Json>,"source": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"fetched_at"?: string | null,"id"?: string,"neighborhood_id"?: string,"payload"?: NonNullable<Json>,"source"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "neighborhood_stats_neighborhood_id_fkey"
      columns: ["neighborhood_id"]
isOneToOne: false
      referencedRelation: "neighborhoods"
      referencedColumns: ["id"]
    }
                  ]
                },"neighborhoods": {
                  Row: {
                    "blurb": string | null,"boundary": unknown,"created_at": string,"hero_path": string | null,"id": string,"lat": number | null,"lng": number | null,"name": string,"slug": string,"sort_order": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blurb"?: string | null,"boundary"?: unknown,"created_at"?: string,"hero_path"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"name": string,"slug": string,"sort_order"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "blurb"?: string | null,"boundary"?: unknown,"created_at"?: string,"hero_path"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"name"?: string,"slug"?: string,"sort_order"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"newsletter_subscribers": {
                  Row: {
                    "confirmed_at": string | null,"created_at": string,"email": string,"id": string,"status": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmed_at"?: string | null,"created_at"?: string,"email": string,"id"?: string,"status"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "confirmed_at"?: string | null,"created_at"?: string,"email"?: string,"id"?: string,"status"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string | null,"id": string,"notification_prefs": Json | null,"phone": string | null,"role": Database["public"]['Enums']["profile_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id": string,"notification_prefs"?: Json | null,"phone"?: string | null,"role"?: Database["public"]['Enums']["profile_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id"?: string,"notification_prefs"?: Json | null,"phone"?: string | null,"role"?: Database["public"]['Enums']["profile_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"redirects": {
                  Row: {
                    "created_at": string,"from_path": string,"id": string,"status_code": number | null,"to_path": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"from_path": string,"id"?: string,"status_code"?: number | null,"to_path": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"from_path"?: string,"id"?: string,"status_code"?: number | null,"to_path"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"saved_homes": {
                  Row: {
                    "created_at": string,"id": string,"listing_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"listing_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"listing_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_homes_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_searches": {
                  Row: {
                    "channels": (string)[] | null,"created_at": string,"filters": NonNullable<Json>,"frequency": string | null,"id": string,"last_sent_at": string | null,"name": string,"polygon": unknown,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "channels"?: (string)[] | null,"created_at"?: string,"filters": NonNullable<Json>,"frequency"?: string | null,"id"?: string,"last_sent_at"?: string | null,"name": string,"polygon"?: unknown,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "channels"?: (string)[] | null,"created_at"?: string,"filters"?: NonNullable<Json>,"frequency"?: string | null,"id"?: string,"last_sent_at"?: string | null,"name"?: string,"polygon"?: unknown,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"schools": {
                  Row: {
                    "category": string | null,"created_at": string,"grades": string | null,"id": string,"level": string | null,"name": string,"neighborhood_id": string,"rating": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"created_at"?: string,"grades"?: string | null,"id"?: string,"level"?: string | null,"name": string,"neighborhood_id": string,"rating"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string | null,"created_at"?: string,"grades"?: string | null,"id"?: string,"level"?: string | null,"name"?: string,"neighborhood_id"?: string,"rating"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "schools_neighborhood_id_fkey"
      columns: ["neighborhood_id"]
isOneToOne: false
      referencedRelation: "neighborhoods"
      referencedColumns: ["id"]
    }
                  ]
                },"showing_requests": {
                  Row: {
                    "created_at": string,"id": string,"lead_id": string,"listing_id": string,"meeting_type": string | null,"starts_at": string,"status": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"lead_id": string,"listing_id": string,"meeting_type"?: string | null,"starts_at": string,"status"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"lead_id"?: string,"listing_id"?: string,"meeting_type"?: string | null,"starts_at"?: string,"status"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "showing_requests_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "showing_requests_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"site_settings": {
                  Row: {
                    "created_at": string,"id": string,"key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"social_posts": {
                  Row: {
                    "alt": string,"created_at": string,"id": string,"image_path": string,"permalink": string,"sort_order": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt": string,"created_at"?: string,"id"?: string,"image_path": string,"permalink": string,"sort_order"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "alt"?: string,"created_at"?: string,"id"?: string,"image_path"?: string,"permalink"?: string,"sort_order"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"testimonials": {
                  Row: {
                    "agent_id": string | null,"body": string,"created_at": string,"id": string,"is_featured": boolean | null,"rating": number | null,"reviewer_name": string,"sort_order": number | null,"source": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agent_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"is_featured"?: boolean | null,"rating"?: number | null,"reviewer_name": string,"sort_order"?: number | null,"source"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "agent_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"is_featured"?: boolean | null,"rating"?: number | null,"reviewer_name"?: string,"sort_order"?: number | null,"source"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "testimonials_agent_id_fkey"
      columns: ["agent_id"]
isOneToOne: false
      referencedRelation: "agents"
      referencedColumns: ["id"]
    }
                  ]
                },"valuation_requests": {
                  Row: {
                    "address": string,"confidence": string | null,"created_at": string,"geom": unknown,"id": string,"lat": number | null,"lead_id": string,"lng": number | null,"result": Json | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"confidence"?: string | null,"created_at"?: string,"geom"?: unknown,"id"?: string,"lat"?: number | null,"lead_id": string,"lng"?: number | null,"result"?: Json | null,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string,"confidence"?: string | null,"created_at"?: string,"geom"?: unknown,"id"?: string,"lat"?: number | null,"lead_id"?: string,"lng"?: number | null,"result"?: Json | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "valuation_requests_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "check_rate_limit":
{ Args: { "bucket": string,"max_hits"?: number,"window_seconds"?: number }; Returns: boolean
                           },
"comps_for_valuation":
{ Args: { "baths": number,"beds": number,"lat": number,"lng": number,"sqft": number,"type": string }; Returns: {
              "address_line": string,
"baths_full": number | null,
"baths_half": number | null,
"beds": number | null,
"city": string,
"courtesy_of": string | null,
"created_at": string,
"description": string | null,
"featured_rank": number | null,
"geom": unknown,
"hidden": boolean | null,
"id": string,
"is_featured": boolean | null,
"lat": number | null,
"list_price": number,
"listing_agent_id": string | null,
"living_sqft": number | null,
"lng": number | null,
"lot_acres": number | null,
"mls_id": string,
"neighborhood_id": string | null,
"property_type": string,
"raw": Json | null,
"slug": string,
"sold_date": string | null,
"sold_price": number | null,
"state": string | null,
"status": Database["public"]['Enums']["listing_status"],
"stories": number | null,
"synced_at": string | null,
"updated_at": string,
"year_built": number | null,
"zip": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "listings"
        isOneToOne: false
        isSetofReturn: true
      } },
"listings_in_polygon":
{ Args: { "polygon": Json }; Returns: {
              "address_line": string,
"baths_full": number | null,
"baths_half": number | null,
"beds": number | null,
"city": string,
"courtesy_of": string | null,
"created_at": string,
"description": string | null,
"featured_rank": number | null,
"geom": unknown,
"hidden": boolean | null,
"id": string,
"is_featured": boolean | null,
"lat": number | null,
"list_price": number,
"listing_agent_id": string | null,
"living_sqft": number | null,
"lng": number | null,
"lot_acres": number | null,
"mls_id": string,
"neighborhood_id": string | null,
"property_type": string,
"raw": Json | null,
"slug": string,
"sold_date": string | null,
"sold_price": number | null,
"state": string | null,
"status": Database["public"]['Enums']["listing_status"],
"stories": number | null,
"synced_at": string | null,
"updated_at": string,
"year_built": number | null,
"zip": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "listings"
        isOneToOne: false
        isSetofReturn: true
      } },
"search_listings":
{ Args: { "filters"?: Json,"page_limit"?: number,"page_offset"?: number,"sort"?: string }; Returns: Json
                           },
"similar_listings":
{ Args: { "listing_id": string }; Returns: {
              "address_line": string,
"baths_full": number | null,
"baths_half": number | null,
"beds": number | null,
"city": string,
"courtesy_of": string | null,
"created_at": string,
"description": string | null,
"featured_rank": number | null,
"geom": unknown,
"hidden": boolean | null,
"id": string,
"is_featured": boolean | null,
"lat": number | null,
"list_price": number,
"listing_agent_id": string | null,
"living_sqft": number | null,
"lng": number | null,
"lot_acres": number | null,
"mls_id": string,
"neighborhood_id": string | null,
"property_type": string,
"raw": Json | null,
"slug": string,
"sold_date": string | null,
"sold_price": number | null,
"state": string | null,
"status": Database["public"]['Enums']["listing_status"],
"stories": number | null,
"synced_at": string | null,
"updated_at": string,
"year_built": number | null,
"zip": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "listings"
        isOneToOne: false
        isSetofReturn: true
      } },
"submit_lead_bundle":
{ Args: { "payload": Json }; Returns: string
                           }
          }
          Enums: {
            "consent_channel": "email_phone"|"sms"|"newsletter","feature_group": "interior"|"area_lot"|"exterior"|"financial","lead_source": "contact"|"valuation"|"showing"|"newsletter"|"agent"|"progressive","lead_status": "new"|"contacted"|"closed","listing_status": "for_sale"|"pending"|"sold","profile_role": "user"|"agent"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "consent_channel": ["email_phone", "sms", "newsletter"],"feature_group": ["interior", "area_lot", "exterior", "financial"],"lead_source": ["contact", "valuation", "showing", "newsletter", "agent", "progressive"],"lead_status": ["new", "contacted", "closed"],"listing_status": ["for_sale", "pending", "sold"],"profile_role": ["user", "agent", "admin"]
          }
        }
} as const

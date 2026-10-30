export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activities: {
        Row: {
          actor_id: string | null;
          body: string;
          conversation_id: string | null;
          created_at: string;
          id: string;
          is_internal: boolean;
          kind: string;
          lead_id: string | null;
          listing_id: string | null;
          payload: NonNullable<Json>;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          body: string;
          conversation_id?: string | null;
          created_at?: string;
          id?: string;
          is_internal?: boolean;
          kind: string;
          lead_id?: string | null;
          listing_id?: string | null;
          payload?: NonNullable<Json>;
          updated_at?: string;
        };
        Update: {
          actor_id?: string | null;
          body?: string;
          conversation_id?: string | null;
          created_at?: string;
          id?: string;
          is_internal?: boolean;
          kind?: string;
          lead_id?: string | null;
          listing_id?: string | null;
          payload?: NonNullable<Json>;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activities_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activities_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activities_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activities_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      agents: {
        Row: {
          bio: string;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          is_active: boolean | null;
          license_no: string | null;
          phone: string | null;
          photo_path: string | null;
          slug: string;
          socials: Json | null;
          sort_order: number | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          bio?: string;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          is_active?: boolean | null;
          license_no?: string | null;
          phone?: string | null;
          photo_path?: string | null;
          slug: string;
          socials?: Json | null;
          sort_order?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          bio?: string;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean | null;
          license_no?: string | null;
          phone?: string | null;
          photo_path?: string | null;
          slug?: string;
          socials?: Json | null;
          sort_order?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          changes: Json | null;
          created_at: string;
          id: string;
          record_id: string | null;
          table_name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          changes?: Json | null;
          created_at?: string;
          id?: string;
          record_id?: string | null;
          table_name: string;
          updated_at?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          changes?: Json | null;
          created_at?: string;
          id?: string;
          record_id?: string | null;
          table_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      automation_rules: {
        Row: {
          action: string;
          assigned_to: string | null;
          created_at: string;
          delay_hours: number;
          enabled: boolean;
          event: string;
          id: string;
          name: string;
          task_title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          assigned_to?: string | null;
          created_at?: string;
          delay_hours?: number;
          enabled?: boolean;
          event: string;
          id?: string;
          name: string;
          task_title: string;
          updated_at?: string;
        };
        Update: {
          action?: string;
          assigned_to?: string | null;
          created_at?: string;
          delay_hours?: number;
          enabled?: boolean;
          event?: string;
          id?: string;
          name?: string;
          task_title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'automation_rules_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      automation_runs: {
        Row: {
          created_at: string;
          event_key: string;
          id: string;
          result: string;
          rule_id: string;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          event_key: string;
          id?: string;
          result: string;
          rule_id: string;
          status: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          event_key?: string;
          id?: string;
          result?: string;
          rule_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'automation_runs_rule_id_fkey';
            columns: ['rule_id'];
            isOneToOne: false;
            referencedRelation: 'automation_rules';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_posts: {
        Row: {
          author_id: string | null;
          body_md: string | null;
          category: string | null;
          cover_path: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          published_at: string | null;
          seo: Json | null;
          slug: string;
          status: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          body_md?: string | null;
          category?: string | null;
          cover_path?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          seo?: Json | null;
          slug: string;
          status?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body_md?: string | null;
          category?: string | null;
          cover_path?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          seo?: Json | null;
          slug?: string;
          status?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
      };
      campaigns: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          listing_id: string | null;
          name: string;
          slug: string;
          status: string;
          updated_at: string;
          utm_campaign: string;
          utm_medium: string;
          utm_source: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          listing_id?: string | null;
          name: string;
          slug: string;
          status: string;
          updated_at?: string;
          utm_campaign: string;
          utm_medium: string;
          utm_source: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          listing_id?: string | null;
          name?: string;
          slug?: string;
          status?: string;
          updated_at?: string;
          utm_campaign?: string;
          utm_medium?: string;
          utm_source?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'campaigns_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      consents: {
        Row: {
          channel: Database['public']['Enums']['consent_channel'];
          created_at: string;
          disclosure_text: string;
          disclosure_version: string;
          granted: boolean;
          granted_at: string | null;
          id: string;
          ip_hash: string | null;
          lead_id: string;
          updated_at: string;
          user_agent: string | null;
        };
        ComputedFields: never;
        Insert: {
          channel: Database['public']['Enums']['consent_channel'];
          created_at?: string;
          disclosure_text: string;
          disclosure_version: string;
          granted: boolean;
          granted_at?: string | null;
          id?: string;
          ip_hash?: string | null;
          lead_id: string;
          updated_at?: string;
          user_agent?: string | null;
        };
        Update: {
          channel?: Database['public']['Enums']['consent_channel'];
          created_at?: string;
          disclosure_text?: string;
          disclosure_version?: string;
          granted?: boolean;
          granted_at?: string | null;
          id?: string;
          ip_hash?: string | null;
          lead_id?: string;
          updated_at?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'consents_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_messages: {
        Row: {
          actor_id: string | null;
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          is_internal: boolean;
          property_ids: string[] | null;
          provider: string | null;
          reply_to: string | null;
          request_id: string | null;
          role: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          is_internal?: boolean;
          property_ids?: string[] | null;
          provider?: string | null;
          reply_to?: string | null;
          request_id?: string | null;
          role: string;
          updated_at?: string;
        };
        Update: {
          actor_id?: string | null;
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          is_internal?: boolean;
          property_ids?: string[] | null;
          provider?: string | null;
          reply_to?: string | null;
          request_id?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_messages_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_messages_reply_to_fkey';
            columns: ['reply_to'];
            isOneToOne: true;
            referencedRelation: 'conversation_messages';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          ai_status: string;
          assigned_to: string | null;
          created_at: string;
          id: string;
          last_message_at: string;
          lead_id: string | null;
          listing_id: string | null;
          mode: string;
          recommendation: string;
          session_hash: string;
          status: string;
          summary: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ai_status?: string;
          assigned_to?: string | null;
          created_at?: string;
          id?: string;
          last_message_at?: string;
          lead_id?: string | null;
          listing_id?: string | null;
          mode?: string;
          recommendation?: string;
          session_hash: string;
          status?: string;
          summary?: string;
          updated_at?: string;
        };
        Update: {
          ai_status?: string;
          assigned_to?: string | null;
          created_at?: string;
          id?: string;
          last_message_at?: string;
          lead_id?: string | null;
          listing_id?: string | null;
          mode?: string;
          recommendation?: string;
          session_hash?: string;
          status?: string;
          summary?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      dev_outbox: {
        Row: {
          attachments: Json | null;
          body: string | null;
          channel: string;
          created_at: string;
          id: string;
          recipient: string;
          sent_at: string | null;
          subject: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          attachments?: Json | null;
          body?: string | null;
          channel: string;
          created_at?: string;
          id?: string;
          recipient: string;
          sent_at?: string | null;
          subject?: string | null;
          updated_at?: string;
        };
        Update: {
          attachments?: Json | null;
          body?: string | null;
          channel?: string;
          created_at?: string;
          id?: string;
          recipient?: string;
          sent_at?: string | null;
          subject?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_identities: {
        Row: {
          created_at: string;
          id: string;
          lead_id: string;
          normalized_email: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          lead_id: string;
          normalized_email: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          lead_id?: string;
          normalized_email?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_identities_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_properties: {
        Row: {
          created_at: string;
          id: string;
          lead_id: string;
          listing_id: string;
          source_page: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          lead_id: string;
          listing_id: string;
          source_page?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          lead_id?: string;
          listing_id?: string;
          source_page?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_properties_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_properties_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      leads: {
        Row: {
          agent_id: string | null;
          assigned_to: string | null;
          created_at: string;
          email: string;
          first_name: string | null;
          follow_up_at: string | null;
          id: string;
          interest: string | null;
          ip_hash: string | null;
          last_interaction_at: string | null;
          last_name: string | null;
          listing_id: string | null;
          message: string | null;
          middle_name: string | null;
          notes: string | null;
          phone: string | null;
          priority: string;
          source: Database['public']['Enums']['lead_source'];
          stage_id: string;
          status: Database['public']['Enums']['lead_status'] | null;
          tags: string[];
          trigger_source: string | null;
          updated_at: string;
          user_agent: string | null;
          utm: Json | null;
        };
        ComputedFields: never;
        Insert: {
          agent_id?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          email: string;
          first_name?: string | null;
          follow_up_at?: string | null;
          id?: string;
          interest?: string | null;
          ip_hash?: string | null;
          last_interaction_at?: string | null;
          last_name?: string | null;
          listing_id?: string | null;
          message?: string | null;
          middle_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          priority?: string;
          source: Database['public']['Enums']['lead_source'];
          stage_id?: string;
          status?: Database['public']['Enums']['lead_status'] | null;
          tags?: string[];
          trigger_source?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          utm?: Json | null;
        };
        Update: {
          agent_id?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string | null;
          follow_up_at?: string | null;
          id?: string;
          interest?: string | null;
          ip_hash?: string | null;
          last_interaction_at?: string | null;
          last_name?: string | null;
          listing_id?: string | null;
          message?: string | null;
          middle_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          priority?: string;
          source?: Database['public']['Enums']['lead_source'];
          stage_id?: string;
          status?: Database['public']['Enums']['lead_status'] | null;
          tags?: string[];
          trigger_source?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          utm?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'leads_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leads_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leads_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leads_stage_id_fkey';
            columns: ['stage_id'];
            isOneToOne: false;
            referencedRelation: 'pipeline_stages';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_features: {
        Row: {
          created_at: string;
          group: Database['public']['Enums']['feature_group'];
          id: string;
          label: string;
          listing_id: string;
          updated_at: string;
          value: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          group: Database['public']['Enums']['feature_group'];
          id?: string;
          label: string;
          listing_id: string;
          updated_at?: string;
          value?: string | null;
        };
        Update: {
          created_at?: string;
          group?: Database['public']['Enums']['feature_group'];
          id?: string;
          label?: string;
          listing_id?: string;
          updated_at?: string;
          value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_features_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_photos: {
        Row: {
          blurhash: string | null;
          caption: string | null;
          created_at: string;
          height: number | null;
          id: string;
          listing_id: string;
          sort_order: number | null;
          storage_path: string | null;
          updated_at: string;
          url: string | null;
          width: number | null;
        };
        ComputedFields: never;
        Insert: {
          blurhash?: string | null;
          caption?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          listing_id: string;
          sort_order?: number | null;
          storage_path?: string | null;
          updated_at?: string;
          url?: string | null;
          width?: number | null;
        };
        Update: {
          blurhash?: string | null;
          caption?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          listing_id?: string;
          sort_order?: number | null;
          storage_path?: string | null;
          updated_at?: string;
          url?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_photos_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      listings: {
        Row: {
          address_line: string;
          baths_full: number | null;
          baths_half: number | null;
          beds: number | null;
          city: string;
          courtesy_of: string | null;
          created_at: string;
          description: string | null;
          featured_rank: number | null;
          geom: unknown;
          hidden: boolean | null;
          id: string;
          is_featured: boolean | null;
          lat: number | null;
          lead_capture_required: boolean;
          list_price: number;
          listing_agent_id: string | null;
          listing_kind: string;
          living_sqft: number | null;
          lng: number | null;
          lot_acres: number | null;
          mls_id: string;
          mls_id_locked: boolean;
          neighborhood_id: string | null;
          property_type: string;
          publication_status: string;
          raw: Json | null;
          slug: string;
          sold_date: string | null;
          sold_price: number | null;
          state: string | null;
          status: Database['public']['Enums']['listing_status'];
          stories: number | null;
          synced_at: string | null;
          title: string;
          updated_at: string;
          year_built: number | null;
          zip: string | null;
        };
        ComputedFields: never;
        Insert: {
          address_line: string;
          baths_full?: number | null;
          baths_half?: number | null;
          beds?: number | null;
          city: string;
          courtesy_of?: string | null;
          created_at?: string;
          description?: string | null;
          featured_rank?: number | null;
          geom?: unknown;
          hidden?: boolean | null;
          id?: string;
          is_featured?: boolean | null;
          lat?: number | null;
          lead_capture_required?: boolean;
          list_price: number;
          listing_agent_id?: string | null;
          listing_kind?: string;
          living_sqft?: number | null;
          lng?: number | null;
          lot_acres?: number | null;
          mls_id: string;
          mls_id_locked?: boolean;
          neighborhood_id?: string | null;
          property_type: string;
          publication_status?: string;
          raw?: Json | null;
          slug: string;
          sold_date?: string | null;
          sold_price?: number | null;
          state?: string | null;
          status: Database['public']['Enums']['listing_status'];
          stories?: number | null;
          synced_at?: string | null;
          title?: string;
          updated_at?: string;
          year_built?: number | null;
          zip?: string | null;
        };
        Update: {
          address_line?: string;
          baths_full?: number | null;
          baths_half?: number | null;
          beds?: number | null;
          city?: string;
          courtesy_of?: string | null;
          created_at?: string;
          description?: string | null;
          featured_rank?: number | null;
          geom?: unknown;
          hidden?: boolean | null;
          id?: string;
          is_featured?: boolean | null;
          lat?: number | null;
          lead_capture_required?: boolean;
          list_price?: number;
          listing_agent_id?: string | null;
          listing_kind?: string;
          living_sqft?: number | null;
          lng?: number | null;
          lot_acres?: number | null;
          mls_id?: string;
          mls_id_locked?: boolean;
          neighborhood_id?: string | null;
          property_type?: string;
          publication_status?: string;
          raw?: Json | null;
          slug?: string;
          sold_date?: string | null;
          sold_price?: number | null;
          state?: string | null;
          status?: Database['public']['Enums']['listing_status'];
          stories?: number | null;
          synced_at?: string | null;
          title?: string;
          updated_at?: string;
          year_built?: number | null;
          zip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listings_listing_agent_id_fkey';
            columns: ['listing_agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'listings_neighborhood_id_fkey';
            columns: ['neighborhood_id'];
            isOneToOne: false;
            referencedRelation: 'neighborhoods';
            referencedColumns: ['id'];
          },
        ];
      };
      message_templates: {
        Row: {
          body: string;
          channel: string;
          created_at: string;
          id: string;
          name: string;
          subject: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          channel: string;
          created_at?: string;
          id?: string;
          name: string;
          subject?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          channel?: string;
          created_at?: string;
          id?: string;
          name?: string;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      neighborhood_pois: {
        Row: {
          address: string | null;
          category: string | null;
          created_at: string;
          distance_mi: number | null;
          fetched_at: string | null;
          id: string;
          lat: number | null;
          lng: number | null;
          name: string;
          neighborhood_id: string;
          rating: number | null;
          review_count: number | null;
          updated_at: string;
          yelp_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          category?: string | null;
          created_at?: string;
          distance_mi?: number | null;
          fetched_at?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name: string;
          neighborhood_id: string;
          rating?: number | null;
          review_count?: number | null;
          updated_at?: string;
          yelp_url?: string | null;
        };
        Update: {
          address?: string | null;
          category?: string | null;
          created_at?: string;
          distance_mi?: number | null;
          fetched_at?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          neighborhood_id?: string;
          rating?: number | null;
          review_count?: number | null;
          updated_at?: string;
          yelp_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'neighborhood_pois_neighborhood_id_fkey';
            columns: ['neighborhood_id'];
            isOneToOne: false;
            referencedRelation: 'neighborhoods';
            referencedColumns: ['id'];
          },
        ];
      };
      neighborhood_stats: {
        Row: {
          created_at: string;
          fetched_at: string | null;
          id: string;
          neighborhood_id: string;
          payload: NonNullable<Json>;
          source: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          fetched_at?: string | null;
          id?: string;
          neighborhood_id: string;
          payload: NonNullable<Json>;
          source: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          fetched_at?: string | null;
          id?: string;
          neighborhood_id?: string;
          payload?: NonNullable<Json>;
          source?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'neighborhood_stats_neighborhood_id_fkey';
            columns: ['neighborhood_id'];
            isOneToOne: false;
            referencedRelation: 'neighborhoods';
            referencedColumns: ['id'];
          },
        ];
      };
      neighborhoods: {
        Row: {
          blurb: string | null;
          boundary: unknown;
          created_at: string;
          hero_path: string | null;
          id: string;
          lat: number | null;
          lng: number | null;
          name: string;
          slug: string;
          sort_order: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          blurb?: string | null;
          boundary?: unknown;
          created_at?: string;
          hero_path?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name: string;
          slug: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Update: {
          blurb?: string | null;
          boundary?: unknown;
          created_at?: string;
          hero_path?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null;
          created_at: string;
          email: string;
          id: string;
          status: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          confirmed_at?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          confirmed_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          lead_id: string | null;
          read_at: string | null;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          read_at?: string | null;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          read_at?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      pipeline_stages: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          outcome: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          color: string;
          created_at?: string;
          id?: string;
          name: string;
          outcome: string;
          sort_order: number;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          outcome?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          agent_id: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          notification_prefs: Json | null;
          phone: string | null;
          role: Database['public']['Enums']['profile_role'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          agent_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          notification_prefs?: Json | null;
          phone?: string | null;
          role?: Database['public']['Enums']['profile_role'];
          updated_at?: string;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          notification_prefs?: Json | null;
          phone?: string | null;
          role?: Database['public']['Enums']['profile_role'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
      };
      redirects: {
        Row: {
          created_at: string;
          from_path: string;
          id: string;
          status_code: number | null;
          to_path: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          from_path: string;
          id?: string;
          status_code?: number | null;
          to_path: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          from_path?: string;
          id?: string;
          status_code?: number | null;
          to_path?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_homes: {
        Row: {
          created_at: string;
          id: string;
          listing_id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          listing_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          listing_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_homes_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_searches: {
        Row: {
          channels: string[] | null;
          created_at: string;
          filters: NonNullable<Json>;
          frequency: string | null;
          id: string;
          last_sent_at: string | null;
          name: string;
          polygon: unknown;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          channels?: string[] | null;
          created_at?: string;
          filters: NonNullable<Json>;
          frequency?: string | null;
          id?: string;
          last_sent_at?: string | null;
          name: string;
          polygon?: unknown;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          channels?: string[] | null;
          created_at?: string;
          filters?: NonNullable<Json>;
          frequency?: string | null;
          id?: string;
          last_sent_at?: string | null;
          name?: string;
          polygon?: unknown;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      schools: {
        Row: {
          category: string | null;
          created_at: string;
          grades: string | null;
          id: string;
          level: string | null;
          name: string;
          neighborhood_id: string;
          rating: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category?: string | null;
          created_at?: string;
          grades?: string | null;
          id?: string;
          level?: string | null;
          name: string;
          neighborhood_id: string;
          rating?: number | null;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          grades?: string | null;
          id?: string;
          level?: string | null;
          name?: string;
          neighborhood_id?: string;
          rating?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'schools_neighborhood_id_fkey';
            columns: ['neighborhood_id'];
            isOneToOne: false;
            referencedRelation: 'neighborhoods';
            referencedColumns: ['id'];
          },
        ];
      };
      showing_requests: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          ends_at: string;
          id: string;
          kind: string;
          lead_id: string;
          listing_id: string | null;
          meeting_type: string | null;
          notes: string;
          starts_at: string;
          status: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          ends_at: string;
          id?: string;
          kind?: string;
          lead_id: string;
          listing_id?: string | null;
          meeting_type?: string | null;
          notes?: string;
          starts_at: string;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          ends_at?: string;
          id?: string;
          kind?: string;
          lead_id?: string;
          listing_id?: string | null;
          meeting_type?: string | null;
          notes?: string;
          starts_at?: string;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'showing_requests_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'showing_requests_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'showing_requests_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      site_settings: {
        Row: {
          created_at: string;
          id: string;
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          created_at?: string;
          id?: string;
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
      social_posts: {
        Row: {
          alt: string;
          created_at: string;
          id: string;
          image_path: string;
          permalink: string;
          sort_order: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          alt: string;
          created_at?: string;
          id?: string;
          image_path: string;
          permalink: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Update: {
          alt?: string;
          created_at?: string;
          id?: string;
          image_path?: string;
          permalink?: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          assigned_to: string | null;
          automation_key: string | null;
          completed_at: string | null;
          created_at: string;
          due_at: string | null;
          id: string;
          lead_id: string | null;
          listing_id: string | null;
          notes: string;
          status: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          assigned_to?: string | null;
          automation_key?: string | null;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          lead_id?: string | null;
          listing_id?: string | null;
          notes?: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          automation_key?: string | null;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          lead_id?: string | null;
          listing_id?: string | null;
          notes?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      testimonials: {
        Row: {
          agent_id: string | null;
          body: string;
          created_at: string;
          id: string;
          is_featured: boolean | null;
          rating: number | null;
          reviewer_name: string;
          sort_order: number | null;
          source: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          agent_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          is_featured?: boolean | null;
          rating?: number | null;
          reviewer_name: string;
          sort_order?: number | null;
          source?: string | null;
          updated_at?: string;
        };
        Update: {
          agent_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          is_featured?: boolean | null;
          rating?: number | null;
          reviewer_name?: string;
          sort_order?: number | null;
          source?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'testimonials_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
      };
      valuation_requests: {
        Row: {
          address: string;
          confidence: string | null;
          created_at: string;
          geom: unknown;
          id: string;
          lat: number | null;
          lead_id: string;
          lng: number | null;
          result: Json | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address: string;
          confidence?: string | null;
          created_at?: string;
          geom?: unknown;
          id?: string;
          lat?: number | null;
          lead_id: string;
          lng?: number | null;
          result?: Json | null;
          updated_at?: string;
        };
        Update: {
          address?: string;
          confidence?: string | null;
          created_at?: string;
          geom?: unknown;
          id?: string;
          lat?: number | null;
          lead_id?: string;
          lng?: number | null;
          result?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'valuation_requests_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_rate_limit: {
        Args: { bucket: string; max_hits?: number; window_seconds?: number };
        Returns: boolean;
      };
      comps_for_valuation: {
        Args: { baths: number; beds: number; lat: number; lng: number; sqft: number; type: string };
        Returns: {
          address_line: string;
          baths_full: number | null;
          baths_half: number | null;
          beds: number | null;
          city: string;
          courtesy_of: string | null;
          created_at: string;
          description: string | null;
          featured_rank: number | null;
          geom: unknown;
          hidden: boolean | null;
          id: string;
          is_featured: boolean | null;
          lat: number | null;
          lead_capture_required: boolean;
          list_price: number;
          listing_agent_id: string | null;
          listing_kind: string;
          living_sqft: number | null;
          lng: number | null;
          lot_acres: number | null;
          mls_id: string;
          mls_id_locked: boolean;
          neighborhood_id: string | null;
          property_type: string;
          publication_status: string;
          raw: Json | null;
          slug: string;
          sold_date: string | null;
          sold_price: number | null;
          state: string | null;
          status: Database['public']['Enums']['listing_status'];
          stories: number | null;
          synced_at: string | null;
          title: string;
          updated_at: string;
          year_built: number | null;
          zip: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'listings';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      listings_in_polygon: {
        Args: { polygon: Json };
        Returns: {
          address_line: string;
          baths_full: number | null;
          baths_half: number | null;
          beds: number | null;
          city: string;
          courtesy_of: string | null;
          created_at: string;
          description: string | null;
          featured_rank: number | null;
          geom: unknown;
          hidden: boolean | null;
          id: string;
          is_featured: boolean | null;
          lat: number | null;
          lead_capture_required: boolean;
          list_price: number;
          listing_agent_id: string | null;
          listing_kind: string;
          living_sqft: number | null;
          lng: number | null;
          lot_acres: number | null;
          mls_id: string;
          mls_id_locked: boolean;
          neighborhood_id: string | null;
          property_type: string;
          publication_status: string;
          raw: Json | null;
          slug: string;
          sold_date: string | null;
          sold_price: number | null;
          state: string | null;
          status: Database['public']['Enums']['listing_status'];
          stories: number | null;
          synced_at: string | null;
          title: string;
          updated_at: string;
          year_built: number | null;
          zip: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'listings';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      platform_apply: { Args: { lock_key?: string; operations: Json }; Returns: undefined };
      search_listings: {
        Args: { filters?: Json; page_limit?: number; page_offset?: number; sort?: string };
        Returns: Json;
      };
      similar_listings: {
        Args: { listing_id: string };
        Returns: {
          address_line: string;
          baths_full: number | null;
          baths_half: number | null;
          beds: number | null;
          city: string;
          courtesy_of: string | null;
          created_at: string;
          description: string | null;
          featured_rank: number | null;
          geom: unknown;
          hidden: boolean | null;
          id: string;
          is_featured: boolean | null;
          lat: number | null;
          lead_capture_required: boolean;
          list_price: number;
          listing_agent_id: string | null;
          listing_kind: string;
          living_sqft: number | null;
          lng: number | null;
          lot_acres: number | null;
          mls_id: string;
          mls_id_locked: boolean;
          neighborhood_id: string | null;
          property_type: string;
          publication_status: string;
          raw: Json | null;
          slug: string;
          sold_date: string | null;
          sold_price: number | null;
          state: string | null;
          status: Database['public']['Enums']['listing_status'];
          stories: number | null;
          synced_at: string | null;
          title: string;
          updated_at: string;
          year_built: number | null;
          zip: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'listings';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      submit_lead_bundle: { Args: { payload: Json }; Returns: string };
    };
    Enums: {
      consent_channel: 'email_phone' | 'sms' | 'newsletter';
      feature_group: 'interior' | 'area_lot' | 'exterior' | 'financial';
      lead_source: 'contact' | 'valuation' | 'showing' | 'newsletter' | 'agent' | 'progressive';
      lead_status: 'new' | 'contacted' | 'closed';
      listing_status: 'for_sale' | 'pending' | 'sold';
      profile_role: 'user' | 'agent' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      consent_channel: ['email_phone', 'sms', 'newsletter'],
      feature_group: ['interior', 'area_lot', 'exterior', 'financial'],
      lead_source: ['contact', 'valuation', 'showing', 'newsletter', 'agent', 'progressive'],
      lead_status: ['new', 'contacted', 'closed'],
      listing_status: ['for_sale', 'pending', 'sold'],
      profile_role: ['user', 'agent', 'admin'],
    },
  },
} as const;

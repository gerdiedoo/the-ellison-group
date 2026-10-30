import type { Base, Json } from '@/lib/types';
export type PipelineStage = Base & {
  name: string;
  sort_order: number;
  outcome: 'open' | 'won' | 'lost';
  color: string;
};
export type LeadProperty = Base & { lead_id: string; listing_id: string; source_page: string };
export type Activity = Base & {
  lead_id: string | null;
  listing_id: string | null;
  conversation_id: string | null;
  actor_id: string | null;
  kind: string;
  body: string;
  payload: Json;
  is_internal: boolean;
};
export type Conversation = Base & {
  session_hash: string;
  lead_id: string | null;
  listing_id: string | null;
  assigned_to: string | null;
  mode: 'ai' | 'human';
  status: 'open' | 'waiting' | 'resolved';
  summary: string;
  recommendation: string;
  ai_status: 'unconfigured' | 'ready' | 'failed';
  last_message_at: string;
};
export type ChatMessage = Base & {
  conversation_id: string;
  role: 'visitor' | 'assistant' | 'agent' | 'system';
  body: string;
  is_internal: boolean;
  actor_id: string | null;
  request_id: string | null;
  provider: string | null;
  reply_to?: string | null;
  property_ids?: string[] | null;
};
export type Task = Base & {
  title: string;
  lead_id: string | null;
  listing_id: string | null;
  assigned_to: string | null;
  due_at: string | null;
  status: 'open' | 'completed';
  notes: string;
  completed_at: string | null;
  automation_key: string | null;
};
export type AutomationRule = Base & {
  name: string;
  event:
    | 'lead_created'
    | 'inquiry_submitted'
    | 'lead_assigned'
    | 'appointment_scheduled'
    | 'follow_up_due'
    | 'lead_uncontacted';
  enabled: boolean;
  action: 'create_task' | 'internal_notification';
  delay_hours: number;
  task_title: string;
  assigned_to: string | null;
};
export type AutomationRun = Base & {
  rule_id: string;
  event_key: string;
  status: 'completed' | 'failed';
  result: string;
};
export type Notification = Base & {
  user_id: string | null;
  title: string;
  body: string;
  lead_id: string | null;
  read_at: string | null;
};
export type MessageTemplate = Base & {
  name: string;
  channel: 'email' | 'sms' | 'internal';
  subject: string;
  body: string;
};
export type Campaign = Base & {
  name: string;
  slug: string;
  status: 'draft' | 'active' | 'archived';
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  description: string;
  listing_id: string | null;
};
export type LeadIdentity = Base & { normalized_email: string; lead_id: string };
export type PlatformTables = {
  pipeline_stages: PipelineStage;
  lead_properties: LeadProperty;
  activities: Activity;
  conversations: Conversation;
  conversation_messages: ChatMessage;
  tasks: Task;
  automation_rules: AutomationRule;
  automation_runs: AutomationRun;
  notifications: Notification;
  message_templates: MessageTemplate;
  campaigns: Campaign;
  lead_identities: LeadIdentity;
};
export type CaptureConfig = {
  enabled: boolean;
  property_ids: string[];
  detail_mode: 'immediate' | 'action';
  allow_basic_browsing: boolean;
  actions: ('save' | 'showing' | 'contact')[];
  required_fields: ('full_name' | 'email' | 'phone')[];
  google_enabled: boolean;
};
export type AssistantConfig = { enabled: boolean; instructions: string; approved_faq: string };

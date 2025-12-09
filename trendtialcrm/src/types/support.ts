// src/types/support.ts
// Support Agent Types and Interfaces

import { UserProfile } from './index';

// ==================== TICKET TYPES ====================

export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed' | 'escalated';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
export type TicketCategory = 
  | 'technical_issue' 
  | 'billing' 
  | 'account' 
  | 'feature_request' 
  | 'bug_report' 
  | 'general_inquiry'
  | 'complaint'
  | 'feedback'
  | 'other';

export type TicketChannel = 'email' | 'chat' | 'phone' | 'voice' | 'web_form' | 'social_media' | 'whatsapp';

export interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  channel: TicketChannel;
  needs_human_review?: boolean;
  resolution?: string;
  
  // Customer Info
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_avatar?: string;
  
  // Assignment
  assigned_to?: string;
  assigned_agent?: Pick<UserProfile, 'id' | 'full_name' | 'email'>;
  
  // AI Classification
  ai_category?: string;
  ai_confidence?: number;
  ai_suggested_response?: string;
  ai_sentiment?: 'positive' | 'neutral' | 'negative';
  ai_priority_suggestion?: TicketPriority;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  
  // SLA
  sla_deadline?: string;
  sla_breached: boolean;
  
  // Tags & Metadata
  tags: string[];
  metadata?: Record<string, any>;
  
  // Related
  messages?: TicketMessage[];
  messages_count?: number;
  attachments_count?: number;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'customer' | 'agent' | 'system' | 'ai_bot';
  sender_id?: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  content_type: 'text' | 'html' | 'markdown';
  
  // Attachments
  attachments?: TicketAttachment[];
  
  // AI Features
  is_ai_generated: boolean;
  ai_suggested: boolean;
  
  // Read Status
  is_read: boolean;
  read_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id?: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface TicketNote {
  id: string;
  ticket_id: string;
  agent_id: string;
  agent_name: string;
  content: string;
  is_private: boolean;
  created_at: string;
}

// ==================== KNOWLEDGE BASE TYPES ====================

export type KBArticleStatus = 'draft' | 'published' | 'archived';
export type KBArticleType = 'faq' | 'guide' | 'troubleshooting' | 'how_to' | 'policy' | 'announcement';

export interface KBCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  order_position: number;
  articles_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category_id: string;
  category?: KBCategory;
  type: KBArticleType;
  status: KBArticleStatus;
  
  // Author
  author_id: string;
  author?: Pick<UserProfile, 'id' | 'full_name' | 'email'>;
  
  // SEO & Search
  keywords: string[];
  tags: string[];
  
  // Metrics
  views_count: number;
  helpful_count: number;
  not_helpful_count: number;
  
  // AI Features
  embedding_vector?: number[];
  ai_generated: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  
  // Related
  related_articles?: string[];
}

export interface KBSearchResult {
  article: KBArticle;
  score: number;
  highlight?: string;
  matched_keywords?: string[];
}

// ==================== SUPPORT STATS TYPES ====================

export interface SupportStats {
  // Ticket Stats
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_today: number;
  avg_response_time_minutes: number;
  avg_resolution_time_hours: number;
  sla_compliance_rate: number;
  customer_satisfaction_score: number;
  
  // Channel Distribution
  tickets_by_channel: Record<TicketChannel, number>;
  
  // Category Distribution
  tickets_by_category: Record<TicketCategory, number>;
  
  // Priority Distribution
  tickets_by_priority: Record<TicketPriority, number>;
  
  // AI Stats
  ai_auto_classified: number;
  ai_suggested_used: number;
  ai_accuracy_rate: number;
  
  // KB Stats
  total_kb_articles: number;
  kb_searches_today: number;
  kb_helpful_rate: number;
  
  // Agent Stats
  active_agents: number;
  tickets_per_agent: number;
}

export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  agent_avatar?: string;
  tickets_handled: number;
  tickets_resolved: number;
  avg_response_time_minutes: number;
  avg_resolution_time_hours: number;
  customer_satisfaction: number;
  sla_compliance: number;
}

// ==================== FILTER & SORT TYPES ====================

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  channel?: TicketChannel[];
  assigned_to?: string[];
  tags?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
  sla_breached?: boolean;
  unassigned?: boolean;
}

export interface TicketSortOptions {
  field: 'created_at' | 'updated_at' | 'priority' | 'status' | 'sla_deadline';
  direction: 'asc' | 'desc';
}

export interface KBFilters {
  category_id?: string;
  status?: KBArticleStatus;
  type?: KBArticleType;
  tags?: string[];
  search?: string;
}

// ==================== CREATE/UPDATE TYPES ====================

export interface CreateTicketData {
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  channel?: TicketChannel;
  customer_name?: string;
  customer_email: string;
  customer_phone?: string;
  tags?: string[];
}

export interface UpdateTicketData {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  tags?: string[];
  needs_human_review?: boolean;
  resolution?: string;
}

export interface CreateTicketMessageData {
  ticket_id: string;
  content: string;
  content_type?: 'text' | 'html' | 'markdown';
  sender_type?: 'customer' | 'agent' | 'system' | 'ai_bot';
  sender_id?: string;
  sender_name?: string;
  is_ai_generated?: boolean;
}

export interface CreateKBArticleData {
  title: string;
  content: string;
  excerpt?: string;
  category_id: string;
  type: KBArticleType;
  status?: KBArticleStatus;
  keywords?: string[];
  tags?: string[];
}

export interface UpdateKBArticleData {
  title?: string;
  content?: string;
  excerpt?: string;
  category_id?: string;
  type?: KBArticleType;
  status?: KBArticleStatus;
  keywords?: string[];
  tags?: string[];
}

// ==================== CANNED RESPONSES ====================

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  shortcut?: string;
  is_active: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ==================== VOICE SUPPORT ====================

export interface VoiceCall {
  id: string;
  ticket_id?: string;
  customer_phone: string;
  customer_name?: string;
  agent_id?: string;
  status: 'ringing' | 'in_progress' | 'on_hold' | 'completed' | 'missed' | 'voicemail';
  direction: 'inbound' | 'outbound';
  duration_seconds?: number;
  recording_url?: string;
  transcript?: string;
  ai_summary?: string;
  created_at: string;
  ended_at?: string;
}

// ==================== EMAIL TEMPLATES ====================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'welcome' | 'response' | 'resolution' | 'escalation' | 'feedback' | 'custom';
  variables: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ==================== AUTOMATION RULES ====================

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'ticket_created' | 'ticket_updated' | 'sla_breach' | 'no_response' | 'keyword_match';
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  is_active: boolean;
  priority: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface AutomationAction {
  type: 'assign_agent' | 'set_priority' | 'set_category' | 'add_tag' | 'send_email' | 'send_notification' | 'escalate';
  value: string;
}

// ==================== LIVE CHAT ====================

export interface LiveChatSession {
  id: string;
  ticket_id?: string;
  visitor_id: string;
  visitor_name?: string;
  visitor_email?: string;
  agent_id?: string;
  status: 'waiting' | 'active' | 'closed';
  messages: ChatMessage[];
  started_at: string;
  ended_at?: string;
  rating?: number;
  feedback?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'visitor' | 'agent' | 'bot';
  sender_name: string;
  content: string;
  is_typing?: boolean;
  created_at: string;
}

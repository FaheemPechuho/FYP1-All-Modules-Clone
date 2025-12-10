/**
 * Sales Hub Type Definitions
 * 
 * Types for AI-powered sales calls, analytics, and lead qualification
 * Used by Sales Hub page and related components
 * 
 * @author Faheem
 */

// =============================================================================
// CALL TYPES
// =============================================================================

/**
 * Call status during AI voice interaction
 */
export type CallStatus = 'idle' | 'connecting' | 'active' | 'ending' | 'completed' | 'failed';

/**
 * Call outcome classification
 */
export type CallOutcome = 
  | 'completed' 
  | 'qualified' 
  | 'not_interested' 
  | 'callback_requested' 
  | 'no_answer' 
  | 'failed'
  | 'voicemail';

/**
 * Lead qualification status from BANT framework
 */
export type QualificationStatus = 
  | 'unqualified' 
  | 'marketing_qualified' 
  | 'sales_qualified' 
  | 'opportunity';

/**
 * BANT Assessment breakdown
 */
export interface BANTAssessment {
  budget: 'unknown' | 'low' | 'medium' | 'high';
  authority: 'unknown' | 'no' | 'yes' | 'influencer';
  need: 'unknown' | 'low' | 'medium' | 'high' | 'urgent';
  timeline: 'unknown' | 'no_timeline' | 'future' | 'this_quarter' | 'immediate';
}

/**
 * AI Call record from backend
 */
export interface AICall {
  id: string;
  lead_id: string;
  user_id: string | null;
  session_id: string;
  duration: number; // in seconds
  call_type: 'inbound' | 'outbound' | 'callback' | 'voicemail';
  outcome: CallOutcome;
  notes: string | null;
  transcript: string | null;
  call_start_time: string;
  call_end_time: string | null;
  created_at: string;
  
  // AI-specific fields
  sentiment_score: number | null; // -1.0 to 1.0
  intent_detected: string | null;
  confidence_score: number | null; // 0.0 to 1.0
  
  // Relations
  lead?: {
    id: string;
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    lead_score: number | null;
  };
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Call session for live AI calls
 */
export interface CallSession {
  sessionId: string;
  leadId: string;
  status: CallStatus;
  startTime: Date;
  duration: number;
  currentTranscript: string[];
  qualificationStatus: QualificationStatus;
  leadScore: number;
  bant: BANTAssessment;
  lastUpdate: Date;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

/**
 * Call statistics summary
 */
export interface CallStatistics {
  totalCalls: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  successRate: number;
  qualificationRate: number;
  outcomes: Record<string, number>;
  callsByDay: { date: string; count: number }[];
  qualificationBreakdown: {
    unqualified: number;
    marketing_qualified: number;
    sales_qualified: number;
    opportunity: number;
  };
}

/**
 * Lead score distribution
 */
export interface LeadScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

/**
 * BANT completion stats
 */
export interface BANTStats {
  budgetIdentified: number;
  authorityConfirmed: number;
  needAssessed: number;
  timelineEstablished: number;
  total: number;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Start AI call request
 */
export interface StartCallRequest {
  leadId: string;
  userId?: string;
}

/**
 * Start AI call response
 */
export interface StartCallResponse {
  success: boolean;
  sessionId: string;
  message: string;
  callId?: string;
}

/**
 * Call status response
 */
export interface CallStatusResponse {
  sessionId: string;
  status: CallStatus;
  duration: number;
  transcript: string[];
  qualificationStatus: QualificationStatus;
  leadScore: number;
  bant: BANTAssessment;
}

/**
 * End call request
 */
export interface EndCallRequest {
  sessionId: string;
  outcome?: CallOutcome;
}

/**
 * End call response with summary
 */
export interface EndCallResponse {
  success: boolean;
  callId: string;
  summary: {
    duration: number;
    outcome: CallOutcome;
    qualificationStatus: QualificationStatus;
    leadScore: number;
    bant: BANTAssessment;
    transcript: string;
    nextSteps: string;
  };
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

/**
 * Props for CallDashboard component
 */
export interface CallDashboardProps {
  stats: CallStatistics | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

/**
 * Props for AICallPanel component
 */
export interface AICallPanelProps {
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  onCallStart?: (sessionId: string) => void;
  onCallEnd?: (summary: EndCallResponse['summary']) => void;
}

/**
 * Props for RecentAICalls component
 */
export interface RecentAICallsProps {
  calls: AICall[];
  isLoading: boolean;
  onCallSelect?: (call: AICall) => void;
  onViewAll?: () => void;
  limit?: number;
}

/**
 * Props for CallAnalytics component
 */
export interface CallAnalyticsProps {
  stats: CallStatistics | null;
  isLoading: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}


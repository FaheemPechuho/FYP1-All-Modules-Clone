/**
 * Gemini AI Service
 * 
 * Direct integration with Google Gemini API for content generation.
 * This service provides fallback content generation when the Clara backend
 * is unavailable.
 * 
 * API Key: Uses the provided Gemini API key directly
 * Model: gemini-1.5-flash (fast and efficient for marketing content)
 * 
 * @author Sheryar
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Gemini API Configuration
 * API Key provided by user for direct frontend integration
 */
const GEMINI_API_KEY = 'AIzaSyADeYgcwx3_wLr8zNxnQJIV4cMYxT-59CA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface LeadInfo {
  id: string;
  name?: string;
  company?: string;
  industry?: string;
  email?: string;
  phone?: string;
  deal_value?: number;
  status_bucket?: string;
  notes?: string;
}

export interface GeneratedEmailContent {
  subject_line: string;
  preview_text: string;
  greeting: string;
  body: string;
  cta: string;
  signature: string;
  ps_line: string | null;
  email_type: string;
  tone: string;
  lead_id: string;
}

export interface GeneratedSMSContent {
  message: string;
  character_count: number;
  has_link_placeholder: boolean;
  urgency_level: 'low' | 'medium' | 'high';
  sms_type: string;
  lead_id: string;
}

export interface GeneratedCallScriptContent {
  opener: string;
  introduction: string;
  value_proposition: string;
  qualifying_questions: string[];
  pain_point_probes: string[];
  objection_handlers: {
    no_time: string;
    not_interested: string;
    using_competitor: string;
    no_budget: string;
    send_info: string;
  };
  closing: string;
  voicemail_script: string;
  estimated_duration: string;
  objective: string;
  lead_id: string;
}

export interface GeneratedAdContent {
  headlines: string[];
  primary_text: string;
  description: string;
  cta_button: string;
  hooks: string[];
  hashtags: string[];
  emoji_suggestions: string[];
  a_b_variations: Array<{ headline: string; primary_text: string }>;
  platform: string;
  objective: string;
}

// =============================================================================
// PROMPTS
// =============================================================================

const SYSTEM_PROMPT = `You are Clara, an expert AI marketing assistant. Your role is to:
1. Generate personalized, high-converting marketing content
2. Be concise and value-focused
3. Always respond with valid JSON only - no extra text or markdown

Guidelines:
- Keep content scannable and action-oriented
- Focus on benefits, not features
- Use industry-appropriate language
- Include clear calls-to-action`;

const EMAIL_PROMPT = (lead: LeadInfo, emailType: string, tone: string) => `
Generate a personalized ${emailType} email with a ${tone} tone.

Lead Info:
- Name: ${lead.name || 'there'}
- Company: ${lead.company || 'their company'}
- Industry: ${lead.industry || 'B2B'}
- Deal Value: $${lead.deal_value || 0}
- Status: ${lead.status_bucket || 'New'}

Return ONLY this JSON (no markdown, no extra text):
{
  "subject_line": "compelling subject under 50 chars",
  "preview_text": "preview under 100 chars",
  "greeting": "Hi ${lead.name || 'there'},",
  "body": "2-3 paragraphs of personalized email body",
  "cta": "clear call to action",
  "signature": "Best regards,\\n[Your Name]",
  "ps_line": "optional PS or null"
}`;

const SMS_PROMPT = (lead: LeadInfo, smsType: string) => `
Generate a ${smsType} SMS message for this lead.

Lead Info:
- Name: ${lead.name || ''}
- Company: ${lead.company || ''}
- Status: ${lead.status_bucket || 'New'}

Return ONLY this JSON (no markdown):
{
  "message": "SMS text under 160 characters",
  "character_count": 0,
  "has_link_placeholder": false,
  "urgency_level": "medium"
}`;

const CALL_SCRIPT_PROMPT = (lead: LeadInfo, objective: string) => `
Generate a ${objective} cold call script.

Lead Info:
- Name: ${lead.name || 'the prospect'}
- Company: ${lead.company || 'their company'}
- Industry: ${lead.industry || 'B2B'}
- Status: ${lead.status_bucket || 'New'}

Return ONLY this JSON (no markdown):
{
  "opener": "Hook them in first 10 seconds",
  "introduction": "Who you are and why calling",
  "value_proposition": "What's in it for them",
  "qualifying_questions": ["question1", "question2", "question3"],
  "pain_point_probes": ["probe1", "probe2"],
  "objection_handlers": {
    "no_time": "response for no time",
    "not_interested": "response for not interested",
    "using_competitor": "response for using competitor",
    "no_budget": "response for no budget",
    "send_info": "response for send info request"
  },
  "closing": "Push for next step",
  "voicemail_script": "30 second voicemail",
  "estimated_duration": "5-10 minutes"
}`;

const AD_COPY_PROMPT = (platform: string, industry: string, objective: string) => `
Generate ${platform} ad copy for ${industry} industry with ${objective} objective.

Return ONLY this JSON (no markdown):
{
  "headlines": ["headline1 (max 30 chars)", "headline2", "headline3"],
  "primary_text": "main ad copy (keep it concise for ${platform})",
  "description": "supporting text",
  "cta_button": "Learn More",
  "hooks": ["attention hook 1", "attention hook 2"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "emoji_suggestions": ["🚀", "✅", "💼"],
  "a_b_variations": [
    {"headline": "variation 1 headline", "primary_text": "variation 1 text"},
    {"headline": "variation 2 headline", "primary_text": "variation 2 text"}
  ]
}`;

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Call Gemini API with a prompt
 */
async function callGeminiAPI(prompt: string): Promise<any> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No content in Gemini response');
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonText = text;
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0];
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0];
    }
    
    // Find JSON object in text
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd);
    }

    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// =============================================================================
// CONTENT GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate email content using Gemini
 */
export async function generateEmailWithGemini(
  lead: LeadInfo,
  emailType: string = 'follow_up',
  tone: string = 'professional'
): Promise<GeneratedEmailContent> {
  try {
    const result = await callGeminiAPI(EMAIL_PROMPT(lead, emailType, tone));
    return {
      ...result,
      email_type: emailType,
      tone: tone,
      lead_id: lead.id
    };
  } catch (error) {
    console.error('Email generation error:', error);
    // Return fallback content
    return getFallbackEmail(lead, emailType, tone);
  }
}

/**
 * Generate SMS content using Gemini
 */
export async function generateSMSWithGemini(
  lead: LeadInfo,
  smsType: string = 'quick_follow_up'
): Promise<GeneratedSMSContent> {
  try {
    const result = await callGeminiAPI(SMS_PROMPT(lead, smsType));
    return {
      ...result,
      character_count: result.message?.length || 0,
      sms_type: smsType,
      lead_id: lead.id
    };
  } catch (error) {
    console.error('SMS generation error:', error);
    return getFallbackSMS(lead, smsType);
  }
}

/**
 * Generate call script using Gemini
 */
export async function generateCallScriptWithGemini(
  lead: LeadInfo,
  objective: string = 'discovery'
): Promise<GeneratedCallScriptContent> {
  try {
    const result = await callGeminiAPI(CALL_SCRIPT_PROMPT(lead, objective));
    return {
      ...result,
      objective: objective,
      lead_id: lead.id
    };
  } catch (error) {
    console.error('Call script generation error:', error);
    return getFallbackCallScript(lead, objective);
  }
}

/**
 * Generate ad copy using Gemini
 */
export async function generateAdCopyWithGemini(
  platform: string = 'facebook',
  industry: string = 'B2B',
  objective: string = 'awareness'
): Promise<GeneratedAdContent> {
  try {
    const result = await callGeminiAPI(AD_COPY_PROMPT(platform, industry, objective));
    return {
      ...result,
      platform: platform,
      objective: objective
    };
  } catch (error) {
    console.error('Ad copy generation error:', error);
    return getFallbackAdCopy(platform, objective);
  }
}

// =============================================================================
// FALLBACK CONTENT
// =============================================================================

function getFallbackEmail(lead: LeadInfo, emailType: string, tone: string): GeneratedEmailContent {
  const name = lead.name || 'there';
  const company = lead.company || '';
  
  return {
    subject_line: `Quick follow-up${company ? ` for ${company}` : ''}`,
    preview_text: "I wanted to reach out and see how things are going",
    greeting: `Hi ${name},`,
    body: `I hope this message finds you well.\n\nI wanted to follow up on our previous conversation and see if you had any questions about how we can help ${company || 'your business'}.\n\nI'd love to schedule a quick call to discuss your specific needs and explore how we might be able to support your goals.`,
    cta: "Would you have 15 minutes this week for a quick chat?",
    signature: "Best regards,\n[Your Name]",
    ps_line: "P.S. I've attached a brief overview of our solutions for your reference.",
    email_type: emailType,
    tone: tone,
    lead_id: lead.id
  };
}

function getFallbackSMS(lead: LeadInfo, smsType: string): GeneratedSMSContent {
  const name = lead.name || '';
  const message = name 
    ? `Hi ${name}, just following up on our conversation. Do you have a few minutes to chat this week? Let me know what works best for you.`
    : `Hi, just following up on our recent conversation. Do you have time for a quick chat this week?`;
  
  return {
    message: message.substring(0, 160),
    character_count: Math.min(message.length, 160),
    has_link_placeholder: false,
    urgency_level: 'medium',
    sms_type: smsType,
    lead_id: lead.id
  };
}

function getFallbackCallScript(lead: LeadInfo, objective: string): GeneratedCallScriptContent {
  const name = lead.name || 'there';
  const company = lead.company || 'your company';
  
  return {
    opener: `Hi ${name}, this is [Your Name] from [Company]. Did I catch you at a good time?`,
    introduction: "I'm reaching out because we help businesses like yours improve their sales process and customer engagement.",
    value_proposition: "We've helped similar companies increase their conversion rates by up to 30% while reducing manual work.",
    qualifying_questions: [
      "What's your biggest challenge with your current sales/marketing process?",
      "How are you currently handling lead management?",
      "What would an ideal solution look like for you?"
    ],
    pain_point_probes: [
      "Tell me more about that challenge - how is it affecting your business?",
      "What have you tried so far to address this?"
    ],
    objection_handlers: {
      no_time: "I completely understand you're busy. When would be a better time for a quick 5-minute chat?",
      not_interested: "No problem at all. Just curious - what solution are you currently using for this?",
      using_competitor: "That's great you have something in place. How's that working out for you?",
      no_budget: "I hear you. Would it help if I showed you the ROI other companies in your industry have seen?",
      send_info: "Happy to! What specific information would be most helpful for your evaluation?"
    },
    closing: `Based on what you've shared, I think we could really help ${company}. Can we schedule a quick 15-minute demo next week?`,
    voicemail_script: `Hi ${name}, this is [Your Name] from [Company]. I'm calling because we help businesses like ${company} with [specific benefit]. I'd love to chat for just a few minutes about how we might help you. Please call me back at [number], or I'll try you again tomorrow. Thanks!`,
    estimated_duration: "5-10 minutes",
    objective: objective,
    lead_id: lead.id
  };
}

function getFallbackAdCopy(platform: string, objective: string): GeneratedAdContent {
  return {
    headlines: [
      "Transform Your Business Today",
      "See Results in 30 Days",
      "Free Demo - Get Started Now"
    ],
    primary_text: "Stop struggling with manual processes and missed opportunities. Our solution helps businesses like yours save time, increase revenue, and delight customers. Join thousands of satisfied users today.",
    description: "The all-in-one platform for modern businesses. Start your free trial.",
    cta_button: "Learn More",
    hooks: [
      "Tired of losing leads to slow follow-ups?",
      "What if you could 3x your conversion rate?"
    ],
    hashtags: ["#BusinessGrowth", "#SalesAutomation", "#CRM", "#Marketing"],
    emoji_suggestions: ["🚀", "✅", "💼", "📈"],
    a_b_variations: [
      {
        headline: "Boost Sales by 30%",
        primary_text: "Our customers see an average 30% increase in sales within 90 days. Start your journey today."
      },
      {
        headline: "Never Miss a Lead Again",
        primary_text: "Automated follow-ups mean no lead falls through the cracks. Try it free for 14 days."
      }
    ],
    platform: platform,
    objective: objective
  };
}

export default {
  generateEmailWithGemini,
  generateSMSWithGemini,
  generateCallScriptWithGemini,
  generateAdCopyWithGemini
};


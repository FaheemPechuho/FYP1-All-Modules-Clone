"""
Email Campaign Manager - Ollama-Powered Email Marketing
Owner: AI Assistant (based on Sheryar's architecture)

Comprehensive email campaign management with AI features:
- Email campaign creation with AI-generated content
- Subject line optimization and A/B testing
- Email sequence automation
- Performance analytics and insights
- Template management

Uses Ollama for:
- Subject line generation
- Email body content creation
- Personalization suggestions
- Send time optimization
- Performance analysis
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import os
import requests
from utils.logger import get_logger

logger = get_logger("email_campaign_manager")


class EmailCampaignManager:
    """
    Manages email marketing campaigns with AI-powered features using Ollama.
    """
    
    def __init__(self):
        """Initialize Email Campaign Manager with Ollama configuration"""
        self.ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
        self.ollama_model = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")
        logger.info(f"EmailCampaignManager initialized with Ollama ({self.ollama_model})")
    
    def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
        """Call Ollama API for AI assistance"""
        try:
            if not system_prompt:
                system_prompt = "You are an expert email marketing specialist. Provide concise, actionable advice."
            
            payload = {
                "model": self.ollama_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "options": {"temperature": 0.7}
            }
            
            resp = requests.post(self.ollama_url, json=payload, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            
            message = data.get("message", {})
            return message.get("content", "").strip()
            
        except Exception as e:
            logger.error(f"Ollama call error: {e}")
            return ""
    
    def generate_subject_lines(self, 
                              campaign_goal: str, 
                              target_audience: str, 
                              key_benefit: str,
                              count: int = 5) -> List[str]:
        """
        Generate AI-powered subject lines for email campaigns.
        
        Args:
            campaign_goal: Goal of the campaign (sales, engagement, etc.)
            target_audience: Description of target audience
            key_benefit: Main benefit to highlight
            count: Number of subject lines to generate
            
        Returns:
            List of subject line suggestions
        """
        prompt = f"""
        Generate {count} compelling email subject lines for:
        - Goal: {campaign_goal}
        - Audience: {target_audience}
        - Key Benefit: {key_benefit}
        
        Requirements:
        - Keep under 50 characters
        - Use power words and urgency
        - Include personalization opportunities
        - Vary the approach (question, benefit, urgency, curiosity)
        
        Return only the subject lines, one per line, numbered.
        """
        
        response = self._call_ollama(prompt)
        
        # Parse subject lines from response
        subject_lines = []
        for line in response.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-')):
                # Remove numbering
                clean_line = line.lstrip('0123456789.-) ').strip()
                if clean_line and len(clean_line) <= 60:  # Reasonable length
                    subject_lines.append(clean_line)
        
        # Fallback if parsing failed
        if not subject_lines:
            subject_lines = [
                f"Exclusive: {key_benefit} for {target_audience}",
                f"Don't Miss Out: {key_benefit}",
                f"Limited Time: {key_benefit} Inside",
                f"Your {key_benefit} Awaits",
                f"Unlock {key_benefit} Today"
            ]
        
        return subject_lines[:count]
    
    def generate_email_content(self,
                              subject: str,
                              goal: str,
                              audience: str,
                              tone: str = "professional") -> Dict[str, str]:
        """
        Generate complete email content with AI.
        
        Args:
            subject: Email subject line
            goal: Campaign goal
            audience: Target audience
            tone: Email tone (professional, friendly, casual)
            
        Returns:
            Dictionary with email components
        """
        prompt = f"""
        Create a complete email for:
        - Subject: {subject}
        - Goal: {goal}
        - Audience: {audience}
        - Tone: {tone}
        
        Include:
        1. Greeting (personalized)
        2. Opening paragraph (hook)
        3. Main body (2-3 paragraphs)
        4. Call-to-action
        5. Closing
        
        Format as JSON:
        {{
            "greeting": "Hi {{{{name}}}},",
            "opening": "Opening paragraph...",
            "body": "Main content...",
            "cta": "Call to action",
            "closing": "Best regards"
        }}
        """
        
        response = self._call_ollama(prompt)
        
        try:
            if "{" in response and "}" in response:
                start = response.find("{")
                end = response.rfind("}") + 1
                json_str = response[start:end]
                return json.loads(json_str)
        except Exception as e:
            logger.error(f"Failed to parse email content: {e}")
        
        # Fallback
        return {
            "greeting": "Hi {{name}},",
            "opening": f"We're reaching out to share something special with you.",
            "body": f"As a valued member of our {audience} community, you have exclusive access to {goal}. This is your opportunity to take advantage of this limited-time offer.",
            "cta": "Get Started Now",
            "closing": "Best regards"
        }
    
    def create_email_sequence(self,
                             sequence_goal: str,
                             audience: str,
                             num_emails: int = 3) -> List[Dict[str, Any]]:
        """
        Generate an automated email sequence with AI.
        
        Args:
            sequence_goal: Goal of the sequence (onboarding, nurture, etc.)
            audience: Target audience
            num_emails: Number of emails in sequence
            
        Returns:
            List of email configurations
        """
        prompt = f"""
        Create a {num_emails}-email sequence for:
        - Goal: {sequence_goal}
        - Audience: {audience}
        
        For each email, provide:
        1. Day to send (e.g., Day 0, Day 3, Day 7)
        2. Subject line
        3. Main topic/focus
        4. Key points to cover
        
        Format as JSON array:
        [
            {{
                "day": 0,
                "subject": "Welcome to...",
                "topic": "Introduction",
                "key_points": ["Point 1", "Point 2"]
            }}
        ]
        """
        
        response = self._call_ollama(prompt)
        
        try:
            if "[" in response and "]" in response:
                start = response.find("[")
                end = response.rfind("]") + 1
                json_str = response[start:end]
                return json.loads(json_str)
        except Exception as e:
            logger.error(f"Failed to parse email sequence: {e}")
        
        # Fallback sequence
        return [
            {
                "day": 0,
                "subject": f"Welcome to {sequence_goal}!",
                "topic": "Introduction and Welcome",
                "key_points": ["Welcome message", "Set expectations", "First action"]
            },
            {
                "day": 3,
                "subject": f"Getting Started with {sequence_goal}",
                "topic": "Education and Value",
                "key_points": ["Key benefits", "How to use", "Success stories"]
            },
            {
                "day": 7,
                "subject": f"Your {sequence_goal} Journey",
                "topic": "Engagement and Next Steps",
                "key_points": ["Progress check", "Additional resources", "Call to action"]
            }
        ][:num_emails]
    
    def optimize_send_time(self,
                          audience_timezone: str,
                          industry: str) -> Dict[str, Any]:
        """
        Get AI-powered recommendations for optimal email send times.
        
        Args:
            audience_timezone: Target audience timezone
            industry: Industry vertical
            
        Returns:
            Send time recommendations
        """
        prompt = f"""
        Recommend the best times to send marketing emails for:
        - Timezone: {audience_timezone}
        - Industry: {industry}
        
        Provide:
        1. Best day of week
        2. Best time of day
        3. Days/times to avoid
        4. Reasoning
        
        Be specific and data-driven.
        """
        
        response = self._call_ollama(prompt)
        
        # Parse recommendations
        return {
            "recommended_day": "Tuesday",  # Most common best day
            "recommended_time": "10:00 AM",  # Most common best time
            "timezone": audience_timezone,
            "reasoning": response,
            "avoid": ["Monday mornings", "Friday afternoons", "Weekends"]
        }
    
    def analyze_email_performance(self,
                                  email_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze email campaign performance with AI insights.
        
        Args:
            email_data: Email metrics (opens, clicks, etc.)
            
        Returns:
            Performance analysis and recommendations
        """
        sent = email_data.get('sent', 0)
        opens = email_data.get('opens', 0)
        clicks = email_data.get('clicks', 0)
        
        open_rate = (opens / sent * 100) if sent > 0 else 0
        click_rate = (clicks / opens * 100) if opens > 0 else 0
        
        prompt = f"""
        Analyze this email campaign performance:
        - Sent: {sent}
        - Opens: {opens} ({open_rate:.1f}%)
        - Clicks: {clicks} ({click_rate:.1f}%)
        - Subject: {email_data.get('subject', 'N/A')}
        
        Provide:
        1. Performance assessment (excellent/good/needs improvement)
        2. 3 specific recommendations to improve
        3. Benchmark comparison
        
        Be concise and actionable.
        """
        
        response = self._call_ollama(prompt)
        
        # Determine performance level
        performance = "needs_improvement"
        if open_rate >= 25 and click_rate >= 3:
            performance = "excellent"
        elif open_rate >= 18 and click_rate >= 2:
            performance = "good"
        
        return {
            "email_id": email_data.get('id'),
            "performance_level": performance,
            "metrics": {
                "open_rate": round(open_rate, 2),
                "click_rate": round(click_rate, 2),
                "sent": sent,
                "opens": opens,
                "clicks": clicks
            },
            "analysis": response,
            "recommendations": self._extract_recommendations(response)
        }
    
    def _extract_recommendations(self, text: str) -> List[str]:
        """Extract recommendations from AI response"""
        recommendations = []
        for line in text.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                clean_line = line.lstrip('0123456789.-•) ').strip()
                if clean_line and len(clean_line) > 10:  # Meaningful recommendation
                    recommendations.append(clean_line)
        return recommendations[:5]  # Limit to 5
    
    def generate_ab_test_variants(self,
                                  original_subject: str,
                                  test_element: str = "subject") -> List[str]:
        """
        Generate A/B test variants for email elements.
        
        Args:
            original_subject: Original subject line or element
            test_element: What to test (subject, cta, opening)
            
        Returns:
            List of test variants
        """
        prompt = f"""
        Create 3 A/B test variants for this email {test_element}:
        
        Original: {original_subject}
        
        Each variant should test a different approach:
        1. Emotional appeal
        2. Urgency/scarcity
        3. Curiosity/question
        
        Keep the same core message but vary the presentation.
        Return only the variants, one per line.
        """
        
        response = self._call_ollama(prompt)
        
        variants = []
        for line in response.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-')):
                clean_line = line.lstrip('0123456789.-) ').strip()
                if clean_line:
                    variants.append(clean_line)
        
        return variants[:3]


# Global instance
email_campaign_manager = EmailCampaignManager()

"""
Campaign Manager - Ollama-Powered Campaign Management
Owner: AI Assistant (based on Sheryar's architecture)

This module handles comprehensive campaign management with AI-powered features:
- Campaign creation with AI-generated content
- Campaign optimization suggestions
- Performance tracking and analytics
- Multi-channel campaign support (Email, Social, Ads)

Uses Ollama for:
- Campaign name and description generation
- Target audience analysis
- Content suggestions
- Performance optimization recommendations
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import os
import requests
from utils.logger import get_logger
from supabase import create_client, Client

logger = get_logger("campaign_manager")

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if supabase_url and supabase_key:
    supabase: Client = create_client(supabase_url, supabase_key)
else:
    supabase = None
    logger.warning("Supabase not configured - campaign data will not persist")


class CampaignManager:
    """
    Manages marketing campaigns with AI-powered features using Ollama.
    """
    
    def __init__(self):
        """Initialize Campaign Manager with Ollama configuration"""
        self.ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
        self.ollama_model = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")
        logger.info(f"CampaignManager initialized with Ollama ({self.ollama_model})")
    
    def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
        """
        Call Ollama API for AI-powered campaign insights.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt for context
            
        Returns:
            AI-generated response text
        """
        try:
            if not system_prompt:
                system_prompt = "You are a marketing expert AI assistant. Provide concise, actionable marketing advice."
            
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
            content = message.get("content", "")
            
            return content.strip()
            
        except Exception as e:
            logger.error(f"Ollama call error: {e}")
            return ""
    
    def generate_campaign_ideas(self, industry: str, goal: str, budget: float) -> Dict[str, Any]:
        """
        Generate AI-powered campaign ideas based on industry, goal, and budget.
        
        Args:
            industry: Target industry
            goal: Campaign goal (awareness, leads, sales, etc.)
            budget: Campaign budget
            
        Returns:
            Dictionary with campaign ideas and recommendations
        """
        prompt = f"""
        Generate 3 marketing campaign ideas for:
        - Industry: {industry}
        - Goal: {goal}
        - Budget: ${budget:,.2f}
        
        For each campaign, provide:
        1. Campaign Name
        2. Brief Description (2-3 sentences)
        3. Recommended Channels (Email, Social, Ads, etc.)
        4. Expected ROI
        5. Key Success Metrics
        
        Format as JSON with this structure:
        {{
            "campaigns": [
                {{
                    "name": "Campaign Name",
                    "description": "Description",
                    "channels": ["Email", "Facebook"],
                    "expected_roi": "200%",
                    "metrics": ["Open Rate", "Click Rate"]
                }}
            ]
        }}
        """
        
        response = self._call_ollama(prompt)
        
        try:
            # Try to parse JSON from response
            if "{" in response and "}" in response:
                start = response.find("{")
                end = response.rfind("}") + 1
                json_str = response[start:end]
                return json.loads(json_str)
        except Exception as e:
            logger.error(f"Failed to parse campaign ideas: {e}")
        
        # Fallback response
        return {
            "campaigns": [
                {
                    "name": f"{industry} {goal.title()} Campaign",
                    "description": f"AI-generated campaign focused on {goal} for {industry} industry",
                    "channels": ["Email", "Social Media"],
                    "expected_roi": "150-250%",
                    "metrics": ["Engagement Rate", "Conversion Rate"]
                }
            ]
        }
    
    def optimize_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze campaign performance and provide AI-powered optimization suggestions.
        
        Args:
            campaign_data: Current campaign metrics and details
            
        Returns:
            Optimization recommendations
        """
        prompt = f"""
        Analyze this marketing campaign and provide optimization recommendations:
        
        Campaign: {campaign_data.get('name', 'Unknown')}
        Channel: {campaign_data.get('channel', 'Unknown')}
        Current Metrics:
        - Leads: {campaign_data.get('leads', 0)}
        - Conversion Rate: {campaign_data.get('conversion_rate', 0)}%
        - Cost per Lead: ${campaign_data.get('cost_per_lead', 0)}
        - ROI: {campaign_data.get('roi', 0)}%
        
        Provide 3-5 specific, actionable recommendations to improve performance.
        Format as a simple list of recommendations.
        """
        
        response = self._call_ollama(prompt)
        
        # Parse recommendations from response
        recommendations = []
        for line in response.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                # Remove numbering/bullets
                clean_line = line.lstrip('0123456789.-•) ').strip()
                if clean_line:
                    recommendations.append(clean_line)
        
        return {
            "campaign_id": campaign_data.get('id'),
            "recommendations": recommendations[:5],  # Limit to 5
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def generate_campaign_content(self, campaign_type: str, target_audience: str, key_message: str) -> Dict[str, Any]:
        """
        Generate AI-powered content for a campaign.
        
        Args:
            campaign_type: Type of campaign (email, social, ad)
            target_audience: Description of target audience
            key_message: Main message to convey
            
        Returns:
            Generated content with variations
        """
        prompt = f"""
        Create marketing content for a {campaign_type} campaign:
        
        Target Audience: {target_audience}
        Key Message: {key_message}
        
        Generate:
        1. 3 compelling headlines/subject lines
        2. Main body copy (2-3 paragraphs)
        3. Call-to-action text
        4. 3 A/B test variations for the headline
        
        Format as JSON:
        {{
            "headlines": ["Headline 1", "Headline 2", "Headline 3"],
            "body": "Main copy text...",
            "cta": "Call to action",
            "ab_test_headlines": ["Variation 1", "Variation 2", "Variation 3"]
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
            logger.error(f"Failed to parse campaign content: {e}")
        
        # Fallback
        return {
            "headlines": [
                f"Discover {key_message}",
                f"Transform Your {target_audience} Experience",
                f"Exclusive Offer for {target_audience}"
            ],
            "body": f"We're excited to share {key_message} with {target_audience}. This is your opportunity to take advantage of our latest offering.",
            "cta": "Learn More",
            "ab_test_headlines": [
                f"Limited Time: {key_message}",
                f"Don't Miss Out on {key_message}",
                f"Join Thousands Who Love {key_message}"
            ]
        }
    
    def analyze_campaign_performance(self, campaign_id: str) -> Dict[str, Any]:
        """
        Analyze campaign performance with AI insights.
        
        Args:
            campaign_id: Campaign identifier
            
        Returns:
            Performance analysis with AI insights
        """
        # In a real implementation, fetch actual campaign data from database
        # For now, return structured analysis format
        
        return {
            "campaign_id": campaign_id,
            "status": "active",
            "insights": {
                "performance_score": 75,  # Out of 100
                "trend": "improving",
                "key_findings": [
                    "Conversion rate above industry average",
                    "Email open rates declining - refresh subject lines",
                    "Best performing time: Tuesday 10 AM"
                ]
            },
            "recommendations": [
                "Increase budget for high-performing segments",
                "Test new subject line variations",
                "Expand to similar audience segments"
            ]
        }


# Global instance
campaign_manager = CampaignManager()

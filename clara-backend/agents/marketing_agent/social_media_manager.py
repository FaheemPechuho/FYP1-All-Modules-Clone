"""
Social Media Manager - Ollama-Powered Social Media Marketing
Owner: AI Assistant (based on Sheryar's architecture)

Comprehensive social media management with AI features:
- Platform-specific content generation (Facebook, LinkedIn, Twitter, TikTok, Instagram)
- Hashtag research and optimization
- Posting schedule optimization
- Content calendar creation
- Engagement analytics

Uses Ollama for:
- Post content generation
- Caption writing
- Hashtag suggestions
- Optimal posting time recommendations
- Engagement prediction
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import os
import requests
from utils.logger import get_logger

logger = get_logger("social_media_manager")


class SocialMediaManager:
    """
    Manages social media marketing with AI-powered features using Ollama.
    """
    
    # Platform-specific character limits and best practices
    PLATFORM_SPECS = {
        "facebook": {
            "max_chars": 63206,
            "optimal_chars": 250,
            "hashtag_limit": 30,
            "best_times": ["1-4 PM weekdays"],
            "tone": "friendly and engaging"
        },
        "twitter": {
            "max_chars": 280,
            "optimal_chars": 250,
            "hashtag_limit": 2,
            "best_times": ["12-3 PM weekdays"],
            "tone": "concise and punchy"
        },
        "linkedin": {
            "max_chars": 3000,
            "optimal_chars": 150,
            "hashtag_limit": 5,
            "best_times": ["7-9 AM, 12 PM, 5-6 PM weekdays"],
            "tone": "professional and insightful"
        },
        "instagram": {
            "max_chars": 2200,
            "optimal_chars": 150,
            "hashtag_limit": 30,
            "best_times": ["11 AM - 1 PM weekdays"],
            "tone": "visual and inspirational"
        },
        "tiktok": {
            "max_chars": 2200,
            "optimal_chars": 150,
            "hashtag_limit": 5,
            "best_times": ["6-10 PM weekdays"],
            "tone": "casual and trendy"
        }
    }
    
    def __init__(self):
        """Initialize Social Media Manager with Ollama configuration"""
        self.ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
        self.ollama_model = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")
        logger.info(f"SocialMediaManager initialized with Ollama ({self.ollama_model})")
    
    def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
        """Call Ollama API for AI assistance"""
        try:
            if not system_prompt:
                system_prompt = "You are a social media marketing expert. Provide engaging, platform-optimized content."
            
            payload = {
                "model": self.ollama_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "options": {"temperature": 0.8}  # Higher creativity for social media
            }
            
            resp = requests.post(self.ollama_url, json=payload, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            
            message = data.get("message", {})
            return message.get("content", "").strip()
            
        except Exception as e:
            logger.error(f"Ollama call error: {e}")
            return ""
    
    def generate_social_post(self,
                            platform: str,
                            topic: str,
                            goal: str = "engagement",
                            include_cta: bool = True) -> Dict[str, Any]:
        """
        Generate platform-specific social media post with AI.
        
        Args:
            platform: Social media platform (facebook, twitter, linkedin, etc.)
            topic: Post topic or message
            goal: Post goal (engagement, traffic, awareness)
            include_cta: Whether to include call-to-action
            
        Returns:
            Generated post with content, hashtags, and metadata
        """
        platform = platform.lower()
        specs = self.PLATFORM_SPECS.get(platform, self.PLATFORM_SPECS["facebook"])
        
        prompt = f"""
        Create a {platform} post about: {topic}
        
        Requirements:
        - Platform: {platform}
        - Goal: {goal}
        - Tone: {specs['tone']}
        - Character limit: {specs['optimal_chars']} (optimal)
        - Include CTA: {include_cta}
        
        Format as JSON:
        {{
            "content": "Post text...",
            "hashtags": ["hashtag1", "hashtag2"],
            "cta": "Call to action",
            "emoji_suggestions": ["😊", "🚀"]
        }}
        
        Make it engaging and platform-appropriate.
        """
        
        response = self._call_ollama(prompt)
        
        try:
            if "{" in response and "}" in response:
                start = response.find("{")
                end = response.rfind("}") + 1
                json_str = response[start:end]
                post_data = json.loads(json_str)
                
                # Ensure hashtag limit
                if "hashtags" in post_data:
                    post_data["hashtags"] = post_data["hashtags"][:specs["hashtag_limit"]]
                
                post_data["platform"] = platform
                post_data["char_count"] = len(post_data.get("content", ""))
                return post_data
                
        except Exception as e:
            logger.error(f"Failed to parse social post: {e}")
        
        # Fallback
        return {
            "platform": platform,
            "content": f"Exciting news about {topic}! Learn more and join the conversation.",
            "hashtags": [f"#{topic.replace(' ', '')}", "#Marketing"],
            "cta": "Learn More" if include_cta else None,
            "emoji_suggestions": ["🚀", "✨"],
            "char_count": 0
        }
    
    def generate_hashtags(self,
                         topic: str,
                         platform: str,
                         count: int = 10) -> List[str]:
        """
        Generate relevant hashtags for a topic.
        
        Args:
            topic: Post topic
            platform: Target platform
            count: Number of hashtags to generate
            
        Returns:
            List of hashtag suggestions
        """
        specs = self.PLATFORM_SPECS.get(platform.lower(), {})
        max_hashtags = specs.get("hashtag_limit", 10)
        count = min(count, max_hashtags)
        
        prompt = f"""
        Generate {count} relevant hashtags for a {platform} post about: {topic}
        
        Requirements:
        - Mix of popular and niche hashtags
        - Include trending tags if relevant
        - Avoid overly generic tags
        - Format: #HashtagName
        
        Return only the hashtags, one per line.
        """
        
        response = self._call_ollama(prompt)
        
        hashtags = []
        for line in response.split('\n'):
            line = line.strip()
            if line.startswith('#'):
                hashtag = line.split()[0]  # Get first word if multiple
                if len(hashtag) > 1:  # Valid hashtag
                    hashtags.append(hashtag)
        
        # Fallback if parsing failed
        if not hashtags:
            base_tag = topic.replace(' ', '').replace('-', '')
            hashtags = [
                f"#{base_tag}",
                "#Marketing",
                "#Business",
                "#Growth",
                "#Success"
            ]
        
        return hashtags[:count]
    
    def create_content_calendar(self,
                               theme: str,
                               platforms: List[str],
                               days: int = 7) -> List[Dict[str, Any]]:
        """
        Generate AI-powered content calendar.
        
        Args:
            theme: Overall content theme
            platforms: List of platforms to post on
            days: Number of days to plan
            
        Returns:
            List of scheduled posts
        """
        prompt = f"""
        Create a {days}-day social media content calendar for:
        - Theme: {theme}
        - Platforms: {', '.join(platforms)}
        
        For each day, suggest:
        1. Post topic
        2. Best platform
        3. Post type (educational, promotional, engaging)
        4. Best time to post
        
        Format as JSON array:
        [
            {{
                "day": 1,
                "topic": "Topic",
                "platform": "linkedin",
                "type": "educational",
                "time": "9:00 AM"
            }}
        ]
        
        Vary content types and platforms for maximum engagement.
        """
        
        response = self._call_ollama(prompt)
        
        try:
            if "[" in response and "]" in response:
                start = response.find("[")
                end = response.rfind("]") + 1
                json_str = response[start:end]
                return json.loads(json_str)
        except Exception as e:
            logger.error(f"Failed to parse content calendar: {e}")
        
        # Fallback calendar
        calendar = []
        post_types = ["educational", "promotional", "engaging", "inspirational"]
        
        for day in range(1, days + 1):
            platform = platforms[(day - 1) % len(platforms)]
            post_type = post_types[(day - 1) % len(post_types)]
            
            calendar.append({
                "day": day,
                "topic": f"{theme} - Day {day}",
                "platform": platform,
                "type": post_type,
                "time": "10:00 AM"
            })
        
        return calendar
    
    def optimize_posting_schedule(self,
                                  platform: str,
                                  audience_timezone: str,
                                  industry: str) -> Dict[str, Any]:
        """
        Get AI recommendations for optimal posting times.
        
        Args:
            platform: Social media platform
            audience_timezone: Target audience timezone
            industry: Industry vertical
            
        Returns:
            Posting schedule recommendations
        """
        specs = self.PLATFORM_SPECS.get(platform.lower(), {})
        
        prompt = f"""
        Recommend the best posting schedule for {platform}:
        - Timezone: {audience_timezone}
        - Industry: {industry}
        - Platform best times: {specs.get('best_times', [])}
        
        Provide:
        1. Best days of week
        2. Best times of day
        3. Posting frequency
        4. Times to avoid
        
        Be specific and data-driven.
        """
        
        response = self._call_ollama(prompt)
        
        return {
            "platform": platform,
            "timezone": audience_timezone,
            "recommended_days": ["Tuesday", "Wednesday", "Thursday"],
            "recommended_times": specs.get("best_times", ["10:00 AM", "2:00 PM"]),
            "frequency": "1-2 posts per day",
            "avoid": ["Late nights", "Early mornings", "Weekends"],
            "reasoning": response
        }
    
    def analyze_post_performance(self,
                                post_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze social media post performance with AI insights.
        
        Args:
            post_data: Post metrics (likes, shares, comments, etc.)
            
        Returns:
            Performance analysis and recommendations
        """
        platform = post_data.get('platform', 'unknown')
        likes = post_data.get('likes', 0)
        shares = post_data.get('shares', 0)
        comments = post_data.get('comments', 0)
        reach = post_data.get('reach', 0)
        
        engagement_rate = ((likes + shares + comments) / reach * 100) if reach > 0 else 0
        
        prompt = f"""
        Analyze this {platform} post performance:
        - Likes: {likes}
        - Shares: {shares}
        - Comments: {comments}
        - Reach: {reach}
        - Engagement Rate: {engagement_rate:.2f}%
        - Content: {post_data.get('content', 'N/A')[:100]}
        
        Provide:
        1. Performance assessment
        2. What worked well
        3. 3 recommendations for future posts
        
        Be specific and actionable.
        """
        
        response = self._call_ollama(prompt)
        
        # Determine performance level
        performance = "needs_improvement"
        if engagement_rate >= 5:
            performance = "excellent"
        elif engagement_rate >= 2:
            performance = "good"
        
        return {
            "post_id": post_data.get('id'),
            "platform": platform,
            "performance_level": performance,
            "metrics": {
                "engagement_rate": round(engagement_rate, 2),
                "likes": likes,
                "shares": shares,
                "comments": comments,
                "reach": reach
            },
            "analysis": response,
            "recommendations": self._extract_recommendations(response)
        }
    
    def generate_caption_variations(self,
                                   original_caption: str,
                                   platform: str,
                                   count: int = 3) -> List[str]:
        """
        Generate variations of a social media caption for A/B testing.
        
        Args:
            original_caption: Original caption text
            platform: Target platform
            count: Number of variations to generate
            
        Returns:
            List of caption variations
        """
        specs = self.PLATFORM_SPECS.get(platform.lower(), {})
        
        prompt = f"""
        Create {count} variations of this {platform} caption:
        
        Original: {original_caption}
        
        Each variation should:
        - Maintain the core message
        - Use different hooks/angles
        - Stay within {specs.get('optimal_chars', 150)} characters
        - Match {specs.get('tone', 'engaging')} tone
        
        Return only the variations, one per line, numbered.
        """
        
        response = self._call_ollama(prompt)
        
        variations = []
        for line in response.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-')):
                clean_line = line.lstrip('0123456789.-) ').strip()
                if clean_line:
                    variations.append(clean_line)
        
        return variations[:count]
    
    def _extract_recommendations(self, text: str) -> List[str]:
        """Extract recommendations from AI response"""
        recommendations = []
        for line in text.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                clean_line = line.lstrip('0123456789.-•) ').strip()
                if clean_line and len(clean_line) > 10:
                    recommendations.append(clean_line)
        return recommendations[:5]


# Global instance
social_media_manager = SocialMediaManager()

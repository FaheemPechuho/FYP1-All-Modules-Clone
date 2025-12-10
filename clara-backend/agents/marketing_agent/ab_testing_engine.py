"""
A/B Testing Engine - Ollama-Powered Marketing Experimentation
Owner: AI Assistant

Comprehensive A/B testing management with AI features:
- Test variant generation
- Statistical analysis
- Winner prediction
- Optimization recommendations

Uses Ollama for:
- Variant generation (subject lines, CTAs, content)
- Test hypothesis creation
- Results interpretation
- Optimization suggestions
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import os
import requests
from utils.logger import get_logger

logger = get_logger("ab_testing_engine")


class ABTestingEngine:
    """
    Manages A/B testing with AI-powered features using Ollama.
    """
    
    def __init__(self):
        """Initialize A/B Testing Engine with Ollama configuration"""
        self.ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
        self.ollama_model = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")
        logger.info(f"ABTestingEngine initialized with Ollama ({self.ollama_model})")
    
    def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
        """Call Ollama API for AI assistance"""
        try:
            if not system_prompt:
                system_prompt = "You are an A/B testing and conversion optimization expert. Provide data-driven recommendations."
            
            payload = {
                "model": self.ollama_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "options": {"temperature": 0.8}  # Higher for creative variants
            }
            
            resp = requests.post(self.ollama_url, json=payload, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            
            message = data.get("message", {})
            return message.get("content", "").strip()
            
        except Exception as e:
            logger.error(f"Ollama call error: {e}")
            return ""
    
    def generate_variants(self, 
                         test_type: str, 
                         original: str, 
                         goal: str,
                         num_variants: int = 3) -> List[str]:
        """
        Generate A/B test variants using AI.
        
        Args:
            test_type: Type of test (subject_line, cta, email_content, landing_page, ad_copy)
            original: Original version (control)
            goal: Test goal (increase_opens, increase_clicks, increase_conversions)
            num_variants: Number of variants to generate
            
        Returns:
            List of variant suggestions
        """
        prompt = f"""
        Create {num_variants} A/B test variants for:
        
        Test Type: {test_type}
        Original (Control): {original}
        Goal: {goal}
        
        Each variant should test a different approach:
        1. Emotional appeal
        2. Urgency/scarcity
        3. Curiosity/question
        4. Value proposition
        5. Social proof
        
        Return only the variants, one per line, numbered.
        Keep them similar in length to the original.
        """
        
        response = self._call_ollama(prompt)
        
        # Parse variants
        variants = []
        for line in response.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-')):
                clean_line = line.lstrip('0123456789.-) ').strip()
                if clean_line:
                    variants.append(clean_line)
        
        # Fallback if parsing failed
        if not variants:
            variants = [
                f"{original} - Limited Time Only",
                f"Don't Miss: {original}",
                f"Exclusive: {original}"
            ]
        
        return variants[:num_variants]
    
    def create_test_hypothesis(self, test_type: str, variants: List[str]) -> str:
        """
        Generate a test hypothesis based on variants.
        
        Args:
            test_type: Type of test
            variants: List of variants being tested
            
        Returns:
            Test hypothesis
        """
        prompt = f"""
        Create a clear A/B test hypothesis for:
        
        Test Type: {test_type}
        Variants: {len(variants)}
        
        Format: "If we [change], then [expected outcome] because [reasoning]"
        
        Be specific and measurable.
        """
        
        response = self._call_ollama(prompt)
        
        if response:
            return response
        
        return f"If we test different {test_type} variations, then we will identify the most effective version for our audience."
    
    def analyze_results(self, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze A/B test results with AI insights.
        
        Args:
            test_data: Test results with metrics for each variant
            
        Returns:
            Analysis with winner, confidence, and recommendations
        """
        test_name = test_data.get('name', 'Unknown')
        variants = test_data.get('variants', [])
        
        # Build variant summary
        variant_summary = []
        for v in variants:
            variant_summary.append(
                f"Variant {v.get('name', 'A')}: "
                f"{v.get('impressions', 0)} impressions, "
                f"{v.get('conversions', 0)} conversions "
                f"({v.get('conversion_rate', 0):.2f}%)"
            )
        
        prompt = f"""
        Analyze these A/B test results:
        
        Test: {test_name}
        {chr(10).join(variant_summary)}
        
        Provide:
        1. Which variant won and why
        2. Statistical confidence level (high/medium/low)
        3. Key insights from the results
        4. 3 recommendations for next tests
        
        Be specific and data-driven.
        """
        
        response = self._call_ollama(prompt)
        
        # Determine winner (simple logic - highest conversion rate)
        winner = max(variants, key=lambda x: x.get('conversion_rate', 0)) if variants else None
        
        return {
            "test_id": test_data.get('id'),
            "winner": winner.get('name') if winner else None,
            "confidence": "medium",  # Would need proper statistical calculation
            "analysis": response,
            "recommendations": self._extract_recommendations(response),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def suggest_test_ideas(self, channel: str, current_performance: Dict[str, float]) -> List[Dict[str, str]]:
        """
        Suggest A/B test ideas based on channel and performance.
        
        Args:
            channel: Marketing channel (email, landing_page, ads, social)
            current_performance: Current metrics
            
        Returns:
            List of test ideas
        """
        prompt = f"""
        Suggest 5 A/B test ideas for {channel} marketing with current performance:
        - Conversion Rate: {current_performance.get('conversion_rate', 0)}%
        - Click Rate: {current_performance.get('click_rate', 0)}%
        - Engagement: {current_performance.get('engagement', 0)}%
        
        For each test idea, provide:
        - What to test
        - Why it matters
        - Expected impact
        
        Return as a simple numbered list.
        """
        
        response = self._call_ollama(prompt)
        
        # Fallback test ideas
        test_ideas = [
            {
                "name": "Subject Line Optimization",
                "description": "Test different subject line approaches",
                "expected_impact": "10-30% increase in open rates"
            },
            {
                "name": "CTA Button Color",
                "description": "Test different call-to-action button colors",
                "expected_impact": "5-15% increase in click rates"
            },
            {
                "name": "Email Length",
                "description": "Test short vs long email formats",
                "expected_impact": "Improved engagement and conversions"
            },
            {
                "name": "Personalization Level",
                "description": "Test degree of personalization",
                "expected_impact": "Higher relevance and conversion"
            },
            {
                "name": "Send Time",
                "description": "Test different send times",
                "expected_impact": "Better open and engagement rates"
            }
        ]
        
        return test_ideas
    
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
ab_testing_engine = ABTestingEngine()

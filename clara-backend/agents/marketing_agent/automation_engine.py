"""
Automation Engine - Ollama-Powered Marketing Automation
Owner: AI Assistant

Comprehensive marketing automation workflow management with AI features:
- Workflow creation with AI-suggested triggers and actions
- Workflow optimization recommendations
- Performance analysis and insights

Uses Ollama for:
- Trigger suggestions based on goals
- Action sequence recommendations
- Workflow optimization
- Performance insights
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import os
import requests
from utils.logger import get_logger

logger = get_logger("automation_engine")


class AutomationEngine:
    """
    Manages marketing automation workflows with AI-powered features using Ollama.
    """
    
    def __init__(self):
        """Initialize Automation Engine with Ollama configuration"""
        self.ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
        self.ollama_model = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")
        logger.info(f"AutomationEngine initialized with Ollama ({self.ollama_model})")
    
    def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
        """Call Ollama API for AI assistance"""
        try:
            if not system_prompt:
                system_prompt = "You are a marketing automation expert. Provide concise, actionable workflow recommendations."
            
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
    
    def suggest_workflow(self, goal: str, trigger_type: str, audience: str) -> Dict[str, Any]:
        """
        Generate AI-powered workflow suggestions.
        
        Args:
            goal: Workflow goal (lead_nurturing, onboarding, re_engagement, etc.)
            trigger_type: Type of trigger (new_lead, purchase, abandoned_cart, etc.)
            audience: Target audience description
            
        Returns:
            Workflow structure with steps
        """
        prompt = f"""
        Create a marketing automation workflow for:
        - Goal: {goal}
        - Trigger: {trigger_type}
        - Audience: {audience}
        
        Provide a workflow with 4-6 steps including:
        1. Trigger condition
        2. Wait/delay periods
        3. Actions (send email, add tag, update field, etc.)
        4. Conditions (if/else logic)
        
        Format as JSON:
        {{
            "name": "Workflow Name",
            "description": "Brief description",
            "steps": [
                {{
                    "step_number": 1,
                    "type": "trigger",
                    "name": "Step name",
                    "description": "What happens",
                    "config": {{"key": "value"}}
                }}
            ],
            "expected_outcome": "What this workflow achieves"
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
            logger.error(f"Failed to parse workflow: {e}")
        
        # Fallback workflow
        return {
            "name": f"{goal.replace('_', ' ').title()} Workflow",
            "description": f"Automated workflow for {goal}",
            "steps": [
                {
                    "step_number": 1,
                    "type": "trigger",
                    "name": trigger_type.replace('_', ' ').title(),
                    "description": f"When {trigger_type.replace('_', ' ')} occurs",
                    "config": {"trigger": trigger_type}
                },
                {
                    "step_number": 2,
                    "type": "delay",
                    "name": "Wait 1 Day",
                    "description": "Allow time for initial engagement",
                    "config": {"duration": 1, "unit": "days"}
                },
                {
                    "step_number": 3,
                    "type": "action",
                    "name": "Send Welcome Email",
                    "description": "Send personalized welcome message",
                    "config": {"action": "send_email", "template": "welcome"}
                },
                {
                    "step_number": 4,
                    "type": "condition",
                    "name": "Check Email Opened",
                    "description": "Did they open the email?",
                    "config": {"condition": "email_opened", "if_yes": "continue", "if_no": "wait"}
                }
            ],
            "expected_outcome": f"Automated {goal} for {audience}"
        }
    
    def optimize_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze workflow performance and provide optimization suggestions.
        
        Args:
            workflow_data: Workflow metrics and configuration
            
        Returns:
            Optimization recommendations
        """
        name = workflow_data.get('name', 'Unknown')
        total_contacts = workflow_data.get('total_contacts', 0)
        completed = workflow_data.get('completed', 0)
        conversion_rate = workflow_data.get('conversion_rate', 0)
        
        prompt = f"""
        Analyze this marketing automation workflow:
        
        Name: {name}
        Total Contacts: {total_contacts}
        Completed: {completed}
        Conversion Rate: {conversion_rate}%
        
        Provide 3-5 specific optimization recommendations to improve:
        - Completion rate
        - Conversion rate
        - Overall effectiveness
        
        Be specific and actionable.
        """
        
        response = self._call_ollama(prompt)
        
        # Parse recommendations
        recommendations = []
        for line in response.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                clean_line = line.lstrip('0123456789.-•) ').strip()
                if clean_line and len(clean_line) > 10:
                    recommendations.append(clean_line)
        
        return {
            "workflow_id": workflow_data.get('id'),
            "recommendations": recommendations[:5],
            "performance_score": min(100, int(conversion_rate * 5)),  # Simple scoring
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def suggest_triggers(self, goal: str) -> List[Dict[str, str]]:
        """
        Suggest appropriate triggers for a workflow goal.
        
        Args:
            goal: Workflow goal
            
        Returns:
            List of trigger suggestions
        """
        prompt = f"""
        Suggest 5 effective triggers for a {goal} marketing automation workflow.
        
        For each trigger, provide:
        - Name
        - Description
        - When to use it
        
        Return as a simple list.
        """
        
        response = self._call_ollama(prompt)
        
        # Parse triggers (simplified)
        triggers = [
            {"name": "New Lead Created", "description": "When a new lead enters the system", "event": "new_lead"},
            {"name": "Form Submitted", "description": "When a specific form is submitted", "event": "form_submit"},
            {"name": "Tag Added", "description": "When a specific tag is applied", "event": "tag_added"},
            {"name": "Email Opened", "description": "When an email is opened", "event": "email_opened"},
            {"name": "No Activity", "description": "After X days of inactivity", "event": "no_activity"}
        ]
        
        return triggers


# Global instance
automation_engine = AutomationEngine()

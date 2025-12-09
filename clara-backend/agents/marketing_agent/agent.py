"""
Marketing Agent - Main marketing agent implementation
Owner: Sheryar
"""

from typing import Dict, Any, Optional, List
from agents.base_agent import BaseAgent
from utils.logger import get_logger
from .lead_analyzer import LeadAnalyzer
from .content_generator import ContentGenerator
from .nurturing_engine import NurturingEngine
from .crm_connector import MarketingCRMConnector
from .prompts import MARKETING_AGENT_SYSTEM_PROMPT

logger = get_logger("marketing_agent")


class MarketingAgent(BaseAgent):
    """
    Marketing Agent - Handles content generation, lead nurturing, and marketing intelligence
    Owner: Sheryar
    """
    
    def __init__(self):
        """Initialize Marketing Agent"""
        super().__init__("marketing")
        
        self.analyzer = LeadAnalyzer()
        self.content_generator = ContentGenerator()
        self.nurturing_engine = NurturingEngine()
        self.crm_connector = MarketingCRMConnector()
        
        logger.info("Marketing Agent fully initialized and ready")
    
    def process(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming message/request"""
        try:
            action = message_data.get("action", "analyze")
            
            handlers = {
                "analyze_lead": self._handle_analyze_lead,
                "analyze_batch": self._handle_analyze_batch,
                "generate_email": self._handle_generate_email,
                "generate_sms": self._handle_generate_sms,
                "generate_call_script": self._handle_generate_call_script,
                "generate_ad_copy": self._handle_generate_ad_copy,
                "get_nurturing_sequence": self._handle_get_nurturing,
                "get_campaign_insights": self._handle_campaign_insights,
                "get_leads_by_stage": self._handle_get_leads_by_stage,
                "get_leads_by_temperature": self._handle_get_leads_by_temperature,
            }
            
            handler = handlers.get(action)
            if handler:
                result = handler(message_data)
                return self.format_response(message="Success", success=True, metadata=result)
            else:
                return self.format_response(
                    message=f"Unknown action: {action}",
                    success=False,
                    metadata={"available_actions": list(handlers.keys())}
                )
                
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            return self.format_response(message=f"Error: {str(e)}", success=False)
    
    # Lead Analysis
    def analyze_lead(self, lead_id: str) -> Dict[str, Any]:
        lead_data = self.crm_connector.get_lead_by_id(lead_id)
        if not lead_data:
            return {"error": f"Lead not found: {lead_id}"}
        return self.analyzer.analyze_lead(lead_data)
    
    def analyze_leads_batch(self, stage: Optional[str] = None, limit: int = 10) -> Dict[str, Any]:
        if stage:
            leads = self.crm_connector.get_leads_by_stage(stage, limit=limit)
        else:
            leads = self.crm_connector.get_leads_for_marketing(limit=limit)
        
        if not leads:
            return {"error": "No leads found", "prioritized_leads": []}
        
        return self.analyzer.analyze_batch(leads)
    
    # Content Generation
    def generate_email(self, lead_id: str, email_type: str = "follow_up", tone: str = "professional") -> Dict[str, Any]:
        lead_data = self.crm_connector.get_lead_by_id(lead_id)
        if not lead_data:
            return {"error": f"Lead not found: {lead_id}"}
        return self.content_generator.generate_email(lead_data, email_type, tone)
    
    def generate_sms(self, lead_id: str, sms_type: str = "quick_follow_up", context: str = "") -> Dict[str, Any]:
        lead_data = self.crm_connector.get_lead_by_id(lead_id)
        if not lead_data:
            return {"error": f"Lead not found: {lead_id}"}
        return self.content_generator.generate_sms(lead_data, sms_type, context)
    
    def generate_cold_call_script(self, lead_id: str, objective: str = "discovery") -> Dict[str, Any]:
        lead_data = self.crm_connector.get_lead_by_id(lead_id)
        if not lead_data:
            return {"error": f"Lead not found: {lead_id}"}
        return self.content_generator.generate_cold_call_script(lead_data, objective)
    
    def generate_ad_copy(self, platform: str, industry: str = "", pain_points: str = "", objective: str = "awareness") -> Dict[str, Any]:
        target_profile = {
            "industry": industry or "B2B",
            "pain_points": pain_points or "efficiency, growth, automation",
            "decision_stage": "awareness"
        }
        return self.content_generator.generate_ad_copy(platform, target_profile, objective)
    
    def generate_batch_content(self, stage: str, content_type: str, limit: int = 10, **kwargs) -> List[Dict[str, Any]]:
        leads = self.crm_connector.get_leads_by_stage(stage, limit=limit)
        if not leads:
            return [{"error": "No leads found in stage"}]
        return self.content_generator.generate_batch_content(leads, content_type, **kwargs)
    
    # Nurturing
    def get_nurturing_sequence(self, lead_id: str) -> Dict[str, Any]:
        lead_data = self.crm_connector.get_lead_by_id(lead_id)
        if not lead_data:
            return {"error": f"Lead not found: {lead_id}"}
        return self.nurturing_engine.get_sequence_for_lead(lead_data)
    
    def get_next_action(self, lead_id: str) -> Dict[str, Any]:
        lead_data = self.crm_connector.get_lead_by_id(lead_id)
        if not lead_data:
            return {"error": f"Lead not found: {lead_id}"}
        return self.nurturing_engine.get_next_action(lead_data)
    
    def get_available_sequences(self) -> List[Dict[str, Any]]:
        return self.nurturing_engine.get_available_sequences()
    
    # Insights
    def get_campaign_insights(self) -> Dict[str, Any]:
        stats = self.crm_connector.get_campaign_stats()
        insights = []
        
        if stats.get("sources"):
            best_source = max(stats["sources"], key=lambda x: x.get("conversion_rate", 0))
            if best_source["conversion_rate"] > 0:
                insights.append(f"'{best_source['name']}' has highest conversion rate ({best_source['conversion_rate']}%)")
        
        stats["ai_insights"] = insights
        return stats
    
    def get_leads_by_temperature(self, temperature: str, limit: int = 10) -> List[Dict[str, Any]]:
        return self.crm_connector.get_leads_by_temperature(temperature, limit)
    
    # Request Handlers
    def _handle_analyze_lead(self, data: Dict[str, Any]) -> Dict[str, Any]:
        lead_id = data.get("lead_id")
        if not lead_id:
            return {"error": "lead_id required"}
        return self.analyze_lead(lead_id)
    
    def _handle_analyze_batch(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self.analyze_leads_batch(data.get("stage"), data.get("limit", 10))
    
    def _handle_generate_email(self, data: Dict[str, Any]) -> Dict[str, Any]:
        lead_id = data.get("lead_id")
        if not lead_id:
            return {"error": "lead_id required"}
        return self.generate_email(lead_id, data.get("email_type", "follow_up"), data.get("tone", "professional"))
    
    def _handle_generate_sms(self, data: Dict[str, Any]) -> Dict[str, Any]:
        lead_id = data.get("lead_id")
        if not lead_id:
            return {"error": "lead_id required"}
        return self.generate_sms(lead_id, data.get("sms_type", "quick_follow_up"), data.get("context", ""))
    
    def _handle_generate_call_script(self, data: Dict[str, Any]) -> Dict[str, Any]:
        lead_id = data.get("lead_id")
        if not lead_id:
            return {"error": "lead_id required"}
        return self.generate_cold_call_script(lead_id, data.get("objective", "discovery"))
    
    def _handle_generate_ad_copy(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self.generate_ad_copy(
            data.get("platform", "facebook"),
            data.get("industry", ""),
            data.get("pain_points", ""),
            data.get("objective", "awareness")
        )
    
    def _handle_get_nurturing(self, data: Dict[str, Any]) -> Dict[str, Any]:
        lead_id = data.get("lead_id")
        if not lead_id:
            return {"error": "lead_id required"}
        return self.get_nurturing_sequence(lead_id)
    
    def _handle_campaign_insights(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self.get_campaign_insights()
    
    def _handle_get_leads_by_stage(self, data: Dict[str, Any]) -> Dict[str, Any]:
        leads = self.crm_connector.get_leads_by_stage(data.get("stage"), data.get("limit", 10))
        return {"leads": leads, "count": len(leads)}
    
    def _handle_get_leads_by_temperature(self, data: Dict[str, Any]) -> Dict[str, Any]:
        temperature = data.get("temperature", "hot")
        leads = self.get_leads_by_temperature(temperature, data.get("limit", 10))
        return {"leads": leads, "count": len(leads), "temperature": temperature}
    
    def get_system_prompt(self) -> str:
        return MARKETING_AGENT_SYSTEM_PROMPT
    
    def reset_session(self, session_id: str):
        self.clear_conversation_history(session_id)
        logger.info(f"Reset session: {session_id}")

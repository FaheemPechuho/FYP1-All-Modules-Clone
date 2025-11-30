
### FILE: lead_analyzer.py ###
"""
Lead Analyzer - Analyze leads for marketing intelligence
Owner: Sheryar
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from utils.logger import get_logger

logger = get_logger("lead_analyzer")


class LeadAnalyzer:
    """Analyze leads for temperature, priority, and marketing recommendations"""
    
    def __init__(self):
        """Initialize lead analyzer with scoring rules"""
        self.temperature_rules = self._load_temperature_rules()
        logger.info("Lead Analyzer initialized")
    
    def _load_temperature_rules(self) -> Dict[str, Any]:
        """Load temperature scoring configuration"""
        return {
            "hot_threshold": 70,
            "warm_threshold": 40,
            "factors": {
                "deal_value": {
                    "high": {"min": 10000, "points": 25},
                    "medium": {"min": 1000, "points": 15},
                    "low": {"min": 0, "points": 5}
                },
                "pipeline_stage": {
                    "Closed Won": 30,
                    "Negotiation": 25,
                    "Proposal Sent": 20,
                    "Needs Analysis": 15,
                    "Contact Made": 10,
                    "Qualified": 8,
                    "New Lead": 5
                },
                "recency": {
                    "today": 20,
                    "this_week": 15,
                    "this_month": 10,
                    "older": 0
                },
                "lead_score": {
                    "weight": 0.25
                }
            }
        }
    
    def analyze_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single lead and return marketing intelligence
        
        Args:
            lead_data: Lead information from CRM
            
        Returns:
            Analysis result with temperature, priority, recommendations
        """
        try:
            # Calculate temperature score
            temp_score, temp_factors = self._calculate_temperature_score(lead_data)
            
            # Determine temperature label
            temperature = self._get_temperature_label(temp_score)
            
            # Calculate priority
            priority = self._calculate_priority(lead_data, temp_score)
            
            # Determine nurturing stage
            nurturing_stage = self._get_nurturing_stage(lead_data)
            
            # Get recommended actions
            recommendations = self._get_recommendations(lead_data, temperature, nurturing_stage)
            
            # Identify risk factors
            risks = self._identify_risks(lead_data)
            
            analysis = {
                "lead_id": lead_data.get("id"),
                "lead_name": lead_data.get("name") or lead_data.get("client_name"),
                "temperature": temperature,
                "temperature_score": temp_score,
                "temperature_reasons": temp_factors,
                "priority": priority,
                "nurturing_stage": nurturing_stage,
                "recommended_action": recommendations.get("immediate_action"),
                "content_suggestions": recommendations.get("content"),
                "talking_points": recommendations.get("talking_points", []),
                "risk_factors": risks,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Analyzed lead {lead_data.get('id')}: {temperature} ({temp_score}/100)")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing lead: {e}")
            return self._get_fallback_analysis(lead_data)
    
    def analyze_batch(self, leads: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze multiple leads and return prioritized list"""
        try:
            analyzed_leads = []
            hot_count = warm_count = cold_count = 0
            total_value = 0
            
            for lead in leads:
                analysis = self.analyze_lead(lead)
                analyzed_leads.append({
                    **analysis,
                    "deal_value": lead.get("deal_value", 0),
                    "company": lead.get("company") or lead.get("client_name"),
                    "pipeline_stage": lead.get("pipeline_stage") or lead.get("status")
                })
                
                if analysis["temperature"] == "hot":
                    hot_count += 1
                elif analysis["temperature"] == "warm":
                    warm_count += 1
                else:
                    cold_count += 1
                
                total_value += lead.get("deal_value", 0) or 0
            
            # Sort by priority and temperature score
            priority_order = {"high": 0, "medium": 1, "low": 2}
            analyzed_leads.sort(key=lambda x: (
                priority_order.get(x["priority"], 2),
                -x["temperature_score"]
            ))
            
            for i, lead in enumerate(analyzed_leads):
                lead["priority_rank"] = i + 1
            
            return {
                "summary": {
                    "total_leads": len(leads),
                    "hot_leads": hot_count,
                    "warm_leads": warm_count,
                    "cold_leads": cold_count,
                    "total_pipeline_value": total_value
                },
                "prioritized_leads": analyzed_leads[:10],
                "all_leads": analyzed_leads,
                "segment_recommendations": {
                    "hot_leads_action": "Immediate personal outreach - call or personalized email",
                    "warm_leads_action": "Nurture with value-add content and soft CTAs",
                    "cold_leads_action": "Re-engagement campaign or move to long-term nurture"
                },
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in batch analysis: {e}")
            return {"error": str(e), "prioritized_leads": []}
    
    def _calculate_temperature_score(self, lead_data: Dict[str, Any]) -> tuple:
        """Calculate temperature score (0-100) with contributing factors"""
        score = 0
        factors = []
        rules = self.temperature_rules["factors"]
        
        # Deal value scoring
        deal_value = lead_data.get("deal_value", 0) or 0
        if deal_value >= rules["deal_value"]["high"]["min"]:
            score += rules["deal_value"]["high"]["points"]
            factors.append(f"High deal value (${deal_value:,})")
        elif deal_value >= rules["deal_value"]["medium"]["min"]:
            score += rules["deal_value"]["medium"]["points"]
            factors.append(f"Medium deal value (${deal_value:,})")
        else:
            score += rules["deal_value"]["low"]["points"]
            if deal_value > 0:
                factors.append(f"Low deal value (${deal_value:,})")
        
        # Pipeline stage scoring
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or "New Lead"
        stage_score = rules["pipeline_stage"].get(stage, 5)
        score += stage_score
        if stage_score >= 20:
            factors.append(f"Advanced stage ({stage})")
        elif stage_score <= 8:
            factors.append(f"Early stage ({stage})")
        
        # Recency scoring
        last_contact = lead_data.get("last_contact") or lead_data.get("updated_at")
        recency_score, recency_desc = self._score_recency(last_contact)
        score += recency_score
        if recency_desc:
            factors.append(recency_desc)
        
        # Lead score contribution
        lead_score = lead_data.get("lead_score", 0) or 0
        score_contribution = int(lead_score * rules["lead_score"]["weight"])
        score += score_contribution
        if lead_score >= 60:
            factors.append(f"High lead score ({lead_score})")
        elif lead_score <= 30 and lead_score > 0:
            factors.append(f"Low lead score ({lead_score})")
        
        score = min(100, score)
        return score, factors
    
    def _score_recency(self, last_contact) -> tuple:
        """Score based on recency of last contact"""
        if not last_contact:
            return 0, "No contact history"
        
        try:
            if isinstance(last_contact, str):
                last_date = datetime.fromisoformat(last_contact.replace('Z', '+00:00'))
            else:
                last_date = last_contact
            
            now = datetime.utcnow()
            if last_date.tzinfo:
                last_date = last_date.replace(tzinfo=None)
            
            days_ago = (now - last_date).days
            
            if days_ago <= 1:
                return 20, "Contacted today/yesterday"
            elif days_ago <= 7:
                return 15, f"Contacted {days_ago} days ago"
            elif days_ago <= 30:
                return 10, f"Contacted {days_ago} days ago"
            else:
                return 0, f"No contact in {days_ago}+ days"
                
        except Exception as e:
            logger.debug(f"Error parsing date: {e}")
            return 5, None
    
    def _get_temperature_label(self, score: int) -> str:
        """Convert score to temperature label"""
        if score >= self.temperature_rules["hot_threshold"]:
            return "hot"
        elif score >= self.temperature_rules["warm_threshold"]:
            return "warm"
        else:
            return "cold"
    
    def _calculate_priority(self, lead_data: Dict[str, Any], temp_score: int) -> str:
        """Calculate priority based on multiple factors"""
        deal_value = lead_data.get("deal_value", 0) or 0
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or ""
        
        high_priority_stages = ["Negotiation", "Proposal Sent", "Needs Analysis"]
        if temp_score >= 70 or deal_value >= 10000 or stage in high_priority_stages:
            return "high"
        
        if temp_score >= 40 or deal_value >= 1000:
            return "medium"
        
        return "low"
    
    def _get_nurturing_stage(self, lead_data: Dict[str, Any]) -> str:
        """Determine nurturing stage based on pipeline position"""
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or "New Lead"
        
        stage_mapping = {
            "New Lead": "awareness",
            "Qualified": "awareness",
            "Contact Made": "consideration",
            "Needs Analysis": "consideration",
            "Proposal Sent": "decision",
            "Negotiation": "decision",
            "Closed Won": "retention"
        }
        
        return stage_mapping.get(stage, "awareness")
    
    def _get_recommendations(self, lead_data: Dict[str, Any], temperature: str, nurturing_stage: str) -> Dict[str, Any]:
        """Get content and action recommendations"""
        recommendations = {
            "immediate_action": "",
            "content": {
                "email_type": "follow_up",
                "call_urgency": "this_week",
                "ad_retargeting": False
            },
            "talking_points": []
        }
        
        if temperature == "hot":
            recommendations["immediate_action"] = "Call immediately - high chance of conversion"
            recommendations["content"]["call_urgency"] = "immediate"
            recommendations["talking_points"] = [
                "Reference previous conversations",
                "Address any pending concerns",
                "Push for commitment/next step"
            ]
        elif temperature == "warm":
            recommendations["immediate_action"] = "Send personalized follow-up email"
            recommendations["content"]["email_type"] = "follow_up"
            recommendations["content"]["call_urgency"] = "this_week"
            recommendations["talking_points"] = [
                "Share relevant case study",
                "Offer value-add content",
                "Suggest demo or call"
            ]
        else:
            recommendations["immediate_action"] = "Add to re-engagement campaign"
            recommendations["content"]["email_type"] = "re_engagement"
            recommendations["content"]["call_urgency"] = "not_needed"
            recommendations["content"]["ad_retargeting"] = True
            recommendations["talking_points"] = [
                "Reconnect with new value proposition",
                "Share industry insights",
                "Low-pressure check-in"
            ]
        
        return recommendations
    
    def _identify_risks(self, lead_data: Dict[str, Any]) -> List[str]:
        """Identify risk factors for the lead"""
        risks = []
        
        last_contact = lead_data.get("last_contact") or lead_data.get("updated_at")
        if last_contact:
            try:
                if isinstance(last_contact, str):
                    last_date = datetime.fromisoformat(last_contact.replace('Z', '+00:00'))
                else:
                    last_date = last_contact
                
                if last_date.tzinfo:
                    last_date = last_date.replace(tzinfo=None)
                    
                days_ago = (datetime.utcnow() - last_date).days
                if days_ago > 30:
                    risks.append(f"No contact in {days_ago} days - risk of going cold")
                elif days_ago > 14:
                    risks.append("Contact overdue - needs follow-up")
            except:
                pass
        
        deal_value = lead_data.get("deal_value", 0) or 0
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or ""
        
        if deal_value > 10000 and stage in ["New Lead", "Qualified"]:
            risks.append("High-value lead stuck in early stage")
        
        if not lead_data.get("email") and not lead_data.get("phone"):
            risks.append("Missing contact information")
        
        if not lead_data.get("industry"):
            risks.append("Industry unknown - harder to personalize")
        
        return risks
    
    def _get_fallback_analysis(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Return fallback analysis when processing fails"""
        return {
            "lead_id": lead_data.get("id"),
            "lead_name": lead_data.get("name") or lead_data.get("client_name"),
            "temperature": "warm",
            "temperature_score": 50,
            "temperature_reasons": ["Unable to fully analyze"],
            "priority": "medium",
            "nurturing_stage": "consideration",
            "recommended_action": "Review lead manually",
            "content_suggestions": {
                "email_type": "follow_up",
                "call_urgency": "this_week",
                "ad_retargeting": False
            },
            "talking_points": [],
            "risk_factors": ["Analysis incomplete"],
            "analyzed_at": datetime.utcnow().isoformat()
        }

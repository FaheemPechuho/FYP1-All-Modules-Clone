"""
Marketing CRM Connector - Read leads and log marketing activities

This module provides the data access layer for the Marketing Agent:
- Fetches leads from Supabase via LeadsAPI
- Filters leads by stage, temperature, and marketing criteria
- Transforms lead data to marketing-friendly format
- Calculates campaign statistics and source analytics

Data Transformations:
- Lead name resolution (contact_person > client_name > name)
- Deal value normalization (deal_value > budget_amount)
- Pipeline stage mapping
- Quick temperature scoring for filtering

Owner: Sheryar
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from crm_integration.leads_api import LeadsAPI
from utils.logger import get_logger

logger = get_logger("marketing_crm_connector")


class MarketingCRMConnector:
    """Handle CRM operations for marketing agent"""
    
    def __init__(self):
        """Initialize CRM connector"""
        self.leads_api = LeadsAPI()
        logger.info("Marketing CRM connector initialized")
    
    def get_leads_by_stage(self, stage: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get leads by pipeline stage"""
        try:
            leads = self.leads_api.get_leads_by_status(stage, limit=limit)
            return leads or []
        except Exception as e:
            logger.error(f"Error fetching leads by stage: {e}")
            return []
    
    def get_leads_for_marketing(self, filters: Optional[Dict[str, Any]] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get leads that need marketing attention"""
        try:
            all_leads = self.leads_api.get_all_leads(limit=limit * 2)
            
            if not all_leads:
                return []
            
            leads = []
            for lead in all_leads:
                lead_data = self._transform_lead_data(lead)
                
                if filters:
                    if filters.get("stage") and lead_data.get("pipeline_stage") != filters["stage"]:
                        continue
                    if filters.get("min_value") and (lead_data.get("deal_value") or 0) < filters["min_value"]:
                        continue
                
                leads.append(lead_data)
                
                if len(leads) >= limit:
                    break
            
            return leads
            
        except Exception as e:
            logger.error(f"Error fetching leads for marketing: {e}")
            return []
    
    def get_lead_by_id(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Get single lead by ID"""
        try:
            lead = self.leads_api.get_lead(lead_id)
            if lead:
                return self._transform_lead_data(lead)
            return None
        except Exception as e:
            logger.error(f"Error fetching lead {lead_id}: {e}")
            return None
    
    def get_leads_by_temperature(self, temperature: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get leads by inferred temperature"""
        try:
            all_leads = self.leads_api.get_all_leads(limit=50)
            
            if not all_leads:
                return []
            
            scored_leads = []
            for lead in all_leads:
                lead_data = self._transform_lead_data(lead)
                temp_score = self._calculate_quick_temp_score(lead_data)
                
                if temp_score >= 70:
                    lead_temp = "hot"
                elif temp_score >= 40:
                    lead_temp = "warm"
                else:
                    lead_temp = "cold"
                
                if lead_temp == temperature:
                    lead_data["temperature_score"] = temp_score
                    scored_leads.append(lead_data)
            
            scored_leads.sort(key=lambda x: x.get("temperature_score", 0), reverse=True)
            return scored_leads[:limit]
            
        except Exception as e:
            logger.error(f"Error fetching leads by temperature: {e}")
            return []
    
    def get_campaign_stats(self) -> Dict[str, Any]:
        """Get campaign/source statistics"""
        try:
            all_leads = self.leads_api.get_all_leads(limit=500)
            
            if not all_leads:
                return {"sources": [], "total_leads": 0}
            
            sources = {}
            
            for lead in all_leads:
                source = lead.get("source") or "Unknown"
                stage = lead.get("pipeline_stage") or lead.get("status") or "Unknown"
                deal_value = lead.get("deal_value") or 0
                
                if source not in sources:
                    sources[source] = {"name": source, "total_leads": 0, "total_value": 0, "closed_won": 0}
                
                sources[source]["total_leads"] += 1
                sources[source]["total_value"] += deal_value
                
                if stage == "Closed Won":
                    sources[source]["closed_won"] += 1
            
            source_list = []
            for source_name, data in sources.items():
                data["conversion_rate"] = (
                    round(data["closed_won"] / data["total_leads"] * 100, 1)
                    if data["total_leads"] > 0 else 0
                )
                source_list.append(data)
            
            source_list.sort(key=lambda x: x["total_leads"], reverse=True)
            
            return {
                "sources": source_list,
                "total_leads": len(all_leads),
                "total_pipeline_value": sum(l.get("deal_value", 0) or 0 for l in all_leads)
            }
            
        except Exception as e:
            logger.error(f"Error getting campaign stats: {e}")
            return {"sources": [], "total_leads": 0}
    
    def _transform_lead_data(self, lead: Dict[str, Any]) -> Dict[str, Any]:
        """Transform CRM lead data to marketing agent format"""
        return {
            "id": lead.get("id"),
            "name": lead.get("contact_person") or lead.get("client_name") or lead.get("name"),
            "company": lead.get("client_name") or lead.get("company_name"),
            "client_name": lead.get("client_name"),
            "email": lead.get("email"),
            "phone": lead.get("phone"),
            "industry": lead.get("industry"),
            "pipeline_stage": lead.get("pipeline_stage") or lead.get("status"),
            "status": lead.get("status"),
            "deal_value": lead.get("deal_value") or lead.get("budget_amount") or 0,
            "lead_score": lead.get("lead_score", 0),
            "source": lead.get("source"),
            "assigned_agent": lead.get("assigned_agent"),
            "last_contact": lead.get("updated_at") or lead.get("last_contact"),
            "created_at": lead.get("created_at"),
            "tags": lead.get("tags", []),
            "notes": lead.get("notes"),
            "pain_points": lead.get("pain_points") or lead.get("requirements")
        }
    
    def _calculate_quick_temp_score(self, lead_data: Dict[str, Any]) -> int:
        """Quick temperature score calculation"""
        score = 0
        
        deal_value = lead_data.get("deal_value", 0) or 0
        if deal_value >= 10000:
            score += 25
        elif deal_value >= 1000:
            score += 15
        elif deal_value > 0:
            score += 5
        
        stage_scores = {
            "Closed Won": 30, "Negotiation": 25, "Proposal Sent": 20,
            "Needs Analysis": 15, "Contact Made": 10, "Qualified": 8, "New Lead": 5
        }
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or ""
        score += stage_scores.get(stage, 5)
        
        last_contact = lead_data.get("last_contact")
        if last_contact:
            try:
                if isinstance(last_contact, str):
                    last_date = datetime.fromisoformat(last_contact.replace('Z', '+00:00'))
                else:
                    last_date = last_contact
                
                if last_date.tzinfo:
                    last_date = last_date.replace(tzinfo=None)
                
                days_ago = (datetime.utcnow() - last_date).days
                if days_ago <= 1:
                    score += 20
                elif days_ago <= 7:
                    score += 15
                elif days_ago <= 30:
                    score += 10
            except:
                pass
        
        lead_score = lead_data.get("lead_score", 0) or 0
        score += int(lead_score * 0.25)
        
        return min(100, score)
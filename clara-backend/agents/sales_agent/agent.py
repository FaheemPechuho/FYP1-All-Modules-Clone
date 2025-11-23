"""
Sales Agent - Main sales agent implementation
Owner: Faheem
"""

from typing import Dict, Any, Optional
import json
from openai import OpenAI
from groq import Groq
from agents.base_agent import BaseAgent
from utils.logger import get_logger
from config import get_api_key, get_agent_model
from .prompts import (
    SALES_AGENT_SYSTEM_PROMPT,
    get_sales_prompt_with_context
)
from .lead_qualifier import LeadQualifier
from .lead_scorer import LeadScorer
from .crm_connector import SalesCRMConnector

logger = get_logger("sales_agent")


class SalesAgent(BaseAgent):
    """
    Sales Agent - Handles lead qualification, scoring, and CRM management
    
    Responsibilities:
    - Qualify leads using BANT framework
    - Calculate lead scores
    - Manage CRM operations
    - Maintain conversation context
    - Provide appropriate responses
    """
    
    def __init__(self):
        """Initialize Sales Agent"""
        super().__init__("sales")
        
        # Initialize components
        self.qualifier = LeadQualifier()
        self.scorer = LeadScorer()
        self.crm_connector = SalesCRMConnector()
        
        # Initialize LLM client (matching Verbi configuration)
        api_key = get_api_key("groq") or get_api_key("openai")  # Prefer Groq
        
        if api_key and api_key.startswith("gsk_"):
            self.client = Groq(api_key=api_key)
        else:
            self.client = OpenAI(api_key=api_key)
        
        # Store lead information per session
        self.lead_data: Dict[str, Dict[str, Any]] = {}
        
        logger.info("Sales Agent fully initialized and ready")
    
    def process(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process incoming message and generate response
        
        Args:
            message_data: Processed message from orchestrator
            
        Returns:
            Agent response with actions taken
        """
        try:
            # Extract necessary information
            session_id = self.extract_session_id(message_data)
            user_message = message_data.get("raw_message", "")
            extracted_entities = message_data.get("extracted_entities", {})
            
            logger.info(f"Processing message for session: {session_id}")
            
            # Add user message to conversation history
            self.add_to_conversation_history(session_id, "user", user_message)
            
            # Get conversation history
            conversation_history = self.get_conversation_history(session_id)
            
            # Initialize lead data for this session if not exists
            if session_id not in self.lead_data:
                self.lead_data[session_id] = {}
            
            # Step 1: Qualify the lead
            qualification_result = self.qualifier.qualify_lead(
                conversation_history=conversation_history,
                latest_message=user_message,
                current_lead_info=self.lead_data[session_id]
            )
            
            # Update lead data with extracted information
            self.lead_data[session_id].update(
                qualification_result.get("extracted_info", {})
            )
            
            # Step 2: Calculate lead score
            score_breakdown = self.scorer.calculate_score(
                lead_info=self.lead_data[session_id],
                bant_assessment=qualification_result.get("bant_assessment", {}),
                conversation_history=conversation_history,
                extracted_entities=extracted_entities
            )
            
            # Step 3: Generate conversational response
            response_text = self._generate_response(
                conversation_history=conversation_history,
                lead_info=self.lead_data[session_id],
                qualification_result=qualification_result,
                score_breakdown=score_breakdown
            )
            
            # Add assistant response to history
            self.add_to_conversation_history(session_id, "assistant", response_text)
            
            # Step 4: Update CRM if lead is qualified enough
            crm_lead = None
            crm_updated = False
            
            if self._should_update_crm(qualification_result, score_breakdown):
                crm_lead = self.crm_connector.create_or_update_lead(
                    lead_info=self.lead_data[session_id],
                    qualification_result=qualification_result,
                    score_breakdown=score_breakdown
                )
                crm_updated = crm_lead is not None
                
                if crm_updated:
                    logger.info(f"CRM updated successfully for session {session_id}")
            
            # Step 5: Build response
            actions = self._get_actions_taken(
                qualification_result,
                score_breakdown,
                crm_updated
            )
            
            response = self.format_response(
                message=response_text,
                success=True,
                metadata={
                    "session_id": session_id,
                    "qualification_status": qualification_result.get("qualification_status"),
                    "lead_score": score_breakdown.get("total_score"),
                    "score_grade": score_breakdown.get("score_grade"),
                    "crm_updated": crm_updated,
                    "lead_id": crm_lead.get("id") if crm_lead else None,
                    "bant_assessment": qualification_result.get("bant_assessment"),
                    "next_best_action": qualification_result.get("next_best_action"),
                    "missing_information": qualification_result.get("missing_information", []),
                },
                actions=actions
            )
            
            logger.info(
                f"Sales Agent completed processing: "
                f"Score={score_breakdown.get('total_score')}, "
                f"Status={qualification_result.get('qualification_status')}, "
                f"CRM Updated={crm_updated}"
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error in Sales Agent processing: {e}")
            return self.format_response(
                message="I apologize, but I encountered an error. Could you please repeat that?",
                success=False,
                metadata={"error": str(e)}
            )
    
    def _generate_response(
        self,
        conversation_history: list,
        lead_info: Dict[str, Any],
        qualification_result: Dict[str, Any],
        score_breakdown: Dict[str, Any]
    ) -> str:
        """
        Generate conversational response using LLM
        
        Args:
            conversation_history: Conversation history
            lead_info: Current lead information
            qualification_result: Qualification assessment
            score_breakdown: Score breakdown
            
        Returns:
            Response text
        """
        try:
            # Build system prompt with context
            system_prompt = get_sales_prompt_with_context(
                lead_info=lead_info,
                conversation_history=conversation_history
            )
            
            # Add guidance based on qualification status
            guidance = self._get_response_guidance(
                qualification_result,
                score_breakdown
            )
            
            if guidance:
                system_prompt += f"\n\n## Current Guidance:\n{guidance}"
            
            # Prepare messages for LLM
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add recent conversation (last 10 messages)
            recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
            messages.extend([
                msg for msg in recent_history
                if msg["role"] != "system"
            ])
            
            # Generate response
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=300,
            )
            
            response_text = response.choices[0].message.content.strip()
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I apologize for the confusion. Could you please tell me more about what you're looking for?"
    
    def _get_response_guidance(
        self,
        qualification_result: Dict[str, Any],
        score_breakdown: Dict[str, Any]
    ) -> str:
        """Get guidance for response generation based on lead status"""
        missing_info = qualification_result.get("missing_information", [])
        next_action = qualification_result.get("next_best_action", "")
        score = score_breakdown.get("total_score", 0)
        
        guidance = []
        
        # If critical info is missing, focus on gathering it
        if missing_info:
            guidance.append(
                f"You still need to gather: {', '.join(missing_info)}. "
                "Ask about ONE of these naturally in the conversation."
            )
        
        # If score is high, move towards closing/demo
        if score >= 70:
            guidance.append(
                "This is a hot lead! Consider suggesting a demo or meeting. "
                "Be enthusiastic but professional."
            )
        elif score >= 50:
            guidance.append(
                "This lead shows promise. Continue building rapport and "
                "understanding their needs deeply."
            )
        elif score < 30:
            guidance.append(
                "Lead needs more qualification. Focus on understanding if "
                "there's a real fit before investing too much time."
            )
        
        # Add next best action
        if next_action:
            guidance.append(f"Next step: {next_action}")
        
        return "\n".join(guidance)
    
    def _should_update_crm(
        self,
        qualification_result: Dict[str, Any],
        score_breakdown: Dict[str, Any]
    ) -> bool:
        """Determine if CRM should be updated"""
        # Update CRM if:
        # 1. Lead score is above 30
        # 2. OR qualification status is not unqualified
        # 3. OR we have at least company name and contact info
        
        score = score_breakdown.get("total_score", 0)
        qual_status = qualification_result.get("qualification_status")
        extracted_info = qualification_result.get("extracted_info", {})
        
        if score >= 30:
            return True
        
        if qual_status and qual_status != "unqualified":
            return True
        
        # Check if we have minimal info
        has_company = bool(extracted_info.get("company_name"))
        has_contact = bool(extracted_info.get("email") or extracted_info.get("phone"))
        
        if has_company and has_contact:
            return True
        
        return False
    
    def _get_actions_taken(
        self,
        qualification_result: Dict[str, Any],
        score_breakdown: Dict[str, Any],
        crm_updated: bool
    ) -> list:
        """Get list of actions taken by the agent"""
        actions = []
        
        actions.append("analyzed_conversation")
        actions.append("qualified_lead")
        actions.append("calculated_score")
        
        if crm_updated:
            actions.append("updated_crm")
        
        qual_status = qualification_result.get("qualification_status")
        if qual_status in ["sales_qualified", "opportunity"]:
            actions.append("identified_qualified_lead")
        
        score = score_breakdown.get("total_score", 0)
        if score >= 70:
            actions.append("identified_hot_lead")
        
        return actions
    
    def get_system_prompt(self) -> str:
        """Get the system prompt for sales agent"""
        return SALES_AGENT_SYSTEM_PROMPT
    
    def get_lead_summary(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get summary of lead for a session
        
        Args:
            session_id: Session ID
            
        Returns:
            Lead summary or None
        """
        if session_id not in self.lead_data:
            return None
        
        return {
            "session_id": session_id,
            "lead_info": self.lead_data[session_id],
            "conversation_length": len(self.conversation_history.get(session_id, [])),
        }
    
    def reset_session(self, session_id: str):
        """
        Reset/clear a session
        
        Args:
            session_id: Session ID to reset
        """
        self.clear_conversation_history(session_id)
        
        if session_id in self.lead_data:
            del self.lead_data[session_id]
        
        logger.info(f"Reset session: {session_id}")


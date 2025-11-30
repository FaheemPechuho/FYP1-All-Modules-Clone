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
        
        # Track active call IDs per session
        self.active_calls: Dict[str, str] = {}  # session_id -> call_id
        
        # Track call start times per session (for duration calculation)
        self.call_start_times: Dict[str, Any] = {}  # session_id -> datetime
        
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
            extracted_info = qualification_result.get("extracted_info", {})
            
            # Normalize email if present (fixes "at" -> "@" issues from voice transcription)
            if extracted_info.get("email"):
                email = extracted_info["email"]
                # Normalize email: replace "at" with "@", lowercase, remove spaces
                import re
                normalized_email = email.lower().strip()
                normalized_email = re.sub(r'\s+at\s+', '@', normalized_email, flags=re.IGNORECASE)
                normalized_email = re.sub(r'\s+@\s+', '@', normalized_email)
                normalized_email = normalized_email.replace(' ', '')
                if '@' in normalized_email and '.' in normalized_email.split('@')[1]:
                    extracted_info["email"] = normalized_email
                    if normalized_email != email:
                        logger.info(f"Normalized email in extracted_info: '{email}' -> '{normalized_email}'")
            
            self.lead_data[session_id].update(extracted_info)
            
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
            call_id = None
            
            if self._should_update_crm(qualification_result, score_breakdown):
                crm_lead = self.crm_connector.create_or_update_lead(
                    lead_info=self.lead_data[session_id],
                    qualification_result=qualification_result,
                    score_breakdown=score_breakdown
                )
                crm_updated = crm_lead is not None
                
                if crm_updated:
                    logger.info(f"CRM updated successfully for session {session_id}")
                    
                    # Start call tracking if not already started
                    if session_id not in self.active_calls:
                        from datetime import datetime
                        
                        call_id = self.crm_connector.start_call_tracking(
                            lead_id=crm_lead["id"],
                            session_id=session_id
                        )
                        if call_id:
                            self.active_calls[session_id] = call_id
                            self.call_start_times[session_id] = datetime.utcnow()
                            logger.info(f"Started call tracking: {call_id}")
                    else:
                        call_id = self.active_calls[session_id]
            
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
                    "call_id": self.active_calls.get(session_id),
                    "call_tracking_active": session_id in self.active_calls,
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
                system_prompt += f"\n\n## Current Guidance:\n{guidance}\n\nREMEMBER: Keep your response SHORT (2-3 sentences max). Be natural and conversational."
            
            # Prepare messages for LLM
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add recent conversation (last 10 messages)
            recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
            messages.extend([
                msg for msg in recent_history
                if msg["role"] != "system"
            ])
            
            # Generate response - keep it short for voice conversations
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=150,  # Reduced for shorter, more natural voice responses
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
        
        # Always emphasize brevity
        guidance.append("Keep response SHORT (2-3 sentences). Be natural and conversational.")
        
        # If critical info is missing, focus on gathering it
        if missing_info:
            # Pick the most important missing info
            priority_info = missing_info[0] if missing_info else None
            if priority_info:
                guidance.append(
                    f"Ask about: {priority_info}. Keep it to ONE short question."
                )
        
        # If score is high, move towards closing/demo
        if score >= 70:
            guidance.append(
                "Hot lead! Briefly suggest a demo or meeting (1 sentence)."
            )
        elif score >= 50:
            guidance.append(
                "Good lead. Continue building rapport with short, focused responses."
            )
        elif score < 30:
            guidance.append(
                "Needs more qualification. Ask ONE short question to understand fit."
            )
        
        # Add next best action (briefly)
        if next_action:
            # Make next_action shorter if it's too long
            short_action = next_action[:100] + "..." if len(next_action) > 100 else next_action
            guidance.append(f"Next: {short_action}")
        
        return " | ".join(guidance)  # Use separator instead of newlines for brevity
    
    def _should_update_crm(
        self,
        qualification_result: Dict[str, Any],
        score_breakdown: Dict[str, Any]
    ) -> bool:
        """
        Determine if CRM should be updated
        
        IMPORTANT: Only create leads when we have minimum required information!
        This prevents creating incomplete/null records in the database.
        """
        extracted_info = qualification_result.get("extracted_info", {})
        
        # Check for contact information (email or phone is required)
        has_email = bool(extracted_info.get("email"))
        has_phone = bool(extracted_info.get("phone"))
        has_contact_method = has_email or has_phone
        
        if not has_contact_method:
            logger.debug("Not updating CRM: Missing email and phone")
            return False
        
        # Check qualification criteria
        score = score_breakdown.get("total_score", 0)
        qual_status = qualification_result.get("qualification_status")
        
        # Update CRM if ANY of these conditions are met:
        # 1. Lead is qualified (not unqualified) - this is the main indicator
        # 2. Lead score is above 30 (shows engagement)
        # 3. We have company/contact name + contact method
        # 4. We have industry + contact method (can infer company name)
        
        company_name = extracted_info.get("company_name")
        contact_person = extracted_info.get("contact_person") or extracted_info.get("name")
        industry = extracted_info.get("industry")
        
        # Primary condition: Qualified lead with contact info
        if qual_status and qual_status != "unqualified" and has_contact_method:
            logger.debug(f"Updating CRM: Qualified as {qual_status} with contact info")
            return True
        
        # Secondary: High engagement score
        if score >= 30 and has_contact_method:
            logger.debug(f"Updating CRM: Lead score {score} >= 30 with contact info")
            return True
        
        # Tertiary: Has company/contact name
        has_company_or_contact = bool(company_name or contact_person)
        if has_company_or_contact and has_contact_method:
            logger.debug("Updating CRM: Has company/contact + contact method")
            return True
        
        # Quaternary: Has industry (can generate company name from industry)
        if industry and has_contact_method:
            logger.debug(f"Updating CRM: Has industry ({industry}) + contact method (will generate company name)")
            return True
        
        logger.debug("Not updating CRM: Insufficient information collected")
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
        # End call tracking if active
        if session_id in self.active_calls:
            self.end_call_session(session_id, outcome="cancelled")
        
        self.clear_conversation_history(session_id)
        
        if session_id in self.lead_data:
            del self.lead_data[session_id]
        
        if session_id in self.call_start_times:
            del self.call_start_times[session_id]
        
        logger.info(f"Reset session: {session_id}")
    
    def end_call_session(self, session_id: str, outcome: str = "completed"):
        """
        End call tracking for a session
        
        Args:
            session_id: Session ID
            outcome: Call outcome (completed, qualified, not_interested, cancelled)
        """
        try:
            if session_id not in self.active_calls:
                logger.debug(f"No active call to end for session: {session_id}")
                return
            
            from datetime import datetime
            
            call_id = self.active_calls[session_id]
            conversation_history = self.get_conversation_history(session_id)
            
            # Calculate duration
            if session_id in self.call_start_times:
                start_time = self.call_start_times[session_id]
                duration = int((datetime.utcnow() - start_time).total_seconds())
            else:
                # Estimate duration from conversation length (rough estimate)
                duration = len(conversation_history) * 30  # ~30 seconds per exchange
            
            # Get qualification and score data if available
            lead_data = self.lead_data.get(session_id, {})
            
            # Re-run qualification one final time for the complete conversation
            try:
                qualification_result = self.qualifier.qualify_lead(
                    conversation_history=conversation_history,
                    latest_message="",
                    current_lead_info=lead_data
                )
                
                score_breakdown = self.scorer.calculate_score(
                    lead_info=lead_data,
                    bant_assessment=qualification_result.get("bant_assessment", {}),
                    conversation_history=conversation_history,
                    extracted_entities={}
                )
            except Exception as e:
                logger.error(f"Error getting final qualification: {e}")
                qualification_result = None
                score_breakdown = None
            
            # End call tracking
            success = self.crm_connector.end_call_tracking(
                call_id=call_id,
                duration=duration,
                outcome=outcome,
                conversation_history=conversation_history,
                qualification_result=qualification_result,
                score_breakdown=score_breakdown
            )
            
            if success:
                logger.info(f"Ended call tracking for session {session_id} (duration: {duration}s)")
                del self.active_calls[session_id]
                if session_id in self.call_start_times:
                    del self.call_start_times[session_id]
            else:
                logger.error(f"Failed to end call tracking for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error ending call session: {e}")


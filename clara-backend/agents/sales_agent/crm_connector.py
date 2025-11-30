"""
CRM Connector - Connect Sales Agent to Supabase CRM
"""

from typing import Dict, Any, Optional
from datetime import datetime
import re
from crm_integration.leads_api import LeadsAPI
from crm_integration.users_api import UsersAPI
from crm_integration.calls_api import CallsAPI
from utils.logger import get_logger
from utils.validators import validate_email, validate_phone

logger = get_logger("sales_crm_connector")


class SalesCRMConnector:
    """Handle CRM operations for sales agent"""
    
    def __init__(self):
        """Initialize CRM connector"""
        self.leads_api = LeadsAPI()
        self.users_api = UsersAPI()
        self.calls_api = CallsAPI()
        
        # Get or create Clara AI agent user
        self.clara_agent = self.users_api.get_default_agent()
        if self.clara_agent:
            self.default_agent_id = self.clara_agent["id"]
            logger.info(f"Using Clara AI agent ID: {self.default_agent_id}")
        else:
            self.default_agent_id = None
            logger.warning("Could not initialize Clara AI agent user - calls will not be assigned to a user")
        
        logger.info("Sales CRM connector initialized with users and calls tracking")
    
    def _normalize_email(self, email: str) -> Optional[str]:
        """
        Normalize email address for consistent lookup
        
        Handles:
        - "at" -> "@" conversion
        - Lowercase conversion
        - Whitespace removal
        - Basic validation
        
        Args:
            email: Raw email string (may be malformed)
            
        Returns:
            Normalized email or None if invalid
        """
        if not email:
            return None
        
        # Convert to lowercase and strip whitespace
        email = email.lower().strip()
        
        # Replace "at" with "@" (common in voice transcriptions)
        email = re.sub(r'\s+at\s+', '@', email, flags=re.IGNORECASE)
        email = re.sub(r'\s+@\s+', '@', email)  # Remove spaces around @
        
        # Remove any remaining spaces
        email = email.replace(' ', '')
        
        # Basic email validation (must have @ and at least one . after @)
        if '@' not in email or '.' not in email.split('@')[1]:
            logger.warning(f"Invalid email format after normalization: {email}")
            return None
        
        return email
    
    def create_or_update_lead(
        self,
        lead_info: Dict[str, Any],
        qualification_result: Dict[str, Any],
        score_breakdown: Dict[str, Any],
        agent_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create new lead or update existing one
        
        Args:
            lead_info: Lead information
            qualification_result: Qualification assessment
            score_breakdown: Score breakdown
            agent_id: ID of agent handling the lead (defaults to Clara AI agent)
            
        Returns:
            Created/updated lead or None if failed
        """
        try:
            # Use provided agent_id or default to Clara AI agent
            effective_agent_id = agent_id or self.default_agent_id
            
            if not effective_agent_id:
                logger.error("No agent ID available for lead creation")
                # Continue anyway - lead can exist without agent assignment
            
            # Normalize email before lookup
            raw_email = lead_info.get("email")
            normalized_email = self._normalize_email(raw_email) if raw_email else None
            
            # Update lead_info with normalized email
            if normalized_email and normalized_email != raw_email:
                logger.info(f"Normalized email: '{raw_email}' -> '{normalized_email}'")
                lead_info["email"] = normalized_email
            
            # Check if lead already exists (try multiple lookup methods)
            existing_lead = None
            
            # Try email lookup first (most reliable)
            if normalized_email:
                existing_lead = self.leads_api.find_lead_by_email(normalized_email)
                if existing_lead:
                    logger.info(f"Found existing lead by email: {existing_lead['id']}")
            
            # If not found by email, try phone
            if not existing_lead:
                phone = lead_info.get("phone")
                if phone:
                    existing_lead = self.leads_api.find_lead_by_phone(phone)
                    if existing_lead:
                        logger.info(f"Found existing lead by phone: {existing_lead['id']}")
            
            # Note: We don't search by company+contact to avoid false matches
            # Email and phone are the primary identifiers
            
            # Prepare lead data
            lead_data = self._prepare_lead_data(
                lead_info,
                qualification_result,
                score_breakdown
            )
            
            # Safety check: If lead_data preparation failed, don't proceed
            if lead_data is None:
                logger.error("Lead data preparation failed - insufficient information")
                return None
            
            if existing_lead:
                # Update existing lead
                lead_id = existing_lead["id"]
                logger.info(f"Updating existing lead: {lead_id}")
                
                updated_lead = self.leads_api.update_lead(lead_id, lead_data)
                
                if updated_lead:
                    # Log activity
                    self.leads_api.add_activity(
                        lead_id=lead_id,
                        activity_type="ai_interaction",
                        subject="AI Voice Assistant - Follow-up",
                        description="Lead information updated through AI voice assistant",
                        created_by=effective_agent_id,
                        metadata={
                            "source": "voice_assistant",
                            "qualification_status": qualification_result.get("qualification_status"),
                            "lead_score": score_breakdown.get("total_score")
                        }
                    )
                
                return updated_lead
            else:
                # Create new lead
                logger.info("Creating new lead")
                
                created_lead = self.leads_api.create_lead(lead_data, effective_agent_id)
                
                if created_lead:
                    # Activity is now logged in leads_api.create_lead
                    logger.info(f"Successfully created lead: {created_lead['id']}")
                
                return created_lead
                
        except Exception as e:
            logger.error(f"Error creating/updating lead: {e}")
            return None
    
    def _prepare_lead_data(
        self,
        lead_info: Dict[str, Any],
        qualification_result: Dict[str, Any],
        score_breakdown: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Prepare comprehensive lead data for CRM with full TrendtialCRM schema
        
        Returns:
            Dict with lead data, or None if insufficient information
        """
        extracted_info = qualification_result.get("extracted_info", {})
        bant = qualification_result.get("bant_assessment", {})
        
        # Merge lead_info and extracted_info
        merged_info = {**lead_info, **extracted_info}
        
        # CRITICAL: Ensure we have minimum required data
        # TrendtialCRM requires client_name (company_name) - generate fallback if needed
        company_name = merged_info.get("company_name")
        contact_person = merged_info.get("contact_person") or merged_info.get("name")
        industry = merged_info.get("industry")
        email = merged_info.get("email")
        
        # Generate company_name using fallback logic (in priority order):
        if not company_name:
            if contact_person:
                # Use contact person's name as company
                company_name = f"{contact_person}'s Company"
                logger.info(f"No company_name provided, using contact person: {company_name}")
            elif industry:
                # Use industry to generate company name
                company_name = f"{industry.title()} Company"
                logger.info(f"No company_name provided, using industry: {company_name}")
            elif email:
                # Extract domain from email as last resort
                email_domain = email.split("@")[1].split(".")[0] if "@" in email else None
                if email_domain:
                    company_name = f"{email_domain.title()} Company"
                    logger.info(f"No company_name provided, using email domain: {company_name}")
                else:
                    company_name = "Unknown Company"
                    logger.warning("No company_name provided, using default: Unknown Company")
            else:
                # Absolute last resort
                company_name = "Unknown Company"
                logger.warning("No company_name provided, using default: Unknown Company")
        
        # Build comprehensive lead data with ALL TrendtialCRM + Clara fields
        lead_data = {
            # ===== Core Contact Information =====
            "company_name": company_name,
            "contact_person": contact_person,
            "email": merged_info.get("email"),
            "phone": merged_info.get("phone"),
            
            # ===== Company Details =====
            "industry": merged_info.get("industry"),
            "company_size": self._parse_company_size(merged_info.get("company_size")),
            "location": merged_info.get("location"),
            
            # ===== Lead Classification (TrendtialCRM) =====
            "status_bucket": self._determine_stage(
                score_breakdown.get("total_score", 0),
                qualification_result.get("qualification_status")
            ),
            "qualification_status": qualification_result.get("qualification_status", "unqualified"),
            "lead_score": score_breakdown.get("total_score", 0),
            
            # ===== BANT Assessment (Clara's Strength!) =====
            # Note: authority is not a column in leads table, so we store BANT in notes/progress_details
            # budget, need, timeline are stored in progress_details and notes
            "budget": None,  # Not a column - stored in notes
            "need": None,    # Not a column - stored in notes
            "timeline": None,  # Not a column - stored in notes
            
            # ===== Source Tracking (TrendtialCRM) =====
            "lead_source": "voice_assistant",
            "campaign_id": merged_info.get("campaign_id"),
            "utm_source": merged_info.get("utm_source"),
            "utm_medium": merged_info.get("utm_medium", "voice"),
            "utm_campaign": merged_info.get("utm_campaign"),
            "referrer_url": merged_info.get("referrer_url"),
            
            # ===== Business & Pipeline Details =====
            "deal_value": self._parse_budget_amount(
                merged_info.get("budget_amount") or 
                merged_info.get("deal_value") or 
                merged_info.get("expected_value")
            ),
            "expected_close_date": self._estimate_close_date(bant.get("timeline")),
            "win_probability": self._estimate_win_probability(
                score_breakdown.get("total_score", 0)
            ),
            
            # ===== Progress & Next Steps =====
            "progress_details": self._build_progress_details(merged_info, bant, qualification_result),
            "next_step": qualification_result.get("next_best_action", "Continue qualification"),
            "follow_up_due_date": self._estimate_follow_up_date(bant.get("timeline")),
            
            # ===== Notes & Context =====
            "notes": self._build_notes(merged_info, bant),
            "tags": self._generate_tags(merged_info, bant, qualification_result),
            
            # ===== Clara AI Context (Clara-specific) =====
            "conversation_summary": self._build_conversation_summary(merged_info, bant, qualification_result),
            "extracted_info": merged_info,  # Store raw extracted info as JSONB
            
            # ===== Sync Management =====
            "sync_lock": False,  # Not syncing to Google Sheets
        }
        
        # Remove None values and exclude fields that don't exist in leads table
        # Note: company_name, company_size, location are kept here for leads_api.create_lead
        # which uses them to create/update the client. They'll be filtered out in update_lead.
        excluded_fields = {"budget", "authority", "need", "timeline", "conversation_summary", "extracted_info"}
        
        filtered_data = {
            k: v for k, v in lead_data.items() 
            if v is not None and k not in excluded_fields
        }
        
        return filtered_data
    
    def _determine_stage(self, lead_score: int, qualification_status: str) -> str:
        """Determine lead stage (P1/P2/P3) based on score and qualification"""
        if qualification_status == "opportunity" or lead_score >= 70:
            return "P1"
        elif qualification_status == "sales_qualified" or lead_score >= 50:
            return "P2"
        else:
            return "P3"
    
    def _parse_budget_amount(self, budget_str: Optional[Any]) -> Optional[float]:
        """
        Parse budget amount from various formats to numeric value
        
        Handles:
        - Numeric strings: "10000", "10,000"
        - Currency formats: "$10,000", "$10k", "10k"
        - Written numbers: "ten thousand", "ten thousand dollars"
        
        Args:
            budget_str: Budget string or number
            
        Returns:
            Numeric budget value or None
        """
        if not budget_str:
            return None
        
        # If already a number, return it
        if isinstance(budget_str, (int, float)):
            return float(budget_str)
        
        budget_str = str(budget_str).lower().strip()
        
        # Remove currency symbols and common words
        budget_str = budget_str.replace('$', '').replace(',', '').replace('usd', '').replace('dollars', '').replace('dollar', '').strip()
        
        # Handle "k" suffix (thousands)
        multiplier = 1
        if budget_str.endswith('k'):
            multiplier = 1000
            budget_str = budget_str[:-1].strip()
        elif budget_str.endswith('m'):
            multiplier = 1000000
            budget_str = budget_str[:-1].strip()
        
        # Try to extract numeric value
        import re
        numbers = re.findall(r'\d+\.?\d*', budget_str)
        
        if numbers:
            try:
                value = float(numbers[0]) * multiplier
                logger.info(f"Parsed budget amount: {budget_str} -> {value}")
                return value
            except (ValueError, TypeError):
                pass
        
        # Map written numbers (common cases)
        written_numbers = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
            "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
            "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
            "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
            "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70,
            "eighty": 80, "ninety": 90, "hundred": 100, "thousand": 1000, "million": 1000000
        }
        
        # Try to parse written numbers (simple cases like "ten thousand")
        words = budget_str.split()
        if len(words) >= 2:
            try:
                first_word = words[0]
                second_word = words[1]
                
                if first_word in written_numbers and second_word in ["thousand", "hundred", "million"]:
                    value = written_numbers[first_word] * written_numbers[second_word]
                    logger.info(f"Parsed written budget: {budget_str} -> {value}")
                    return float(value)
            except (KeyError, ValueError):
                pass
        
        logger.warning(f"Could not parse budget amount: {budget_str}")
        return None
    
    def _parse_company_size(self, company_size_str: Optional[str]) -> Optional[int]:
        """Parse company size string to integer"""
        if not company_size_str:
            return None
        
        size_str = str(company_size_str).lower()
        
        # Try to extract numbers
        import re
        numbers = re.findall(r'\d+', size_str)
        
        if numbers:
            return int(numbers[0])
        
        # Map common size descriptions
        size_map = {
            "startup": 10,
            "small": 25,
            "medium": 100,
            "large": 500,
            "enterprise": 1000,
        }
        
        for key, value in size_map.items():
            if key in size_str:
                return value
        
        return None
    
    def _estimate_close_date(self, timeline: Optional[str]) -> Optional[str]:
        """Estimate close date based on timeline"""
        from datetime import datetime, timedelta
        
        if not timeline or timeline == "unknown":
            return None
        
        today = datetime.utcnow()
        
        timeline_map = {
            "immediate": timedelta(days=7),
            "this_quarter": timedelta(days=90),
            "future": timedelta(days=180),
            "no_timeline": timedelta(days=365),
        }
        
        delta = timeline_map.get(timeline, timedelta(days=90))
        close_date = today + delta
        
        return close_date.isoformat()
    
    def _estimate_win_probability(self, lead_score: int) -> int:
        """Estimate win probability percentage based on lead score"""
        # Simple linear mapping: score 0-100 -> probability 0-100%
        # You can make this more sophisticated based on historical data
        if lead_score >= 80:
            return 75
        elif lead_score >= 60:
            return 50
        elif lead_score >= 40:
            return 25
        elif lead_score >= 20:
            return 10
        else:
            return 5
    
    def _estimate_follow_up_date(self, timeline: Optional[str]) -> Optional[str]:
        """Estimate follow-up date based on BANT timeline"""
        from datetime import datetime, timedelta
        
        if not timeline or timeline == "unknown":
            # Default: follow up in 1 week
            return (datetime.utcnow() + timedelta(days=7)).isoformat()
        
        timeline_map = {
            "immediate": timedelta(days=1),     # Follow up tomorrow
            "this_quarter": timedelta(days=3),  # Follow up in 3 days
            "future": timedelta(days=14),       # Follow up in 2 weeks
            "no_timeline": timedelta(days=30),  # Follow up in 1 month
        }
        
        delta = timeline_map.get(timeline, timedelta(days=7))
        follow_up_date = datetime.utcnow() + delta
        
        return follow_up_date.isoformat()
    
    def _build_progress_details(
        self,
        lead_info: Dict[str, Any],
        bant: Dict[str, Any],
        qualification_result: Dict[str, Any]
    ) -> str:
        """Build progress details field"""
        details = []
        
        # Qualification status
        qual_status = qualification_result.get("qualification_status", "unqualified")
        details.append(f"Status: {qual_status.replace('_', ' ').title()}")
        
        # BANT summary
        bant_known = sum(1 for v in bant.values() if v and v != "unknown")
        details.append(f"BANT: {bant_known}/4 criteria identified")
        
        # Missing information
        missing = qualification_result.get("missing_information", [])
        if missing:
            details.append(f"Missing: {', '.join(missing)}")
        
        return " | ".join(details)
    
    def _build_conversation_summary(
        self,
        lead_info: Dict[str, Any],
        bant: Dict[str, Any],
        qualification_result: Dict[str, Any]
    ) -> str:
        """Build conversation summary for Clara AI context"""
        summary_parts = []
        
        # Lead type
        qual_status = qualification_result.get("qualification_status", "unqualified")
        summary_parts.append(f"Lead qualified as: {qual_status}")
        
        # Key information gathered
        gathered_info = []
        if lead_info.get("company_name"):
            gathered_info.append("company")
        if lead_info.get("email"):
            gathered_info.append("email")
        if lead_info.get("phone"):
            gathered_info.append("phone")
        if lead_info.get("industry"):
            gathered_info.append("industry")
        
        if gathered_info:
            summary_parts.append(f"Gathered: {', '.join(gathered_info)}")
        
        # BANT status
        bant_str = ", ".join([f"{k}: {v}" for k, v in bant.items() if v and v != "unknown"])
        if bant_str:
            summary_parts.append(f"BANT: {bant_str}")
        
        # Pain points if any
        pain_points = lead_info.get("pain_points", [])
        if pain_points:
            summary_parts.append(f"Pain points: {', '.join(pain_points[:2])}")
        
        return " | ".join(summary_parts)
    
    def _build_notes(self, lead_info: Dict[str, Any], bant: Dict[str, Any]) -> str:
        """Build notes field from lead info and BANT"""
        notes = []
        
        # Add budget amount if available
        budget_amount = lead_info.get("budget_amount")
        if budget_amount:
            # Format budget nicely
            if isinstance(budget_amount, (int, float)):
                if budget_amount >= 1000000:
                    budget_str = f"${budget_amount/1000000:.1f}M"
                elif budget_amount >= 1000:
                    budget_str = f"${budget_amount/1000:.0f}k"
                else:
                    budget_str = f"${budget_amount:.0f}"
                notes.append(f"Budget: {budget_str}")
        
        # Add pain points
        pain_points = lead_info.get("pain_points", [])
        if pain_points:
            notes.append(f"Pain Points: {', '.join(pain_points)}")
        
        # Add requirements
        requirements = lead_info.get("requirements", [])
        if requirements:
            notes.append(f"Requirements: {', '.join(requirements)}")
        
        # Add BANT summary
        bant_summary = []
        for key, value in bant.items():
            if value != "unknown":
                bant_summary.append(f"{key.capitalize()}: {value}")
        
        if bant_summary:
            notes.append(f"BANT: {', '.join(bant_summary)}")
        
        return " | ".join(notes) if notes else "Initial contact via voice assistant"
    
    def _generate_tags(
        self,
        lead_info: Dict[str, Any],
        bant: Dict[str, Any],
        qualification_result: Dict[str, Any]
    ) -> list:
        """Generate tags for lead"""
        tags = ["voice_lead", "ai_qualified"]
        
        # Add qualification status tag
        qual_status = qualification_result.get("qualification_status")
        if qual_status:
            tags.append(qual_status)
        
        # Add urgency tag
        if bant.get("need") == "urgent":
            tags.append("urgent")
        
        if bant.get("timeline") == "immediate":
            tags.append("hot_lead")
        
        # Add industry tag
        if lead_info.get("industry"):
            tags.append(lead_info["industry"].lower().replace(" ", "_"))
        
        return tags
    
    def log_conversation_summary(
        self,
        lead_id: str,
        conversation_summary: str,
        key_points: list
    ) -> bool:
        """
        Log conversation summary as activity
        
        Args:
            lead_id: Lead ID
            conversation_summary: Summary of conversation
            key_points: List of key points discussed
            
        Returns:
            True if successful, False otherwise
        """
        try:
            activity = self.leads_api.add_activity(
                lead_id=lead_id,
                activity_type="call",
                description=conversation_summary,
                metadata={
                    "key_points": key_points,
                    "source": "voice_assistant",
                    "automated": True
                }
            )
            
            return activity is not None
            
        except Exception as e:
            logger.error(f"Error logging conversation summary: {e}")
            return False
    
    def schedule_follow_up(
        self,
        lead_id: str,
        follow_up_info: Dict[str, Any]
    ) -> bool:
        """
        Schedule a follow-up for the lead
        
        Args:
            lead_id: Lead ID
            follow_up_info: Follow-up information
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Update lead with follow-up date
            follow_up_date = follow_up_info.get("follow_up_date")
            notes = follow_up_info.get("notes", "")
            
            if follow_up_date:
                updated = self.leads_api.update_lead(
                    lead_id,
                    {
                        "follow_up_due_date": follow_up_date,
                        "next_step": f"Follow up: {notes}"
                    }
                )
                
                if updated:
                    # Log activity
                    self.leads_api.add_activity(
                        lead_id=lead_id,
                        activity_type="task",
                        subject="Follow-up Scheduled",
                        description=f"Follow-up scheduled for {follow_up_date}",
                        created_by=self.default_agent_id,
                        metadata={"notes": notes, "automated": True}
                    )
                    
                return updated is not None
            
            return False
            
        except Exception as e:
            logger.error(f"Error scheduling follow-up: {e}")
            return False
    
    # ========== Call Tracking Methods ==========
    
    def start_call_tracking(
        self,
        lead_id: str,
        session_id: str,
        agent_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Start tracking a voice call
        
        Args:
            lead_id: Lead ID
            session_id: Conversation session ID
            agent_id: Agent user ID (defaults to Clara AI agent)
            
        Returns:
            Call ID or None if failed
        """
        try:
            effective_agent_id = agent_id or self.default_agent_id
            
            call = self.calls_api.create_call(
                lead_id=lead_id,
                user_id=effective_agent_id,
                session_id=session_id,
                call_type="outbound",  # Must match schema: inbound, outbound, callback, or voicemail
                call_start_time=datetime.utcnow(),
                notes="AI Voice Assistant call started"
            )
            
            if call:
                logger.info(f"Started call tracking: {call['id']} for lead {lead_id}")
                return call["id"]
            else:
                logger.error("Failed to start call tracking")
                return None
            
        except Exception as e:
            logger.error(f"Error starting call tracking: {e}")
            return None
    
    def end_call_tracking(
        self,
        call_id: str,
        duration: int,
        outcome: str,
        conversation_history: list,
        qualification_result: Optional[Dict[str, Any]] = None,
        score_breakdown: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        End call tracking with final details
        
        Args:
            call_id: Call ID
            duration: Call duration in seconds
            outcome: Call outcome (completed, qualified, not_interested, etc.)
            conversation_history: Full conversation
            qualification_result: Lead qualification result
            score_breakdown: Lead score breakdown
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Build transcript from conversation history
            transcript = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in conversation_history
                if msg['role'] in ['user', 'assistant']
            ])
            
            # Determine intent from qualification
            intent_detected = None
            confidence_score = None
            
            if qualification_result:
                intent_detected = qualification_result.get("qualification_status")
                # Use lead score as confidence indicator
                if score_breakdown:
                    confidence_score = score_breakdown.get("total_score", 0) / 100.0
            
            # Build notes
            notes_parts = ["AI Voice Assistant Call Completed"]
            
            if qualification_result:
                qual_status = qualification_result.get("qualification_status")
                notes_parts.append(f"Qualification: {qual_status}")
                
                bant = qualification_result.get("bant_assessment", {})
                if bant:
                    bant_str = ", ".join([f"{k}: {v}" for k, v in bant.items() if v != "unknown"])
                    if bant_str:
                        notes_parts.append(f"BANT: {bant_str}")
            
            if score_breakdown:
                score = score_breakdown.get("total_score")
                grade = score_breakdown.get("score_grade")
                notes_parts.append(f"Lead Score: {score}/100 (Grade: {grade})")
            
            notes = " | ".join(notes_parts)
            
            # End the call
            success = self.calls_api.end_call(
                call_id=call_id,
                duration=duration,
                outcome=outcome,
                transcript=transcript,
                sentiment_score=None,  # TODO: Add sentiment analysis
                intent_detected=intent_detected,
                confidence_score=confidence_score,
                notes=notes
            )
            
            if success:
                logger.info(f"Ended call tracking: {call_id} (duration: {duration}s, outcome: {outcome})")
            
            return success
            
        except Exception as e:
            logger.error(f"Error ending call tracking: {e}")
            return False
    
    def get_call_by_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get call record by session ID
        
        Args:
            session_id: Session ID
            
        Returns:
            Call record or None
        """
        return self.calls_api.get_call_by_session(session_id)


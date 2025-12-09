"""
Lead Scorer - Calculate lead scores based on multiple factors
"""

from typing import Dict, Any
from utils.logger import get_logger

logger = get_logger("lead_scorer")


class LeadScorer:
    """Calculate and update lead scores"""
    
    def __init__(self):
        """Initialize lead scorer with scoring rules"""
        self.scoring_rules = self._load_scoring_rules()
        logger.info("Lead scorer initialized")
    
    def _load_scoring_rules(self) -> Dict[str, Any]:
        """
        Load scoring rules configuration
        
        Returns:
            Dictionary of scoring rules
        """
        return {
            "company_fit": {
                "max_points": 25,
                "criteria": {
                    "company_size": {
                        "enterprise": 10,
                        "large": 8,
                        "medium": 6,
                        "small": 4,
                        "startup": 3,
                    },
                    "industry_match": {
                        "exact_match": 10,
                        "related": 6,
                        "general": 3,
                    },
                    "location": {
                        "target_region": 5,
                        "other": 2,
                    }
                }
            },
            "engagement": {
                "max_points": 25,
                "criteria": {
                    "response_quality": {
                        "detailed": 10,
                        "moderate": 6,
                        "brief": 3,
                    },
                    "interaction_count": {
                        "5+": 5,
                        "3-4": 4,
                        "2": 2,
                        "1": 1,
                    },
                    "interest_level": {
                        "high": 10,
                        "medium": 6,
                        "low": 2,
                    }
                }
            },
            "bant": {
                "max_points": 30,
                "criteria": {
                    "budget": {
                        "high": 10,
                        "medium": 6,
                        "low": 2,
                        "unknown": 0,
                    },
                    "authority": {
                        "yes": 10,
                        "influencer": 6,
                        "no": 2,
                        "unknown": 0,
                    },
                    "need": {
                        "urgent": 5,
                        "high": 4,
                        "medium": 3,
                        "low": 1,
                        "unknown": 0,
                    },
                    "timeline": {
                        "immediate": 5,
                        "this_quarter": 4,
                        "future": 2,
                        "no_timeline": 1,
                        "unknown": 0,
                    }
                }
            },
            "intent_signals": {
                "max_points": 20,
                "criteria": {
                    "pricing_inquiry": 5,
                    "demo_request": 10,
                    "meeting_request": 10,
                    "urgency_expressed": 5,
                    "competitor_mention": 3,
                    "timeline_mentioned": 3,
                }
            }
        }
    
    def calculate_score(
        self,
        lead_info: Dict[str, Any],
        bant_assessment: Dict[str, str],
        conversation_history: list,
        extracted_entities: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive lead score
        
        Args:
            lead_info: Lead information
            bant_assessment: BANT assessment results
            conversation_history: Conversation messages
            extracted_entities: Extracted entities from messages
            
        Returns:
            Score breakdown and total
        """
        try:
            # Calculate each category
            company_fit_score = self._score_company_fit(lead_info)
            engagement_score = self._score_engagement(conversation_history, lead_info)
            bant_score = self._score_bant(bant_assessment)
            intent_score = self._score_intent_signals(conversation_history, extracted_entities)
            
            # Calculate total
            total_score = company_fit_score + engagement_score + bant_score + intent_score
            
            # Clamp to 0-100
            total_score = max(0, min(100, total_score))
            
            score_breakdown = {
                "total_score": total_score,
                "category_scores": {
                    "company_fit": company_fit_score,
                    "engagement": engagement_score,
                    "bant": bant_score,
                    "intent_signals": intent_score,
                },
                "score_grade": self._get_score_grade(total_score),
                "scoring_factors": self._get_scoring_factors(lead_info, bant_assessment),
            }
            
            logger.info(f"Calculated lead score: {total_score}/100 (Grade: {score_breakdown['score_grade']})")
            
            return score_breakdown
            
        except Exception as e:
            logger.error(f"Error calculating lead score: {e}")
            return {
                "total_score": 0,
                "category_scores": {
                    "company_fit": 0,
                    "engagement": 0,
                    "bant": 0,
                    "intent_signals": 0,
                },
                "score_grade": "F",
                "error": str(e)
            }
    
    def _score_company_fit(self, lead_info: Dict[str, Any]) -> int:
        """Score based on company fit"""
        score = 0
        rules = self.scoring_rules["company_fit"]["criteria"]
        
        # Company size
        company_size = lead_info.get("company_size")
        if company_size:
            company_size_str = str(company_size).lower()
            for size_key, points in rules["company_size"].items():
                if size_key in company_size_str:
                    score += points
                    break
        
        # Industry match (simplified - you can enhance this)
        if lead_info.get("industry"):
            score += rules["industry_match"]["general"]  # Default to general match
        
        # Location (simplified)
        if lead_info.get("location"):
            score += rules["location"]["other"]
        
        return min(score, self.scoring_rules["company_fit"]["max_points"])
    
    def _score_engagement(self, conversation_history: list, lead_info: Dict[str, Any]) -> int:
        """Score based on engagement level"""
        score = 0
        rules = self.scoring_rules["engagement"]["criteria"]
        
        # Count user messages
        user_messages = [m for m in conversation_history if m.get("role") == "user"]
        message_count = len(user_messages)
        
        # Interaction count
        if message_count >= 5:
            score += rules["interaction_count"]["5+"]
        elif message_count >= 3:
            score += rules["interaction_count"]["3-4"]
        elif message_count >= 2:
            score += rules["interaction_count"]["2"]
        else:
            score += rules["interaction_count"]["1"]
        
        # Response quality (based on average message length)
        if user_messages:
            avg_length = sum(len(m.get("content", "")) for m in user_messages) / len(user_messages)
            if avg_length > 100:
                score += rules["response_quality"]["detailed"]
            elif avg_length > 50:
                score += rules["response_quality"]["moderate"]
            else:
                score += rules["response_quality"]["brief"]
        
        # Interest level (heuristic based on conversation)
        conversation_text = " ".join([m.get("content", "") for m in user_messages]).lower()
        interest_keywords = ["interested", "like", "want", "need", "tell me more", "how", "when"]
        
        if sum(1 for kw in interest_keywords if kw in conversation_text) >= 3:
            score += rules["interest_level"]["high"]
        elif sum(1 for kw in interest_keywords if kw in conversation_text) >= 1:
            score += rules["interest_level"]["medium"]
        else:
            score += rules["interest_level"]["low"]
        
        return min(score, self.scoring_rules["engagement"]["max_points"])
    
    def _score_bant(self, bant_assessment: Dict[str, str]) -> int:
        """Score based on BANT assessment"""
        score = 0
        rules = self.scoring_rules["bant"]["criteria"]
        
        for factor, value in bant_assessment.items():
            if factor in rules and value in rules[factor]:
                score += rules[factor][value]
        
        return min(score, self.scoring_rules["bant"]["max_points"])
    
    def _score_intent_signals(
        self,
        conversation_history: list,
        extracted_entities: Dict[str, Any]
    ) -> int:
        """Score based on buying intent signals"""
        score = 0
        rules = self.scoring_rules["intent_signals"]["criteria"]
        
        # Get all user messages
        user_messages = [m for m in conversation_history if m.get("role") == "user"]
        conversation_text = " ".join([m.get("content", "") for m in user_messages]).lower()
        
        # Check for various intent signals
        if any(word in conversation_text for word in ["price", "cost", "pricing", "how much"]):
            score += rules["pricing_inquiry"]
        
        if any(word in conversation_text for word in ["demo", "demonstration", "show me", "trial"]):
            score += rules["demo_request"]
        
        if any(word in conversation_text for word in ["meeting", "call", "schedule", "discuss"]):
            score += rules["meeting_request"]
        
        if any(word in conversation_text for word in ["urgent", "asap", "immediately", "soon"]):
            score += rules["urgency_expressed"]
        
        if any(word in conversation_text for word in ["currently using", "switching from", "competitor"]):
            score += rules["competitor_mention"]
        
        if any(word in conversation_text for word in ["when", "timeline", "deadline", "by"]):
            score += rules["timeline_mentioned"]
        
        return min(score, self.scoring_rules["intent_signals"]["max_points"])
    
    def _get_score_grade(self, score: int) -> str:
        """Convert score to letter grade"""
        if score >= 80:
            return "A"
        elif score >= 60:
            return "B"
        elif score >= 40:
            return "C"
        elif score >= 20:
            return "D"
        else:
            return "F"
    
    def _get_scoring_factors(
        self,
        lead_info: Dict[str, Any],
        bant_assessment: Dict[str, str]
    ) -> list:
        """Get list of positive and negative scoring factors"""
        factors = {
            "positive": [],
            "negative": [],
        }
        
        # Positive factors
        if bant_assessment.get("budget") in ["high", "medium"]:
            factors["positive"].append("Budget confirmed")
        
        if bant_assessment.get("authority") == "yes":
            factors["positive"].append("Decision maker engaged")
        
        if bant_assessment.get("need") in ["urgent", "high"]:
            factors["positive"].append("Strong need identified")
        
        if bant_assessment.get("timeline") in ["immediate", "this_quarter"]:
            factors["positive"].append("Near-term timeline")
        
        if lead_info.get("company_size"):
            factors["positive"].append("Company information provided")
        
        # Negative factors
        if bant_assessment.get("budget") == "unknown":
            factors["negative"].append("Budget not discussed")
        
        if bant_assessment.get("authority") == "no":
            factors["negative"].append("Not a decision maker")
        
        if bant_assessment.get("timeline") == "no_timeline":
            factors["negative"].append("No clear timeline")
        
        return factors
    
    def update_score(
        self,
        current_score: int,
        new_info: Dict[str, Any],
        score_delta: int = 0
    ) -> int:
        """
        Update existing lead score with new information
        
        Args:
            current_score: Current lead score
            new_info: New information that affects score
            score_delta: Manual score adjustment
            
        Returns:
            Updated score
        """
        updated_score = current_score + score_delta
        
        # Apply adjustments based on new info
        if new_info.get("demo_requested"):
            updated_score += 10
        
        if new_info.get("meeting_scheduled"):
            updated_score += 15
        
        if new_info.get("pricing_discussed"):
            updated_score += 5
        
        # Clamp to 0-100
        return max(0, min(100, updated_score))


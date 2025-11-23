"""
Agent Router - Route messages to appropriate agents
"""

from typing import Dict, Any, Optional
from config import settings, is_agent_enabled
from utils.logger import get_logger

logger = get_logger("router")


class AgentRouter:
    """Route messages to appropriate agents based on classification"""
    
    def __init__(self):
        """Initialize router"""
        self.routing_rules = self._load_routing_rules()
        logger.info("Agent router initialized")
    
    def _load_routing_rules(self) -> Dict[str, Any]:
        """
        Load routing rules configuration
        
        Returns:
            Dictionary of routing rules
        """
        return {
            "sales": {
                "enabled": is_agent_enabled("sales"),
                "priority_keywords": ["buy", "purchase", "demo", "pricing"],
                "default_priority": 3,
                "escalation_threshold": 0.9,
            },
            "support": {
                "enabled": is_agent_enabled("support"),
                "priority_keywords": ["urgent", "broken", "emergency", "critical"],
                "default_priority": 4,
                "escalation_threshold": 0.95,
            },
            "marketing": {
                "enabled": is_agent_enabled("marketing"),
                "priority_keywords": ["feedback", "suggestion"],
                "default_priority": 2,
                "escalation_threshold": 0.8,
            },
        }
    
    def route(
        self,
        classification: Dict[str, Any],
        message: str,
        user_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Route message to appropriate agent
        
        Args:
            classification: Classification result from MessageClassifier
            message: Original message text
            user_info: Optional user information
            
        Returns:
            Routing decision with target agent and metadata
        """
        try:
            intent = classification.get("intent", settings.DEFAULT_AGENT)
            confidence = classification.get("confidence", 0.5)
            entities = classification.get("entities", {})
            
            # Check if primary agent is enabled
            if not self.routing_rules[intent]["enabled"]:
                logger.warning(f"Agent '{intent}' is disabled, using fallback")
                intent = self._get_fallback_agent(intent)
            
            # Determine priority
            priority = self._calculate_priority(intent, entities, message)
            
            # Determine if escalation needed
            needs_escalation = self._check_escalation(intent, confidence, entities)
            
            # Build routing decision
            routing = {
                "target_agent": intent,
                "confidence": confidence,
                "priority": priority,
                "needs_escalation": needs_escalation,
                "reason": self._generate_routing_reason(intent, classification),
                "alternative_agents": self._get_alternative_agents(intent),
                "routing_metadata": {
                    "classification_method": classification.get("classification_method"),
                    "entities_extracted": len(entities),
                    "urgency": entities.get("urgency", "low"),
                },
            }
            
            logger.info(
                f"Routed to {intent} agent (priority: {priority}, "
                f"confidence: {confidence:.2f})"
            )
            
            return routing
            
        except Exception as e:
            logger.error(f"Error routing message: {e}")
            # Return default routing
            return {
                "target_agent": settings.DEFAULT_AGENT,
                "confidence": 0.5,
                "priority": 3,
                "needs_escalation": False,
                "reason": "Default routing due to error",
                "error": str(e)
            }
    
    def _calculate_priority(
        self,
        agent_type: str,
        entities: Dict[str, Any],
        message: str
    ) -> int:
        """
        Calculate message priority (1-5, where 5 is highest)
        
        Args:
            agent_type: Type of agent
            entities: Extracted entities
            message: Message text
            
        Returns:
            Priority level (1-5)
        """
        # Start with default priority
        priority = self.routing_rules[agent_type]["default_priority"]
        
        # Increase priority based on urgency
        urgency = entities.get("urgency", "low")
        if urgency == "high":
            priority = min(5, priority + 2)
        elif urgency == "medium":
            priority = min(5, priority + 1)
        
        # Check for priority keywords
        message_lower = message.lower()
        priority_keywords = self.routing_rules[agent_type]["priority_keywords"]
        
        if any(keyword in message_lower for keyword in priority_keywords):
            priority = min(5, priority + 1)
        
        return priority
    
    def _check_escalation(
        self,
        agent_type: str,
        confidence: float,
        entities: Dict[str, Any]
    ) -> bool:
        """
        Check if message needs escalation to human
        
        Args:
            agent_type: Type of agent
            confidence: Classification confidence
            entities: Extracted entities
            
        Returns:
            True if escalation needed, False otherwise
        """
        # Check confidence threshold
        threshold = self.routing_rules[agent_type]["escalation_threshold"]
        
        # Escalate if low confidence
        if confidence < settings.CLASSIFICATION_CONFIDENCE_THRESHOLD:
            return True
        
        # Escalate if high urgency
        if entities.get("urgency") == "high":
            return True
        
        return False
    
    def _generate_routing_reason(
        self,
        agent_type: str,
        classification: Dict[str, Any]
    ) -> str:
        """
        Generate human-readable routing reason
        
        Args:
            agent_type: Type of agent
            classification: Classification result
            
        Returns:
            Routing reason string
        """
        confidence = classification.get("confidence", 0)
        method = classification.get("classification_method", "unknown")
        
        reasons = {
            "sales": f"Message classified as sales inquiry ({method}, {confidence:.0%} confidence)",
            "support": f"Message classified as support request ({method}, {confidence:.0%} confidence)",
            "marketing": f"Message classified as marketing feedback ({method}, {confidence:.0%} confidence)",
        }
        
        return reasons.get(agent_type, "Default routing")
    
    def _get_alternative_agents(self, primary_agent: str) -> list:
        """
        Get alternative agents if primary fails
        
        Args:
            primary_agent: Primary agent type
            
        Returns:
            List of alternative agent types
        """
        all_agents = ["sales", "support", "marketing"]
        
        # Remove primary agent
        alternatives = [a for a in all_agents if a != primary_agent]
        
        # Filter to enabled agents only
        alternatives = [a for a in alternatives if self.routing_rules[a]["enabled"]]
        
        return alternatives
    
    def _get_fallback_agent(self, disabled_agent: str) -> str:
        """
        Get fallback agent when requested agent is disabled
        
        Args:
            disabled_agent: The disabled agent type
            
        Returns:
            Fallback agent type
        """
        # Try alternatives in order
        for agent_type in ["sales", "support", "marketing"]:
            if agent_type != disabled_agent and self.routing_rules[agent_type]["enabled"]:
                logger.info(f"Using fallback agent: {agent_type}")
                return agent_type
        
        # If all disabled, return sales as ultimate fallback
        logger.warning("All agents disabled, using sales as ultimate fallback")
        return "sales"
    
    def get_routing_stats(self) -> Dict[str, Any]:
        """
        Get routing statistics
        
        Returns:
            Dictionary of routing stats
        """
        return {
            "enabled_agents": [
                agent for agent, rules in self.routing_rules.items()
                if rules["enabled"]
            ],
            "disabled_agents": [
                agent for agent, rules in self.routing_rules.items()
                if not rules["enabled"]
            ],
            "routing_rules": self.routing_rules,
        }


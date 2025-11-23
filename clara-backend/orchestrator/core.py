"""
Core Orchestrator - Main orchestration logic
"""

from typing import Dict, Any, Optional
from .message_parser import MessageParser
from .classifier import MessageClassifier
from .router import AgentRouter
from utils.logger import get_logger
from config import settings

logger = get_logger("orchestrator")


class Orchestrator:
    """
    Main Orchestrator class that coordinates message flow through the system
    """
    
    def __init__(self):
        """Initialize orchestrator with all components"""
        try:
            self.parser = MessageParser()
            self.classifier = MessageClassifier()
            self.router = AgentRouter()
            
            logger.info("Orchestrator initialized successfully")
            logger.info(f"Enabled agents: {self.get_enabled_agents()}")
            
        except Exception as e:
            logger.error(f"Failed to initialize orchestrator: {e}")
            raise
    
    def process_message(
        self,
        raw_message: str,
        input_channel: str = "voice",
        user_info: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
        conversation_history: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Process incoming message through the complete pipeline
        
        Args:
            raw_message: The raw message text
            input_channel: Input channel (voice, email, chatbot)
            user_info: Optional user information
            session_id: Optional session ID for tracking
            conversation_history: Optional conversation history for context
            
        Returns:
            Complete processed message with routing information
        """
        try:
            logger.info(f"Processing message from {input_channel}")
            logger.debug(f"Message: {raw_message[:100]}...")
            
            # Step 1: Parse message
            parsed_message = self.parser.parse_message(
                raw_message=raw_message,
                input_channel=input_channel,
                user_info=user_info,
                session_id=session_id
            )
            
            # Step 2: Classify message
            classification = self.classifier.classify(
                message=parsed_message["sanitized_message"]
            )
            
            # Add classification to parsed message
            parsed_message["parsed_message"] = classification
            
            # Step 3: Route to agent
            routing = self.router.route(
                classification=classification,
                message=raw_message,
                user_info=user_info
            )
            
            # Add routing to parsed message
            parsed_message["routing"] = routing
            
            # Add conversation context if provided
            if conversation_history:
                parsed_message["conversation_history"] = conversation_history
            
            logger.info(
                f"Message processed successfully: "
                f"routed to {routing['target_agent']} "
                f"(confidence: {routing['confidence']:.2f}, "
                f"priority: {routing['priority']})"
            )
            
            return parsed_message
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            
            # Return error response
            return {
                "error": True,
                "error_message": str(e),
                "raw_message": raw_message,
                "routing": {
                    "target_agent": settings.DEFAULT_AGENT,
                    "confidence": 0.5,
                    "priority": 3,
                    "reason": "Fallback due to processing error"
                }
            }
    
    def route_to_agent(
        self,
        processed_message: Dict[str, Any],
        agent_instances: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Route processed message to the appropriate agent instance
        
        Args:
            processed_message: Fully processed message from process_message()
            agent_instances: Dictionary of initialized agent instances
            
        Returns:
            Agent response
        """
        try:
            target_agent = processed_message["routing"]["target_agent"]
            
            if not agent_instances or target_agent not in agent_instances:
                logger.warning(f"Agent '{target_agent}' not available")
                return {
                    "success": False,
                    "error": f"Agent '{target_agent}' not initialized",
                    "message": "I apologize, but I'm unable to process your request at the moment."
                }
            
            # Get agent instance
            agent = agent_instances[target_agent]
            
            # Call agent's process method
            logger.info(f"Calling {target_agent} agent")
            agent_response = agent.process(processed_message)
            
            return agent_response
            
        except Exception as e:
            logger.error(f"Error routing to agent: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "I apologize, but I encountered an error processing your request."
            }
    
    def get_enabled_agents(self) -> list:
        """
        Get list of currently enabled agents
        
        Returns:
            List of enabled agent names
        """
        stats = self.router.get_routing_stats()
        return stats["enabled_agents"]
    
    def get_orchestrator_status(self) -> Dict[str, Any]:
        """
        Get orchestrator status and statistics
        
        Returns:
            Status dictionary
        """
        return {
            "status": "operational",
            "components": {
                "parser": "initialized",
                "classifier": "initialized",
                "router": "initialized"
            },
            "enabled_agents": self.get_enabled_agents(),
            "routing_stats": self.router.get_routing_stats(),
            "settings": {
                "confidence_threshold": settings.CLASSIFICATION_CONFIDENCE_THRESHOLD,
                "default_agent": settings.DEFAULT_AGENT,
                "classifier_model": self.classifier.model,
            }
        }
    
    def test_pipeline(self, test_message: str = "Hello, I'm interested in your product") -> Dict[str, Any]:
        """
        Test the complete orchestrator pipeline
        
        Args:
            test_message: Test message to process
            
        Returns:
            Test result
        """
        try:
            logger.info("Running orchestrator pipeline test")
            
            result = self.process_message(
                raw_message=test_message,
                input_channel="test"
            )
            
            success = not result.get("error", False)
            
            test_result = {
                "success": success,
                "test_message": test_message,
                "classified_as": result.get("parsed_message", {}).get("intent"),
                "routed_to": result.get("routing", {}).get("target_agent"),
                "confidence": result.get("routing", {}).get("confidence"),
                "priority": result.get("routing", {}).get("priority"),
            }
            
            if success:
                logger.info("Pipeline test passed ✓")
            else:
                logger.error("Pipeline test failed ✗")
            
            return test_result
            
        except Exception as e:
            logger.error(f"Pipeline test failed with error: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance
_orchestrator_instance: Optional[Orchestrator] = None


def get_orchestrator() -> Orchestrator:
    """
    Get or create orchestrator instance (singleton pattern)
    
    Returns:
        Orchestrator instance
    """
    global _orchestrator_instance
    
    if _orchestrator_instance is None:
        _orchestrator_instance = Orchestrator()
    
    return _orchestrator_instance


"""
Base Agent - Abstract base class for all agents
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime
from utils.logger import get_logger
from config import get_agent_model, get_api_key

logger = get_logger("base_agent")


class BaseAgent(ABC):
    """Abstract base class for all AI agents"""
    
    def __init__(self, agent_type: str):
        """
        Initialize base agent
        
        Args:
            agent_type: Type of agent (sales, support, marketing)
        """
        self.agent_type = agent_type
        self.model = get_agent_model(agent_type)
        self.conversation_history: Dict[str, List[Dict]] = {}
        
        logger.info(f"{agent_type.capitalize()} Agent initialized with model: {self.model}")
    
    @abstractmethod
    def process(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process incoming message and generate response
        
        Args:
            message_data: Processed message data from orchestrator
            
        Returns:
            Agent response dictionary
        """
        pass
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """
        Get the system prompt for this agent
        
        Returns:
            System prompt string
        """
        pass
    
    def add_to_conversation_history(
        self,
        session_id: str,
        role: str,
        content: str
    ):
        """
        Add message to conversation history
        
        Args:
            session_id: Session ID for tracking conversation
            role: Message role (user, assistant, system)
            content: Message content
        """
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []
        
        self.conversation_history[session_id].append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep only last 20 messages per session to avoid context overflow
        if len(self.conversation_history[session_id]) > 20:
            # Keep system message and last 19 messages
            system_msgs = [m for m in self.conversation_history[session_id] if m["role"] == "system"]
            other_msgs = [m for m in self.conversation_history[session_id] if m["role"] != "system"]
            self.conversation_history[session_id] = system_msgs + other_msgs[-19:]
    
    def get_conversation_history(
        self,
        session_id: str,
        include_system: bool = True
    ) -> List[Dict[str, str]]:
        """
        Get conversation history for a session
        
        Args:
            session_id: Session ID
            include_system: Whether to include system messages
            
        Returns:
            List of conversation messages
        """
        if session_id not in self.conversation_history:
            # Initialize with system prompt
            self.conversation_history[session_id] = [{
                "role": "system",
                "content": self.get_system_prompt()
            }]
        
        history = self.conversation_history[session_id]
        
        if not include_system:
            history = [m for m in history if m["role"] != "system"]
        
        # Return in format expected by LLM APIs (without timestamp)
        return [
            {"role": m["role"], "content": m["content"]}
            for m in history
        ]
    
    def clear_conversation_history(self, session_id: str):
        """
        Clear conversation history for a session
        
        Args:
            session_id: Session ID to clear
        """
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]
            logger.info(f"Cleared conversation history for session: {session_id}")
    
    def format_response(
        self,
        message: str,
        success: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
        actions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Format agent response in standard structure
        
        Args:
            message: Response message
            success: Whether operation was successful
            metadata: Additional metadata
            actions: List of actions taken (e.g., ["created_lead", "scheduled_followup"])
            
        Returns:
            Formatted response dictionary
        """
        return {
            "success": success,
            "agent": self.agent_type,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
            "actions": actions or [],
        }
    
    def extract_session_id(self, message_data: Dict[str, Any]) -> str:
        """
        Extract session ID from message data
        
        Args:
            message_data: Message data from orchestrator
            
        Returns:
            Session ID
        """
        return message_data.get("user_info", {}).get("session_id", "default_session")
    
    def get_agent_status(self) -> Dict[str, Any]:
        """
        Get agent status and statistics
        
        Returns:
            Status dictionary
        """
        return {
            "agent_type": self.agent_type,
            "model": self.model,
            "active_sessions": len(self.conversation_history),
            "status": "operational"
        }


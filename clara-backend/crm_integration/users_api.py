"""
Users API - Manage user lookups and agent assignments
"""

from typing import Dict, Any, Optional, List
from .supabase_client import get_supabase_client
from utils.logger import get_logger

logger = get_logger("users_api")


class UsersAPI:
    """API for managing users in Supabase CRM"""
    
    def __init__(self):
        self.client = get_supabase_client()
        self._clara_agent_cache = None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID
        
        Args:
            user_id: User UUID
            
        Returns:
            User data or None if not found
        """
        try:
            result = self.client.table("users").select("*").eq("id", user_id).execute()
            
            if result.data:
                logger.debug(f"Found user: {user_id}")
                return result.data[0]
            else:
                logger.warning(f"User not found: {user_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting user {user_id}: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email address
        
        Args:
            email: User email
            
        Returns:
            User data or None if not found
        """
        try:
            result = self.client.table("users").select("*").eq("email", email).execute()
            
            if result.data:
                logger.debug(f"Found user by email: {email}")
                return result.data[0]
            else:
                logger.warning(f"User not found by email: {email}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {e}")
            return None
    
    def get_default_agent(self) -> Optional[Dict[str, Any]]:
        """
        Get the Clara AI agent user
        Creates one if it doesn't exist
        Uses caching for performance
        
        Returns:
            Clara AI agent user or None if creation fails
        """
        # Return cached value if available
        if self._clara_agent_cache:
            return self._clara_agent_cache
        
        try:
            # Try to find Clara AI agent
            result = self.client.table("users").select("*").eq(
                "email", "clara@trendtialcrm.ai"
            ).execute()
            
            if result.data:
                logger.info("Found existing Clara AI agent")
                self._clara_agent_cache = result.data[0]
                return self._clara_agent_cache
            
            # Clara AI agent doesn't exist, try to create it
            logger.info("Clara AI agent not found, attempting to create...")
            
            # Note: This requires the users table to not have strict FK to auth.users
            # or we need to create an auth user first
            try:
                create_result = self.client.table("users").insert({
                    "email": "clara@trendtialcrm.ai",
                    "full_name": "Clara AI Voice Assistant",
                    "role": "agent",
                }).execute()
                
                if create_result.data:
                    logger.info("Clara AI agent created successfully")
                    self._clara_agent_cache = create_result.data[0]
                    return self._clara_agent_cache
                else:
                    logger.error("Failed to create Clara AI agent")
                    return None
                    
            except Exception as create_error:
                logger.error(f"Error creating Clara AI agent: {create_error}")
                logger.warning("You may need to manually create clara@trendtialcrm.ai user in Supabase")
                return None
            
        except Exception as e:
            logger.error(f"Error getting/creating default agent: {e}")
            return None
    
    def list_agents(self, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """
        List all agents
        
        Args:
            include_inactive: Include inactive agents
            
        Returns:
            List of agent users
        """
        try:
            query = self.client.table("users").select("*").eq("role", "agent")
            
            if not include_inactive:
                query = query.eq("is_active", True)
            
            result = query.execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} agents")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error listing agents: {e}")
            return []
    
    def list_managers(self, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """
        List all managers
        
        Args:
            include_inactive: Include inactive managers
            
        Returns:
            List of manager users
        """
        try:
            query = self.client.table("users").select("*").eq("role", "manager")
            
            if not include_inactive:
                query = query.eq("is_active", True)
            
            result = query.execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} managers")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error listing managers: {e}")
            return []
    
    def get_user_role(self, user_id: str) -> Optional[str]:
        """
        Get user's role
        
        Args:
            user_id: User UUID
            
        Returns:
            Role string or None
        """
        user = self.get_user_by_id(user_id)
        return user.get("role") if user else None
    
    def is_agent_active(self, user_id: str) -> bool:
        """
        Check if an agent is active
        
        Args:
            user_id: User UUID
            
        Returns:
            True if active, False otherwise
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        return user.get("is_active", False) and user.get("role") == "agent"
    
    def get_agent_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Find agent by name (case-insensitive search)
        
        Args:
            name: Agent name to search
            
        Returns:
            Agent user or None
        """
        try:
            # Search for agents with matching name
            result = self.client.table("users").select("*").eq("role", "agent").ilike(
                "full_name", f"%{name}%"
            ).execute()
            
            if result.data:
                logger.debug(f"Found agent by name: {name}")
                return result.data[0]  # Return first match
            else:
                logger.warning(f"Agent not found by name: {name}")
                return None
                
        except Exception as e:
            logger.error(f"Error finding agent by name {name}: {e}")
            return None
    
    def assign_agent_to_lead(
        self,
        lead_id: str,
        agent_id: str
    ) -> bool:
        """
        Assign an agent to a lead
        
        Args:
            lead_id: Lead UUID
            agent_id: Agent user UUID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Verify agent exists and is active
            if not self.is_agent_active(agent_id):
                logger.error(f"Cannot assign inactive agent: {agent_id}")
                return False
            
            # Update lead
            result = self.client.table("leads").update({
                "agent_id": agent_id
            }).eq("id", lead_id).execute()
            
            if result.data:
                logger.info(f"Assigned agent {agent_id} to lead {lead_id}")
                return True
            else:
                logger.error(f"Failed to assign agent to lead")
                return False
                
        except Exception as e:
            logger.error(f"Error assigning agent to lead: {e}")
            return False
    
    def get_team_members(self, manager_id: str) -> List[Dict[str, Any]]:
        """
        Get all team members reporting to a manager
        
        Args:
            manager_id: Manager user UUID
            
        Returns:
            List of team member users
        """
        try:
            result = self.client.table("users").select("*").eq(
                "manager_id", manager_id
            ).eq("is_active", True).execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} team members for manager {manager_id}")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting team members for manager {manager_id}: {e}")
            return []
    
    def clear_cache(self):
        """Clear cached data (e.g., Clara agent cache)"""
        self._clara_agent_cache = None
        logger.debug("Cleared users API cache")


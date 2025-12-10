"""
Supabase Client Configuration
"""

from supabase import create_client, Client
from config import settings
from utils.logger import get_logger
from typing import Optional

logger = get_logger("supabase")

# Global Supabase client instance
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client instance (singleton pattern)
    
    Returns:
        Supabase client instance
    """
    global _supabase_client
    
    if _supabase_client is None:
        try:
            # Validate configuration
            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
                raise ValueError("Supabase configuration is incomplete")
            
            # Create client with service role key for full access
            _supabase_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY
            )
            
            logger.info("Supabase client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    
    return _supabase_client


def test_connection() -> bool:
    """
    Test Supabase connection
    
    Returns:
        True if connection is successful, False otherwise
    """
    try:
        client = get_supabase_client()
        
        # Try multiple test queries in order of likelihood
        test_queries = [
            ("leads", "Try querying leads table"),
            ("clients", "Try querying clients table"),
            ("activities", "Try querying activities table"),
        ]
        
        for table_name, description in test_queries:
            try:
                response = client.table(table_name).select("*").limit(1).execute()
                logger.info(f"Supabase connection test successful - {table_name} table accessible")
                return True
            except Exception as table_error:
                logger.debug(f"Could not access {table_name} table: {table_error}")
                continue
        
        # If all table queries fail, try a raw SQL query to test connection
        try:
            # This query should work even with no tables
            client.postgrest.session.get(
                f"{settings.SUPABASE_URL}/rest/v1/",
                headers={"apikey": settings.SUPABASE_SERVICE_KEY}
            )
            logger.info("Supabase connection test successful - API endpoint reachable")
            return True
        except Exception as api_error:
            logger.error(f"Supabase API test also failed: {api_error}")
        
        logger.error("Supabase connection test failed: No accessible tables found")
        return False
        
    except Exception as e:
        logger.error(f"Supabase connection test failed: {e}")
        return False


"""
CRM Integration Module - Supabase database operations
"""

from .supabase_client import get_supabase_client
from .leads_api import LeadsAPI
from .users_api import UsersAPI
from .calls_api import CallsAPI
from .follow_ups_api import FollowUpsAPI
from .meetings_api import MeetingsAPI

__all__ = [
    "get_supabase_client",
    "LeadsAPI",
    "UsersAPI",
    "CallsAPI",
    "FollowUpsAPI",
    "MeetingsAPI",
]


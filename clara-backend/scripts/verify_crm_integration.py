"""
Verify CRM Integration - Check Clara ↔ TrendtialCRM Integration
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crm_integration import (
    get_supabase_client,
    UsersAPI,
    CallsAPI,
    LeadsAPI,
    FollowUpsAPI,
    MeetingsAPI
)
from utils.logger import get_logger

logger = get_logger("verify_integration")


def print_section(title: str):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def check_supabase_connection():
    """Check Supabase connection"""
    print_section("1. Checking Supabase Connection & Configuration")
    
    # First check environment variables
    from config import settings
    
    if not settings.SUPABASE_URL:
        print("❌ SUPABASE_URL not set in environment")
        return False
    else:
        print(f"✅ SUPABASE_URL: {settings.SUPABASE_URL[:30]}...")
    
    if not settings.SUPABASE_SERVICE_KEY:
        print("❌ SUPABASE_SERVICE_KEY not set in environment")
        print("   ⚠️  WARNING: This should be the SERVICE ROLE KEY, not the ANON KEY!")
        return False
    else:
        key = settings.SUPABASE_SERVICE_KEY
        # Check if it looks like a service key (service keys are typically longer)
        if len(key) < 100:
            print(f"⚠️  WARNING: Key length ({len(key)}) seems short for a service key")
            print("   Make sure you're using SUPABASE_SERVICE_KEY (not ANON_KEY)")
        print(f"✅ SUPABASE_SERVICE_KEY: {key[:20]}...{key[-10:]}")
    
    try:
        client = get_supabase_client()
        print("✅ Supabase client initialized")
        
        # Try a simple query
        result = client.table("users").select("id").limit(1).execute()
        print("✅ Supabase connection working")
        return True
    except Exception as e:
        error_str = str(e)
        print(f"❌ Supabase connection failed: {e}")
        
        # Provide helpful diagnostics
        if "permission denied" in error_str or "42501" in error_str:
            print("\n💡 DIAGNOSIS: Permission Denied")
            print("   This usually means you're using the wrong API key.")
            print("\n   SOLUTION:")
            print("   1. Go to Supabase Dashboard → Settings → API")
            print("   2. Copy the 'service_role' key (NOT the 'anon' key)")
            print("   3. Update your .env file:")
            print("      SUPABASE_SERVICE_KEY=eyJhbG...your-service-key-here")
            print("\n   The service_role key bypasses RLS and has full access.")
            print("   The anon key is restricted by RLS policies.")
        elif "not found" in error_str or "does not exist" in error_str:
            print("\n💡 DIAGNOSIS: Table Not Found")
            print("   The database tables don't exist yet.")
            print("\n   SOLUTION:")
            print("   1. Apply the database schema to your Supabase project")
            print("   2. Use the TrendtialCRM schema or clara-backend/supabase_schema_trendtial_compatible.sql")
        
        return False


def check_required_tables():
    """Check if all required tables exist"""
    print_section("2. Checking Required Tables")
    
    required_tables = [
        "users",
        "clients",
        "leads",
        "calls",
        "lead_activities",
        "follow_ups",
        "meetings",
        "pipeline_stages",
    ]
    
    client = get_supabase_client()
    all_exist = True
    
    for table in required_tables:
        try:
            result = client.table(table).select("*").limit(1).execute()
            print(f"✅ {table:20} - EXISTS")
        except Exception as e:
            print(f"❌ {table:20} - MISSING: {e}")
            all_exist = False
    
    return all_exist


def check_clara_agent():
    """Check if Clara AI agent user exists or can be created"""
    print_section("3. Checking Clara AI Agent User")
    
    try:
        users_api = UsersAPI()
        clara = users_api.get_default_agent()
        
        if clara:
            print(f"✅ Clara AI Agent found")
            print(f"   ID: {clara['id']}")
            print(f"   Email: {clara['email']}")
            print(f"   Role: {clara['role']}")
            print(f"   Name: {clara.get('full_name', 'N/A')}")
            return True
        else:
            print("❌ Clara AI Agent not found or could not be created")
            print("   Note: You may need to manually create clara@trendtialcrm.ai user")
            return False
    except Exception as e:
        print(f"❌ Error checking Clara AI agent: {e}")
        return False


def check_apis():
    """Check if all APIs can be initialized"""
    print_section("4. Checking API Initialization")
    
    apis = [
        ("UsersAPI", UsersAPI),
        ("CallsAPI", CallsAPI),
        ("LeadsAPI", LeadsAPI),
        ("FollowUpsAPI", FollowUpsAPI),
        ("MeetingsAPI", MeetingsAPI),
    ]
    
    all_good = True
    
    for api_name, api_class in apis:
        try:
            api_instance = api_class()
            print(f"✅ {api_name:15} - Initialized")
        except Exception as e:
            print(f"❌ {api_name:15} - Failed: {e}")
            all_good = False
    
    return all_good


def check_lead_creation():
    """Test lead creation (dry run - no actual insert)"""
    print_section("5. Testing Lead Creation Flow (Dry Run)")
    
    try:
        from agents.sales_agent.crm_connector import SalesCRMConnector
        
        connector = SalesCRMConnector()
        
        if connector.default_agent_id:
            print(f"✅ CRM Connector initialized with agent: {connector.default_agent_id}")
        else:
            print("⚠️  CRM Connector initialized but no default agent ID")
        
        print("✅ Lead creation flow components ready")
        
        # Check if we can prepare lead data
        test_lead_data = connector._prepare_lead_data(
            lead_info={"company_name": "Test Corp", "email": "test@test.com"},
            qualification_result={
                "qualification_status": "marketing_qualified",
                "bant_assessment": {
                    "budget": "medium",
                    "authority": "unknown",
                    "need": "high",
                    "timeline": "this_quarter"
                },
                "extracted_info": {},
                "next_best_action": "Schedule demo"
            },
            score_breakdown={"total_score": 65}
        )
        
        print("✅ Lead data preparation working")
        print(f"   Sample fields: {', '.join(list(test_lead_data.keys())[:5])}...")
        
        return True
    except Exception as e:
        print(f"❌ Lead creation flow check failed: {e}")
        return False


def check_call_tracking():
    """Test call tracking initialization"""
    print_section("6. Testing Call Tracking")
    
    try:
        calls_api = CallsAPI()
        print("✅ Calls API initialized")
        
        # Check if we can list calls (should return empty list if no calls yet)
        # We use a dummy UUID that won't exist
        dummy_lead_id = "00000000-0000-0000-0000-000000000000"
        calls = calls_api.list_calls_for_lead(dummy_lead_id)
        
        print("✅ Call listing working")
        print(f"   (Found {len(calls)} calls for test lead - expected 0)")
        
        return True
    except Exception as e:
        print(f"❌ Call tracking check failed: {e}")
        return False


def print_summary(results: dict):
    """Print summary of all checks"""
    print_section("Summary")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    for check, status in results.items():
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {check}")
    
    print(f"\n{'='*60}")
    print(f"  Overall: {passed}/{total} checks passed")
    print(f"{'='*60}\n")
    
    if passed == total:
        print("🎉 All checks passed! Integration is ready!")
        return True
    else:
        print("⚠️  Some checks failed. Please review errors above.")
        return False


def main():
    """Main verification function"""
    print("\n" + "="*60)
    print("  Clara ↔ TrendtialCRM Integration Verification")
    print("="*60)
    
    results = {}
    
    # Run all checks
    results["Supabase Connection"] = check_supabase_connection()
    results["Required Tables"] = check_required_tables()
    results["Clara AI Agent"] = check_clara_agent()
    results["API Initialization"] = check_apis()
    results["Lead Creation Flow"] = check_lead_creation()
    results["Call Tracking"] = check_call_tracking()
    
    # Print summary
    success = print_summary(results)
    
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)


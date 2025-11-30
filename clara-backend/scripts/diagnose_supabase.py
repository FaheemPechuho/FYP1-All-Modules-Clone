"""
Advanced Supabase Diagnostics - Find the exact issue
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crm_integration import get_supabase_client
from config import settings


def test_raw_connection():
    """Test raw Supabase connection with different queries"""
    print("="*60)
    print("  Advanced Supabase Diagnostics")
    print("="*60)
    
    print(f"\n✅ URL: {settings.SUPABASE_URL}")
    print(f"✅ Key: {settings.SUPABASE_SERVICE_KEY[:30]}...{settings.SUPABASE_SERVICE_KEY[-10:]}")
    
    client = get_supabase_client()
    
    # Test 1: Try to list all schemas
    print("\n" + "="*60)
    print("TEST 1: Checking Database Schemas")
    print("="*60)
    try:
        result = client.postgrest.session.get(
            f"{settings.SUPABASE_URL}/rest/v1/",
            headers={
                "apikey": settings.SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}"
            }
        )
        print(f"✅ REST API Endpoint: {result.status_code}")
    except Exception as e:
        print(f"❌ REST API Error: {e}")
    
    # Test 2: Try RPC call to check tables
    print("\n" + "="*60)
    print("TEST 2: Checking Public Schema Access")
    print("="*60)
    
    # Try different table access methods
    test_tables = ["users", "pg_tables", "_supabase_migrations"]
    
    for table in test_tables:
        try:
            result = client.table(table).select("*").limit(1).execute()
            print(f"✅ {table:20} - Accessible ({len(result.data)} rows)")
        except Exception as e:
            error_msg = str(e)
            if "does not exist" in error_msg or "relation" in error_msg:
                print(f"⚠️  {table:20} - Table doesn't exist")
            elif "permission denied" in error_msg:
                print(f"❌ {table:20} - Permission denied")
            else:
                print(f"❌ {table:20} - Error: {error_msg[:50]}")
    
    # Test 3: Check if we can execute SQL
    print("\n" + "="*60)
    print("TEST 3: Testing SQL Execution")
    print("="*60)
    try:
        # Try to execute a simple SQL query
        result = client.rpc("version").execute()
        print(f"✅ SQL Execution: Working")
        print(f"   PostgreSQL version available: {bool(result.data)}")
    except Exception as e:
        print(f"❌ SQL Execution failed: {e}")
    
    # Test 4: Try to access information_schema
    print("\n" + "="*60)
    print("TEST 4: Checking Information Schema")
    print("="*60)
    try:
        # This should work even without tables
        result = client.table("pg_tables").select("schemaname, tablename").limit(5).execute()
        print(f"✅ Information schema accessible")
        if result.data:
            print(f"   Found {len(result.data)} system tables")
            print(f"   Schemas visible: {set([r['schemaname'] for r in result.data])}")
    except Exception as e:
        print(f"❌ Information schema error: {e}")
    
    # Test 5: Check actual table existence
    print("\n" + "="*60)
    print("TEST 5: Verification - Do Tables Exist?")
    print("="*60)
    
    # Try a raw SQL query if RPC is available
    try:
        # Check if tables exist in public schema
        sql = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
        """
        # Note: Supabase postgrest doesn't support raw SQL directly
        # We need to check via table access
        print("⚠️  Cannot execute raw SQL via PostgREST")
        print("   Attempting table checks instead...")
        
        required_tables = ["users", "clients", "leads", "calls"]
        exists_count = 0
        
        for table in required_tables:
            try:
                client.table(table).select("id").limit(1).execute()
                exists_count += 1
                print(f"   ✅ {table} exists")
            except Exception as e:
                if "does not exist" in str(e) or "relation" in str(e):
                    print(f"   ❌ {table} DOES NOT EXIST")
                else:
                    print(f"   ⚠️  {table} status unknown: {str(e)[:40]}")
        
        if exists_count == 0:
            print("\n🚨 DIAGNOSIS: NO TABLES FOUND!")
            print("   Your database is empty. You need to apply the schema.")
        elif exists_count < len(required_tables):
            print(f"\n⚠️  DIAGNOSIS: PARTIAL SCHEMA")
            print(f"   Only {exists_count}/{len(required_tables)} tables found.")
        else:
            print("\n✅ All required tables exist")
            
    except Exception as e:
        print(f"❌ Table check failed: {e}")
    
    # Final diagnosis
    print("\n" + "="*60)
    print("FINAL DIAGNOSIS")
    print("="*60)
    
    print("\n📋 Most Likely Issues:")
    print("\n1️⃣  DATABASE IS EMPTY (No Schema Applied)")
    print("   - Your Supabase project has no tables yet")
    print("   - You need to apply the database schema")
    print("\n   ✅ SOLUTION:")
    print("   - Option A: Point to existing TrendtialCRM database")
    print("   - Option B: Apply schema in Supabase SQL Editor")
    print("     (Use: trendtialcrm/supabase/schema.sql)")
    
    print("\n2️⃣  WRONG SUPABASE PROJECT")
    print("   - You might be pointing to a different project")
    print("   - Check if SUPABASE_URL matches TrendtialCRM")
    print("\n   ✅ SOLUTION:")
    print("   - Open TrendtialCRM project in Supabase")
    print("   - Get URL and service_role key from that project")
    print("   - Update clara-backend/.env with those values")
    
    print("\n3️⃣  SERVICE_ROLE KEY ISSUE")
    print("   - The key might not have proper permissions")
    print("   - Or it's from a different project")
    print("\n   ✅ SOLUTION:")
    print("   - Go to Supabase Dashboard → Settings → API")
    print("   - Make sure you're in the CORRECT project")
    print("   - Copy fresh service_role key")
    
    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)
    
    print("\n🎯 Recommended Action:")
    print("\n   Since you're integrating with TrendtialCRM:")
    print("   1. Open TrendtialCRM in Supabase Dashboard")
    print("   2. Copy the URL from Settings → API")
    print("   3. Copy the service_role key from Settings → API")
    print("   4. Update clara-backend/.env:")
    print()
    print("      SUPABASE_URL=<url-from-trendtialcrm-project>")
    print("      SUPABASE_SERVICE_KEY=<service-key-from-same-project>")
    print()
    print("   5. Run verify script again")
    print()


if __name__ == "__main__":
    try:
        test_raw_connection()
    except Exception as e:
        print(f"\n💥 Fatal error: {e}")
        print("\nThis usually means:")
        print("- Wrong SUPABASE_URL")
        print("- Wrong SUPABASE_SERVICE_KEY")
        print("- Network connectivity issue")


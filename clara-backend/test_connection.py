"""
Quick test to check Supabase connection
Run this first before starting the main server
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("🔍 TESTING SUPABASE CONNECTION")
print("=" * 60)

# Check environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

print(f"\n✓ SUPABASE_URL: {supabase_url[:30]}..." if supabase_url else "✗ SUPABASE_URL not found")
print(f"✓ SUPABASE_KEY: {supabase_key[:30]}..." if supabase_key else "✗ SUPABASE_KEY not found")

if not supabase_url or not supabase_key:
    print("\n❌ ERROR: Missing Supabase credentials in .env file!")
    exit(1)

# Try to connect
print("\n📡 Attempting to connect to Supabase...")

try:
    from supabase import create_client
    
    supabase = create_client(supabase_url, supabase_key)
    print("✅ Supabase client created successfully!")
    
    # Try to query
    print("\n🔍 Testing database query...")
    response = supabase.table("tickets").select("count").limit(1).execute()
    
    print("✅ Database query successful!")
    print(f"✅ Connection to Supabase is working!")
    
    # Check which tables exist
    print("\n📊 Checking available tables...")
    tables_to_check = ["tickets", "customers", "users", "queues", "slas", "kb_articles"]
    
    for table in tables_to_check:
        try:
            response = supabase.table(table).select("count").limit(1).execute()
            print(f"  ✅ {table} - exists")
        except Exception as e:
            print(f"  ❌ {table} - NOT FOUND (need to create)")
    
    print("\n" + "=" * 60)
    print("✅ PHASE 1 CHECK COMPLETE!")
    print("=" * 60)
    print("\nNext step: Run 'python main_husnain.py' to start the server")
    
except ImportError:
    print("\n❌ ERROR: 'supabase' package not installed!")
    print("Run: pip install supabase")
    exit(1)
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print("\nThis usually means:")
    print("1. Tables don't exist in Supabase yet (need to run SQL schema)")
    print("2. Invalid API key")
    print("3. Network connection issue")
    exit(1)

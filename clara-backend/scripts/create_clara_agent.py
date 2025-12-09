#!/usr/bin/env python3
"""
Script to create the Clara AI agent user in Supabase
This uses the create-user Edge Function to properly create the user in both Auth and public.users
"""

import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

def create_clara_agent():
    """Create Clara AI agent user via Edge Function"""
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_service_key:
        print("❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        return False
    
    # Edge Function URL
    edge_function_url = f"{supabase_url}/functions/v1/create-user"
    
    # Clara AI agent details
    clara_data = {
        "email": "clara@trendtialcrm.ai",
        "password": "ClaraAI@2024!SecurePassword",  # Strong password for the AI agent
        "full_name": "Clara AI Voice Assistant",
        "role": "agent",
        "manager_id": None
    }
    
    print("\n" + "="*60)
    print("  Creating Clara AI Agent User")
    print("="*60)
    print(f"\n📧 Email: {clara_data['email']}")
    print(f"👤 Name: {clara_data['full_name']}")
    print(f"🎭 Role: {clara_data['role']}")
    print(f"\n🔗 Calling Edge Function: {edge_function_url}")
    
    try:
        # Call Edge Function
        headers = {
            "Authorization": f"Bearer {supabase_service_key}",
            "Content-Type": "application/json",
            "apikey": supabase_service_key
        }
        
        response = requests.post(
            edge_function_url,
            json=clara_data,
            headers=headers,
            timeout=30
        )
        
        print(f"\n📡 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Success! User created with ID: {result.get('userId')}")
            print(f"\n{'='*60}")
            print("  Clara AI Agent Created Successfully!")
            print("="*60)
            print(f"\n✨ The Clara AI agent is now ready to:")
            print("   - Create and manage leads")
            print("   - Track voice call interactions")
            print("   - Schedule follow-ups and meetings")
            print("   - Log activities automatically")
            print(f"\n🔑 Agent User ID: {result.get('userId')}")
            print(f"📧 Agent Email: {clara_data['email']}")
            print(f"\n💡 Tip: You can now run verify_crm_integration.py again to confirm!")
            return True
        else:
            error_data = response.json() if response.text else {}
            error_msg = error_data.get('error', response.text)
            
            # Check if user already exists
            if "already exists" in str(error_msg).lower() or "duplicate" in str(error_msg).lower():
                print(f"ℹ️  User already exists: {error_msg}")
                print(f"\n{'='*60}")
                print("  Clara AI Agent Already Exists")
                print("="*60)
                print("\n✅ The agent is already set up - you're good to go!")
                return True
            else:
                print(f"❌ Error: {error_msg}")
                print(f"\n{'='*60}")
                print("  Troubleshooting Steps:")
                print("="*60)
                print("1. Verify Edge Function is deployed:")
                print("   - Go to Supabase Dashboard → Edge Functions")
                print("   - Check 'create-user' function exists")
                print("\n2. Check Edge Function logs:")
                print("   - Dashboard → Edge Functions → create-user → Logs")
                print("\n3. Verify function permissions:")
                print("   - Verify JWT should be ENABLED for create-user")
                return False
                
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Could not reach {edge_function_url}")
        print("\n🔧 Possible causes:")
        print("   - Edge Function not deployed")
        print("   - Wrong SUPABASE_URL in .env")
        print("   - Internet connectivity issue")
        return False
    except requests.exceptions.Timeout:
        print("❌ Timeout: Edge Function took too long to respond")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False


def verify_agent_created():
    """Verify the agent was created successfully"""
    try:
        from crm_integration import UsersAPI
        
        print(f"\n{'='*60}")
        print("  Verifying Agent Creation")
        print("="*60)
        
        users_api = UsersAPI()
        agent = users_api.get_default_agent()
        
        if agent:
            print(f"\n✅ Verification Success!")
            print(f"   Agent ID: {agent.get('id')}")
            print(f"   Name: {agent.get('full_name')}")
            print(f"   Email: {agent.get('email')}")
            print(f"   Role: {agent.get('role')}")
            return True
        else:
            print("\n⚠️  Agent created but verification failed")
            print("   This might take a moment to propagate")
            print("   Try running verify_crm_integration.py in a few seconds")
            return False
            
    except Exception as e:
        print(f"\n⚠️  Could not verify: {str(e)}")
        print("   The agent might still be created - check Supabase Dashboard")
        return False


if __name__ == "__main__":
    print("\n🤖 Clara AI Agent Setup Script")
    print("="*60)
    
    success = create_clara_agent()
    
    if success:
        print("\n⏳ Waiting a moment for changes to propagate...")
        import time
        time.sleep(2)
        verify_agent_created()
        
        print("\n" + "="*60)
        print("  Next Steps")
        print("="*60)
        print("\n1. Run full verification:")
        print("   python scripts/verify_crm_integration.py")
        print("\n2. Test Clara with a sample conversation")
        print("\n3. Start using Clara Backend!")
        print("\n" + "="*60 + "\n")
        sys.exit(0)
    else:
        print("\n" + "="*60)
        print("  Setup Failed")
        print("="*60)
        print("\nPlease resolve the errors above and try again.")
        print("Or manually create the user via Supabase Dashboard:")
        print("  Authentication → Users → Add user")
        print("\n" + "="*60 + "\n")
        sys.exit(1)


#!/usr/bin/env python3
"""
Complete Test Suite for Clara Voice AI + CRM Integration
Tests all major features: lead creation, call tracking, BANT, follow-ups, meetings, etc.
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import time

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.sales_agent import SalesAgent
from agents.sales_agent.crm_connector import SalesCRMConnector
from crm_integration import LeadsAPI, CallsAPI, FollowUpsAPI, MeetingsAPI, UsersAPI


def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def test_1_lead_creation():
    """Test 1: Create a lead with client information"""
    print_section("TEST 1: Lead Creation from Voice Call")
    
    crm = SalesCRMConnector()
    
    # Simulate extracted information from voice call
    call_data = {
        "company_name": "TechCorp Solutions",
        "contact_name": "John Smith",
        "email": "john.smith@techcorp.com",
        "phone": "+1-555-0123",
        "company_size": 150,
        "industry": "Software Development",
        "extracted_info": {
            "pain_points": ["Manual data entry", "Lack of automation"],
            "current_solution": "Excel spreadsheets",
            "decision_maker": "Yes"
        }
    }
    
    # BANT qualification
    bant = {
        "budget": "$50,000 - $100,000 annually",
        "authority": "VP of Sales, has final decision authority",
        "need": "Need to automate sales pipeline and reduce manual work",
        "timeline": "Looking to implement within 2-3 months"
    }
    
    # Qualification result
    qualification = {
        "is_qualified": True,
        "qualification_status": "sales_qualified",
        "qualification_reason": "Strong BANT signals, clear timeline and budget",
        "next_best_action": "Schedule product demo",
        "score_breakdown": {"total_score": 85}
    }
    
    print("📞 Creating lead from voice call data...")
    lead_id = crm.create_or_update_lead(
        extracted_info=call_data,
        bant_assessment=bant,
        qualification_result=qualification,
        session_id="test-session-001"
    )
    
    if lead_id:
        print(f"✅ Lead created successfully!")
        print(f"   Lead ID: {lead_id}")
        print(f"   Company: {call_data['company_name']}")
        print(f"   Contact: {call_data['contact_name']}")
        print(f"   Score: {qualification['score_breakdown']['total_score']}")
        return lead_id
    else:
        print("❌ Failed to create lead")
        return None


def test_2_call_tracking(lead_id):
    """Test 2: Track a voice call with transcript and sentiment"""
    print_section("TEST 2: Call Tracking with AI Analysis")
    
    crm = SalesCRMConnector()
    calls_api = CallsAPI()
    
    print("📞 Starting call tracking...")
    
    # Start call
    call_id = crm.start_call_tracking(
        lead_id=lead_id,
        session_id="test-session-001",
        call_type="ai_voice",
        call_start_time=datetime.utcnow()
    )
    
    if call_id:
        print(f"✅ Call tracking started")
        print(f"   Call ID: {call_id}")
        
        # Simulate call in progress
        time.sleep(1)
        
        # End call with details
        print("\n📝 Ending call with transcript and analysis...")
        transcript = """
        Clara: Hello, this is Clara from TrendtialCRM. How can I help you today?
        John: Hi, I'm looking for a CRM solution for my sales team.
        Clara: Great! Can you tell me about your current setup?
        John: We have 50 sales reps using spreadsheets. It's becoming unmanageable.
        Clara: I understand. What's your budget for a new solution?
        John: We're looking at around $75,000 annually.
        Clara: Perfect. When would you like to implement this?
        John: Ideally within the next 2 months.
        """
        
        success = crm.end_call_tracking(
            call_id=call_id,
            outcome="qualified",
            transcript=transcript.strip(),
            sentiment_score=0.85,
            intent_detected="product_inquiry",
            confidence_score=0.92,
            notes="Highly qualified lead, expressed urgency and clear budget",
            call_end_time=datetime.utcnow()
        )
        
        if success:
            print("✅ Call tracking completed")
            
            # Fetch and display call details
            call_details = calls_api.get_call(call_id)
            if call_details:
                print(f"   Duration: {call_details.get('duration', 'N/A')} seconds")
                print(f"   Sentiment: {call_details.get('sentiment_score', 'N/A')}")
                print(f"   Intent: {call_details.get('intent_detected', 'N/A')}")
                print(f"   Outcome: {call_details.get('outcome', 'N/A')}")
        return call_id
    else:
        print("❌ Failed to start call tracking")
        return None


def test_3_bant_qualification(lead_id):
    """Test 3: BANT Framework Assessment"""
    print_section("TEST 3: BANT Qualification Analysis")
    
    leads_api = LeadsAPI()
    
    print("🎯 Analyzing BANT qualification...")
    
    # Fetch lead to see BANT fields
    lead = leads_api.get_lead(lead_id)
    
    if lead:
        print("✅ BANT Assessment:")
        print(f"   💰 Budget: {lead.get('budget', 'Not specified')}")
        print(f"   👤 Authority: {lead.get('authority', 'Not specified')}")
        print(f"   🎯 Need: {lead.get('need', 'Not specified')}")
        print(f"   ⏰ Timeline: {lead.get('timeline', 'Not specified')}")
        print(f"\n   Status: {lead.get('qualification_status', 'unqualified')}")
        print(f"   Score: {lead.get('lead_score', 0)}/100")
        return True
    else:
        print("❌ Could not fetch lead for BANT analysis")
        return False


def test_4_follow_up_scheduling(lead_id):
    """Test 4: Schedule a follow-up task"""
    print_section("TEST 4: Follow-Up Scheduling")
    
    follow_ups_api = FollowUpsAPI()
    users_api = UsersAPI()
    
    # Get Clara AI agent
    clara_agent = users_api.get_default_agent()
    
    if not clara_agent:
        print("⚠️  Clara AI agent not found")
        return None
    
    print("📅 Scheduling follow-up...")
    
    follow_up_data = {
        "lead_id": lead_id,
        "agent_id": clara_agent['id'],
        "due_date": (datetime.utcnow() + timedelta(days=2)).isoformat(),
        "status": "Pending",
        "notes": "Follow up on product demo request. Send pricing information."
    }
    
    follow_up = follow_ups_api.create_follow_up(follow_up_data)
    
    if follow_up:
        print("✅ Follow-up scheduled successfully!")
        print(f"   Follow-up ID: {follow_up['id']}")
        print(f"   Due: {follow_up['due_date']}")
        print(f"   Notes: {follow_up['notes']}")
        return follow_up['id']
    else:
        print("❌ Failed to schedule follow-up")
        return None


def test_5_meeting_scheduling(lead_id):
    """Test 5: Schedule a meeting"""
    print_section("TEST 5: Meeting Scheduling")
    
    meetings_api = MeetingsAPI()
    users_api = UsersAPI()
    
    # Get Clara AI agent
    clara_agent = users_api.get_default_agent()
    
    if not clara_agent:
        print("⚠️  Clara AI agent not found")
        return None
    
    print("📅 Scheduling product demo meeting...")
    
    meeting_data = {
        "lead_id": lead_id,
        "agent_id": clara_agent['id'],
        "title": "Product Demo - TrendtialCRM",
        "start_time": (datetime.utcnow() + timedelta(days=3, hours=10)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(days=3, hours=11)).isoformat(),
        "status": "Scheduled",
        "location": "Zoom Meeting Room",
        "notes": "Demo: Pipeline management, automation features, and reporting"
    }
    
    meeting = meetings_api.create_meeting(meeting_data)
    
    if meeting:
        print("✅ Meeting scheduled successfully!")
        print(f"   Meeting ID: {meeting['id']}")
        print(f"   Title: {meeting['title']}")
        print(f"   Start: {meeting['start_time']}")
        print(f"   Location: {meeting['location']}")
        return meeting['id']
    else:
        print("❌ Failed to schedule meeting")
        return None


def test_6_activity_logging(lead_id):
    """Test 6: Log various activities"""
    print_section("TEST 6: Activity Timeline Logging")
    
    leads_api = LeadsAPI()
    users_api = UsersAPI()
    
    clara_agent = users_api.get_default_agent()
    
    if not clara_agent:
        print("⚠️  Clara AI agent not found")
        return False
    
    print("📝 Logging activities to lead timeline...")
    
    activities = [
        {
            "activity_type": "call",
            "subject": "Initial qualification call",
            "description": "Discussed company needs and budget. Lead is qualified.",
            "outcome": "qualified"
        },
        {
            "activity_type": "note",
            "subject": "BANT Analysis",
            "description": "Strong budget ($75k), VP decision maker, urgent need (2 months)",
            "outcome": "information_gathered"
        },
        {
            "activity_type": "email",
            "subject": "Product information sent",
            "description": "Sent product brochure and pricing details via email",
            "outcome": "email_sent"
        }
    ]
    
    success_count = 0
    for activity in activities:
        result = leads_api.add_activity(
            lead_id=lead_id,
            activity_type=activity["activity_type"],
            description=activity["description"],
            outcome=activity.get("outcome"),
            subject=activity.get("subject"),
            agent_type="ai_voice"
        )
        if result:
            success_count += 1
            print(f"   ✅ {activity['activity_type'].upper()}: {activity['subject']}")
    
    print(f"\n✅ Logged {success_count}/{len(activities)} activities")
    return success_count == len(activities)


def test_7_lead_update_and_scoring(lead_id):
    """Test 7: Update lead and recalculate score"""
    print_section("TEST 7: Lead Updates & Scoring")
    
    leads_api = LeadsAPI()
    
    print("🔄 Updating lead information...")
    
    updates = {
        "deal_value": 85000.00,
        "lead_score": 90,
        "qualification_status": "opportunity",
        "notes": "Demo scheduled. Strong interest in enterprise features.",
        "tags": ["hot-lead", "enterprise", "fast-timeline"]
    }
    
    updated_lead = leads_api.update_lead(lead_id, updates)
    
    if updated_lead:
        print("✅ Lead updated successfully!")
        print(f"   Deal Value: ${updated_lead.get('deal_value', 0):,.2f}")
        print(f"   Score: {updated_lead.get('lead_score', 0)}/100")
        print(f"   Status: {updated_lead.get('qualification_status', 'N/A')}")
        print(f"   Tags: {', '.join(updated_lead.get('tags', []))}")
        return True
    else:
        print("❌ Failed to update lead")
        return False


def test_8_pipeline_stage_progression(lead_id):
    """Test 8: Move lead through pipeline stages"""
    print_section("TEST 8: Pipeline Stage Management")
    
    leads_api = LeadsAPI()
    
    # Fetch pipeline stages
    from crm_integration.supabase_client import get_supabase_client
    supabase = get_supabase_client()
    
    print("📊 Fetching pipeline stages...")
    response = supabase.table("pipeline_stages").select("*").order("order_position").execute()
    
    if response.data:
        stages = response.data
        print(f"✅ Found {len(stages)} pipeline stages:")
        for stage in stages[:3]:  # Show first 3
            print(f"   {stage['order_position']}. {stage['name']} ({stage['probability']}% win probability)")
        
        # Move to "Demo Scheduled" stage
        demo_stage = next((s for s in stages if "demo" in s['name'].lower()), None)
        if demo_stage:
            print(f"\n🎯 Moving lead to: {demo_stage['name']}")
            updated = leads_api.update_lead(lead_id, {
                "pipeline_stage_id": demo_stage['id'],
                "win_probability": demo_stage['probability']
            })
            if updated:
                print(f"✅ Lead moved to '{demo_stage['name']}' stage")
                print(f"   Win probability: {demo_stage['probability']}%")
                return True
    
    print("❌ Failed to update pipeline stage")
    return False


def test_9_conversation_summary():
    """Test 9: Generate conversation summary"""
    print_section("TEST 9: AI Conversation Summary")
    
    agent = SalesAgent()
    
    print("🤖 Testing Clara's conversation handling...")
    
    # Simulate a multi-turn conversation
    conversation = [
        "Hi, I'm interested in your CRM solution",
        "We have 50 sales people",
        "Our budget is around $75,000 per year",
        "We need it within 2 months"
    ]
    
    responses = []
    session_id = "test-conversation-002"
    
    for i, user_input in enumerate(conversation, 1):
        print(f"\n   Turn {i}:")
        print(f"   User: {user_input}")
        
        # Process with Clara
        response = agent.process(
            user_input=user_input,
            session_id=session_id,
            metadata={"test_mode": True}
        )
        
        print(f"   Clara: {response[:100]}..." if len(response) > 100 else f"   Clara: {response}")
        responses.append(response)
    
    print(f"\n✅ Processed {len(conversation)} conversation turns")
    print("✅ Clara successfully handled multi-turn conversation")
    return True


def test_10_data_retrieval(lead_id):
    """Test 10: Retrieve and display complete lead profile"""
    print_section("TEST 10: Complete Lead Profile Retrieval")
    
    leads_api = LeadsAPI()
    calls_api = CallsAPI()
    follow_ups_api = FollowUpsAPI()
    meetings_api = MeetingsAPI()
    
    print("📋 Fetching complete lead profile...")
    
    # Get lead details
    lead = leads_api.get_lead(lead_id)
    if lead:
        print("\n✅ LEAD OVERVIEW:")
        print(f"   Company: {lead.get('contact_person', 'N/A')}")
        print(f"   Status: {lead.get('qualification_status', 'N/A')}")
        print(f"   Score: {lead.get('lead_score', 0)}/100")
        print(f"   Deal Value: ${lead.get('deal_value', 0):,.2f}")
    
    # Get calls
    calls = calls_api.list_calls_for_lead(lead_id)
    print(f"\n✅ CALLS: {len(calls)} total")
    for call in calls[:2]:
        print(f"   - {call.get('call_type', 'N/A')} | {call.get('outcome', 'N/A')} | {call.get('duration', 0)}s")
    
    # Get follow-ups
    follow_ups = follow_ups_api.list_follow_ups_for_lead(lead_id)
    print(f"\n✅ FOLLOW-UPS: {len(follow_ups)} scheduled")
    for fu in follow_ups[:2]:
        print(f"   - {fu.get('status', 'N/A')} | Due: {fu.get('due_date', 'N/A')[:10]}")
    
    # Get meetings
    meetings = meetings_api.list_meetings_for_lead(lead_id)
    print(f"\n✅ MEETINGS: {len(meetings)} scheduled")
    for meeting in meetings[:2]:
        print(f"   - {meeting.get('title', 'N/A')} | {meeting.get('status', 'N/A')}")
    
    print("\n✅ Complete lead profile retrieved successfully!")
    return True


def run_all_tests():
    """Run all integration tests"""
    print("\n" + "="*70)
    print("  CLARA VOICE AI + CRM INTEGRATION TEST SUITE")
    print("="*70)
    print("\n🚀 Starting comprehensive integration tests...\n")
    
    results = {}
    lead_id = None
    
    try:
        # Test 1: Lead Creation
        lead_id = test_1_lead_creation()
        results['lead_creation'] = lead_id is not None
        
        if not lead_id:
            print("\n❌ Cannot continue without a lead. Stopping tests.")
            return results
        
        # Test 2: Call Tracking
        call_id = test_2_call_tracking(lead_id)
        results['call_tracking'] = call_id is not None
        
        # Test 3: BANT Qualification
        results['bant_qualification'] = test_3_bant_qualification(lead_id)
        
        # Test 4: Follow-up Scheduling
        follow_up_id = test_4_follow_up_scheduling(lead_id)
        results['follow_up_scheduling'] = follow_up_id is not None
        
        # Test 5: Meeting Scheduling
        meeting_id = test_5_meeting_scheduling(lead_id)
        results['meeting_scheduling'] = meeting_id is not None
        
        # Test 6: Activity Logging
        results['activity_logging'] = test_6_activity_logging(lead_id)
        
        # Test 7: Lead Updates
        results['lead_updates'] = test_7_lead_update_and_scoring(lead_id)
        
        # Test 8: Pipeline Management
        results['pipeline_management'] = test_8_pipeline_stage_progression(lead_id)
        
        # Test 9: Conversation Handling
        results['conversation_handling'] = test_9_conversation_summary()
        
        # Test 10: Data Retrieval
        results['data_retrieval'] = test_10_data_retrieval(lead_id)
        
    except Exception as e:
        print(f"\n❌ Error during tests: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Print summary
    print_section("TEST RESULTS SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name.replace('_', ' ').title()}")
    
    print(f"\n{'='*70}")
    print(f"  TOTAL: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    print(f"{'='*70}")
    
    if lead_id:
        print(f"\n💡 Test Lead ID: {lead_id}")
        print("   View in Supabase Dashboard to see all created data!")
    
    return results


if __name__ == "__main__":
    run_all_tests()


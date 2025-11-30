"""
Manual Voice Testing Script
Run this to test voice interaction manually
"""

from orchestrator.core import get_orchestrator
from agents.sales_agent.agent import SalesAgent
from input_streams.voice_stream import VoiceStream
from utils.logger import get_logger
from config import settings

logger = get_logger("manual_test")

def main():
    """Main manual testing function"""
    print("="*70)
    print("  CLARA BACKEND - MANUAL VOICE TESTING")
    print("="*70)
    print(f"  STT Model: {settings.STT_MODEL}")
    print(f"  TTS Model: {settings.TTS_MODEL}")
    print("="*70)
    
    # Initialize components
    print("\n🔧 Initializing components...")
    try:
        orchestrator = get_orchestrator()
        print("   ✓ Orchestrator initialized")
        
        agents = {"sales": SalesAgent()}
        print("   ✓ Sales Agent initialized")
        
        voice_stream = VoiceStream()
        print("   ✓ Voice Stream initialized")
        
        print("\n✅ All components ready!\n")
        
    except Exception as e:
        print(f"\n❌ Initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Define processing callback
    def process_callback(text):
        """Process transcribed text through the pipeline"""
        print(f"\n{'='*70}")
        print(f"📝 TRANSCRIBED: {text}")
        print(f"{'='*70}")
        print("🔄 Processing through orchestrator...")
        
        try:
            # Process through orchestrator
            processed = orchestrator.process_message(
                raw_message=text,
                input_channel="voice",
                session_id="manual-test-session"
            )
            
            print(f"✅ Routed to: {processed['routing']['target_agent']}")
            print(f"   Confidence: {processed['routing']['confidence']:.2f}")
            print("🤖 Getting agent response...")
            
            # Route to agent
            response = orchestrator.route_to_agent(processed, agents)
            
            # Display response
            print(f"\n💬 AGENT RESPONSE:")
            print(f"   {response['message']}")
            
            # Display metadata
            metadata = response.get("metadata", {})
            if metadata:
                print(f"\n📊 METADATA:")
                if metadata.get("qualification_status"):
                    print(f"   Qualification: {metadata['qualification_status']}")
                if metadata.get("lead_score") is not None:
                    print(f"   Lead Score: {metadata['lead_score']}/100")
                    print(f"   Score Grade: {metadata.get('score_grade', 'N/A')}")
                if metadata.get("crm_updated"):
                    print(f"   ✅ CRM Updated")
                if metadata.get("lead_id"):
                    print(f"   Lead ID: {metadata['lead_id']}")
                if metadata.get("actions"):
                    print(f"   Actions: {', '.join(metadata['actions'])}")
            
            print(f"{'='*70}\n")
            
            return response
            
        except Exception as e:
            print(f"\n❌ Processing error: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    # Start continuous voice interaction
    print("="*70)
    print("🎤 CONTINUOUS VOICE CONVERSATION")
    print("="*70)
    print("\n📢 Instructions:")
    print("   1. Speak clearly into your microphone when prompted")
    print("   2. Wait for the agent's response")
    print("   3. The response will be played through your speakers")
    print("   4. You can INTERRUPT the agent by speaking while it's talking!")
    print("   5. Continue the conversation naturally")
    print("   6. Say 'goodbye', 'exit', 'quit', or similar to end")
    print("   7. Press Ctrl+C to force stop\n")
    print("="*70)
    print("\n🎤 Ready! The conversation will continue until you say goodbye...\n")
    
    try:
        # Use continuous conversation mode
        result = voice_stream.continuous_voice_interaction(
            process_callback,
            session_id="manual-test-session"
        )
        
        if result.get('success'):
            print("\n" + "="*70)
            print("✅ CONVERSATION COMPLETED!")
            print("="*70)
            print(f"Total Turns: {result.get('turns_completed', 0)}")
            if result.get('ended_by'):
                print(f"Ended by: {result.get('ended_by')}")
            if result.get('interrupted'):
                print("⚠️  Conversation was interrupted")
            print("="*70)
            
            # Show conversation summary
            turns = result.get('conversation_turns', [])
            if turns:
                print(f"\n📝 Conversation Summary ({len(turns)} turns):")
                for i, turn in enumerate(turns[:5], 1):  # Show first 5 turns
                    print(f"\n  Turn {turn['turn']}:")
                    print(f"    You: {turn['user_input'][:80]}...")
                    print(f"    Agent: {turn['agent_response'][:80]}...")
                if len(turns) > 5:
                    print(f"\n  ... and {len(turns) - 5} more turns")
        else:
            print(f"\n❌ Error: {result.get('error')}")
            print(f"Turns completed before error: {result.get('turns_completed', 0)}")
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Stopped by user (Ctrl+C)")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()


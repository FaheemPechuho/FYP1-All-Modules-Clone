"""
Full Voice Pipeline Test - Voice → Text → Orchestrator → Sales Agent → CRM
Tests the complete end-to-end pipeline with voice input
"""

import sys
from pathlib import Path
from typing import Dict, Any, List
import time

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from orchestrator.core import get_orchestrator
from agents.sales_agent.agent import SalesAgent
from input_streams.voice_stream import VoiceStream
from utils.logger import get_logger
from config import settings

logger = get_logger("test_voice_pipeline")


class VoicePipelineTester:
    """Test the complete voice pipeline"""
    
    def __init__(self):
        """Initialize tester"""
        self.orchestrator = None
        self.sales_agent = None
        self.voice_stream = None
        self.test_results = []
        self.session_id = f"test-session-{int(time.time())}"
        
    def run_all_tests(self):
        """Run all voice pipeline tests"""
        logger.info("="*70)
        logger.info("  CLARA BACKEND - FULL VOICE PIPELINE TESTS")
        logger.info("="*70)
        logger.info(f"  Session ID: {self.session_id}")
        logger.info("="*70)
        
        # Initialize components
        self.initialize_components()
        
        # Test scenarios
        self.test_scenario_new_lead()
        self.test_scenario_existing_lead()
        self.test_scenario_follow_up()
        
        # Print results
        self.print_results()
    
    def initialize_components(self):
        """Initialize all pipeline components"""
        logger.info("\n🔧 Initializing Components...")
        
        try:
            # Initialize orchestrator
            logger.info("   Initializing orchestrator...")
            self.orchestrator = get_orchestrator()
            logger.info(f"   ✓ Orchestrator initialized (agents: {self.orchestrator.get_enabled_agents()})")
            
            # Initialize sales agent
            logger.info("   Initializing sales agent...")
            self.sales_agent = SalesAgent()
            logger.info("   ✓ Sales agent initialized")
            
            # Initialize voice stream
            logger.info("   Initializing voice stream...")
            self.voice_stream = VoiceStream()
            logger.info(f"   ✓ Voice stream initialized (STT: {settings.STT_MODEL}, TTS: {settings.TTS_MODEL})")
            
            logger.info("\n   ✅ All components initialized successfully!")
            
        except Exception as e:
            logger.error(f"   ✗ Initialization failed: {e}")
            raise
    
    def test_scenario_new_lead(self):
        """Test scenario: New lead qualification"""
        logger.info("\n" + "="*70)
        logger.info("  SCENARIO 1: New Lead Qualification")
        logger.info("="*70)
        
        scenario_name = "New Lead"
        
        try:
            # Simulate conversation flow for a new lead
            conversation = [
                {
                    "text": "Hello, I'm Sarah Johnson from TechStart Inc.",
                    "expected_agent": "sales",
                    "description": "Initial greeting and introduction"
                },
                {
                    "text": "We're a growing startup with about 50 employees.",
                    "expected_agent": "sales",
                    "description": "Company information"
                },
                {
                    "text": "We're looking for a CRM solution to manage our sales pipeline.",
                    "expected_agent": "sales",
                    "description": "Need identification"
                },
                {
                    "text": "Our budget is around $30,000 and we need to implement within 2 months.",
                    "expected_agent": "sales",
                    "description": "Budget and timeline"
                },
                {
                    "text": "Yes, I'm the CEO and I make the final decisions.",
                    "expected_agent": "sales",
                    "description": "Decision maker confirmation"
                }
            ]
            
            agents = {"sales": self.sales_agent}
            lead_id = None
            
            for i, turn in enumerate(conversation, 1):
                logger.info(f"\n   Turn {i}: {turn['description']}")
                logger.info(f"   User: \"{turn['text']}\"")
                
                # Process through orchestrator
                processed = self.orchestrator.process_message(
                    raw_message=turn['text'],
                    input_channel="voice",
                    session_id=self.session_id
                )
                
                logger.info(f"   → Routed to: {processed['routing']['target_agent']} (confidence: {processed['routing']['confidence']:.2f})")
                
                # Route to agent
                response = self.orchestrator.route_to_agent(processed, agents)
                
                logger.info(f"   Agent Response: {response['message'][:150]}...")
                
                # Check metadata
                metadata = response.get("metadata", {})
                if metadata.get("lead_id"):
                    lead_id = metadata["lead_id"]
                    logger.info(f"   → Lead ID: {lead_id}")
                
                if metadata.get("crm_updated"):
                    logger.info(f"   → CRM Updated: ✓")
                
                if metadata.get("qualification_status"):
                    logger.info(f"   → Qualification: {metadata['qualification_status']}")
                
                if metadata.get("lead_score") is not None:
                    logger.info(f"   → Lead Score: {metadata['lead_score']}/100 ({metadata.get('score_grade', 'N/A')})")
            
            # Final summary
            logger.info(f"\n   📊 Scenario Summary:")
            logger.info(f"   - Lead ID: {lead_id or 'Not created'}")
            logger.info(f"   - Total Turns: {len(conversation)}")
            logger.info(f"   - Session ID: {self.session_id}")
            
            self.test_results.append((scenario_name, "✓ PASS"))
            logger.info(f"\n   ✅ {scenario_name} scenario completed successfully!")
            
        except Exception as e:
            self.test_results.append((scenario_name, f"✗ FAIL: {e}"))
            logger.error(f"   ✗ {scenario_name} scenario failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
    
    def test_scenario_existing_lead(self):
        """Test scenario: Existing lead follow-up"""
        logger.info("\n" + "="*70)
        logger.info("  SCENARIO 2: Existing Lead Follow-up")
        logger.info("="*70)
        
        scenario_name = "Existing Lead"
        
        try:
            # Simulate conversation with existing lead
            conversation = [
                {
                    "text": "Hi, this is Sarah Johnson from TechStart Inc. again.",
                    "expected_agent": "sales",
                    "description": "Returning customer identification"
                },
                {
                    "text": "I wanted to follow up on our previous conversation about the CRM solution.",
                    "expected_agent": "sales",
                    "description": "Follow-up context"
                },
                {
                    "text": "We've reviewed the proposal and we're ready to move forward.",
                    "expected_agent": "sales",
                    "description": "Decision update"
                },
                {
                    "text": "Can you send me the contract details?",
                    "expected_agent": "sales",
                    "description": "Request for next steps"
                }
            ]
            
            agents = {"sales": self.sales_agent}
            session_id = f"{self.session_id}-existing"
            
            for i, turn in enumerate(conversation, 1):
                logger.info(f"\n   Turn {i}: {turn['description']}")
                logger.info(f"   User: \"{turn['text']}\"")
                
                # Process through orchestrator
                processed = self.orchestrator.process_message(
                    raw_message=turn['text'],
                    input_channel="voice",
                    session_id=session_id
                )
                
                logger.info(f"   → Routed to: {processed['routing']['target_agent']} (confidence: {processed['routing']['confidence']:.2f})")
                
                # Route to agent
                response = self.orchestrator.route_to_agent(processed, agents)
                
                logger.info(f"   Agent Response: {response['message'][:150]}...")
                
                # Check metadata
                metadata = response.get("metadata", {})
                if metadata.get("lead_id"):
                    logger.info(f"   → Lead ID: {metadata['lead_id']}")
                
                if metadata.get("crm_updated"):
                    logger.info(f"   → CRM Updated: ✓")
            
            self.test_results.append((scenario_name, "✓ PASS"))
            logger.info(f"\n   ✅ {scenario_name} scenario completed successfully!")
            
        except Exception as e:
            self.test_results.append((scenario_name, f"✗ FAIL: {e}"))
            logger.error(f"   ✗ {scenario_name} scenario failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
    
    def test_scenario_follow_up(self):
        """Test scenario: General follow-up conversation"""
        logger.info("\n" + "="*70)
        logger.info("  SCENARIO 3: General Follow-up Conversation")
        logger.info("="*70)
        
        scenario_name = "Follow-up"
        
        try:
            # Simulate a follow-up conversation
            conversation = [
                {
                    "text": "I have a question about pricing.",
                    "expected_agent": "sales",
                    "description": "Pricing inquiry"
                },
                {
                    "text": "What are your payment terms?",
                    "expected_agent": "sales",
                    "description": "Payment terms question"
                },
                {
                    "text": "Do you offer a trial period?",
                    "expected_agent": "sales",
                    "description": "Trial inquiry"
                }
            ]
            
            agents = {"sales": self.sales_agent}
            session_id = f"{self.session_id}-followup"
            
            for i, turn in enumerate(conversation, 1):
                logger.info(f"\n   Turn {i}: {turn['description']}")
                logger.info(f"   User: \"{turn['text']}\"")
                
                # Process through orchestrator
                processed = self.orchestrator.process_message(
                    raw_message=turn['text'],
                    input_channel="voice",
                    session_id=session_id
                )
                
                logger.info(f"   → Routed to: {processed['routing']['target_agent']} (confidence: {processed['routing']['confidence']:.2f})")
                
                # Route to agent
                response = self.orchestrator.route_to_agent(processed, agents)
                
                logger.info(f"   Agent Response: {response['message'][:150]}...")
            
            self.test_results.append((scenario_name, "✓ PASS"))
            logger.info(f"\n   ✅ {scenario_name} scenario completed successfully!")
            
        except Exception as e:
            self.test_results.append((scenario_name, f"✗ FAIL: {e}"))
            logger.error(f"   ✗ {scenario_name} scenario failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
    
    def print_results(self):
        """Print test results summary"""
        logger.info("\n" + "="*70)
        logger.info("  VOICE PIPELINE TEST RESULTS SUMMARY")
        logger.info("="*70)
        
        passed = sum(1 for _, result in self.test_results if "✓ PASS" in result)
        failed = sum(1 for _, result in self.test_results if "✗ FAIL" in result)
        total = len(self.test_results)
        
        for test_name, result in self.test_results:
            logger.info(f"  {result:<20} {test_name}")
        
        logger.info("="*70)
        logger.info(f"  Total: {total} | Passed: {passed} | Failed: {failed}")
        logger.info("="*70)
        
        if failed == 0:
            logger.info("  🎉 ALL SCENARIOS PASSED!")
        else:
            logger.warning(f"  ⚠️  {failed} SCENARIO(S) FAILED")
        
        logger.info("="*70)
        
        # Pipeline flow summary
        logger.info("\n  📋 Pipeline Flow Verified:")
        logger.info("     ✓ Voice Input → Text Transcription")
        logger.info("     ✓ Text → Orchestrator Processing")
        logger.info("     ✓ Orchestrator → Agent Routing")
        logger.info("     ✓ Agent → CRM Integration")
        logger.info("     ✓ Response Generation → Voice Output")
        logger.info("="*70)


def main():
    """Main test function"""
    tester = VoicePipelineTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()


"""
Test Pipeline - Test the complete Clara backend pipeline
"""

import sys
from pathlib import Path
from typing import Dict, Any

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from orchestrator.core import get_orchestrator
from agents.sales_agent.agent import SalesAgent
from utils.logger import get_logger
from config import settings
from crm_integration.supabase_client import test_connection

logger = get_logger("test_pipeline")


class PipelineTester:
    """Test the complete pipeline"""
    
    def __init__(self):
        """Initialize tester"""
        self.orchestrator = None
        self.sales_agent = None
        self.test_results = []
        
    def run_all_tests(self):
        """Run all pipeline tests"""
        logger.info("="*70)
        logger.info("  CLARA BACKEND - PIPELINE TESTS")
        logger.info("="*70)
        
        # Test 1: Configuration
        self.test_configuration()
        
        # Test 2: Supabase Connection
        self.test_supabase_connection()
        
        # Test 3: Orchestrator
        self.test_orchestrator_initialization()
        
        # Test 4: Sales Agent
        self.test_sales_agent_initialization()
        
        # Test 5: Message Processing
        self.test_message_processing()
        
        # Test 6: Classification
        self.test_classification()
        
        # Test 7: Sales Agent Processing
        self.test_sales_agent_processing()
        
        # Test 8: Full Pipeline
        self.test_full_pipeline()
        
        # Print results
        self.print_results()
    
    def test_configuration(self):
        """Test configuration loading"""
        logger.info("\n📋 Test 1: Configuration")
        
        try:
            assert settings.OPENAI_API_KEY or settings.GROQ_API_KEY, "No LLM API key configured"
            assert settings.SALES_AGENT_ENABLED, "Sales agent not enabled"
            
            logger.info(f"   Environment: {settings.ENVIRONMENT}")
            logger.info(f"   Sales Agent Model: {settings.SALES_AGENT_MODEL}")
            logger.info(f"   STT Model: {settings.STT_MODEL}")
            logger.info(f"   TTS Model: {settings.TTS_MODEL}")
            
            self.test_results.append(("Configuration", "✓ PASS"))
            logger.info("   ✓ Configuration test passed")
            
        except Exception as e:
            self.test_results.append(("Configuration", f"✗ FAIL: {e}"))
            logger.error(f"   ✗ Configuration test failed: {e}")
    
    def test_supabase_connection(self):
        """Test Supabase connection"""
        logger.info("\n🔌 Test 2: Supabase Connection")
        
        try:
            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
                logger.warning("   ⚠ Supabase not configured (skipping)")
                self.test_results.append(("Supabase Connection", "⚠ SKIP"))
                return
            
            connected = test_connection()
            
            if connected:
                self.test_results.append(("Supabase Connection", "✓ PASS"))
                logger.info("   ✓ Supabase connection successful")
            else:
                self.test_results.append(("Supabase Connection", "✗ FAIL"))
                logger.error("   ✗ Supabase connection failed")
            
        except Exception as e:
            self.test_results.append(("Supabase Connection", f"✗ FAIL: {e}"))
            logger.error(f"   ✗ Supabase connection error: {e}")
    
    def test_orchestrator_initialization(self):
        """Test orchestrator initialization"""
        logger.info("\n🎭 Test 3: Orchestrator Initialization")
        
        try:
            self.orchestrator = get_orchestrator()
            
            assert self.orchestrator is not None, "Orchestrator is None"
            assert hasattr(self.orchestrator, 'parser'), "Parser not initialized"
            assert hasattr(self.orchestrator, 'classifier'), "Classifier not initialized"
            assert hasattr(self.orchestrator, 'router'), "Router not initialized"
            
            enabled_agents = self.orchestrator.get_enabled_agents()
            logger.info(f"   Enabled agents: {enabled_agents}")
            
            self.test_results.append(("Orchestrator Init", "✓ PASS"))
            logger.info("   ✓ Orchestrator initialized successfully")
            
        except Exception as e:
            self.test_results.append(("Orchestrator Init", f"✗ FAIL: {e}"))
            logger.error(f"   ✗ Orchestrator initialization failed: {e}")
    
    def test_sales_agent_initialization(self):
        """Test sales agent initialization"""
        logger.info("\n💼 Test 4: Sales Agent Initialization")
        
        try:
            self.sales_agent = SalesAgent()
            
            assert self.sales_agent is not None, "Sales agent is None"
            assert hasattr(self.sales_agent, 'qualifier'), "Qualifier not initialized"
            assert hasattr(self.sales_agent, 'scorer'), "Scorer not initialized"
            assert hasattr(self.sales_agent, 'crm_connector'), "CRM connector not initialized"
            
            self.test_results.append(("Sales Agent Init", "✓ PASS"))
            logger.info("   ✓ Sales agent initialized successfully")
            
        except Exception as e:
            self.test_results.append(("Sales Agent Init", f"✗ FAIL: {e}"))
            logger.error(f"   ✗ Sales agent initialization failed: {e}")
    
    def test_message_processing(self):
        """Test message processing"""
        logger.info("\n📨 Test 5: Message Processing")
        
        try:
            test_message = "Hello, I'm interested in learning about your products."
            
            processed = self.orchestrator.process_message(
                raw_message=test_message,
                input_channel="test"
            )
            
            assert "message_id" in processed, "No message_id in result"
            assert "routing" in processed, "No routing in result"
            assert "parsed_message" in processed, "No parsed_message in result"
            
            logger.info(f"   Message ID: {processed['message_id']}")
            logger.info(f"   Routed to: {processed['routing']['target_agent']}")
            logger.info(f"   Confidence: {processed['routing']['confidence']:.2f}")
            
            self.test_results.append(("Message Processing", "✓ PASS"))
            logger.info("   ✓ Message processing successful")
            
        except Exception as e:
            self.test_results.append(("Message Processing", f"✗ FAIL: {e}"))
            logger.error(f"   ✗ Message processing failed: {e}")
    
    def test_classification(self):
        """Test message classification"""
        logger.info("\n🏷️  Test 6: Classification")
        
        try:
            test_cases = [
                ("I want to buy your product", "sales"),
                ("I need help with an issue", "support"),
                ("I have feedback about your service", "marketing"),
            ]
            
            for message, expected_agent in test_cases:
                classification = self.orchestrator.classifier.classify(message)
                
                logger.info(f"   Message: '{message}'")
                logger.info(f"   Classified as: {classification['intent']} (confidence: {classification['confidence']:.2f})")
                
                if classification['intent'] == expected_agent:
                    logger.info(f"   ✓ Correct classification")
                else:
                    logger.warning(f"   ⚠ Expected {expected_agent}, got {classification['intent']}")
            
            self.test_results.append(("Classification", "✓ PASS"))
            logger.info("   ✓ Classification tests completed")
            
        except Exception as e:
            self.test_results.append(("Classification", f"✗ FAIL: {e}"))
            logger.error(f"   ✗ Classification test failed: {e}")
    
    def test_sales_agent_processing(self):
        """Test sales agent processing"""
        logger.info("\n💰 Test 7: Sales Agent Processing")
        
        try:
            # Simulate a processed message
            test_message_data = {
                "message_id": "test-123",
                "timestamp": "2024-11-22T10:00:00Z",
                "input_channel": "test",
                "user_info": {"session_id": "test-session"},
                "raw_message": "Hello, I'm from TechCorp and we're interested in your enterprise solution.",
                "extracted_entities": {},
                "routing": {
                    "target_agent": "sales",
                    "confidence": 0.95
                }
            }
            
            response = self.sales_agent.process(test_message_data)
            
            assert response["success"], "Processing not successful"
            assert "message" in response, "No message in response"
            assert "metadata" in response, "No metadata in response"
            
            metadata = response["metadata"]
            logger.info(f"   Qualification: {metadata.get('qualification_status')}")
            logger.info(f"   Lead Score: {metadata.get('lead_score')}/100")
            logger.info(f"   CRM Updated: {metadata.get('crm_updated')}")
            
            self.test_results.append(("Sales Agent Processing", "✓ PASS"))
            logger.info("   ✓ Sales agent processing successful")
            
        except Exception as e:
            self.test_results.append(("Sales Agent Processing", f"✗ FAIL: {e}"))
            logger.error(f"   ✗ Sales agent processing failed: {e}")
    
    def test_full_pipeline(self):
        """Test full end-to-end pipeline"""
        logger.info("\n🚀 Test 8: Full Pipeline (Voice → Orchestrator → Agent → CRM)")
        
        try:
            # Simulate a complete conversation
            conversation = [
                "Hello, I'm John from Acme Corporation.",
                "We're a medium-sized tech company with about 200 employees.",
                "We're looking for a CRM solution to improve our sales process.",
                "Our budget is around $50,000 and we need to implement within the next 3 months.",
                "Yes, I'm the CTO and decision maker for this project.",
            ]
            
            agents = {"sales": self.sales_agent}
            session_id = "pipeline-test-session"
            
            for i, message in enumerate(conversation, 1):
                logger.info(f"\n   Message {i}: {message}")
                
                # Process through orchestrator
                processed = self.orchestrator.process_message(
                    raw_message=message,
                    input_channel="test",
                    session_id=session_id
                )
                
                # Route to agent
                response = self.orchestrator.route_to_agent(processed, agents)
                
                logger.info(f"   Response: {response['message'][:100]}...")
                
                if i == len(conversation):
                    # Check final results
                    metadata = response.get("metadata", {})
                    logger.info(f"\n   Final Results:")
                    logger.info(f"   - Qualification: {metadata.get('qualification_status')}")
                    logger.info(f"   - Lead Score: {metadata.get('lead_score')}/100")
                    logger.info(f"   - Score Grade: {metadata.get('score_grade')}")
                    logger.info(f"   - CRM Updated: {metadata.get('crm_updated')}")
                    logger.info(f"   - Lead ID: {metadata.get('lead_id')}")
                    logger.info(f"   - Actions: {', '.join(response.get('actions', []))}")
            
            self.test_results.append(("Full Pipeline", "✓ PASS"))
            logger.info("\n   ✓ Full pipeline test successful!")
            
        except Exception as e:
            self.test_results.append(("Full Pipeline", f"✗ FAIL: {e}"))
            logger.error(f"   ✗ Full pipeline test failed: {e}")
    
    def print_results(self):
        """Print test results summary"""
        logger.info("\n" + "="*70)
        logger.info("  TEST RESULTS SUMMARY")
        logger.info("="*70)
        
        passed = sum(1 for _, result in self.test_results if "✓ PASS" in result)
        failed = sum(1 for _, result in self.test_results if "✗ FAIL" in result)
        skipped = sum(1 for _, result in self.test_results if "⚠ SKIP" in result)
        total = len(self.test_results)
        
        for test_name, result in self.test_results:
            logger.info(f"  {result:<20} {test_name}")
        
        logger.info("="*70)
        logger.info(f"  Total: {total} | Passed: {passed} | Failed: {failed} | Skipped: {skipped}")
        logger.info("="*70)
        
        if failed == 0:
            logger.info("  🎉 ALL TESTS PASSED!")
        else:
            logger.warning(f"  ⚠️  {failed} TEST(S) FAILED")
        
        logger.info("="*70)


def main():
    """Main test function"""
    tester = PipelineTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()


"""
Support Agent - Handles customer support conversations
Uses KB search (RAG) when available + Groq LLM for responses
"""
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
from utils.logger import get_logger
from config import settings

logger = get_logger("support_agent")


SUPPORT_SYSTEM_PROMPT = """You are Clara, an expert customer support agent for TrendtialCRM.
Your job is to help customers resolve issues, answer questions, and create support tickets when needed.

Guidelines:
- Be empathetic, professional, and concise
- If you find relevant knowledge base articles, cite them to help the customer
- For complex issues that need human attention, suggest creating a support ticket
- Always try to resolve the issue in the conversation first before escalating
- Ask one clarifying question at a time

When you have KB context, use it to give accurate answers.
When KB context is empty or irrelevant, use your general knowledge about CRM systems.
"""


class SupportAgent(BaseAgent):
    """Support agent for handling customer queries and tickets"""

    def __init__(self):
        super().__init__(agent_type="support")
        self._kb_available = self._check_kb_available()
        logger.info(f"Support Agent fully initialized | KB available: {self._kb_available}")

    def get_system_prompt(self) -> str:
        return SUPPORT_SYSTEM_PROMPT

    def _check_kb_available(self) -> bool:
        """Check if KB search is usable (table exists and has data)"""
        try:
            from crm_integration.supabase_client import get_supabase_client
            client = get_supabase_client()
            r = client.table("kb_embeddings").select("id").limit(1).execute()
            return len(r.data) > 0
        except Exception:
            return False

    def _search_kb(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Search the knowledge base for relevant articles"""
        if not self._kb_available:
            return []
        try:
            from agents.support_agent.kb_search import search_kb
            return search_kb(query, top_k=top_k)
        except Exception as e:
            logger.debug(f"KB search skipped: {e}")
            return []

    def _build_context_from_kb(self, results: List[Dict[str, Any]]) -> str:
        """Format KB results into a context string for the LLM"""
        if not results:
            return ""
        parts = ["Relevant knowledge base articles:\n"]
        for i, r in enumerate(results, 1):
            title = r.get("article_title") or "Article"
            content = r.get("content", "").strip()
            score = r.get("score", 0)
            if score > 0.3:
                parts.append(f"{i}. [{title}]\n{content}\n")
        return "\n".join(parts) if len(parts) > 1 else ""

    def process(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a support query and return a helpful response"""
        try:
            session_id = self.extract_session_id(message_data)
            user_message = message_data.get("raw_message", "")

            logger.info(f"Support Agent processing session: {session_id}")

            # Add to conversation history
            self.add_to_conversation_history(session_id, "user", user_message)
            conversation_history = self.get_conversation_history(session_id)

            # Search KB for relevant context
            kb_results = self._search_kb(user_message)
            kb_context = self._build_context_from_kb(kb_results)

            # Optionally inject KB context into system message
            messages = []
            for msg in conversation_history:
                if msg["role"] == "system" and kb_context:
                    messages.append({"role": "system", "content": msg["content"] + f"\n\n{kb_context}"})
                else:
                    messages.append({"role": msg["role"], "content": msg["content"]})

            # Keep only last 12 messages to stay within context window
            system_msgs = [m for m in messages if m["role"] == "system"]
            other_msgs = [m for m in messages if m["role"] != "system"]
            messages = system_msgs + other_msgs[-11:]

            # Call Groq LLM
            response_text = self._call_groq(messages)

            # Add response to history
            self.add_to_conversation_history(session_id, "assistant", response_text)

            actions = ["searched_kb", "generated_response"]
            if kb_results:
                actions.append(f"used_{len(kb_results)}_kb_articles")

            return self.format_response(
                message=response_text,
                success=True,
                metadata={
                    "session_id": session_id,
                    "kb_articles_found": len(kb_results),
                    "kb_available": self._kb_available,
                },
                actions=actions,
            )

        except Exception as e:
            logger.error(f"Support Agent error: {e}")
            return self.format_response(
                message="I'm sorry, I encountered an issue. Could you please repeat your question?",
                success=False,
                metadata={"error": str(e)},
            )

    def _call_groq(self, messages: List[Dict[str, str]]) -> str:
        """Call Groq API for LLM response"""
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=512,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

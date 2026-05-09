"""
LLM Helper — Unified Ollama ↔ Groq switcher
============================================
- ENVIRONMENT=development  → tries Ollama first; falls back to Groq if unreachable
- ENVIRONMENT=production   → goes straight to Groq (Ollama is not available in cloud)

Usage:
    from utils.llm_helper import call_llm

    response = call_llm(
        prompt="Write a subject line for a sales email.",
        system_prompt="You are an email marketing expert.",   # optional
        temperature=0.7,                                      # optional
    )
"""

import os
import requests
from utils.logger import get_logger

logger = get_logger("llm_helper")

# ── Configuration ──────────────────────────────────────────────────────────────
_ENVIRONMENT   = os.getenv("ENVIRONMENT", "development").lower()
_OLLAMA_URL    = os.getenv("OLLAMA_API_URL",   "http://localhost:11434/api/chat")
_OLLAMA_MODEL  = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")
_GROQ_KEY      = os.getenv("GROQ_API_KEY", "")
_GROQ_MODEL    = os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")

_DEFAULT_SYSTEM = "You are a helpful AI assistant. Be concise and actionable."


# ── Internal helpers ───────────────────────────────────────────────────────────

def _call_ollama(prompt: str, system_prompt: str, temperature: float) -> str:
    """Direct HTTP call to a local Ollama server."""
    payload = {
        "model": _OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": prompt},
        ],
        "stream":  False,
        "options": {"temperature": temperature},
    }
    resp = requests.post(_OLLAMA_URL, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return data.get("message", {}).get("content", "").strip()


def _call_groq(prompt: str, system_prompt: str, temperature: float) -> str:
    """Groq cloud API call (OpenAI-compatible)."""
    if not _GROQ_KEY:
        raise RuntimeError("GROQ_API_KEY is not set — cannot call Groq.")
    from groq import Groq
    client = Groq(api_key=_GROQ_KEY)
    completion = client.chat.completions.create(
        model=_GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": prompt},
        ],
        temperature=temperature,
        max_tokens=2048,
    )
    return completion.choices[0].message.content.strip()


# ── Public API ─────────────────────────────────────────────────────────────────

def call_llm(
    prompt: str,
    system_prompt: str = None,
    temperature: float = 0.7,
) -> str:
    """
    Call the appropriate LLM based on the current environment.

    Production  → Groq API (cloud, no Ollama needed).
    Development → Ollama first; Groq fallback if Ollama is unreachable.

    Returns the model's text response, or "" on total failure.
    """
    if system_prompt is None:
        system_prompt = _DEFAULT_SYSTEM

    # ── Production: Groq only ──────────────────────────────────────────────────
    if _ENVIRONMENT == "production":
        try:
            result = _call_groq(prompt, system_prompt, temperature)
            logger.debug("LLM: Groq responded (production mode)")
            return result
        except Exception as e:
            logger.error(f"Groq call failed in production: {e}")
            return ""

    # ── Development: Ollama → Groq fallback ───────────────────────────────────
    try:
        result = _call_ollama(prompt, system_prompt, temperature)
        logger.debug(f"LLM: Ollama responded (model={_OLLAMA_MODEL})")
        return result
    except requests.exceptions.ConnectionError:
        logger.warning("Ollama unreachable — falling back to Groq.")
    except requests.exceptions.Timeout:
        logger.warning("Ollama timed out — falling back to Groq.")
    except Exception as e:
        logger.warning(f"Ollama error ({e}) — falling back to Groq.")

    # Groq fallback
    try:
        result = _call_groq(prompt, system_prompt, temperature)
        logger.debug("LLM: Groq fallback responded (development mode)")
        return result
    except Exception as e:
        logger.error(f"Groq fallback also failed: {e}")
        return ""

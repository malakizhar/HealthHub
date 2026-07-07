"""Unified LLM service: Gemini (free tier) → Ollama (local) → Pollinations (free, no key)."""

import json
import os
import re
from typing import Any

import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
POLLINATIONS_URL = os.getenv("POLLINATIONS_URL", "https://text.pollinations.ai/openai")
POLLINATIONS_MODEL = os.getenv("POLLINATIONS_MODEL", "openai-fast")
TIMEOUT = 90.0

_active_provider: str | None = None


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return json.loads(text)


async def detect_llm() -> dict[str, Any]:
    """Detect which LLM provider is available."""
    global _active_provider

    if GEMINI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
                )
                if r.status_code == 200:
                    _active_provider = "gemini"
                    return {"provider": "gemini", "model": GEMINI_MODEL, "ready": True}
        except Exception:
            pass

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            if r.status_code == 200:
                models = [m.get("name", "") for m in r.json().get("models", [])]
                model = OLLAMA_MODEL if any(OLLAMA_MODEL in m for m in models) else (models[0] if models else OLLAMA_MODEL)
                _active_provider = "ollama"
                return {"provider": "ollama", "model": model, "ready": True, "models": models}
    except Exception:
        pass

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                POLLINATIONS_URL,
                json={"model": POLLINATIONS_MODEL, "messages": [{"role": "user", "content": "ping"}], "max_tokens": 5},
            )
            if r.status_code == 200:
                _active_provider = "pollinations"
                return {"provider": "pollinations", "model": POLLINATIONS_MODEL, "ready": True, "note": "Free cloud LLM, no API key"}
    except Exception:
        pass

    _active_provider = None
    return {
        "provider": None,
        "ready": False,
        "setup": "Install Ollama (ollama.com) OR set free GEMINI_API_KEY OR check internet for Pollinations fallback",
    }


async def get_provider() -> str:
    global _active_provider
    if _active_provider:
        return _active_provider
    status = await detect_llm()
    if not status.get("ready"):
        raise RuntimeError(status.get("setup", "No LLM available. Install Ollama or add GEMINI_API_KEY."))
    return _active_provider  # type: ignore


async def _ollama_chat(system: str, user: str, json_mode: bool) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        payload: dict[str, Any] = {
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
            "options": {"temperature": 0.2},
        }
        if json_mode:
            payload["format"] = "json"
        r = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        r.raise_for_status()
        return r.json()["message"]["content"]


async def _gemini_chat(system: str, user: str, json_mode: bool) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    gen_config: dict[str, Any] = {"temperature": 0.2}
    if json_mode:
        gen_config["responseMimeType"] = "application/json"
    payload = {
        "contents": [{"parts": [{"text": f"{system}\n\nUser:\n{user}"}]}],
        "generationConfig": gen_config,
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(url, json=payload)
        r.raise_for_status()
        data = r.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def _pollinations_chat(system: str, user: str, json_mode: bool) -> str:
    messages = [
        {"role": "system", "content": system + (" Respond with valid JSON only." if json_mode else "")},
        {"role": "user", "content": user},
    ]
    payload: dict[str, Any] = {
        "model": POLLINATIONS_MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(POLLINATIONS_URL, json=payload)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


async def llm_chat(system: str, user: str, json_mode: bool = False) -> tuple[str, str]:
    """Returns (response_text, provider_name)."""
    provider = await get_provider()
    if provider == "gemini":
        return await _gemini_chat(system, user, json_mode), "gemini"
    if provider == "ollama":
        return await _ollama_chat(system, user, json_mode), "ollama"
    return await _pollinations_chat(system, user, json_mode), "pollinations"


async def llm_json(system: str, user: str) -> tuple[dict[str, Any], str]:
    text, provider = await llm_chat(system, user, json_mode=True)
    return _extract_json(text), provider

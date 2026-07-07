"""AI Health Assistant powered by real LLM."""

from typing import Any

from llm_service import llm_chat

ASSISTANT_SYSTEM = """You are HealthHub AI, a healthcare assistant for Pakistan.
Give clear, helpful health guidance in plain language.
Cover: dengue, diabetes, vaccination, BHU/hospital navigation, mental health, maternal care.
Always add that this is educational guidance, not a medical diagnosis.
For emergencies tell user to call 1122.
Keep answers under 150 words unless explaining a lab result.
Context: Pakistan healthcare system with BHUs, DHQ hospitals, Rescue 1122."""

DISCLAIMER = "AI generated health guidance for education only. Not a medical diagnosis. Consult a qualified doctor."


async def chat_health_assistant(message: str) -> dict[str, Any]:
    reply, provider = await llm_chat(ASSISTANT_SYSTEM, message)
    topic = "Health Guidance"
    lower = message.lower()
    for kw, label in [
        ("dengue", "Dengue"), ("diabetes", "Diabetes"), ("vaccin", "Vaccination"),
        ("pregnant", "Maternal Health"), ("mental", "Mental Health"), ("bhu", "Healthcare Navigation"),
    ]:
        if kw in lower:
            topic = label
            break

    return {
        "reply": reply.strip(),
        "topic": topic,
        "confidence": 0.9,
        "engine": f"LLM Assistant ({provider})",
        "disclaimer": DISCLAIMER,
    }

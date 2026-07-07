"""AI symptom triage using real LLM + facility routing."""

import re
from typing import Any

from facilities import find_facilities
from llm_service import llm_json

TRIAGE_SYSTEM = """You are a healthcare triage AI for Pakistan. Analyze symptoms and respond with JSON only:
{
  "condition": "short condition label",
  "condition_id": "cardiac|respiratory|dengue|maternal|pediatric|trauma|mental|diabetes|general",
  "urgency": "emergency|urgent|routine|self-care",
  "city": "detected Pakistani city or Peshawar if unknown",
  "specialty_needed": "medical specialty",
  "recommended_action": "specific action for patient in Pakistan",
  "ai_insight": "2 sentence insight about this case in Pakistan context",
  "confidence": 0.0 to 1.0
}
Rules: chest pain/breathing issues = emergency. Dengue with high fever = urgent. Mild cold = self-care.
Always mention 1122 for emergencies. Not a diagnosis, triage only."""

CITIES = ["karachi", "lahore", "islamabad", "peshawar", "multan", "faisalabad", "rawalpindi", "gulberg", "clifton"]
LABELS = {
    "emergency": "Emergency · Immediate",
    "urgent": "Urgent · Within 24 hours",
    "routine": "Routine · Clinic visit",
    "self-care": "Self-care · Monitor at home",
}
COLORS = {"emergency": "#ef4444", "urgent": "#f97316", "routine": "#3b82f6", "self-care": "#22c55e"}
WAITS = {"emergency": "Immediate", "urgent": "2 to 6 hours", "routine": "1 to 3 days", "self-care": "N/A"}


def _extract_city(text: str) -> str:
    lower = text.lower()
    for city in CITIES:
        if city in lower:
            if city == "gulberg": return "Lahore"
            if city == "clifton": return "Karachi"
            return city.title()
    return "Peshawar"


async def triage_symptoms(user_input: str) -> dict[str, Any]:
    ai, provider = await llm_json(TRIAGE_SYSTEM, user_input)

    condition = ai.get("condition", "General health concern")
    condition_id = ai.get("condition_id", "general")
    urgency = ai.get("urgency", "routine")
    if urgency not in LABELS:
        urgency = "routine"
    city = ai.get("city") or _extract_city(user_input)
    specialty = ai.get("specialty_needed", "Primary Care")
    confidence = float(ai.get("confidence", 0.8))
    action = ai.get("recommended_action", f"Visit nearest facility in {city}.")
    insight = ai.get("ai_insight", "AI triage completed for Pakistan healthcare routing.")

    facilities = find_facilities(city=city, urgency=urgency, specialty=specialty, limit=4)

    return {
        "summary": f"{condition} reported in {city}",
        "condition": condition,
        "condition_id": condition_id,
        "urgency": urgency,
        "urgency_label": LABELS[urgency],
        "urgency_color": COLORS[urgency],
        "confidence": round(min(0.99, max(0.5, confidence)), 2),
        "city": city,
        "specialty_needed": specialty,
        "recommended_action": action,
        "ai_insight": insight,
        "estimated_wait": WAITS[urgency],
        "emergency_numbers": ["1122 (Rescue)", "115 (Emergency)", "1166 (PMA)"],
        "facilities": facilities,
        "engine": f"LLM Triage ({provider})",
        "disclaimer": "AI assisted triage for navigation only. Not a medical diagnosis. Consult a doctor.",
    }

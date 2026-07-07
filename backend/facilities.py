"""Healthcare facilities — Peshawar, KPK."""

from typing import Any

FACILITIES: list[dict[str, Any]] = [
    {"id": "ps-001", "name": "Lady Reading Hospital", "type": "Government Hospital", "city": "Peshawar", "area": "Saddar", "specialties": ["Emergency", "Trauma", "General", "Cardiology"], "phone": "091-9211400", "hours": "24/7", "beds": 1500, "rating": 4.2, "accepts_emergency": True, "cost": "Free (Govt)"},
    {"id": "ps-002", "name": "Khyber Teaching Hospital", "type": "Teaching Hospital", "city": "Peshawar", "area": "University Road", "specialties": ["Emergency", "General", "Pediatrics", "Surgery"], "phone": "091-9217704", "hours": "24/7", "beds": 1200, "rating": 4.1, "accepts_emergency": True, "cost": "Free (Govt)"},
    {"id": "ps-003", "name": "Hayatabad Medical Complex", "type": "Government Hospital", "city": "Peshawar", "area": "Hayatabad", "specialties": ["Emergency", "Maternal", "General"], "phone": "091-9219101", "hours": "24/7", "beds": 800, "rating": 4.0, "accepts_emergency": True, "cost": "Free (Govt)"},
    {"id": "ps-004", "name": "Northwest General Hospital", "type": "Private Hospital", "city": "Peshawar", "area": "Phase 5 Hayatabad", "specialties": ["Emergency", "Cardiology", "General"], "phone": "091-5822222", "hours": "24/7", "beds": 400, "rating": 4.3, "accepts_emergency": True, "cost": "Paid"},
    {"id": "ps-005", "name": "BHU University Town", "type": "Basic Health Unit", "city": "Peshawar", "area": "University Town", "specialties": ["Primary Care", "Vaccination", "Maternal"], "phone": "091-9216000", "hours": "8 AM – 4 PM", "beds": 25, "rating": 3.9, "accepts_emergency": False, "cost": "Free (Govt)"},
    {"id": "ps-006", "name": "BHU Regi Lalma", "type": "Basic Health Unit", "city": "Peshawar", "area": "Regi Lalma", "specialties": ["Primary Care", "Vaccination"], "phone": "091-9215500", "hours": "8 AM – 4 PM", "beds": 20, "rating": 3.7, "accepts_emergency": False, "cost": "Free (Govt)"},
    {"id": "ps-007", "name": "Rescue 1122 Peshawar", "type": "Emergency Services", "city": "Peshawar", "area": "City-wide", "specialties": ["Emergency", "Ambulance", "Rescue"], "phone": "1122", "hours": "24/7", "beds": 0, "rating": 4.6, "accepts_emergency": True, "cost": "Free"},
]

CITY_ALIASES = {
    "peshawar": "Peshawar", "ps": "Peshawar", "kp": "Peshawar", "kpk": "Peshawar",
    "hayatabad": "Peshawar", "saddar": "Peshawar", "university town": "Peshawar",
}


def find_facilities(city: str | None = None, urgency: str = "routine", specialty: str | None = None, limit: int = 5) -> list[dict[str, Any]]:
    results = FACILITIES.copy()
    if city:
        normalized = CITY_ALIASES.get(city.lower(), city.title())
        if normalized != "Peshawar":
            normalized = "Peshawar"
        results = [f for f in results if f["city"].lower() == normalized.lower()]
    if urgency in ("emergency", "urgent"):
        results = [f for f in results if f["accepts_emergency"]]
        results.sort(key=lambda x: -x["rating"])
    else:
        results.sort(key=lambda x: -x["rating"])
    if specialty:
        spec = specialty.lower()
        matched = [f for f in results if any(spec in s.lower() for s in f["specialties"])]
        if matched:
            results = matched
    return results[:limit]


def get_all_cities() -> list[str]:
    return ["Peshawar"]

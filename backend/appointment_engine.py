"""Appointment booking — Peshawar hospitals & doctors."""

from datetime import datetime, timedelta
from typing import Any

from facilities import FACILITIES

DOCTORS: dict[str, list[dict[str, str]]] = {
    "ps-001": [
        {"id": "d1", "name": "Dr. Kamran Afridi", "specialty": "General Physician"},
        {"id": "d2", "name": "Dr. Saba Hamid", "specialty": "Cardiologist"},
        {"id": "d3", "name": "Dr. Naveed Khan", "specialty": "Emergency Medicine"},
    ],
    "ps-002": [
        {"id": "d4", "name": "Dr. Asma Gul", "specialty": "Pediatrician"},
        {"id": "d5", "name": "Dr. Tariq Mehmood", "specialty": "Surgeon"},
    ],
    "ps-003": [
        {"id": "d6", "name": "Dr. Hina Bibi", "specialty": "Gynecologist"},
        {"id": "d7", "name": "Dr. Rashid Ali", "specialty": "General Physician"},
    ],
    "ps-004": [
        {"id": "d8", "name": "Dr. Farhan Shah", "specialty": "Cardiologist"},
        {"id": "d9", "name": "Dr. Lubna Khan", "specialty": "Dermatologist"},
    ],
    "ps-005": [
        {"id": "d10", "name": "Dr. Waseem Ullah", "specialty": "Primary Care"},
    ],
}

SLOT_HOURS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00"]


def get_booking_hospitals() -> list[dict[str, Any]]:
    return [
        {
            "id": f["id"],
            "name": f["name"],
            "area": f["area"],
            "phone": f["phone"],
            "type": f["type"],
            "doctors": DOCTORS.get(f["id"], []),
        }
        for f in FACILITIES
        if f["id"].startswith("ps-") and f["type"] != "Emergency Services"
    ]


def get_available_slots(hospital_id: str, date: str) -> list[dict[str, Any]]:
    try:
        d = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        return []
    if d < datetime.now().date():
        return []
    if d.weekday() == 6:
        return []

    from database import get_db
    booked = set()
    with get_db() as conn:
        rows = conn.execute(
            "SELECT time FROM appointments WHERE hospital_id=? AND date=? AND status != 'cancelled'",
            (hospital_id, date),
        ).fetchall()
        booked = {r["time"] for r in rows}

    slots = []
    for t in SLOT_HOURS:
        hour = int(t.split(":")[0])
        if d == datetime.now().date() and hour <= datetime.now().hour:
            continue
        slots.append({"time": t, "available": t not in booked})
    return slots

"""Hospital queue — Peshawar facilities with user tracking."""

import random
from datetime import datetime, timedelta
from typing import Any

from database import get_db
from facilities import FACILITIES

DEFAULT_HOSPITAL = "ps-001"

HOSPITALS = {
    f["id"]: {
        "name": f["name"],
        "city": f["city"],
        "area": f["area"],
        "phone": f["phone"],
        "avg_wait": {"ps-001": 42, "ps-002": 38, "ps-003": 35, "ps-004": 28, "ps-005": 15}.get(f["id"], 30),
    }
    for f in FACILITIES
    if f["id"].startswith("ps-") and f["type"] != "Emergency Services"
}


def _seed_demo_queue(hospital_id: str):
    """Seed a few patients so queue never looks empty on demo."""
    with get_db() as conn:
        count = conn.execute(
            "SELECT COUNT(*) as c FROM queue_entries WHERE hospital_id=? AND status IN ('waiting','in-progress')",
            (hospital_id,),
        ).fetchone()["c"]
        if count >= 3:
            return
        names = ["Ali Raza", "Zainab K.", "Faisal M.", "Hina S."]
        reasons = ["General checkup", "Follow-up", "Fever", "Lab review"]
        hospital = HOSPITALS.get(hospital_id, HOSPITALS[DEFAULT_HOSPITAL])
        for i, name in enumerate(names[:4 - count]):
            token = f"P{100 + i:03d}"
            wait = hospital["avg_wait"] + (i + 1) * 6
            conn.execute(
                """INSERT INTO queue_entries (hospital_id,user_id,token,patient_name,reason,status,wait_min,joined_at)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (hospital_id, None, token, name, reasons[i % len(reasons)],
                 "in-progress" if i == 0 else "waiting", wait,
                 (datetime.now() - timedelta(minutes=i * 4)).isoformat()),
            )


def _advance_queue(hospital_id: str):
    with get_db() as conn:
        serving = conn.execute(
            "SELECT id, joined_at FROM queue_entries WHERE hospital_id=? AND status='in-progress' ORDER BY id LIMIT 1",
            (hospital_id,),
        ).fetchone()

        if serving:
            joined = datetime.fromisoformat(serving["joined_at"])
            if datetime.now() - joined > timedelta(minutes=3):
                conn.execute("UPDATE queue_entries SET status='completed' WHERE id=?", (serving["id"],))
                serving = None

        if not serving:
            next_p = conn.execute(
                "SELECT id FROM queue_entries WHERE hospital_id=? AND status='waiting' ORDER BY id LIMIT 1",
                (hospital_id,),
            ).fetchone()
            if next_p:
                conn.execute("UPDATE queue_entries SET status='in-progress' WHERE id=?", (next_p["id"],))

        waiting = conn.execute(
            "SELECT id, wait_min FROM queue_entries WHERE hospital_id=? AND status='waiting' ORDER BY id",
            (hospital_id,),
        ).fetchall()
        for row in waiting:
            new_wait = max(5, row["wait_min"] - random.randint(1, 3))
            conn.execute("UPDATE queue_entries SET wait_min=? WHERE id=?", (new_wait, row["id"]))


def get_queue_status(hospital_id: str, user_id: str | None = None) -> dict[str, Any]:
    hospital_id = hospital_id if hospital_id in HOSPITALS else DEFAULT_HOSPITAL
    hospital = HOSPITALS[hospital_id]
    _seed_demo_queue(hospital_id)
    _advance_queue(hospital_id)

    with get_db() as conn:
        rows = conn.execute(
            """SELECT token, patient_name as patient, reason, status, wait_min, joined_at, user_id
               FROM queue_entries WHERE hospital_id=? AND status IN ('waiting','in-progress')
               ORDER BY CASE status WHEN 'in-progress' THEN 0 ELSE 1 END, id""",
            (hospital_id,),
        ).fetchall()

    queue = [dict(r) for r in rows]
    waiting = [q for q in queue if q["status"] == "waiting"]
    in_progress = next((q for q in queue if q["status"] == "in-progress"), None)
    my_entry = next((q for q in queue if user_id and q.get("user_id") == user_id), None)

    return {
        "hospital_id": hospital_id,
        "hospital_name": hospital["name"],
        "hospital_area": hospital["area"],
        "hospital_phone": hospital["phone"],
        "city": hospital["city"],
        "total_waiting": len(waiting),
        "currently_serving": in_progress,
        "my_entry": my_entry,
        "queue": queue,
        "avg_wait_minutes": hospital["avg_wait"],
        "hospitals": [{"id": k, **v} for k, v in HOSPITALS.items()],
        "live": True,
    }


def get_user_queue(user_id: str) -> dict[str, Any] | None:
    with get_db() as conn:
        row = conn.execute(
            """SELECT hospital_id, token, patient_name, reason, status, wait_min, joined_at
               FROM queue_entries WHERE user_id=? AND status IN ('waiting','in-progress')
               ORDER BY id DESC LIMIT 1""",
            (user_id,),
        ).fetchone()
    if not row:
        return None
    data = dict(row)
    hospital = HOSPITALS.get(data["hospital_id"], {})
    data["hospital_name"] = hospital.get("name", "")
    data["hospital_phone"] = hospital.get("phone", "")
    return data


def join_queue(hospital_id: str, patient_name: str, reason: str, user_id: str | None = None) -> dict[str, Any]:
    hospital_id = hospital_id if hospital_id in HOSPITALS else DEFAULT_HOSPITAL
    hospital = HOSPITALS[hospital_id]

    with get_db() as conn:
        if user_id:
            existing = conn.execute(
                "SELECT id FROM queue_entries WHERE user_id=? AND status IN ('waiting','in-progress')",
                (user_id,),
            ).fetchone()
            if existing:
                raise ValueError("You already have an active queue token. Leave it first or wait to be served.")

        count = conn.execute(
            "SELECT COUNT(*) as c FROM queue_entries WHERE hospital_id=? AND status='waiting'",
            (hospital_id,),
        ).fetchone()["c"]

        token_num = conn.execute(
            "SELECT COUNT(*) as c FROM queue_entries WHERE hospital_id=?", (hospital_id,)
        ).fetchone()["c"] + 1
        token = f"P{token_num:03d}"
        position = count + 1
        wait_min = hospital["avg_wait"] + position * random.randint(4, 10)
        now = datetime.now().isoformat()

        conn.execute(
            """INSERT INTO queue_entries (hospital_id,user_id,token,patient_name,reason,status,wait_min,joined_at)
               VALUES (?,?,?,?,?,?,?,?)""",
            (hospital_id, user_id, token, patient_name, reason, "waiting", wait_min, now),
        )

    return {
        "token": token,
        "position": position,
        "estimated_wait_minutes": wait_min,
        "hospital": hospital["name"],
        "hospital_id": hospital_id,
        "hospital_phone": hospital["phone"],
        "message": f"Token {token} — you are #{position} at {hospital['name']}. Est. wait: {wait_min} min.",
        "live": True,
    }


def leave_queue(user_id: str) -> bool:
    with get_db() as conn:
        cur = conn.execute(
            "UPDATE queue_entries SET status='cancelled' WHERE user_id=? AND status IN ('waiting','in-progress')",
            (user_id,),
        )
        return cur.rowcount > 0

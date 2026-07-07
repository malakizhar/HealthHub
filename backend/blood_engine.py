"""Blood donation community — Peshawar network."""

from datetime import datetime, timedelta
from typing import Any

from database import get_db

PESHAWAR_AREAS = [
    "Saddar", "Hayatabad", "University Town", "Regi Lalma",
    "Board Bazar", "Charsadda Road", "Warsak Road", "Ring Road",
]

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

SEED_DONORS = [
    ("community-1", "Ahmed Khan", "O+", "Saddar", "0300-1122334", "Available weekends"),
    ("community-2", "Fatima Bibi", "A+", "Hayatabad", "0321-4455667", "Regular donor"),
    ("community-3", "Hassan Shah", "B+", "University Town", "0333-7788990", ""),
    ("community-4", "Sanaullah Afridi", "AB+", "Regi Lalma", "0345-2233445", ""),
    ("community-5", "Maryam Gul", "O-", "Hayatabad", "0312-6677889", "Emergency available"),
    ("community-6", "Imran Khattak", "A-", "Board Bazar", "0301-9988776", ""),
    ("community-7", "Ayesha Mohmand", "B-", "Warsak Road", "0322-5544332", ""),
    ("community-8", "Usman Ali", "O+", "Charsadda Road", "0334-1122335", "Can travel anywhere in Peshawar"),
]


def seed_community():
    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) as c FROM blood_donors").fetchone()["c"]
        if count >= len(SEED_DONORS):
            return
        for uid, name, bg, area, phone, notes in SEED_DONORS:
            exists = conn.execute("SELECT 1 FROM blood_donors WHERE phone=?", (phone,)).fetchone()
            if exists:
                continue
            conn.execute(
                """INSERT INTO blood_donors (user_id,name,blood_group,city,area,phone,notes,available,created_at)
                   VALUES (?,?,?,?,?,?,?,1,?)""",
                (uid, name, bg, "Peshawar", area, phone, notes, datetime.now().isoformat()),
            )


def _fmt_donor(row: dict) -> dict:
    d = dict(row)
    d["bloodGroup"] = d.pop("blood_group", d.get("bloodGroup", ""))
    d["available"] = bool(d.get("available", 1))
    return d


def _fmt_request(row: dict) -> dict:
    d = dict(row)
    d["bloodGroup"] = d.pop("blood_group", d.get("bloodGroup", ""))
    d["requesterName"] = d.pop("requester_name", d.get("requesterName", "Community member"))
    d["contactPhone"] = d.pop("contact_phone", d.get("contactPhone", ""))
    d["createdAt"] = d.pop("created_at", d.get("createdAt", ""))
    return d


def get_community(blood_group: str | None = None, area: str | None = None) -> dict[str, Any]:
    seed_community()
    with get_db() as conn:
        donor_q = "SELECT * FROM blood_donors WHERE available=1 AND city='Peshawar'"
        params: list[Any] = []
        if blood_group:
            donor_q += " AND blood_group=?"
            params.append(blood_group)
        if area:
            donor_q += " AND area=?"
            params.append(area)
        donor_q += " ORDER BY id DESC"
        donors = [_fmt_donor(dict(r)) for r in conn.execute(donor_q, params).fetchall()]

        req_q = "SELECT * FROM blood_requests WHERE status='open' AND city='Peshawar'"
        req_params: list[Any] = []
        if blood_group:
            req_q += " AND blood_group=?"
            req_params.append(blood_group)
        if area:
            req_q += " AND area=?"
            req_params.append(area)
        req_q += " ORDER BY CASE urgency WHEN 'critical' THEN 0 WHEN 'urgent' THEN 1 ELSE 2 END, id DESC"
        requests = [_fmt_request(dict(r)) for r in conn.execute(req_q, req_params).fetchall()]

        offers = [dict(r) for r in conn.execute(
            """SELECT o.*, d.name as donor_name, d.phone as donor_phone, d.blood_group
               FROM blood_offers o
               LEFT JOIN blood_donors d ON d.user_id = o.donor_user_id
               ORDER BY o.id DESC LIMIT 50"""
        ).fetchall()]

        stats = {
            "donors_available": len(donors),
            "open_requests": len(requests),
            "areas": PESHAWAR_AREAS,
            "blood_groups": BLOOD_GROUPS,
        }

    return {"donors": donors, "requests": requests, "offers": offers, "stats": stats}


def offer_to_help(request_id: int, donor_user_id: str, donor_name: str, donor_phone: str, message: str) -> dict:
    with get_db() as conn:
        req = conn.execute("SELECT * FROM blood_requests WHERE id=? AND status='open'", (request_id,)).fetchone()
        if not req:
            raise ValueError("Request not found or already closed")
        cur = conn.execute(
            """INSERT INTO blood_offers (request_id, donor_user_id, donor_name, donor_phone, message, status, created_at)
               VALUES (?,?,?,?,?,?,?)""",
            (request_id, donor_user_id, donor_name, donor_phone, message, "pending", datetime.now().isoformat()),
        )
        return {"id": cur.lastrowid, "request_id": request_id, "status": "pending"}


def fulfill_request(request_id: int, user_id: str) -> dict:
    with get_db() as conn:
        req = conn.execute("SELECT * FROM blood_requests WHERE id=? AND user_id=?", (request_id, user_id)).fetchone()
        if not req:
            raise ValueError("Request not found")
        conn.execute(
            "UPDATE blood_requests SET status='fulfilled', fulfilled_at=? WHERE id=?",
            (datetime.now().isoformat(), request_id),
        )
        return {"id": request_id, "status": "fulfilled"}


def toggle_donor_availability(donor_id: int, user_id: str) -> bool:
    with get_db() as conn:
        row = conn.execute("SELECT available FROM blood_donors WHERE id=? AND user_id=?", (donor_id, user_id)).fetchone()
        if not row:
            raise ValueError("Donor profile not found")
        new_val = 0 if row["available"] else 1
        conn.execute("UPDATE blood_donors SET available=? WHERE id=? AND user_id=?", (new_val, donor_id, user_id))
        return bool(new_val)

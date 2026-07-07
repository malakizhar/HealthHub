"""SQLite persistence for HealthHub AI."""

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).parent / "healthhub.db"


def _user_topic(user_id: str) -> str:
    import hashlib
    digest = hashlib.sha256(user_id.strip().lower().encode()).hexdigest()[:12]
    return f"healthhub-{digest}"


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS medications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                name TEXT, dose TEXT, time TEXT, frequency TEXT,
                notes TEXT, taken INTEGER DEFAULT 0, source TEXT DEFAULT 'manual',
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                doctor TEXT, hospital TEXT, date TEXT, time TEXT,
                type TEXT, status TEXT DEFAULT 'pending', created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS emergency_profiles (
                user_id TEXT PRIMARY KEY,
                blood_group TEXT, allergies TEXT, conditions TEXT,
                medications TEXT, emergency_contact TEXT, cnic TEXT
            );
            CREATE TABLE IF NOT EXISTS blood_donors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                name TEXT, blood_group TEXT, city TEXT, phone TEXT,
                available INTEGER DEFAULT 1, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS blood_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                blood_group TEXT, city TEXT, hospital TEXT,
                status TEXT DEFAULT 'open', created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS triage_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                symptoms TEXT, result_json TEXT, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS prescriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                data_json TEXT, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                type TEXT, title TEXT, detail TEXT, module TEXT, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS queue_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hospital_id TEXT,
                token TEXT, patient_name TEXT, reason TEXT,
                status TEXT DEFAULT 'waiting',
                wait_min INTEGER, joined_at TEXT
            );
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                endpoint TEXT UNIQUE,
                p256dh TEXT,
                auth TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS notification_prefs (
                user_id TEXT PRIMARY KEY,
                ntfy_enabled INTEGER DEFAULT 1,
                web_push_enabled INTEGER DEFAULT 1,
                reminders_enabled INTEGER DEFAULT 1,
                topic TEXT
            );
            CREATE TABLE IF NOT EXISTS reminder_sent (
                user_id TEXT,
                slot_key TEXT,
                med_id INTEGER,
                sent_at TEXT,
                PRIMARY KEY (user_id, slot_key)
            );
            CREATE TABLE IF NOT EXISTS blood_offers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER,
                donor_user_id TEXT,
                donor_name TEXT,
                donor_phone TEXT,
                message TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT
            );
        """)
        _migrate(conn)


def _migrate(conn):
    """Add columns for existing databases."""
    migrations = [
        ("blood_donors", "area", "TEXT DEFAULT 'Saddar'"),
        ("blood_donors", "notes", "TEXT DEFAULT ''"),
        ("blood_requests", "area", "TEXT DEFAULT 'Saddar'"),
        ("blood_requests", "urgency", "TEXT DEFAULT 'normal'"),
        ("blood_requests", "units", "INTEGER DEFAULT 1"),
        ("blood_requests", "requester_name", "TEXT DEFAULT ''"),
        ("blood_requests", "contact_phone", "TEXT DEFAULT ''"),
        ("blood_requests", "notes", "TEXT DEFAULT ''"),
        ("blood_requests", "fulfilled_at", "TEXT"),
        ("queue_entries", "user_id", "TEXT"),
        ("appointments", "hospital_id", "TEXT DEFAULT ''"),
        ("appointments", "notes", "TEXT DEFAULT ''"),
        ("appointments", "phone", "TEXT DEFAULT ''"),
        ("emergency_profiles", "phone", "TEXT DEFAULT ''"),
        ("emergency_profiles", "address", "TEXT DEFAULT ''"),
    ]
    for table, col, typedef in migrations:
        cols = [r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
        if col not in cols:
            try:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {typedef}")
            except Exception:
                pass


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def ensure_user(user_id: str, name: str = "", email: str = ""):
    with get_db() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)",
            (user_id, name, email, datetime.now().isoformat()),
        )


def get_user_data(user_id: str) -> dict[str, Any]:
    with get_db() as conn:
        meds = [dict(r) for r in conn.execute(
            "SELECT * FROM medications WHERE user_id=? ORDER BY id DESC", (user_id,)
        ).fetchall()]
        for m in meds:
            m["taken"] = bool(m.pop("taken", 0))

        appts = [dict(r) for r in conn.execute(
            "SELECT * FROM appointments WHERE user_id=? ORDER BY date", (user_id,)
        ).fetchall()]

        ep = conn.execute("SELECT * FROM emergency_profiles WHERE user_id=?", (user_id,)).fetchone()
        profile = dict(ep) if ep else {
            "blood_group": "B+", "allergies": "", "conditions": "",
            "medications": "", "emergency_contact": "", "cnic": "",
        }

        donors = []
        for r in conn.execute(
            "SELECT id, user_id, name, blood_group, city, area, phone, notes, available, created_at FROM blood_donors WHERE available=1 ORDER BY id DESC"
        ).fetchall():
            donors.append(_fmt_donor_row(dict(r)))

        requests = []
        for r in conn.execute(
            "SELECT * FROM blood_requests WHERE user_id=? ORDER BY id DESC", (user_id,)
        ).fetchall():
            requests.append(_fmt_request_row(dict(r)))

        triage = []
        for r in conn.execute(
            "SELECT * FROM triage_records WHERE user_id=? ORDER BY id DESC LIMIT 20", (user_id,)
        ).fetchall():
            row = dict(r)
            data = json.loads(row.pop("result_json", "{}"))
            data["id"] = row["id"]
            data["at"] = row["created_at"]
            data["symptomsPreview"] = row["symptoms"][:80]
            triage.append(data)

        rx = []
        for r in conn.execute(
            "SELECT * FROM prescriptions WHERE user_id=? ORDER BY id DESC LIMIT 10", (user_id,)
        ).fetchall():
            row = dict(r)
            data = json.loads(row.pop("data_json", "{}"))
            data["id"] = row["id"]
            data["at"] = row["created_at"]
            rx.append(data)

        activity = [dict(r) for r in conn.execute(
            "SELECT id, type, title, detail, module, created_at as at FROM activity_log WHERE user_id=? ORDER BY id DESC LIMIT 30",
            (user_id,),
        ).fetchall()]

    return {
        "medications": meds,
        "appointments": appts,
        "emergencyProfile": {
            "bloodGroup": profile.get("blood_group", ""),
            "allergies": profile.get("allergies", ""),
            "conditions": profile.get("conditions", ""),
            "medications": profile.get("medications", ""),
            "emergencyContact": profile.get("emergency_contact", ""),
            "cnic": profile.get("cnic", ""),
            "phone": profile.get("phone", ""),
            "address": profile.get("address", ""),
        },
        "bloodDonors": donors,
        "bloodRequests": requests,
        "triageHistory": triage,
        "prescriptions": rx,
        "activityLog": activity,
    }


def _fmt_donor_row(d: dict) -> dict:
    d["bloodGroup"] = d.pop("blood_group", d.get("bloodGroup", ""))
    d["available"] = bool(d.get("available", 1))
    d["createdAt"] = d.pop("created_at", d.get("createdAt", ""))
    return d


def _fmt_request_row(d: dict) -> dict:
    d["bloodGroup"] = d.pop("blood_group", d.get("bloodGroup", ""))
    d["requesterName"] = d.pop("requester_name", d.get("requesterName", ""))
    d["contactPhone"] = d.pop("contact_phone", d.get("contactPhone", ""))
    d["createdAt"] = d.pop("created_at", d.get("createdAt", ""))
    return d


def get_emergency_profile(user_id: str) -> dict:
    with get_db() as conn:
        ep = conn.execute("SELECT * FROM emergency_profiles WHERE user_id=?", (user_id,)).fetchone()
        profile = dict(ep) if ep else {}
    return {
        "bloodGroup": profile.get("blood_group", "B+"),
        "allergies": profile.get("allergies", ""),
        "conditions": profile.get("conditions", ""),
        "medications": profile.get("medications", ""),
        "emergencyContact": profile.get("emergency_contact", ""),
        "cnic": profile.get("cnic", ""),
        "phone": profile.get("phone", ""),
        "address": profile.get("address", ""),
    }

def log_activity(user_id: str, type_: str, title: str, detail: str, module: str):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO activity_log (user_id, type, title, detail, module, created_at) VALUES (?,?,?,?,?,?)",
            (user_id, type_, title, detail, module, datetime.now().isoformat()),
        )


# Medications CRUD
def add_medication(user_id: str, data: dict) -> dict:
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO medications (user_id,name,dose,time,frequency,notes,taken,source,created_at)
               VALUES (?,?,?,?,?,?,0,?,?)""",
            (user_id, data["name"], data.get("dose",""), data.get("time","08:00"),
             data.get("frequency","Once daily"), data.get("notes",""), data.get("source","manual"),
             datetime.now().isoformat()),
        )
        return {"id": cur.lastrowid, **data, "taken": False}


def toggle_medication(user_id: str, med_id: int) -> bool:
    with get_db() as conn:
        row = conn.execute("SELECT taken FROM medications WHERE id=? AND user_id=?", (med_id, user_id)).fetchone()
        if not row:
            return False
        new_val = 0 if row["taken"] else 1
        conn.execute("UPDATE medications SET taken=? WHERE id=? AND user_id=?", (new_val, med_id, user_id))
        return bool(new_val)


def delete_medication(user_id: str, med_id: int):
    with get_db() as conn:
        conn.execute("DELETE FROM medications WHERE id=? AND user_id=?", (med_id, user_id))


def sync_emergency_meds(user_id: str):
    with get_db() as conn:
        rows = conn.execute("SELECT name, dose FROM medications WHERE user_id=?", (user_id,)).fetchall()
        names = ", ".join(f"{r['name']} {r['dose']}" for r in rows)
        conn.execute(
            """INSERT INTO emergency_profiles (user_id, blood_group, allergies, conditions, medications, emergency_contact, cnic)
               VALUES (?, 'B+', '', '', ?, '', '')
               ON CONFLICT(user_id) DO UPDATE SET medications=excluded.medications""",
            (user_id, names),
        )


# Appointments
def add_appointment(user_id: str, data: dict) -> dict:
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO appointments (user_id,doctor,hospital,hospital_id,date,time,type,status,notes,phone,created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (user_id, data.get("doctor",""), data["hospital"], data.get("hospitalId",""),
             data["date"], data.get("time","09:00"), data.get("type","General"),
             data.get("status","confirmed"), data.get("notes",""), data.get("phone",""),
             datetime.now().isoformat()),
        )
        return {"id": cur.lastrowid, **data, "status": data.get("status", "confirmed")}


def update_appointment_status(user_id: str, appt_id: int, status: str) -> bool:
    with get_db() as conn:
        cur = conn.execute(
            "UPDATE appointments SET status=? WHERE id=? AND user_id=?",
            (status, appt_id, user_id),
        )
        return cur.rowcount > 0


def delete_appointment(user_id: str, appt_id: int):
    with get_db() as conn:
        conn.execute("DELETE FROM appointments WHERE id=? AND user_id=?", (appt_id, user_id))


# Emergency profile
def save_emergency_profile(user_id: str, profile: dict):
    with get_db() as conn:
        conn.execute(
            """INSERT INTO emergency_profiles (user_id,blood_group,allergies,conditions,medications,emergency_contact,cnic,phone,address)
               VALUES (?,?,?,?,?,?,?,?,?)
               ON CONFLICT(user_id) DO UPDATE SET
                 blood_group=excluded.blood_group, allergies=excluded.allergies,
                 conditions=excluded.conditions, medications=excluded.medications,
                 emergency_contact=excluded.emergency_contact, cnic=excluded.cnic,
                 phone=excluded.phone, address=excluded.address""",
            (user_id, profile.get("bloodGroup",""), profile.get("allergies",""),
             profile.get("conditions",""), profile.get("medications",""),
             profile.get("emergencyContact",""), profile.get("cnic",""),
             profile.get("phone",""), profile.get("address","")),
        )


# Blood
def register_donor(user_id: str, data: dict) -> dict:
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM blood_donors WHERE user_id=?", (user_id,)).fetchone()
        if existing:
            conn.execute(
                """UPDATE blood_donors SET name=?, blood_group=?, city=?, area=?, phone=?, notes=?, available=1
                   WHERE user_id=?""",
                (data["name"], data["bloodGroup"], data.get("city","Peshawar"),
                 data.get("area","Saddar"), data["phone"], data.get("notes",""), user_id),
            )
            return {"id": existing["id"], **data, "available": True}
        cur = conn.execute(
            """INSERT INTO blood_donors (user_id,name,blood_group,city,area,phone,notes,available,created_at)
               VALUES (?,?,?,?,?,?,?,1,?)""",
            (user_id, data["name"], data["bloodGroup"], data.get("city","Peshawar"),
             data.get("area","Saddar"), data["phone"], data.get("notes",""), datetime.now().isoformat()),
        )
        return {"id": cur.lastrowid, **data, "available": True}


def request_blood(user_id: str, data: dict) -> dict:
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO blood_requests (user_id,blood_group,city,area,hospital,urgency,units,
               requester_name,contact_phone,notes,status,created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (user_id, data["bloodGroup"], data.get("city","Peshawar"), data.get("area","Saddar"),
             data["hospital"], data.get("urgency","normal"), data.get("units",1),
             data.get("requesterName",""), data.get("contactPhone",""), data.get("notes",""),
             "open", datetime.now().isoformat()),
        )
        return {"id": cur.lastrowid, **data, "status": "open"}


# Triage & prescriptions
def save_triage(user_id: str, symptoms: str, result: dict) -> dict:
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO triage_records (user_id,symptoms,result_json,created_at) VALUES (?,?,?,?)",
            (user_id, symptoms, json.dumps(result), datetime.now().isoformat()),
        )
        result["id"] = cur.lastrowid
        result["at"] = datetime.now().isoformat()
        result["symptomsPreview"] = symptoms[:80]
        return result


def save_prescription(user_id: str, data: dict) -> dict:
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO prescriptions (user_id,data_json,created_at) VALUES (?,?,?)",
            (user_id, json.dumps(data), datetime.now().isoformat()),
        )
        data["id"] = cur.lastrowid
        data["at"] = datetime.now().isoformat()
        return data


# Notifications
def get_notification_prefs(user_id: str) -> dict[str, Any]:
    topic = _user_topic(user_id)
    with get_db() as conn:
        row = conn.execute("SELECT * FROM notification_prefs WHERE user_id=?", (user_id,)).fetchone()
        if row:
            return {
                "ntfy_enabled": bool(row["ntfy_enabled"]),
                "web_push_enabled": bool(row["web_push_enabled"]),
                "reminders_enabled": bool(row["reminders_enabled"]),
                "topic": row["topic"] or topic,
            }
        conn.execute(
            "INSERT OR IGNORE INTO notification_prefs (user_id, ntfy_enabled, web_push_enabled, reminders_enabled, topic) VALUES (?,?,?,?,?)",
            (user_id, 1, 1, 1, topic),
        )
    return {"ntfy_enabled": True, "web_push_enabled": True, "reminders_enabled": True, "topic": topic}


def save_notification_prefs(user_id: str, prefs: dict):
    topic = prefs.get("topic") or _user_topic(user_id)
    with get_db() as conn:
        conn.execute(
            """INSERT INTO notification_prefs (user_id, ntfy_enabled, web_push_enabled, reminders_enabled, topic)
               VALUES (?,?,?,?,?)
               ON CONFLICT(user_id) DO UPDATE SET
                 ntfy_enabled=excluded.ntfy_enabled,
                 web_push_enabled=excluded.web_push_enabled,
                 reminders_enabled=excluded.reminders_enabled,
                 topic=excluded.topic""",
            (user_id, int(prefs.get("ntfy_enabled", True)), int(prefs.get("web_push_enabled", True)),
             int(prefs.get("reminders_enabled", True)), topic),
        )


def save_push_subscription(user_id: str, endpoint: str, p256dh: str, auth: str):
    with get_db() as conn:
        conn.execute(
            """INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
               VALUES (?,?,?,?,?)
               ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, p256dh=excluded.p256dh, auth=excluded.auth""",
            (user_id, endpoint, p256dh, auth, datetime.now().isoformat()),
        )


def delete_push_subscription(user_id: str, endpoint: str):
    with get_db() as conn:
        conn.execute("DELETE FROM push_subscriptions WHERE user_id=? AND endpoint=?", (user_id, endpoint))


def get_push_subscriptions(user_id: str) -> list[dict[str, str]]:
    with get_db() as conn:
        return [dict(r) for r in conn.execute(
            "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=?", (user_id,)
        ).fetchall()]


def get_all_active_medications() -> list[dict[str, Any]]:
    with get_db() as conn:
        return [dict(r) for r in conn.execute(
            "SELECT id, user_id, name, dose, time, frequency, notes, taken FROM medications WHERE taken=0"
        ).fetchall()]


def get_medications_due_list(user_id: str) -> list[dict[str, Any]]:
    with get_db() as conn:
        return [dict(r) for r in conn.execute(
            "SELECT id, name, dose, time, frequency, notes FROM medications WHERE user_id=? AND taken=0 ORDER BY time",
            (user_id,),
        ).fetchall()]


def was_reminder_sent(user_id: str, slot_key: str) -> bool:
    with get_db() as conn:
        row = conn.execute(
            "SELECT 1 FROM reminder_sent WHERE user_id=? AND slot_key=?", (user_id, slot_key)
        ).fetchone()
        return row is not None


def mark_reminder_sent(user_id: str, slot_key: str, med_id: int):
    with get_db() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO reminder_sent (user_id, slot_key, med_id, sent_at) VALUES (?,?,?,?)",
            (user_id, slot_key, med_id, datetime.now().isoformat()),
        )


init_db()

"""HealthHub AI backend: LLM + SQLite + live APIs."""

import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import database as db
from assistant_engine import chat_health_assistant
from facilities import find_facilities, get_all_cities
from health_engine import triage_symptoms
from llm_service import detect_llm
from ocr_engine import explain_prescription, extract_text_from_image
from queue_engine import get_queue_status, join_queue, get_user_queue, leave_queue
from blood_engine import get_community, offer_to_help, fulfill_request, toggle_donor_availability, seed_community
from appointment_engine import get_booking_hospitals, get_available_slots
from notification_service import (
    ensure_vapid_keys,
    notify_user,
    send_test_reminder,
    start_scheduler,
    user_topic,
)

load_dotenv()

app = FastAPI(title="HealthHub AI Backend", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def uid(header: str | None) -> str:
    if not header:
        raise HTTPException(401, "Login required. Missing X-User-Id header.")
    return header


class TriageRequest(BaseModel):
    symptoms: str = Field(..., min_length=3, max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class QueueJoinRequest(BaseModel):
    hospital_id: str
    patient_name: str = Field(..., min_length=2)
    reason: str = Field(default="General consultation")


class MedicationIn(BaseModel):
    name: str
    dose: str = ""
    time: str = "08:00"
    frequency: str = "Once daily"
    notes: str = ""
    source: str = "manual"


class AppointmentIn(BaseModel):
    doctor: str = ""
    hospital: str
    hospitalId: str = ""
    date: str
    time: str = "09:00"
    type: str = "General checkup"
    notes: str = ""
    phone: str = ""


class EmergencyIn(BaseModel):
    bloodGroup: str = ""
    allergies: str = ""
    conditions: str = ""
    medications: str = ""
    emergencyContact: str = ""
    cnic: str = ""
    phone: str = ""
    address: str = ""


class DonorIn(BaseModel):
    name: str
    bloodGroup: str
    city: str = "Peshawar"
    area: str = "Saddar"
    phone: str
    notes: str = ""


class BloodReqIn(BaseModel):
    bloodGroup: str
    city: str = "Peshawar"
    area: str = "Saddar"
    hospital: str
    urgency: str = "normal"
    units: int = 1
    requesterName: str = ""
    contactPhone: str = ""
    notes: str = ""


class BloodOfferIn(BaseModel):
    request_id: int
    donor_name: str
    donor_phone: str
    message: str = "I can donate. Please contact me."


class ApptStatusIn(BaseModel):
    status: str


class PushSubscriptionIn(BaseModel):
    endpoint: str
    keys: dict[str, str]


class NotificationPrefsIn(BaseModel):
    ntfy_enabled: bool = True
    web_push_enabled: bool = True
    reminders_enabled: bool = True


class TestNotificationIn(BaseModel):
    delay_seconds: int = Field(default=10, ge=0, le=300)


@app.on_event("startup")
async def startup():
    db.init_db()
    seed_community()
    ensure_vapid_keys()
    start_scheduler()


@app.get("/api/cron/reminders")
async def cron_reminders(request: Request):
    """Vercel Cron hits this every minute to send medication reminders."""
    secret = os.getenv("CRON_SECRET", "")
    if secret:
        auth = request.headers.get("Authorization", "")
        if auth != f"Bearer {secret}":
            raise HTTPException(403, "Forbidden")
    from notification_service import check_and_send_reminders

    await check_and_send_reminders()
    return {"ok": True}


@app.get("/api/health")
async def health():
    llm = await detect_llm()
    return {"status": "ok", "product": "HealthHub AI", "database": "sqlite", "llm": llm}

# ── User data (SQLite) ──────────────────────────────────────────

@app.get("/api/user/data")
async def user_data(x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    db.ensure_user(user)
    return {"success": True, "data": db.get_user_data(user)}


@app.post("/api/medications")
async def create_med(body: MedicationIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    item = db.add_medication(user, body.model_dump())
    db.sync_emergency_meds(user)
    db.log_activity(user, "medication", "Medicine added", f"{body.name} {body.dose}", "medications")
    return {"success": True, "data": item}


@app.patch("/api/medications/{med_id}/toggle")
async def toggle_med(med_id: int, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    taken = db.toggle_medication(user, med_id)
    return {"success": True, "data": {"taken": taken}}


@app.delete("/api/medications/{med_id}")
async def remove_med(med_id: int, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    db.delete_medication(user, med_id)
    db.sync_emergency_meds(user)
    return {"success": True}


@app.post("/api/appointments")
async def create_appt(body: AppointmentIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    item = db.add_appointment(user, body.model_dump())
    db.log_activity(user, "appointment", "Appointment booked", body.hospital, "appointments")
    return {"success": True, "data": item}


@app.delete("/api/appointments/{appt_id}")
async def remove_appt(appt_id: int, x_user_id: str | None = Header(None)):
    db.delete_appointment(uid(x_user_id), appt_id)
    return {"success": True}


@app.patch("/api/appointments/{appt_id}/status")
async def appt_status(appt_id: int, body: ApptStatusIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    ok = db.update_appointment_status(user, appt_id, body.status)
    if not ok:
        raise HTTPException(404, "Appointment not found")
    return {"success": True}


@app.get("/api/appointments/hospitals")
async def appt_hospitals():
    return {"success": True, "data": get_booking_hospitals()}


@app.get("/api/appointments/slots")
async def appt_slots(hospital_id: str = Query(...), date: str = Query(...)):
    return {"success": True, "data": get_available_slots(hospital_id, date)}


@app.get("/api/emergency-profile")
async def get_profile(x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    return {"success": True, "data": db.get_emergency_profile(user)}


@app.put("/api/emergency-profile")
async def save_profile(body: EmergencyIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    db.save_emergency_profile(user, body.model_dump())
    return {"success": True}


@app.post("/api/blood/donors")
async def add_donor(body: DonorIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    item = db.register_donor(user, body.model_dump())
    db.log_activity(user, "blood", "Donor registered", body.bloodGroup, "blood")
    return {"success": True, "data": item}


@app.post("/api/blood/requests")
async def add_blood_req(body: BloodReqIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    item = db.request_blood(user, body.model_dump())
    db.log_activity(user, "blood", "Blood requested", f"{body.bloodGroup} at {body.hospital}", "blood")
    return {"success": True, "data": item}


@app.get("/api/blood/community")
async def blood_community(blood_group: str | None = Query(None), area: str | None = Query(None)):
    return {"success": True, "data": get_community(blood_group, area)}


@app.post("/api/blood/offers")
async def blood_offer(body: BloodOfferIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    try:
        result = offer_to_help(body.request_id, user, body.donor_name, body.donor_phone, body.message)
        db.log_activity(user, "blood", "Offered to donate", f"Request #{body.request_id}", "blood")
        return {"success": True, "data": result}
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc


@app.patch("/api/blood/requests/{req_id}/fulfill")
async def blood_fulfill(req_id: int, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    try:
        return {"success": True, "data": fulfill_request(req_id, user)}
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc


@app.patch("/api/blood/donors/{donor_id}/availability")
async def donor_toggle(donor_id: int, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    try:
        available = toggle_donor_availability(donor_id, user)
        return {"success": True, "data": {"available": available}}
    except ValueError as exc:
        raise HTTPException(404, detail=str(exc)) from exc


# ── AI endpoints (real LLM) ─────────────────────────────────────

@app.post("/api/triage")
async def triage(body: TriageRequest, x_user_id: str | None = Header(None)):
    try:
        result = await triage_symptoms(body.symptoms.strip())
        if x_user_id:
            db.ensure_user(x_user_id)
            db.save_triage(x_user_id, body.symptoms, result)
            db.log_activity(x_user_id, "triage", "Symptom check", result["condition"], "symptoms")
        return {"success": True, "data": result}
    except Exception as exc:
        raise HTTPException(500, detail=str(exc)) from exc


@app.post("/api/assistant/chat")
async def assistant_chat(body: ChatRequest):
    try:
        return {"success": True, "data": await chat_health_assistant(body.message.strip())}
    except Exception as exc:
        raise HTTPException(500, detail=str(exc)) from exc


@app.post("/api/ocr/scan")
async def ocr_scan(
    file: UploadFile = File(None),
    text: str = Form(None),
    x_user_id: str | None = Header(None),
):
    try:
        raw_text = (text or "").strip()
        ocr_meta = {"method": "text_input", "confidence": 1.0}

        if file and file.filename:
            content = await file.read()
            extracted = await extract_text_from_image(content, file.filename)
            raw_text = extracted["text"]
            ocr_meta = {"method": extracted["method"], "confidence": extracted["confidence"]}

        if not raw_text:
            raise HTTPException(400, "Upload an image or paste prescription text.")

        explanation = await explain_prescription(raw_text)
        data = {"ocr": ocr_meta, "raw_text": raw_text, **explanation}

        if x_user_id:
            db.save_prescription(x_user_id, data)
            db.log_activity(x_user_id, "prescription", "Prescription scanned", explanation.get("summary", ""), "prescription")

        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, detail=str(exc)) from exc


@app.get("/api/facilities")
async def facilities(city: str | None = Query(None), urgency: str = Query("routine"), specialty: str | None = Query(None)):
    return {"success": True, "data": find_facilities(city=city, urgency=urgency, specialty=specialty, limit=20), "cities": get_all_cities()}


@app.get("/api/queue/{hospital_id}")
async def queue_status(hospital_id: str, x_user_id: str | None = Header(None)):
    return {"success": True, "data": get_queue_status(hospital_id, x_user_id)}


@app.get("/api/queue/my/active")
async def my_queue(x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    data = get_user_queue(user)
    return {"success": True, "data": data}


@app.delete("/api/queue/my")
async def leave_my_queue(x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    left = leave_queue(user)
    return {"success": True, "data": {"left": left}}


@app.post("/api/queue/join")
async def queue_join(body: QueueJoinRequest, x_user_id: str | None = Header(None)):
    try:
        user = uid(x_user_id) if x_user_id else None
        result = join_queue(body.hospital_id, body.patient_name, body.reason, user)
        if x_user_id:
            db.log_activity(x_user_id, "queue", "Joined queue", f"Token {result['token']}", "queue")
        return {"success": True, "data": result}
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, detail=str(exc)) from exc


# ── Notifications (free: ntfy + Web Push) ───────────────────────

@app.get("/api/notifications/status")
async def notifications_status(x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    prefs = db.get_notification_prefs(user)
    pub, _ = ensure_vapid_keys()
    subs = db.get_push_subscriptions(user)
    return {
        "success": True,
        "data": {
            **prefs,
            "ntfy_url": f"https://ntfy.sh/{prefs['topic']}",
            "ntfy_app": "https://ntfy.sh/app",
            "web_push_configured": bool(pub),
            "push_subscriptions": len(subs),
        },
    }


@app.get("/api/notifications/vapid-public-key")
async def vapid_public_key():
    pub, _ = ensure_vapid_keys()
    if not pub:
        raise HTTPException(503, "Web Push not configured on server.")
    return {"success": True, "publicKey": pub}


@app.put("/api/notifications/prefs")
async def save_notif_prefs(body: NotificationPrefsIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    db.save_notification_prefs(user, body.model_dump())
    return {"success": True, "data": db.get_notification_prefs(user)}


@app.post("/api/notifications/subscribe")
async def push_subscribe(body: PushSubscriptionIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    keys = body.keys or {}
    db.save_push_subscription(user, body.endpoint, keys.get("p256dh", ""), keys.get("auth", ""))
    return {"success": True}


@app.post("/api/notifications/unsubscribe")
async def push_unsubscribe(body: PushSubscriptionIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    db.delete_push_subscription(user, body.endpoint)
    return {"success": True}


@app.post("/api/notifications/test")
async def test_notification(body: TestNotificationIn, x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    result = await send_test_reminder(user, body.delay_seconds)
    return {"success": True, "data": result}


@app.post("/api/notifications/send-now")
async def send_now(x_user_id: str | None = Header(None)):
    user = uid(x_user_id)
    result = await notify_user(user, "HealthHub Reminder", "Your medicine reminder is working on your phone!")
    return {"success": True, "data": result}

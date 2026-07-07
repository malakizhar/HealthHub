"""Smoke-test all HealthHub API endpoints."""
import json
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8000"
USER = "demo-user"
results = []


def req(method, path, body=None, headers=None, timeout=30, form=None):
    h = {"X-User-Id": USER}
    if headers:
        h.update(headers)
    data = None
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        h["Content-Type"] = "application/x-www-form-urlencoded"
    elif body is not None:
        data = json.dumps(body).encode()
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"raw": raw}
        return e.code, payload


def check(name, method, path, body=None, expect=(200, 201), timeout=30, form=None):
    status, data = req(method, path, body, timeout=timeout, form=form)
    ok = status in expect
    results.append((name, ok, status))
    mark = "OK" if ok else "FAIL"
    print(f"[{mark}] {name} -> {status}")
    if not ok:
        print("     ", str(data)[:200])
    return data


print("=== HealthHub API Tests ===\n")

check("Health", "GET", "/api/health")
check("User data", "GET", "/api/user/data")
check("Facilities", "GET", "/api/facilities")
check("Blood community", "GET", "/api/blood/community")
check("Appointment hospitals", "GET", "/api/appointments/hospitals")
check("Appointment slots", "GET", "/api/appointments/slots?hospital_id=lrh&doctor_id=dr-khan&date=2026-07-10")
check("Queue board", "GET", "/api/queue/lrh")
check("My queue", "GET", "/api/queue/my/active")
check("Emergency profile", "GET", "/api/emergency-profile")
check("Notifications status", "GET", "/api/notifications/status")
check("VAPID key", "GET", "/api/notifications/vapid-public-key")

triage = check("Triage", "POST", "/api/triage", {
    "symptoms": "headache and fever for 2 days",
    "age": 28,
    "duration": "2 days",
})
check("Assistant chat", "POST", "/api/assistant/chat", {"message": "What is dengue?"}, timeout=90)
check("OCR text scan", "POST", "/api/ocr/scan", form={
    "text": "Tab Paracetamol 500mg — 1 tablet twice daily after meals",
})

med = check("Add medication", "POST", "/api/medications", {
    "name": "Paracetamol",
    "dose": "500mg",
    "time": "08:00",
    "frequency": "twice daily",
}, expect=(200, 201))
med_id = (med.get("data") or med).get("id") if isinstance(med, dict) else None
if med_id:
    check("Toggle medication", "PATCH", f"/api/medications/{med_id}/toggle", {"taken": True})

appt = check("Book appointment", "POST", "/api/appointments", {
    "hospital": "Lady Reading Hospital",
    "hospitalId": "lrh",
    "doctor": "Dr. Khan",
    "date": "2026-07-15",
    "time": "10:00",
    "type": "Follow-up",
}, expect=(200, 201))
appt_id = (appt.get("data") or appt).get("id") if isinstance(appt, dict) else None
if appt_id:
    check("Update appointment", "PATCH", f"/api/appointments/{appt_id}/status", {"status": "confirmed"})

check("Update emergency", "PUT", "/api/emergency-profile", {
    "bloodGroup": "O+",
    "allergies": "Penicillin",
    "conditions": "None",
    "emergencyContact": "03001234567",
    "address": "University Town, Peshawar",
})

check("Leave queue (cleanup)", "DELETE", "/api/queue/my", expect=(200, 204))
queue = check("Join queue", "POST", "/api/queue/join", {
    "hospital_id": "lrh",
    "department": "General",
    "patient_name": "Test Patient",
}, expect=(200, 201))

check("Notification prefs", "PUT", "/api/notifications/prefs", {
    "ntfy_enabled": True,
    "web_push_enabled": True,
    "reminders_enabled": True,
})
check("Test notification", "POST", "/api/notifications/test", {
    "title": "HealthHub Test",
    "body": "Reminder test from smoke suite",
})

passed = sum(1 for _, ok, _ in results if ok)
failed = len(results) - passed
print(f"\n=== {passed}/{len(results)} passed, {failed} failed ===")
raise SystemExit(1 if failed else 0)

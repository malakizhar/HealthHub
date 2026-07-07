"""Free medication reminders: ntfy.sh push + Web Push (VAPID) + scheduler."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger("healthhub.notifications")

NTFY_BASE = os.getenv("NTFY_BASE", "https://ntfy.sh")
VAPID_EMAIL = os.getenv("VAPID_EMAIL", "mailto:healthhub@local")
if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
    KEYS_PATH = Path("/tmp/vapid_keys.json")
else:
    KEYS_PATH = Path(__file__).parent / "vapid_keys.json"

_scheduler_task: asyncio.Task | None = None


def user_topic(user_id: str) -> str:
    digest = hashlib.sha256(user_id.strip().lower().encode()).hexdigest()[:12]
    return f"healthhub-{digest}"


def ensure_vapid_keys() -> tuple[str, str]:
    pub = os.getenv("VAPID_PUBLIC_KEY", "")
    priv = os.getenv("VAPID_PRIVATE_KEY", "")
    if pub and priv:
        return pub, priv
    if KEYS_PATH.exists():
        data = json.loads(KEYS_PATH.read_text(encoding="utf-8"))
        return data.get("public", ""), data.get("private", "")
    try:
        from cryptography.hazmat.primitives import serialization
        from py_vapid import Vapid, b64urlencode

        v = Vapid()
        v.generate_keys()
        priv_pem = v.private_pem()
        priv = priv_pem.decode("utf-8") if isinstance(priv_pem, bytes) else priv_pem
        pub = b64urlencode(
            v.public_key.public_bytes(
                serialization.Encoding.X962,
                serialization.PublicFormat.UncompressedPoint,
            )
        )
        KEYS_PATH.write_text(json.dumps({"public": pub, "private": priv}), encoding="utf-8")
        return pub, priv
    except Exception as exc:
        logger.warning("Web Push optional — install pywebpush for browser push: %s", exc)
        return "", ""


async def send_ntfy(topic: str, title: str, body: str, priority: int = 4) -> bool:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{NTFY_BASE}/{topic}",
                content=body.encode("utf-8"),
                headers={
                    "Title": title,
                    "Priority": str(priority),
                    "Tags": "pill,alarm_clock",
                    "Click": "/app/medications",
                },
            )
            return r.status_code in (200, 201)
    except Exception as exc:
        logger.warning("ntfy send failed: %s", exc)
        return False


async def send_web_push(subscription: dict[str, str], payload: dict[str, Any]) -> bool:
    pub, priv = ensure_vapid_keys()
    if not priv:
        return False
    try:
        from pywebpush import WebPushException, webpush

        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": {"p256dh": subscription["p256dh"], "auth": subscription["auth"]},
            },
            data=json.dumps(payload),
            vapid_private_key=priv,
            vapid_claims={"sub": VAPID_EMAIL},
        )
        return True
    except WebPushException as exc:
        logger.warning("web push failed: %s", exc)
        return False


async def notify_user(user_id: str, title: str, body: str, url: str = "/app/medications") -> dict[str, Any]:
    import database as db

    results: dict[str, Any] = {"ntfy": False, "web_push": 0}
    prefs = db.get_notification_prefs(user_id)
    topic = prefs.get("topic") or user_topic(user_id)

    if prefs.get("ntfy_enabled", True):
        results["ntfy"] = await send_ntfy(topic, title, body)

    payload = {"title": title, "body": body, "url": url}
    for sub in db.get_push_subscriptions(user_id):
        if await send_web_push(sub, payload):
            results["web_push"] += 1

    return results


async def send_test_reminder(user_id: str, delay_seconds: int = 5) -> dict[str, Any]:
    import database as db

    meds = db.get_medications_due_list(user_id)
    if meds:
        m = meds[0]
        title = "HealthHub Medicine Reminder"
        body = f"Time for {m['name']} {m['dose']}".strip()
    else:
        title = "HealthHub Reminder Test"
        body = "Notifications are working on your phone!"

    if delay_seconds <= 0:
        return await notify_user(user_id, title, body)

    async def _delayed():
        await asyncio.sleep(delay_seconds)
        await notify_user(user_id, title, body)

    asyncio.create_task(_delayed())
    return {"scheduled_in_seconds": delay_seconds, "title": title, "body": body}


def _time_slots_for_med(med: dict[str, Any]) -> list[str]:
    base = (med.get("time") or "08:00")[:5]
    freq = (med.get("frequency") or "").lower()
    slots = [base]
    if "twice" in freq:
        try:
            h, mi = map(int, base.split(":"))
            h2 = (h + 12) % 24
            slots.append(f"{h2:02d}:{mi:02d}")
        except ValueError:
            pass
    return slots


async def check_and_send_reminders():
    import database as db

    now = datetime.now()
    slot_key = now.strftime("%Y-%m-%d-%H:%M")
    current_hm = now.strftime("%H:%M")

    for row in db.get_all_active_medications():
        if row.get("taken"):
            continue
        user_id = row["user_id"]
        prefs = db.get_notification_prefs(user_id)
        if not prefs.get("reminders_enabled", True):
            continue

        for slot in _time_slots_for_med(row):
            if slot != current_hm:
                continue
            dedupe = f"{row['id']}-{slot_key}"
            if db.was_reminder_sent(user_id, dedupe):
                continue

            title = "Medicine reminder"
            body = f"Take {row['name']} {row['dose']}".strip()
            if row.get("notes"):
                body += f" — {row['notes']}"

            await notify_user(user_id, title, body)
            db.mark_reminder_sent(user_id, dedupe, row["id"])
            db.log_activity(user_id, "medication", "Reminder sent", body, "medications")
            logger.info("Reminder sent to %s: %s", user_id, body)


async def _scheduler_loop():
    while True:
        try:
            await check_and_send_reminders()
        except Exception as exc:
            logger.exception("Reminder scheduler error: %s", exc)
        await asyncio.sleep(30)


def start_scheduler():
    if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
        logger.info("Background scheduler disabled on Vercel — use /api/cron/reminders")
        return
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(_scheduler_loop())

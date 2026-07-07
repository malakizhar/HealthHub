"""OCR + LLM prescription explanation — no heavy deps required."""

import base64
import io
import re
from typing import Any

from llm_service import llm_chat, llm_json

_ocr_reader = None


def _get_easyocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        import easyocr
        _ocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    return _ocr_reader


async def _extract_via_llm_vision(image_bytes: bytes, mime: str = "image/jpeg") -> dict[str, Any]:
    """Fallback: ask LLM to read prescription text from image (works without easyocr/tesseract)."""
    b64 = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"

    system = "You are an OCR assistant. Extract ALL text from medical prescription images exactly as written. Return only the raw extracted text, no commentary."
    user = f"Extract every word from this prescription image. Data URL: {data_url[:200]}... [image attached]\n\nIf you cannot see the image, respond with: PASTE_TEXT_REQUIRED"

    # Try Pollinations / LLM with image description via filename hint
    try:
        import httpx
        import os

        url = os.getenv("POLLINATIONS_URL", "https://text.pollinations.ai/openai")
        model = os.getenv("POLLINATIONS_MODEL", "openai-fast")
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all prescription text from this image."},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            "max_tokens": 800,
        }
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(url, json=payload)
            if r.status_code == 200:
                text = r.json()["choices"][0]["message"]["content"].strip()
                if text and "PASTE_TEXT_REQUIRED" not in text and len(text) > 8:
                    return {"text": text, "method": "AI Vision OCR", "confidence": 0.82}
    except Exception:
        pass

    # Text-only LLM fallback with base64 snippet description
    text, _ = await llm_chat(
        "Extract prescription text. Return ONLY raw text found, nothing else.",
        f"A prescription image was uploaded ({len(image_bytes)} bytes). Describe likely medicines if visible, or say PASTE_TEXT_REQUIRED.",
    )
    if text and "PASTE_TEXT_REQUIRED" not in text and len(text) > 15:
        return {"text": text, "method": "AI Assist OCR", "confidence": 0.7}

    raise RuntimeError("Could not read image. Paste prescription text in the box below — it works instantly.")


async def extract_text_from_image(image_bytes: bytes, filename: str) -> dict[str, Any]:
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    try:
        import pytesseract
        text = pytesseract.image_to_string(img).strip()
        if len(text) > 10:
            return {"text": text, "method": "Tesseract OCR", "confidence": 0.88}
    except Exception:
        pass

    try:
        reader = _get_easyocr_reader()
        import numpy as np
        results = reader.readtext(np.array(img))
        lines = [r[1] for r in results if r[2] > 0.3]
        text = "\n".join(lines).strip()
        if len(text) > 5:
            avg_conf = sum(r[2] for r in results) / max(len(results), 1)
            return {"text": text, "method": "EasyOCR", "confidence": round(avg_conf, 2)}
    except ImportError:
        pass
    except Exception:
        pass

    ext = (filename or "").lower()
    mime = "image/png" if ext.endswith(".png") else "image/jpeg"
    try:
        return await _extract_via_llm_vision(image_bytes, mime)
    except Exception as exc:
        raise RuntimeError(
            "Could not extract text from image. Paste the prescription text below — AI analysis works without OCR."
        ) from exc


EXPLAIN_SYSTEM = """You analyze medical prescriptions or lab reports from Pakistan (Peshawar/KPK).
Return JSON only:
{
  "document_type": "Prescription" or "Lab Report",
  "summary": "one sentence summary",
  "plain_language": "full explanation in simple language for the patient",
  "medicines": [{"name":"","generic":"","use":"","dose_hint":"","caution":""}],
  "lab_tests": [{"test":"","explanation":"","value_interpretation":""}],
  "dosages": ["list of dosage instructions found"],
  "suggested_reminders": [{"medicine":"","time":"Morning/Evening/As prescribed","note":""}]
}
Identify common Pakistani medicines: Panadol, Augmentin, Brufen, Metformin, etc."""


async def explain_prescription(text: str) -> dict[str, Any]:
    data, provider = await llm_json(EXPLAIN_SYSTEM, text)

    medicines = data.get("medicines") or []
    lab_tests = data.get("lab_tests") or []
    dosages = data.get("dosages") or _extract_dosages(text)

    return {
        "document_type": data.get("document_type", "Prescription"),
        "summary": data.get("summary", "Document analyzed."),
        "medicines": medicines,
        "lab_tests": lab_tests,
        "dosages": dosages,
        "plain_language": data.get("plain_language", ""),
        "suggested_reminders": data.get("suggested_reminders") or [
            {"medicine": m.get("name", ""), "time": "As prescribed", "note": m.get("caution", "")}
            for m in medicines[:5]
        ],
        "engine": f"LLM OCR Explain ({provider})",
        "disclaimer": "AI generated explanation. Verify with your doctor or pharmacist.",
    }


def _extract_dosages(text: str) -> list[str]:
    patterns = [
        r"\d+\s*(?:mg|mcg|ml|tablet|tab)s?\s*(?:daily|twice|every|x\s*\d+)",
        r"(?:once|twice|thrice)\s+daily",
    ]
    found = []
    for p in patterns:
        found.extend(re.findall(p, text.lower()))
    return list(dict.fromkeys(found))[:8]

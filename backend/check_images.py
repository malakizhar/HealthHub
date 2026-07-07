import re
import urllib.request
from pathlib import Path

text = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "images.js"
content = text.read_text(encoding="utf-8")
ids = re.findall(r"u\('(photo-[^']+)'", content)
failed = 0
for pid in ids:
    url = f"https://images.unsplash.com/{pid}?auto=format&fit=crop&w=400&q=80"
    try:
        r = urllib.request.urlopen(url, timeout=20)
        print(f"OK  {r.status}  {pid}")
    except Exception as exc:
        print(f"FAIL  {pid}  {exc}")
        failed += 1
print(f"\n{len(ids) - failed}/{len(ids)} images OK")
raise SystemExit(1 if failed else 0)

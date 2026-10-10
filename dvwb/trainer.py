"""Small static trainer host, kept separate from the DVWB service."""
import html
import os
import re
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse

ROOT = Path(__file__).resolve().parent.parent
DVWB_PUBLIC_URL = os.getenv("DVWB_PUBLIC_URL", "http://127.0.0.1:8002/")
app = FastAPI(title="Forge & Fracture Security Field Manual", docs_url=None, redoc_url=None)


@app.get("/", response_class=HTMLResponse)
def index():
    markup = (ROOT / "index.html").read_text(encoding="utf-8")
    markup = re.sub(
        r'(<meta name="dvwb-url" content=")[^"]*(">)',
        lambda match: f'{match.group(1)}{html.escape(DVWB_PUBLIC_URL, quote=True)}{match.group(2)}',
        markup,
        count=1,
    )
    return HTMLResponse(markup)


@app.get("/style.css")
def stylesheet():
    return FileResponse(ROOT / "style.css", media_type="text/css")


@app.get("/app.js")
def script():
    return FileResponse(ROOT / "app.js", media_type="text/javascript")


@app.get("/forgeLogo.png")
def logo():
    return FileResponse(ROOT / "forgeLogo.png", media_type="image/png")

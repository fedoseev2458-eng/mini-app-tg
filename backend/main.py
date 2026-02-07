from dotenv import load_dotenv
load_dotenv()

import logging
from pathlib import Path
from fastapi import FastAPI, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.staticfiles import StaticFiles
from starlette.responses import FileResponse
from ai.factory import get_ai_provider
from storage import save_project, get_projects

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(title="Room AI")

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


class LogRequestsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        log.info("%s %s", request.method, request.url.path)
        return await call_next(request)


app.add_middleware(LogRequestsMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory=str(DIST / "assets")), name="assets")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/redesign")
@app.post("/api/redesign")
async def redesign(
    request: Request,
    image: UploadFile,
    room_type: str = Form(...),
    style: str = Form(...),
    budget: str = Form("medium"),
    text: str = Form(""),
):
    import traceback
    from fastapi.responses import JSONResponse
    from openai import RateLimitError
    try:
        user_id = request.headers.get("x-telegram-user-id")
        image_bytes = await image.read()
        provider = get_ai_provider()
        image_url = await provider.redesign_room(
            image_bytes, room_type, style, budget, text or ""
        )
        save_project(user_id, {"room_type": room_type, "style": style, "image": image_url})
        return {"image": image_url}
    except RateLimitError as e:
        log.error("OpenAI quota exceeded: %s", e)
        return JSONResponse(
            status_code=402,
            content={"error": "Закончился лимит OpenAI. Пополните баланс на platform.openai.com"},
        )
    except Exception as e:
        log.error("redesign failed: %s\n%s", e, traceback.format_exc())
        raise


@app.post("/redesign-apartment")
@app.post("/api/redesign-apartment")
async def redesign_apartment(
    request: Request,
    plan: UploadFile,
    preferences: str = Form(...),
):
    from fastapi.responses import JSONResponse
    from openai import RateLimitError
    try:
        user_id = request.headers.get("x-telegram-user-id")
        plan_bytes = await plan.read()
        provider = get_ai_provider()
        image_urls = await provider.redesign_apartment(plan_bytes, preferences)
        save_project(user_id, {"type": "apartment", "images": image_urls})
        return {"images": image_urls}
    except RateLimitError:
        return JSONResponse(
            status_code=402,
            content={"error": "Закончился лимит OpenAI. Пополните баланс на platform.openai.com"},
        )


@app.get("/projects")
def projects(request: Request):
    user_id = request.headers.get("x-telegram-user-id")
    return get_projects(user_id)


@app.get("/")
def serve_app():
    """Раздаёт Mini App (один ngrok для всего)."""
    return FileResponse(DIST / "index.html")

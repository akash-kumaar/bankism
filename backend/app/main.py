"""FastAPI application entry point for Bankism Blue-Team AI Firewall."""

import logging
import uuid
from pathlib import Path

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.health import router as health_router
from app.api.routes import router as api_router
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("bankism")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Deterministic defensive security firewall for natural-language banking.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def correlation_middleware(request: Request, call_next) -> Response:
    req_id = request.headers.get("X-Request-ID", f"req_{uuid.uuid4().hex[:8]}")
    request.state.req_id = req_id
    response: Response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


@app.exception_handler(Exception)
async def safe_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error on %s: %s", request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal Server Error", "message": "The firewall encountered an unexpected error."},
    )


app.include_router(health_router, prefix="/api")
app.include_router(api_router, prefix="/api")

# ── Static frontend serving ───────────────────────────────────────────────────
_CANDIDATES = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path("/app/frontend/dist"),
]
_DIST = next((p for p in _CANDIDATES if p.exists() and (p / "index.html").exists()), None)

if _DIST:
    logger.info("Serving compiled frontend from %s", _DIST)
    if (_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str) -> FileResponse:
        if any(full_path.startswith(p) for p in ("api/", "docs", "redoc", "openapi")):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        target = _DIST / full_path
        if target.is_file():
            return FileResponse(str(target))
        return FileResponse(str(_DIST / "index.html"))

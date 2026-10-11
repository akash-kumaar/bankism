"""Health endpoint."""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import settings
from app.schemas.responses import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="HEALTHY",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        firewall_active=True,
    )

"""Primary API router: inspect, accounts, transactions, metrics."""


from fastapi import APIRouter, HTTPException, Query, status

from app.banking.accounts import list_accounts
from app.banking.transactions import get_transaction_history
from app.schemas.requests import InspectRequest, TransferRequest
from app.schemas.responses import (
    AccountResponse,
    InspectResponse,
    MetricsResponse,
    TransactionRecord,
)
from app.services.inspector import inspect_request, process_transfer
from app.services.metrics import get_metrics

router = APIRouter(tags=["Firewall & Banking"])


@router.post("/inspect", response_model=InspectResponse)
async def inspect(req: InspectRequest) -> InspectResponse:
    """Run untrusted natural-language request through the full firewall pipeline (read-only)."""
    try:
        return inspect_request(req)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Firewall pipeline error.") from exc


@router.get("/accounts", response_model=list[AccountResponse])
async def accounts() -> list[AccountResponse]:
    """Return simulated account data."""
    return [AccountResponse(**a.model_dump()) for a in list_accounts()]


@router.get("/transactions", response_model=list[TransactionRecord])
async def transactions(limit: int = Query(default=50, ge=1, le=100)) -> list[TransactionRecord]:
    """Return bounded recent transaction history."""
    return [TransactionRecord(**t.model_dump()) for t in get_transaction_history(limit)]


@router.post("/transactions/transfer", response_model=InspectResponse)
async def transfer(req: TransferRequest) -> InspectResponse:
    """Execute transfer through firewall; commits only if all security checks pass."""
    try:
        return process_transfer(req)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Transfer processing error.") from exc


@router.get("/metrics", response_model=MetricsResponse)
async def metrics() -> MetricsResponse:
    """Return session-level security telemetry metrics."""
    return get_metrics()

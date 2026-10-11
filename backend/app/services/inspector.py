"""High-level inspection and transfer service — thin orchestration layer."""

from decimal import Decimal

from app.schemas.requests import InspectRequest, TransferRequest
from app.schemas.responses import InspectResponse
from app.security.pipeline import run_pipeline
from app.services.metrics import record_event


def inspect_request(req: InspectRequest) -> InspectResponse:
    """Evaluate request in read-only inspection mode (no state changes)."""
    resp = run_pipeline(raw_text=req.request_text, account_id=req.account_id, execute_on_approval=False)
    _record(resp, req.request_text)
    return resp


def process_transfer(req: TransferRequest) -> InspectResponse:
    """Evaluate and (if approved) atomically execute a transfer."""
    raw = req.request_text
    if not raw:
        memo_part = f" for {req.memo}" if req.memo else ""
        raw = f"Transfer ${req.amount:,.2f} to {req.recipient}{memo_part}"

    resp = run_pipeline(
        raw_text=raw,
        account_id=req.source_account_id,
        execute_on_approval=True,
        override_recipient=req.recipient,
        override_amount=req.amount,
        override_memo=req.memo,
    )
    amt = (req.amount or Decimal("0")) if resp.action_executed else Decimal("0")
    _record(resp, raw, amount=amt)
    return resp


def _record(resp: InspectResponse, prompt: str, amount: Decimal = Decimal("0")) -> None:
    record_event(
        request_id=resp.request_id,
        verdict=resp.verdict.value,
        threat_category=resp.threat_category.value,
        risk_score=resp.risk_score,
        prompt_preview=prompt,
        action_executed=resp.action_executed,
        amount=amount,
        timestamp=resp.timestamp,
    )

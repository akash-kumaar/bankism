"""End-to-end request security pipeline orchestrator."""

import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from app.banking.accounts import resolve_recipient
from app.banking.transactions import execute_transfer
from app.config import settings
from app.schemas.responses import InspectResponse, PipelineStage, RiskLevel, ThreatCategory, Verdict
from app.security.detector import detect_threats
from app.security.intent_parser import parse_intent
from app.security.normalization import normalize_input
from app.security.policy_engine import enforce_policy


def _stage(name: str, status: str, ms: float, details: str) -> PipelineStage:
    return PipelineStage(stage_name=name, status=status, execution_time_ms=round(ms, 2), details=details)


def _blocked_early(request_id: str, rationale: str, stages: list, score: int = 90) -> InspectResponse:
    return InspectResponse(
        request_id=request_id,
        verdict=Verdict.BLOCKED,
        risk_score=score,
        risk_level=RiskLevel.HIGH,
        threat_category=ThreatCategory.POLICY_VIOLATION,
        rationale=rationale,
        findings=[],
        pipeline=stages,
        normalized_text="",
        action_executed=False,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


def run_pipeline(
    raw_text: str,
    account_id: str | None = None,
    execute_on_approval: bool = False,
    override_recipient: str | None = None,
    override_amount: Decimal | None = None,
    override_memo: str | None = None,
) -> InspectResponse:
    """Execute the 6-stage firewall pipeline and return a complete structured verdict."""
    req_id = f"req_{uuid.uuid4().hex[:12]}"
    stages: list[PipelineStage] = []

    # ── Stage 1: Input validation ──────────────────────────────────────────
    t = time.perf_counter()
    if not raw_text or not raw_text.strip():
        stages.append(_stage("1. Input Validation", "FAILED", 0.0, "Empty request payload."))
        return _blocked_early(req_id, "Empty input rejected.", stages, 90)
    if len(raw_text) > settings.MAX_REQUEST_LENGTH:
        ms = (time.perf_counter() - t) * 1000
        stages.append(_stage("1. Input Validation", "FAILED", ms, f"Length {len(raw_text)} > {settings.MAX_REQUEST_LENGTH}."))
        return _blocked_early(req_id, f"Input length {len(raw_text)} exceeds maximum {settings.MAX_REQUEST_LENGTH}.", stages, 95)
    ms = (time.perf_counter() - t) * 1000
    stages.append(_stage("1. Input Validation", "PASSED", ms, f"{len(raw_text)} chars within bounds."))

    # ── Stage 2: Unicode normalization ────────────────────────────────────
    t = time.perf_counter()
    norm = normalize_input(raw_text)
    ms = (time.perf_counter() - t) * 1000
    norm_status = "FLAGGED" if norm.has_obfuscation else "PASSED"
    stages.append(_stage(
        "2. Unicode Normalization", norm_status, ms,
        f"NFKC applied. Stripped {norm.stripped_invisible} invisible, {norm.stripped_bidi} BIDI chars. "
        f"Signals: {norm.signals or 'none'}.",
    ))

    # ── Stage 3: Threat detection ─────────────────────────────────────────
    t = time.perf_counter()
    detection = detect_threats(raw_text, norm)
    ms = (time.perf_counter() - t) * 1000
    det_status = "BLOCKED" if detection.has_hard_block else ("FLAGGED" if detection.findings else "PASSED")
    stages.append(_stage(
        "3. Threat Detection", det_status, ms,
        f"{len(detection.findings)} finding(s), risk score {detection.risk_score}.",
    ))

    # ── Stage 4: Intent parsing ───────────────────────────────────────────
    t = time.perf_counter()
    intent = parse_intent(norm.normalized_text, default_account=account_id)
    # Structured overrides for TransferRequest path
    if override_recipient:
        intent.recipient = override_recipient
    if override_amount is not None:
        intent.amount = override_amount
        intent.is_ambiguous = intent.recipient is None
    if override_memo is not None:
        intent.memo = override_memo
    ms = (time.perf_counter() - t) * 1000
    intent_status = "PASSED" if (not intent.is_ambiguous and intent.intent_type != "UNKNOWN") else "FLAGGED"
    stages.append(_stage(
        "4. Intent Parsing", intent_status, ms,
        f"Type={intent.intent_type}, Recipient={intent.recipient or '—'}, Amount={intent.amount or '—'}.",
    ))

    # ── Stage 5: Policy enforcement ───────────────────────────────────────
    t = time.perf_counter()
    policy = enforce_policy(raw_text, norm, detection, intent, explicit_account_id=account_id)
    ms = (time.perf_counter() - t) * 1000
    pol_status = {"APPROVED": "PASSED", "BLOCKED": "BLOCKED", "NEEDS_CLARIFICATION": "FLAGGED"}[policy.verdict.value]
    stages.append(_stage("5. Policy Enforcement", pol_status, ms, f"Verdict={policy.verdict.value}. {policy.rationale}"))

    effective_account = account_id or intent.source_account_id or "acc_chk_101"

    # ── Stage 6: Mock banking execution (guarded state mutation) ──────────
    t = time.perf_counter()
    action_executed = False
    txn_id: str | None = None

    if execute_on_approval and policy.can_execute and intent.intent_type == "TRANSFER":
        try:
            canonical = resolve_recipient(intent.recipient or "") or intent.recipient or ""
            txn = execute_transfer(
                source_account_id=effective_account,
                recipient=canonical,
                amount=intent.amount,  # type: ignore[arg-type]
                request_id=req_id,
                memo=intent.memo,
            )
            action_executed = True
            txn_id = txn.id
            ms = (time.perf_counter() - t) * 1000
            stages.append(_stage("6. Ledger Execution", "PASSED", ms, f"Txn {txn.id} committed. ${intent.amount:,.2f} → {canonical}."))
        except Exception as exc:
            ms = (time.perf_counter() - t) * 1000
            stages.append(_stage("6. Ledger Execution", "FAILED", ms, f"Ledger error: {exc}"))
            return InspectResponse(
                request_id=req_id,
                verdict=Verdict.BLOCKED,
                risk_score=policy.risk_score,
                risk_level=policy.risk_level,
                threat_category=policy.threat_category,
                rationale=f"Transfer aborted: {exc}",
                findings=policy.findings,
                pipeline=stages,
                normalized_text=norm.normalized_text,
                parsed_intent=intent,
                action_executed=False,
                account_id=effective_account,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
    else:
        ms = (time.perf_counter() - t) * 1000
        reason = "Inspection-only mode." if not execute_on_approval else "Policy did not authorize execution."
        stages.append(_stage("6. Ledger Execution", "SKIPPED", ms, reason))

    return InspectResponse(
        request_id=req_id,
        verdict=policy.verdict,
        risk_score=policy.risk_score,
        risk_level=policy.risk_level,
        threat_category=policy.threat_category,
        rationale=policy.rationale,
        findings=policy.findings,
        pipeline=stages,
        normalized_text=norm.normalized_text,
        parsed_intent=intent,
        action_executed=action_executed,
        transaction_id=txn_id,
        account_id=effective_account,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

"""Deterministic policy enforcement engine.

Security invariants enforced here (tested explicitly):
  1. Untrusted NL content never directly authorizes a transaction.
  2. Hard-block cannot be overridden by a low risk score.
  3. Unknown recipient → BLOCKED.
  4. Invalid/zero/negative amounts → BLOCKED.
  5. Ambiguous intent → NEEDS_CLARIFICATION.
  6. Blocked transfer cannot mutate balances.
  7. Policy engine is authoritative; no LLM output overrides it.
"""

from dataclasses import dataclass
from decimal import Decimal

from app.banking.accounts import get_account, resolve_recipient
from app.config import settings
from app.schemas.responses import Finding, ParsedIntent, RiskLevel, ThreatCategory, Verdict
from app.security.detector import DetectionResult
from app.security.normalization import NormalizationResult


@dataclass
class PolicyOutcome:
    verdict: Verdict
    threat_category: ThreatCategory
    risk_score: int
    risk_level: RiskLevel
    rationale: str
    can_execute: bool
    findings: list[Finding]


def enforce_policy(
    raw: str,
    norm: NormalizationResult,
    detection: DetectionResult,
    intent: ParsedIntent,
    explicit_account_id: str | None = None,
) -> PolicyOutcome:
    """Apply all deterministic policy rules and return a final verdict.

    Precedence order (highest → lowest):
      1. Hard-block from threat detector (e.g. injection/jailbreak).
      2. Risk score above block threshold.
      3. Unknown or unsupported intent → NEEDS_CLARIFICATION.
      4. Ambiguous intent → NEEDS_CLARIFICATION.
      5. Account validation.
      6. Balance inquiry approval (read-only, no state change).
      7. Transfer-specific validation (recipient → amount → funds → risk gate).
      8. Default-deny for unrecognized states.
    """
    findings = list(detection.findings)

    # ── INVARIANT 2: Hard-block cannot be overridden ───────────────────────
    if detection.has_hard_block or detection.risk_score >= settings.RISK_BLOCK_THRESHOLD:
        return PolicyOutcome(
            verdict=Verdict.BLOCKED,
            threat_category=detection.primary_category,
            risk_score=max(detection.risk_score, 85),
            risk_level=RiskLevel.CRITICAL if detection.has_hard_block else RiskLevel.HIGH,
            rationale=detection.rationale,
            can_execute=False,
            findings=findings,
        )

    # ── Unknown intent ─────────────────────────────────────────────────────
    if intent.intent_type == "UNKNOWN":
        return PolicyOutcome(
            verdict=Verdict.NEEDS_CLARIFICATION,
            threat_category=ThreatCategory.AMBIGUOUS_INTENT,
            risk_score=max(detection.risk_score, 40),
            risk_level=RiskLevel.MEDIUM,
            rationale="Request does not match a supported banking operation (balance inquiry or transfer).",
            can_execute=False,
            findings=findings,
        )

    # ── Ambiguous intent ───────────────────────────────────────────────────
    if intent.is_ambiguous:
        return PolicyOutcome(
            verdict=Verdict.NEEDS_CLARIFICATION,
            threat_category=ThreatCategory.AMBIGUOUS_INTENT,
            risk_score=max(detection.risk_score, 45),
            risk_level=RiskLevel.MEDIUM,
            rationale="Instruction is ambiguous or missing required parameters (recipient or amount).",
            can_execute=False,
            findings=findings,
        )

    # ── Account validation ─────────────────────────────────────────────────
    account_id = explicit_account_id or intent.source_account_id or "acc_chk_101"
    account = get_account(account_id)
    if not account:
        findings.append(
            Finding(
                category=ThreatCategory.POLICY_VIOLATION,
                severity=RiskLevel.HIGH,
                signal="INVALID_ACCOUNT",
                description=f"Account '{account_id}' does not exist.",
            )
        )
        return PolicyOutcome(
            verdict=Verdict.BLOCKED,
            threat_category=ThreatCategory.POLICY_VIOLATION,
            risk_score=75,
            risk_level=RiskLevel.HIGH,
            rationale=f"Source account '{account_id}' does not exist.",
            can_execute=False,
            findings=findings,
        )

    # ── Balance inquiry ────────────────────────────────────────────────────
    if intent.intent_type == "BALANCE_INQUIRY":
        return PolicyOutcome(
            verdict=Verdict.APPROVED,
            threat_category=ThreatCategory.NONE,
            risk_score=min(detection.risk_score, 10),
            risk_level=RiskLevel.LOW,
            rationale=f"Read-only balance inquiry for {account.name} approved.",
            can_execute=False,  # no state change
            findings=findings,
        )

    # ── Transfer validation ────────────────────────────────────────────────
    if intent.intent_type == "TRANSFER":
        # INVARIANT 3: Unknown recipient
        canonical = resolve_recipient(intent.recipient or "")
        if not canonical:
            findings.append(
                Finding(
                    category=ThreatCategory.POLICY_VIOLATION,
                    severity=RiskLevel.HIGH,
                    signal="UNAUTHORIZED_RECIPIENT",
                    description=f"Recipient '{intent.recipient}' not on verified allowlist.",
                )
            )
            return PolicyOutcome(
                verdict=Verdict.BLOCKED,
                threat_category=ThreatCategory.POLICY_VIOLATION,
                risk_score=80,
                risk_level=RiskLevel.HIGH,
                rationale=f"Recipient '{intent.recipient}' is not on the approved recipient list.",
                can_execute=False,
                findings=findings,
            )

        # INVARIANT 4: Invalid amount
        amt = intent.amount
        if amt is None or amt <= Decimal("0"):
            findings.append(
                Finding(
                    category=ThreatCategory.POLICY_VIOLATION,
                    severity=RiskLevel.HIGH,
                    signal="INVALID_AMOUNT",
                    description="Transfer amount must be a positive, finite, non-zero value.",
                )
            )
            return PolicyOutcome(
                verdict=Verdict.BLOCKED,
                threat_category=ThreatCategory.POLICY_VIOLATION,
                risk_score=75,
                risk_level=RiskLevel.HIGH,
                rationale="Transfer amount must be strictly greater than $0.00.",
                can_execute=False,
                findings=findings,
            )

        if amt > settings.MAX_TRANSFER_AMOUNT:
            findings.append(
                Finding(
                    category=ThreatCategory.POLICY_VIOLATION,
                    severity=RiskLevel.HIGH,
                    signal="AMOUNT_EXCEEDS_CAP",
                    description=f"${amt:,.2f} exceeds single-transaction limit ${settings.MAX_TRANSFER_AMOUNT:,.2f}.",
                )
            )
            return PolicyOutcome(
                verdict=Verdict.BLOCKED,
                threat_category=ThreatCategory.POLICY_VIOLATION,
                risk_score=85,
                risk_level=RiskLevel.HIGH,
                rationale=f"Amount ${amt:,.2f} exceeds per-transaction ceiling of ${settings.MAX_TRANSFER_AMOUNT:,.2f}.",
                can_execute=False,
                findings=findings,
            )

        # INVARIANT 6: Insufficient funds
        if account.balance < amt:
            findings.append(
                Finding(
                    category=ThreatCategory.POLICY_VIOLATION,
                    severity=RiskLevel.HIGH,
                    signal="INSUFFICIENT_FUNDS",
                    description=f"Balance ${account.balance:,.2f} < requested ${amt:,.2f}.",
                )
            )
            return PolicyOutcome(
                verdict=Verdict.BLOCKED,
                threat_category=ThreatCategory.POLICY_VIOLATION,
                risk_score=75,
                risk_level=RiskLevel.HIGH,
                rationale=f"Insufficient funds: available ${account.balance:,.2f}, requested ${amt:,.2f}.",
                can_execute=False,
                findings=findings,
            )

        # Elevated-risk gate
        if detection.risk_score >= settings.RISK_CLARIFY_THRESHOLD:
            return PolicyOutcome(
                verdict=Verdict.NEEDS_CLARIFICATION,
                threat_category=detection.primary_category,
                risk_score=detection.risk_score,
                risk_level=RiskLevel.MEDIUM,
                rationale="Elevated risk indicators require additional confirmation before transfer.",
                can_execute=False,
                findings=findings,
            )

        # All checks passed ✓
        return PolicyOutcome(
            verdict=Verdict.APPROVED,
            threat_category=ThreatCategory.NONE,
            risk_score=detection.risk_score,
            risk_level=RiskLevel.LOW,
            rationale=f"Transfer of ${amt:,.2f} to {canonical} approved under all security policies.",
            can_execute=True,
            findings=findings,
        )

    # ── Default deny (fail-closed) ─────────────────────────────────────────
    return PolicyOutcome(
        verdict=Verdict.BLOCKED,
        threat_category=ThreatCategory.POLICY_VIOLATION,
        risk_score=90,
        risk_level=RiskLevel.CRITICAL,
        rationale="Request failed default-deny safety invariant.",
        can_execute=False,
        findings=findings,
    )

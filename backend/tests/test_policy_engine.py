"""Tests for deterministic policy engine — security invariants verified explicitly."""

from decimal import Decimal

from app.banking.accounts import reset_accounts_for_testing
from app.schemas.responses import ParsedIntent, ThreatCategory, Verdict
from app.security.detector import DetectionResult
from app.security.normalization import normalize_input
from app.security.policy_engine import enforce_policy


def _clean_detection():
    """Return a zero-threat detection result."""
    from app.schemas.responses import RiskLevel, ThreatCategory
    return DetectionResult(findings=[], risk_score=0, risk_level=RiskLevel.LOW,
                           primary_category=ThreatCategory.NONE,
                           rationale="clean", has_hard_block=False)


def _norm(text="Transfer $100 to Alice Walker"):
    return normalize_input(text)


def setup_function():
    reset_accounts_for_testing()


# ── Approved paths ─────────────────────────────────────────────────────────────

def test_valid_transfer_approved():
    intent = ParsedIntent(intent_type="TRANSFER", recipient="Alice Walker",
                          amount=Decimal("100.00"), source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.APPROVED
    assert o.can_execute


def test_balance_inquiry_approved():
    intent = ParsedIntent(intent_type="BALANCE_INQUIRY", source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.APPROVED
    assert not o.can_execute  # read-only


# ── Blocked paths ──────────────────────────────────────────────────────────────

def test_unknown_recipient_blocked():
    intent = ParsedIntent(intent_type="TRANSFER", recipient="Eve Mallory",
                          amount=Decimal("100.00"), source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.BLOCKED
    assert not o.can_execute
    assert o.threat_category == ThreatCategory.POLICY_VIOLATION


def test_zero_amount_blocked():
    intent = ParsedIntent(intent_type="TRANSFER", recipient="Alice Walker",
                          amount=Decimal("0.00"), source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.BLOCKED


def test_negative_amount_blocked():
    intent = ParsedIntent(intent_type="TRANSFER", recipient="Alice Walker",
                          amount=Decimal("-50.00"), source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.BLOCKED


def test_none_amount_blocked():
    intent = ParsedIntent(intent_type="TRANSFER", recipient="Alice Walker",
                          amount=None, source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.BLOCKED


def test_amount_exceeds_cap_blocked():
    intent = ParsedIntent(intent_type="TRANSFER", recipient="Alice Walker",
                          amount=Decimal("9999.00"), source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.BLOCKED


def test_insufficient_funds_blocked():
    intent = ParsedIntent(intent_type="TRANSFER", recipient="Alice Walker",
                          amount=Decimal("99999.00"), source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.BLOCKED


def test_invalid_account_blocked():
    intent = ParsedIntent(intent_type="TRANSFER", recipient="Alice Walker",
                          amount=Decimal("100.00"), source_account_id="acc_nonexistent")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.BLOCKED


# ── Invariant 2: hard-block cannot be overridden by low risk score ─────────────

def test_hard_block_overrides_low_risk_score():
    from app.schemas.responses import RiskLevel
    det = DetectionResult(findings=[], risk_score=5, risk_level=RiskLevel.LOW,
                          primary_category=ThreatCategory.PROMPT_INJECTION,
                          rationale="injection", has_hard_block=True)
    intent = ParsedIntent(intent_type="BALANCE_INQUIRY", source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), det, intent)
    assert o.verdict == Verdict.BLOCKED
    assert not o.can_execute


# ── Clarification paths ────────────────────────────────────────────────────────

def test_ambiguous_intent_needs_clarification():
    intent = ParsedIntent(intent_type="TRANSFER", recipient="Alice Walker",
                          amount=None, is_ambiguous=True, source_account_id="acc_chk_101")
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.NEEDS_CLARIFICATION
    assert not o.can_execute


def test_unknown_intent_needs_clarification():
    intent = ParsedIntent(intent_type="UNKNOWN", is_ambiguous=True)
    o = enforce_policy("", _norm(), _clean_detection(), intent)
    assert o.verdict == Verdict.NEEDS_CLARIFICATION

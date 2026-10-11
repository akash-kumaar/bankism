"""Pydantic response schemas and enumerations for Bankism API."""

from decimal import Decimal
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Verdict(str, Enum):
    APPROVED = "APPROVED"
    BLOCKED = "BLOCKED"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ThreatCategory(str, Enum):
    NONE = "NONE"
    PROMPT_INJECTION = "PROMPT_INJECTION"
    SYSTEM_OVERRIDE = "SYSTEM_OVERRIDE"
    JAILBREAK_ROLEPLAY = "JAILBREAK_ROLEPLAY"
    AUTHORIZATION_BYPASS = "AUTHORIZATION_BYPASS"
    MALICIOUS_MEMO = "MALICIOUS_MEMO"
    UNICODE_OBFUSCATION = "UNICODE_OBFUSCATION"
    REPEATED_ATTACK = "REPEATED_ATTACK"
    AMBIGUOUS_INTENT = "AMBIGUOUS_INTENT"
    POLICY_VIOLATION = "POLICY_VIOLATION"


class Finding(BaseModel):
    category: ThreatCategory
    severity: RiskLevel
    signal: str
    description: str


class PipelineStage(BaseModel):
    stage_name: str
    status: str  # PASSED | BLOCKED | FLAGGED | SKIPPED | FAILED
    execution_time_ms: float
    details: str


class ParsedIntent(BaseModel):
    intent_type: str  # BALANCE_INQUIRY | TRANSFER | UNKNOWN
    recipient: str | None = None
    amount: Decimal | None = None
    currency: str = "USD"
    memo: str | None = None
    source_account_id: str | None = None
    is_ambiguous: bool = False


class InspectResponse(BaseModel):
    request_id: str
    verdict: Verdict
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    threat_category: ThreatCategory
    rationale: str
    findings: list[Finding]
    pipeline: list[PipelineStage]
    normalized_text: str
    parsed_intent: ParsedIntent | None = None
    action_executed: bool = False
    transaction_id: str | None = None
    account_id: str | None = None
    timestamp: str


class AccountResponse(BaseModel):
    id: str
    name: str
    type: str
    balance: Decimal
    currency: str = "USD"
    status: str = "ACTIVE"


class TransactionRecord(BaseModel):
    id: str
    source_account_id: str
    recipient: str
    amount: Decimal
    currency: str = "USD"
    timestamp: str
    status: str
    memo: str | None = None
    firewall_verdict: Verdict
    request_id: str


class MetricsResponse(BaseModel):
    total_requests: int
    threats_blocked: int
    requests_approved: int
    needs_clarification: int
    transfers_executed: int
    total_volume_transferred: Decimal
    verdict_breakdown: dict[str, int]
    threat_category_breakdown: dict[str, int]
    risk_score_distribution: dict[str, int]
    recent_activity: list[dict[str, Any]]
    is_seeded: bool = True
    environment: str = "demo"


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    timestamp: str
    firewall_active: bool = True

"""Multi-signal threat detector.

Runs both raw and normalized text through a catalogue of deterministic
pattern-matching rules. Yields structured Finding objects and a calibrated
risk score. Hard-block conditions cannot be overridden by a low score.
"""

import re
from dataclasses import dataclass, field

from app.schemas.responses import Finding, RiskLevel, ThreatCategory
from app.security.normalization import NormalizationResult

# ── Rule catalogue ────────────────────────────────────────────────────────────
# Each rule: (pattern, category, severity, signal, description, hard_block)
_RULES: list[tuple[re.Pattern, ThreatCategory, RiskLevel, str, str, bool]] = [
    # 1. Direct prompt injection — instruction override
    (
        re.compile(
            r"\b(ignore|disregard|forget|bypass|override)\b.{0,60}"
            r"\b(all|any|previous|prior|system|above)\b.{0,60}"
            r"\b(instructions?|rules?|prompts?|constraints?|directives?)\b",
            re.I | re.S,
        ),
        ThreatCategory.PROMPT_INJECTION,
        RiskLevel.CRITICAL,
        "INSTRUCTION_OVERRIDE",
        "Explicit attempt to override prior system instructions.",
        True,
    ),
    # 2. Fake system delimiters
    (
        re.compile(
            r"\b(new\s+instructions?|system\s+directive|special\s+command"
            r"|priority\s+override)\s*:",
            re.I,
        ),
        ThreatCategory.PROMPT_INJECTION,
        RiskLevel.CRITICAL,
        "FAKE_SYSTEM_DELIMITER",
        "Injection of fake high-priority system command delimiters.",
        True,
    ),
    # 3. Privilege escalation via persona switch
    (
        re.compile(
            r"\b(you\s+are\s+now|start\s+acting\s+as|switch\s+to|enter)\s+"
            r"(developer\s+mode|unrestricted|god\s+mode|debug\s+mode|superuser)",
            re.I,
        ),
        ThreatCategory.PROMPT_INJECTION,
        RiskLevel.CRITICAL,
        "PERSONA_PRIVILEGE_ESCALATION",
        "Attempt to switch system into unrestricted/developer persona.",
        True,
    ),
    # 4. System prompt extraction
    (
        re.compile(
            r"\b(print|reveal|show|display|leak|output|echo|repeat)\b.{0,40}"
            r"\b(system\s+prompt|hidden\s+instructions?|internal\s+rules?|developer\s+prompt)\b",
            re.I | re.S,
        ),
        ThreatCategory.SYSTEM_OVERRIDE,
        RiskLevel.HIGH,
        "SYSTEM_PROMPT_EXTRACTION",
        "Attempt to extract internal system prompt or configuration.",
        True,
    ),
    # 5. Security mechanism disablement
    (
        re.compile(
            r"\b(disable|turn\s+off|deactivate|shutdown)\b.{0,40}"
            r"\b(firewall|security|guardrails?|checks?|filters?|restrictions?)\b",
            re.I | re.S,
        ),
        ThreatCategory.SYSTEM_OVERRIDE,
        RiskLevel.CRITICAL,
        "SECURITY_DISARM",
        "Instruction attempting to disable firewall or security filters.",
        True,
    ),
    # 6. Known jailbreak keywords
    (
        re.compile(r"\b(DAN|jailbreak|AIM|do\s+anything\s+now)\b", re.I),
        ThreatCategory.JAILBREAK_ROLEPLAY,
        RiskLevel.CRITICAL,
        "KNOWN_JAILBREAK_KEYWORD",
        "Signature matching known jailbreak exploit identifiers (DAN, AIM).",
        True,
    ),
    # 7. Fictional framing for rule evasion
    (
        re.compile(
            r"\b(pretend|imagine|roleplay|hypothetical|story)\b.{0,60}"
            r"\b(no\s+rules|unlimited|no\s+authorization|illegal|bypass)\b",
            re.I | re.S,
        ),
        ThreatCategory.JAILBREAK_ROLEPLAY,
        RiskLevel.HIGH,
        "FICTIONAL_RULE_EVASION",
        "Fictional framing designed to evade banking safety constraints.",
        True,
    ),
    # 8. 2FA / auth bypass instruction
    (
        re.compile(
            r"\b(skip|bypass|waive|override|without)\b.{0,40}"
            r"\b(2fa|otp|verification|authorization|approval|kyc|balance\s+check)\b",
            re.I | re.S,
        ),
        ThreatCategory.AUTHORIZATION_BYPASS,
        RiskLevel.CRITICAL,
        "AUTH_BYPASS_INSTRUCTION",
        "Attempt to skip mandatory authorization or verification step.",
        True,
    ),
    # 9. Social engineering impersonation
    (
        re.compile(
            r"\b(i\s+am|speaking\s+as)\s+(the\s+)?"
            r"(bank\s+manager|ceo|compliance\s+officer|admin|root|auditor)\b",
            re.I,
        ),
        ThreatCategory.AUTHORIZATION_BYPASS,
        RiskLevel.HIGH,
        "SOCIAL_ENGINEERING_IMPERSONATION",
        "Claim of executive/admin authorization via social engineering.",
        False,
    ),
    # 10. Urgency inducement
    (
        re.compile(
            r"\b(force|emergency|immediate)\s+(transfer|approval|override)\b.{0,30}"
            r"\b(now|without\s+delay|instantly)\b",
            re.I | re.S,
        ),
        ThreatCategory.AUTHORIZATION_BYPASS,
        RiskLevel.MEDIUM,
        "URGENCY_INDUCEMENT",
        "High-urgency pressure to bypass normal verification workflow.",
        False,
    ),
    # 11. Memo instruction injection
    (
        re.compile(
            r"(memo|note|for)\s*:.{0,80}"
            r"\b(actually|instead|ignore|redirect|transfer|send)\b.{0,40}"
            r"\b(to|\$|dollars?)\b",
            re.I | re.S,
        ),
        ThreatCategory.MALICIOUS_MEMO,
        RiskLevel.HIGH,
        "MEMO_INSTRUCTION_HIJACK",
        "Transaction memo contains instructions attempting to hijack the transfer.",
        True,
    ),
    # 12. SQL injection in memo
    (
        re.compile(
            r"(memo|note)\s*:.{0,80}['\"`]\s*(or|and)\s*['\"`]?1['\"`]?\s*=\s*['\"`]?1",
            re.I | re.S,
        ),
        ThreatCategory.MALICIOUS_MEMO,
        RiskLevel.CRITICAL,
        "MEMO_SQL_INJECTION",
        "SQL injection pattern detected in transaction memo.",
        True,
    ),
    # 13. XSS / code injection in memo
    (
        re.compile(
            r"(memo|note)\s*:.{0,80}(<script|javascript:|onerror\s*=)",
            re.I | re.S,
        ),
        ThreatCategory.MALICIOUS_MEMO,
        RiskLevel.CRITICAL,
        "MEMO_CODE_INJECTION",
        "Cross-site scripting or code execution pattern in memo field.",
        True,
    ),
    # 14. Code evaluation constructs
    (
        re.compile(r"(\bexec\b|\beval\b|\bimport\s+os\b|`.*?`|\$\{.*?\})", re.I | re.S),
        ThreatCategory.POLICY_VIOLATION,
        RiskLevel.CRITICAL,
        "CODE_EVAL_ATTEMPT",
        "Code syntax or command evaluation construct in untrusted text.",
        True,
    ),
]

_SEVERITY_WEIGHT = {
    RiskLevel.CRITICAL: 55,
    RiskLevel.HIGH: 35,
    RiskLevel.MEDIUM: 20,
    RiskLevel.LOW: 10,
}


@dataclass
class DetectionResult:
    findings: list[Finding] = field(default_factory=list)
    risk_score: int = 0
    risk_level: RiskLevel = RiskLevel.LOW
    primary_category: ThreatCategory = ThreatCategory.NONE
    rationale: str = "No adversarial signals detected."
    has_hard_block: bool = False


def detect_threats(raw: str, norm: NormalizationResult) -> DetectionResult:
    """Evaluate text against the full rule catalogue and obfuscation signals."""
    findings: list[Finding] = []
    hard_block = False
    raw_score = 0
    seen_signals: set[str] = set()

    # ── 1. Obfuscation signals from normalization ──────────────────────────
    for sig in norm.signals:
        if "ZERO_WIDTH" in sig or "BIDI" in sig:
            findings.append(
                Finding(
                    category=ThreatCategory.UNICODE_OBFUSCATION,
                    severity=RiskLevel.HIGH,
                    signal=sig,
                    description="Zero-width or BIDI override characters detected — common obfuscation vector.",
                )
            )
            raw_score += 35
            hard_block = True
            seen_signals.add(sig)
        elif "HOMOGLYPHS" in sig:
            findings.append(
                Finding(
                    category=ThreatCategory.UNICODE_OBFUSCATION,
                    severity=RiskLevel.MEDIUM,
                    signal=sig,
                    description="Mixed-script homoglyphs substituted to evade keyword detection.",
                )
            )
            raw_score += 25
            seen_signals.add(sig)
        elif sig not in seen_signals:
            findings.append(
                Finding(
                    category=ThreatCategory.UNICODE_OBFUSCATION,
                    severity=RiskLevel.LOW,
                    signal=sig,
                    description="Suspicious encoding or escape sequence detected.",
                )
            )
            raw_score += 10
            seen_signals.add(sig)

    # ── 2. Token repetition / flooding ────────────────────────────────────
    words = re.findall(r"\w+", norm.normalized_text.lower())
    if len(words) > 10:
        ratio = len(words) / max(1, len(set(words)))
        if ratio > 4.0:
            findings.append(
                Finding(
                    category=ThreatCategory.REPEATED_ATTACK,
                    severity=RiskLevel.MEDIUM,
                    signal="TOKEN_REPETITION",
                    description="High token repetition ratio — possible flooding or confusion attack.",
                )
            )
            raw_score += 25

    # ── 3. Rule catalogue — check raw AND normalized ───────────────────────
    for text in (norm.normalized_text, raw):
        for pattern, cat, sev, signal, desc, hb in _RULES:
            if signal in seen_signals:
                continue
            if pattern.search(text):
                findings.append(
                    Finding(category=cat, severity=sev, signal=signal, description=desc)
                )
                seen_signals.add(signal)
                raw_score += _SEVERITY_WEIGHT.get(sev, 10)
                if hb:
                    hard_block = True

    # ── 4. Synthesise final score and level ───────────────────────────────
    risk_score = min(100, max(0, raw_score))

    if hard_block or risk_score >= 70:
        risk_level = RiskLevel.CRITICAL if hard_block else RiskLevel.HIGH
    elif risk_score >= 40:
        risk_level = RiskLevel.MEDIUM
    else:
        risk_level = RiskLevel.LOW

    _sev_order = {RiskLevel.CRITICAL: 4, RiskLevel.HIGH: 3, RiskLevel.MEDIUM: 2, RiskLevel.LOW: 1}
    primary = ThreatCategory.NONE
    rationale = "No adversarial signals detected."
    if findings:
        top = max(findings, key=lambda f: _sev_order.get(f.severity, 0))
        primary = top.category
        rationale = f"Detected {len(findings)} signal(s). Highest: {top.description}"

    return DetectionResult(
        findings=findings,
        risk_score=risk_score,
        risk_level=risk_level,
        primary_category=primary,
        rationale=rationale,
        has_hard_block=hard_block,
    )

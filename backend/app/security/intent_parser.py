"""Deterministic intent parser.

Extracts banking intent from normalized text using a strict, explicit grammar.
Does NOT infer missing fields, hallucinate recipients, or expand vague language.
"""

import re
from decimal import Decimal, InvalidOperation

from app.schemas.responses import ParsedIntent

# ── Intent patterns ───────────────────────────────────────────────────────────
_BALANCE_PATTERNS = [
    re.compile(r"\b(check|show|view|get|what\s+is|display|tell\s+me)\b.{0,40}\b(balance|funds|account\s+summary)\b", re.I | re.S),
    re.compile(r"\bhow\s+much\s+(money|funds|do\s+i\s+have)\b", re.I),
    re.compile(r"\bbalance\s+inquiry\b", re.I),
    re.compile(r"\bmy\s+(account\s+)?balance\b", re.I),
]

_TRANSFER_VERB = re.compile(r"\b(transfer|send|wire|pay|move|remit|forward)\b", re.I)

# Amount: $150, 150.00 dollars, 150 USD, $1,500.00
_AMOUNT_RE = re.compile(
    r"\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)"
    r"|([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:dollars?|bucks?|USD)\b",
    re.I,
)

# Recipient: "to <Name>" followed by space or end
_RECIPIENT_RE = re.compile(
    r"\bto\s+([A-Za-z][A-Za-z\s\-\.]{1,50}?)(?=\s+(?:for|from|memo|note|with|using|$)|\s*$|,|\.|$)",
    re.I,
)

_MEMO_RE = re.compile(r"\b(?:memo\s*:|note\s*:|for\s+(?!transfer|dinner|me\b))(.+)$", re.I)


def parse_intent(text: str, default_account: str | None = None) -> ParsedIntent:
    """Parse normalized natural-language text into deterministic structured intent."""
    src_account = default_account or "acc_chk_101"

    # Detect contradictory multiple transfer verbs → ambiguous
    verb_matches = list(_TRANSFER_VERB.finditer(text))

    # ── Balance inquiry ────────────────────────────────────────────────────
    for pat in _BALANCE_PATTERNS:
        if pat.search(text):
            if re.search(r"\bsavings?\b", text, re.I):
                src_account = "acc_sav_202"
            elif re.search(r"\bbusiness\b", text, re.I):
                src_account = "acc_biz_303"
            return ParsedIntent(
                intent_type="BALANCE_INQUIRY",
                source_account_id=src_account,
            )

    # ── Transfer ───────────────────────────────────────────────────────────
    if verb_matches:
        if re.search(r"\bfrom\s+savings?\b", text, re.I):
            src_account = "acc_sav_202"
        elif re.search(r"\bfrom\s+business\b", text, re.I):
            src_account = "acc_biz_303"

        # Multiple amounts → ambiguous
        amounts = []
        for m in _AMOUNT_RE.finditer(text):
            raw_val = m.group(1) or m.group(2)
            if raw_val:
                try:
                    amounts.append(Decimal(raw_val.replace(",", "")))
                except InvalidOperation:
                    pass

        if len(amounts) > 1 or len(verb_matches) > 1:
            return ParsedIntent(
                intent_type="TRANSFER",
                is_ambiguous=True,
                source_account_id=src_account,
            )

        amount = amounts[0] if amounts else None

        # Recipient
        recipient: str | None = None
        rm = _RECIPIENT_RE.search(text)
        if rm:
            candidate = rm.group(1).strip()
            # Strip trailing dollar amounts or conjunctions
            candidate = re.split(r"\s+\$|\s+for\s+|\s+from\s+", candidate, flags=re.I)[0].strip()
            if len(candidate) >= 2:
                recipient = candidate

        # Memo
        memo: str | None = None
        mm = _MEMO_RE.search(text)
        if mm:
            memo = mm.group(1).strip()[:200]

        is_ambiguous = not recipient or amount is None
        return ParsedIntent(
            intent_type="TRANSFER",
            recipient=recipient,
            amount=amount,
            source_account_id=src_account,
            memo=memo,
            currency="USD",
            is_ambiguous=is_ambiguous,
        )

    # ── Unknown ────────────────────────────────────────────────────────────
    return ParsedIntent(
        intent_type="UNKNOWN",
        is_ambiguous=True,
        source_account_id=src_account,
    )

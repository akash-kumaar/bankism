"""Pydantic request schemas for the Bankism API."""

from decimal import Decimal

from pydantic import BaseModel, Field


class InspectRequest(BaseModel):
    """Untrusted natural-language banking request submitted for firewall evaluation."""

    request_text: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Raw natural-language banking prompt from untrusted input.",
        examples=["Transfer $150 to Alice Walker for dinner"],
    )
    account_id: str | None = Field(
        default=None,
        description="Optional source account identifier for context.",
        examples=["acc_chk_101"],
    )


class TransferRequest(BaseModel):
    """Structured transfer request. All fields pass through the full firewall pipeline."""

    request_text: str | None = Field(
        default=None,
        max_length=1000,
        description="Natural-language command (optional). Generated from fields if absent.",
    )
    source_account_id: str = Field(
        default="acc_chk_101",
        description="Source account identifier.",
    )
    recipient: str | None = Field(
        default=None,
        description="Recipient name — must match the verified allowlist.",
    )
    amount: Decimal | None = Field(
        default=None,
        description="Positive finite transfer amount in USD.",
    )
    memo: str | None = Field(
        default=None,
        max_length=200,
        description="Optional transaction memo (cannot override security fields).",
    )

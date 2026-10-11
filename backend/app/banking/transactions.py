"""In-memory mock ledger with thread-safe atomic transfer execution."""

import threading
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from pydantic import BaseModel

from app.banking.accounts import debit_account, reset_accounts_for_testing
from app.schemas.responses import Verdict


class Transaction(BaseModel):
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


_LOCK = threading.Lock()

# Seeded demo transactions (visible in history before any session activity)
_TRANSACTIONS: list[Transaction] = [
    Transaction(
        id="txn_seed_001", source_account_id="acc_chk_101", recipient="Alice Walker",
        amount=Decimal("120.00"), timestamp="2026-10-10T14:22:00Z", status="COMPLETED",
        memo="Dinner split", firewall_verdict=Verdict.APPROVED, request_id="req_seed_001",
    ),
    Transaction(
        id="txn_seed_002", source_account_id="acc_chk_101", recipient="Bob Martinez",
        amount=Decimal("45.50"), timestamp="2026-10-10T16:05:00Z", status="COMPLETED",
        memo="Coffee beans", firewall_verdict=Verdict.APPROVED, request_id="req_seed_002",
    ),
    Transaction(
        id="txn_seed_003", source_account_id="acc_sav_202", recipient="Charlie Chen",
        amount=Decimal("1500.00"), timestamp="2026-10-11T09:10:00Z", status="COMPLETED",
        memo="Contractor payment", firewall_verdict=Verdict.APPROVED, request_id="req_seed_003",
    ),
]


def execute_transfer(
    source_account_id: str,
    recipient: str,
    amount: Decimal,
    request_id: str,
    memo: str | None = None,
) -> Transaction:
    """Atomically debit account and write ledger record.

    NOTE: In-memory only — resets on application restart.
    """
    with _LOCK:
        # debit_account is internally locked but we wrap both ops in outer lock
        # to keep debit + record creation atomic from application perspective.
        debit_account(source_account_id, amount)
        txn = Transaction(
            id=f"txn_{uuid.uuid4().hex[:12]}",
            source_account_id=source_account_id,
            recipient=recipient,
            amount=amount,
            timestamp=datetime.now(timezone.utc).isoformat(),
            status="COMPLETED",
            memo=memo,
            firewall_verdict=Verdict.APPROVED,
            request_id=request_id,
        )
        _TRANSACTIONS.insert(0, txn)
        return txn.model_copy()


def get_transaction_history(limit: int = 50) -> list[Transaction]:
    with _LOCK:
        return [t.model_copy() for t in _TRANSACTIONS[:limit]]


def reset_ledger_for_testing() -> None:
    """Reset ledger and accounts for test isolation."""
    global _TRANSACTIONS
    with _LOCK:
        reset_accounts_for_testing()
        _TRANSACTIONS = []

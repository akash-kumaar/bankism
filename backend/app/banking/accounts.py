"""Simulated account store with thread-safe Decimal balances."""

import threading
from decimal import Decimal

from pydantic import BaseModel


class Account(BaseModel):
    id: str
    name: str
    type: str  # CHECKING | SAVINGS | BUSINESS
    balance: Decimal
    currency: str = "USD"
    status: str = "ACTIVE"


# ── Verified recipient allowlist ──────────────────────────────────────────────
ALLOWED_RECIPIENTS: dict[str, str] = {
    "alice": "Alice Walker",
    "alice walker": "Alice Walker",
    "alice@bankism.local": "Alice Walker",
    "bob": "Bob Martinez",
    "bob martinez": "Bob Martinez",
    "bob@bankism.local": "Bob Martinez",
    "charlie": "Charlie Chen",
    "charlie chen": "Charlie Chen",
    "charlie@bankism.local": "Charlie Chen",
    "diana": "Diana Prince",
    "diana prince": "Diana Prince",
    "diana@bankism.local": "Diana Prince",
    "evelyn": "Evelyn Reed",
    "evelyn reed": "Evelyn Reed",
    "evelyn@bankism.local": "Evelyn Reed",
}

# ── Initial account state (reset reference) ───────────────────────────────────
_INITIAL: dict[str, dict] = {
    "acc_chk_101": {"id": "acc_chk_101", "name": "Primary Personal Checking", "type": "CHECKING", "balance": Decimal("12450.00")},
    "acc_sav_202": {"id": "acc_sav_202", "name": "High-Yield Vault Savings",   "type": "SAVINGS",  "balance": Decimal("45200.00")},
    "acc_biz_303": {"id": "acc_biz_303", "name": "Commercial Treasury Reserve","type": "BUSINESS", "balance": Decimal("98750.00")},
}

_LOCK = threading.Lock()
_ACCOUNTS: dict[str, Account] = {k: Account(**v) for k, v in _INITIAL.items()}


def get_account(account_id: str) -> Account | None:
    with _LOCK:
        a = _ACCOUNTS.get(account_id)
        return a.model_copy() if a else None


def list_accounts() -> list[Account]:
    with _LOCK:
        return [a.model_copy() for a in _ACCOUNTS.values()]


def debit_account(account_id: str, amount: Decimal) -> Decimal:
    """Atomically debit account and return new balance. Raises on failure."""
    with _LOCK:
        if account_id not in _ACCOUNTS:
            raise ValueError(f"Account '{account_id}' not found.")
        acc = _ACCOUNTS[account_id]
        if acc.balance < amount:
            raise ValueError(f"Insufficient funds: ${acc.balance:,.2f} < ${amount:,.2f}.")
        acc.balance -= amount
        return acc.balance


def resolve_recipient(name: str) -> str | None:
    return ALLOWED_RECIPIENTS.get(name.strip().lower())


def is_allowed_recipient(name: str) -> bool:
    return resolve_recipient(name) is not None


def reset_accounts_for_testing() -> None:
    """Reset account balances to initial state. For tests only."""
    with _LOCK:
        for k, v in _INITIAL.items():
            _ACCOUNTS[k] = Account(**v)

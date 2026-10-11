"""Tests for mock banking ledger — state integrity invariants."""

from decimal import Decimal

import pytest

from app.banking.accounts import get_account
from app.banking.transactions import (
    execute_transfer,
    get_transaction_history,
    reset_ledger_for_testing,
)


def setup_function():
    reset_ledger_for_testing()


def test_successful_transfer_debits_balance():
    before = get_account("acc_chk_101").balance
    execute_transfer("acc_chk_101", "Alice Walker", Decimal("200.00"), "req_test_1")
    after = get_account("acc_chk_101").balance
    assert after == before - Decimal("200.00")


def test_successful_transfer_creates_record():
    execute_transfer("acc_chk_101", "Bob Martinez", Decimal("50.00"), "req_test_2", memo="test")
    history = get_transaction_history(1)
    assert len(history) == 1
    assert history[0].recipient == "Bob Martinez"
    assert history[0].amount == Decimal("50.00")
    assert history[0].status == "COMPLETED"
    assert history[0].memo == "test"


def test_insufficient_funds_raises_and_no_state_change():
    before = get_account("acc_chk_101").balance
    before_count = len(get_transaction_history())
    with pytest.raises(ValueError, match="[Ii]nsufficient"):
        execute_transfer("acc_chk_101", "Alice Walker", Decimal("9999999.00"), "req_fail_1")
    after = get_account("acc_chk_101").balance
    assert after == before  # INVARIANT 6: balance unchanged
    assert len(get_transaction_history()) == before_count  # INVARIANT 7: no record


def test_invalid_account_raises():
    with pytest.raises(ValueError):
        execute_transfer("acc_nonexistent", "Alice Walker", Decimal("10.00"), "req_fail_2")


def test_multiple_transfers_accumulate_correctly():
    reset_ledger_for_testing()
    execute_transfer("acc_chk_101", "Alice Walker", Decimal("100.00"), "req_t1")
    execute_transfer("acc_chk_101", "Bob Martinez", Decimal("100.00"), "req_t2")
    balance = get_account("acc_chk_101").balance
    assert balance == Decimal("12450.00") - Decimal("200.00")
    assert len(get_transaction_history()) == 2


def test_transaction_ids_are_unique():
    txn1 = execute_transfer("acc_chk_101", "Alice Walker", Decimal("10.00"), "req_u1")
    txn2 = execute_transfer("acc_chk_101", "Bob Martinez", Decimal("10.00"), "req_u2")
    assert txn1.id != txn2.id


def test_history_limit_respected():
    history = get_transaction_history(limit=1)
    assert len(history) <= 1

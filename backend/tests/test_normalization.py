"""Tests for Unicode normalization engine."""

from app.security.normalization import normalize_input


def test_benign_text_unchanged():
    raw = "Transfer $150 to Alice Walker for dinner"
    r = normalize_input(raw)
    assert r.normalized_text == raw
    assert r.stripped_invisible == 0
    assert r.stripped_bidi == 0
    assert not r.has_obfuscation


def test_zero_width_space_stripped():
    raw = "Transfer\u200b $200\u200b to \u200bAlice"
    r = normalize_input(raw)
    assert r.stripped_invisible == 3
    assert "ZERO_WIDTH" in " ".join(r.signals)
    assert r.has_obfuscation
    assert "\u200b" not in r.normalized_text
    assert "Transfer $200 to Alice" == r.normalized_text


def test_bidi_override_detected():
    raw = "Transfer to \u202eBob\u202c now"
    r = normalize_input(raw)
    assert r.stripped_bidi == 2
    assert "BIDI" in " ".join(r.signals)
    assert r.has_obfuscation
    assert "\u202e" not in r.normalized_text


def test_cyrillic_homoglyphs_replaced():
    # Cyrillic а (U+0430) and е (U+0435) inside "Alice"
    raw = "Send $50 to \u0410lic\u0435"
    r = normalize_input(raw)
    assert r.homoglyphs_replaced >= 2
    assert "Alice" in r.normalized_text
    assert r.has_obfuscation


def test_fullwidth_nfkc_normalized():
    # Fullwidth letters Ａｌｉｃｅ → Alice via NFKC
    fullwidth = "\uff21\uff4c\uff49\uff43\uff45"
    raw = f"Send $100 to {fullwidth}"
    r = normalize_input(raw)
    assert "Alice" in r.normalized_text


def test_url_encoding_detected():
    raw = "Transfer%20%24100%20to%20Alice"
    r = normalize_input(raw)
    assert "URL_ENCODED_SEQUENCES" in r.signals


def test_empty_signals_for_clean_input():
    r = normalize_input("Check my balance")
    assert len(r.signals) == 0
    assert not r.has_obfuscation


def test_multiple_spaces_collapsed():
    raw = "Transfer   $100   to   Alice"
    r = normalize_input(raw)
    assert "  " not in r.normalized_text

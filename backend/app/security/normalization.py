"""Unicode and text normalization engine.

Strips invisible/zero-width characters, detects BIDI overrides and
homoglyphs, applies NFKC normalization. Records transformation metadata
for downstream threat detection.
"""

import re
import unicodedata
from dataclasses import dataclass, field

# ── Codepoint sets ──────────────────────────────────────────────────────────
_ZERO_WIDTH: set[int] = {
    0x200B,  # Zero Width Space
    0x200C,  # Zero Width Non-Joiner
    0x200D,  # Zero Width Joiner
    0xFEFF,  # BOM / Zero Width No-Break Space
    0x2060,  # Word Joiner
    0x180E,  # Mongolian Vowel Separator
    0x200E,  # Left-to-Right Mark
    0x200F,  # Right-to-Left Mark
}

_BIDI: set[int] = {
    0x202A, 0x202B, 0x202C, 0x202D, 0x202E,  # LRE/RLE/PDF/LRO/RLO
    0x2066, 0x2067, 0x2068, 0x2069,           # LRI/RLI/FSI/PDI
}

# Common look-alike substitutions (Cyrillic + Greek → Latin)
_HOMOGLYPHS: dict[str, str] = {
    # Cyrillic
    "а": "a", "А": "A", "в": "b", "е": "e", "Е": "E",
    "к": "k", "К": "K", "м": "m", "н": "h", "о": "o",
    "О": "O", "р": "p", "Р": "P", "с": "c", "С": "C",
    "т": "t", "у": "y", "х": "x", "Х": "X",
    # Greek
    "α": "a", "Α": "A", "β": "b", "ε": "e", "ι": "i",
    "κ": "k", "ν": "v", "ο": "o", "Ο": "O", "ρ": "p",
    "τ": "t", "υ": "u", "χ": "x",
}


@dataclass
class NormalizationResult:
    raw_text: str
    normalized_text: str
    stripped_invisible: int = 0
    stripped_bidi: int = 0
    homoglyphs_replaced: int = 0
    signals: list[str] = field(default_factory=list)

    @property
    def has_obfuscation(self) -> bool:
        return bool(self.signals)


def normalize_input(raw: str) -> NormalizationResult:
    """Apply conservative, deterministic normalization to untrusted text.

    Order:
    1. Strip Unicode tag characters (plane 14).
    2. Strip zero-width / invisible markers.
    3. Strip BIDI override controls.
    4. Replace known homoglyphs with ASCII equivalents.
    5. Apply NFKC Unicode normalization.
    6. Collapse redundant whitespace.
    """
    result = NormalizationResult(raw_text=raw, normalized_text="")
    signals: list[str] = []
    chars: list[str] = []

    invisible = 0
    bidi = 0
    homoglyphs = 0

    # Pre-scan for encoded artifacts
    if re.search(r"%[0-9a-fA-F]{2}", raw):
        signals.append("URL_ENCODED_SEQUENCES")
    if re.search(r"\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}", raw):
        signals.append("HEX_ESCAPE_SEQUENCES")

    for ch in raw:
        cp = ord(ch)

        # Unicode tag plane
        if 0xE0000 <= cp <= 0xE007F:
            invisible += 1
            continue
        if cp in _ZERO_WIDTH:
            invisible += 1
            continue
        if cp in _BIDI:
            bidi += 1
            continue
        # ASCII controls except newline/tab/carriage-return
        if cp < 32 and ch not in ("\n", "\r", "\t"):
            invisible += 1
            continue

        # Homoglyph replacement
        if ch in _HOMOGLYPHS:
            homoglyphs += 1
            chars.append(_HOMOGLYPHS[ch])
            continue

        chars.append(ch)

    if invisible:
        signals.append(f"ZERO_WIDTH_CHARS:{invisible}")
    if bidi:
        signals.append(f"BIDI_OVERRIDES:{bidi}")
    if homoglyphs:
        signals.append(f"HOMOGLYPHS:{homoglyphs}")

    intermediate = "".join(chars)
    # NFKC normalization (converts fullwidth, ligatures, compatibility forms)
    normalized = unicodedata.normalize("NFKC", intermediate)
    # Collapse runs of horizontal whitespace
    normalized = re.sub(r"[ \t]+", " ", normalized).strip()

    result.normalized_text = normalized
    result.stripped_invisible = invisible
    result.stripped_bidi = bidi
    result.homoglyphs_replaced = homoglyphs
    result.signals = signals
    return result

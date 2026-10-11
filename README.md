# 🛡️ Bankism — Blue-Team AI Firewall

> **PromptWars × UVCE Hackathon Entry**  
> *Defensive AI Security Firewall for Natural-Language Banking Applications*

---

## 🎯 Executive Overview

**Bankism** is a production-grade defensive AI security gateway situated between natural-language user inputs (e.g. conversational agents, mobile voice assistants, smart banking chats) and deterministic core banking ledgers.

Unlike naive approaches that pass untrusted user instructions directly to an LLM agent with banking tools or execution privileges, Bankism implements a **multi-stage deterministic security firewall**. Detection and risk scoring **never** override deterministic authorization and banking policy.

---

## 🛡️ Key Security Invariants

1. **Untrusted NL content never directly authorizes a transfer.** Every request is normalized, threat-inspected, parsed into explicit parameters, policy-verified, and strictly audited before simulation.
2. **Hard-block rules cannot be bypassed by low risk scores.** If an injection or high-severity threat is detected, the verdict is `BLOCKED` regardless of semantic ambiguity or classification heuristics.
3. **Strict Parameter Validation & Precision Accounting.**
   - All amounts are computed using Python `Decimal` (no floating-point rounding attacks).
   - Recipient names must match verified allowlist entities.
   - Transaction limits ($5,000 per transaction) and balance checks are strictly enforced.
4. **Defense in Depth Pipeline:**
   - **Stage 1: Schema & Length Validation** (Reject oversized payloads, malformed JSON, empty inputs)
   - **Stage 2: Unicode & Character Normalization** (Strip zero-width characters, detect BIDI overrides, decompose homoglyphs, NFKC normalization)
   - **Stage 3: Multi-Signal Threat Detection** (Direct Prompt Injection, Jailbreak/Roleplay, Policy Override, Malicious Memo, Suspicious Unicode, Ambiguity)
   - **Stage 4: Deterministic Intent Parsing** (Strict extraction without hallucinating missing fields)
   - **Stage 5: Policy Enforcement** (Hard-block evaluations, limits, funds, recipient allowlists)
   - **Stage 6: Guarded Execution** (Atomic ledger commit only when 100% verified)
   - **Stage 7: Structured Audit & Telemetry** (Immutable logging of request lifecycle and findings)

---

## 🏗️ Architecture & Stack

- **Backend:** Python 3.10+, FastAPI, Pydantic v2, Pytest, Ruff.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts.
- **Packaging:** Multi-stage Dockerfile, Docker Compose, Google Cloud Run ready.
- **CI/CD:** GitHub Actions workflow testing backend ruff/pytest and frontend build.

---

## 🚀 Quickstart

### Option A: Local Python & Node Execution

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
pytest -v
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Option B: Docker Container
```bash
docker build -t bankism .
docker run -p 8080:8080 bankism
# Visit http://localhost:8080 in your browser
```

---

## 🧪 Testing & Verification

Run the full automated test suite:
```bash
cd backend
pytest -v
ruff check .
```

All 67 security regression, policy invariant, normalization, detector, and transaction tests pass deterministically.

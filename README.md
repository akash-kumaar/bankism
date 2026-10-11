# 🛡️ Bankism — Blue-Team AI Firewall

> A deterministic security gateway for protecting natural-language banking applications from prompt injection and malicious transaction instructions.

## 🚀 Live Demo

**[Open Bankism →](https://bankism-6oo8.onrender.com)** · [GitHub Repository](https://github.com/akash-kumaar/bankism)

*Hosted on Render Free. Initial loading may take 50 seconds or more after inactivity.*

## 🎯 Overview

Bankism is a defensive AI security gateway that sits between natural-language user requests and simulated banking operations. It detects suspicious instructions while ensuring that **AI risk scores never override deterministic transaction policies**.

## 🔐 Key Features

- **Prompt Injection Detection** — Identifies malicious instructions, jailbreak attempts, and policy overrides.
- **Unicode Normalization** — Detects suspicious Unicode characters and obfuscation patterns.
- **Deterministic Policy Enforcement** — Validates recipients, transaction limits, and account balances.
- **Precision Accounting** — Uses Python `Decimal` for monetary calculations.
- **Guarded Transaction Execution** — Executes simulated transfers only after required checks pass.
- **Security Inspector & Analytics** — Explore findings, transaction decisions, and threat metrics.
- **Automated Testing** — Regression tests for detection, normalization, and transaction policies.

## ⚙️ Tech Stack

**Backend:** Python, FastAPI, Pydantic, Pytest, Ruff  
**Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts  
**Deployment:** Docker, Render, GitHub Actions

## 🏗️ Security Pipeline

```text
User Input
    ↓
Validation & Normalization
    ↓
Threat Detection
    ↓
Intent Parsing
    ↓
Deterministic Policy Checks
    ↓
Guarded Execution
    ↓
Audit & Telemetry
```

Threat detection identifies risk; deterministic policy enforcement controls execution.

## 💻 Run Locally

**Backend**

```bash
git clone https://github.com/akash-kumaar/bankism.git
cd bankism/backend

python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend** — Open a second terminal:

```bash
cd bankism/frontend
npm install
npm run dev
```

Configure the frontend API URL for your local backend if required.

## 🧪 Tests

From the `backend` directory:

```bash
python -m pytest -v
python -m ruff check .
```

The project reports 67 automated tests covering security regression cases, normalization, detection, and transaction policies.

## ⚠️ Scope

Bankism is a hackathon security demonstration using simulated banking operations. It is not connected to a real banking ledger and is not intended for real financial transactions.

---

**PromptWars × UVCE Hackathon Entry** · [Live Demo](https://bankism-6oo8.onrender.com) · [Source Code](https://github.com/akash-kumaar/bankism)

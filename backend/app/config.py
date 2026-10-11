"""Application configuration — all values come from environment variables or safe defaults."""

import os
from decimal import Decimal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Bankism — Blue-Team AI Firewall"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "demo"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = int(os.environ.get("PORT", "8000"))

    # Security policy limits
    MAX_REQUEST_LENGTH: int = 1000
    MAX_TRANSFER_AMOUNT: Decimal = Decimal("5000.00")
    MIN_TRANSFER_AMOUNT: Decimal = Decimal("0.01")
    DEFAULT_CURRENCY: str = "USD"

    # Risk thresholds
    RISK_BLOCK_THRESHOLD: int = 70    # score >= this → always BLOCKED
    RISK_CLARIFY_THRESHOLD: int = 35  # score >= this → NEEDS_CLARIFICATION for transfers

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

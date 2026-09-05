"""Centralized application configuration for MPLADS Sentinel backend.
Loads settings from environment variables and .env file with production-ready defaults.
"""
import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load .env file from workspace root or current directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # Server binding
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    WORKERS: int = int(os.getenv("WORKERS", "4"))

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mplads-sentinel-insecure-default-change-in-prod")
    
    # CORS Origins
    _raw_cors: str = os.getenv("CORS_ORIGINS", "*")
    @property
    def CORS_ORIGINS(self) -> List[str]:
        if self._raw_cors.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self._raw_cors.split(",") if origin.strip()]

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///data/mplad_sentinel.db")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "20"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

    # Uploads & Limits
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "data/uploads"))

    # Application metadata
    APP_NAME: str = "VIGILANT-MPLAD API"
    APP_VERSION: str = "1.2.0"


settings = Settings()

import os
import logging
from pathlib import Path
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("backend.db")

DB_PATH = Path("data/mplad_sentinel.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH.as_posix()}")

# Auto-normalize postgres:// to postgresql:// for SQLAlchemy 2.0 (common in Neon/Render/Heroku URLs)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Graceful fallback to SQLite if placeholder credentials are detected
if "your_neon_password" in DATABASE_URL or "ep-your-endpoint" in DATABASE_URL:
    logger.info("DATABASE_URL has placeholder Neon credentials. Using local SQLite until real Neon URL is supplied.")
    DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

# Production-grade engine configuration
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()
else:
    # Neon Serverless PostgreSQL / Cloud PostgreSQL connection optimization
    is_neon = "neon.tech" in DATABASE_URL
    connect_args = {}
    
    # Ensure SSL is required for remote cloud databases like Neon
    if is_neon and "sslmode" not in DATABASE_URL:
        connect_args["sslmode"] = "require"

    engine = create_engine(
        DATABASE_URL,
        pool_size=int(os.getenv("DB_POOL_SIZE", "10" if is_neon else "20")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
        pool_pre_ping=True,      # Crucial for Neon serverless wake-up after scale-to-zero
        pool_recycle=300,        # Recycles connections every 5 minutes to prevent stale idle sockets
        pool_timeout=30,
        connect_args=connect_args,
        echo=False
    )

    if is_neon:
        logger.info("Configured SQLAlchemy engine with Neon Serverless PostgreSQL optimizations (SSL enabled, pool_pre_ping).")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session with guaranteed closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> dict:
    """Verifies database connectivity and returns latency and engine status."""
    try:
        import time
        start_time = time.time()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "HEALTHY",
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms
        }
    except Exception as exc:
        logger.error(f"Database health check failed: {exc}")
        return {
            "status": "UNHEALTHY",
            "dialect": engine.dialect.name if hasattr(engine, "dialect") else "unknown",
            "error": str(exc)
        }



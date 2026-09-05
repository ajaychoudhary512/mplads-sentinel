"""Neon Serverless PostgreSQL Migration & Seeding Utility for MPLADS Sentinel.
Transfers and seeds all tables from local baseline into your Neon PostgreSQL database.

Usage:
  python backend/db/migrate_to_neon.py
"""
import os
import sys
import logging
import time
from pathlib import Path

# Add project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import settings
from backend.db.database import engine, Base, check_db_health, SessionLocal
import backend.db.models
from backend.db.models import Project, Alert, Vendor, MP, ExpenditureTransaction, DatasetVersion
from backend.db.seeder import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("neon_migration")


def run_neon_setup():
    db_url = settings.DATABASE_URL
    if not db_url or "neon.tech" not in db_url:
        logger.warning("=" * 70)
        logger.warning("NOTICE: DATABASE_URL does not appear to be a Neon PostgreSQL URL.")
        logger.warning(f"Current DATABASE_URL: {db_url}")
        logger.warning("To use Neon, set DATABASE_URL in your .env file:")
        logger.warning("DATABASE_URL=postgresql://<user>:<password>@<endpoint>.neon.tech/neondb?sslmode=require")
        logger.warning("=" * 70)

    logger.info("Connecting to Database...")
    health = check_db_health()
    if health["status"] != "HEALTHY":
        logger.error(f"Failed to connect to database: {health}")
        sys.exit(1)

    logger.info(f"Connected to {health['dialect']} database successfully (Latency: {health['latency_ms']}ms).")

    logger.info("Step 1: Creating database schema and tables...")
    start = time.time()
    Base.metadata.create_all(bind=engine)
    logger.info(f"Schema and tables created in {time.time() - start:.2f}s.")

    logger.info("Step 2: Seeding database tables...")
    db = SessionLocal()
    try:
        seed_database(db=db, force_reseed=False)
        
        # Verify counts
        p_count = db.query(Project).count()
        v_count = db.query(Vendor).count()
        m_count = db.query(MP).count()
        a_count = db.query(Alert).count()
        e_count = db.query(ExpenditureTransaction).count()

        logger.info("=" * 70)
        logger.info("NEON DATABASE SETUP COMPLETED SUCCESSFULLY!")
        logger.info(f" - Projects:     {p_count:,}")
        logger.info(f" - Vendors:      {v_count:,}")
        logger.info(f" - MPs:          {m_count:,}")
        logger.info(f" - Alerts:       {a_count:,}")
        logger.info(f" - Expenditures: {e_count:,}")
        logger.info("=" * 70)
    finally:
        db.close()


if __name__ == "__main__":
    run_neon_setup()

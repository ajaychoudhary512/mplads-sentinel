"""Database initialization and schema verification CLI utility.
Can be executed during docker container startup or deployment pipelines.
"""
import sys
import logging
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import engine, Base, check_db_health
import backend.db.models
from backend.db.seeder import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("init_db")


def initialize_database(seed_if_empty: bool = True):
    logger.info("Checking database connection...")
    health = check_db_health()
    if health["status"] != "HEALTHY":
        logger.error(f"Cannot connect to database: {health}")
        sys.exit(1)
    
    logger.info(f"Connected to database engine ({health['dialect']}) with latency {health['latency_ms']}ms.")
    
    logger.info("Creating all tables from declarative metadata...")
    Base.metadata.create_all(bind=engine)
    logger.info("All database tables created / verified successfully.")

    if seed_if_empty:
        logger.info("Verifying seed data availability...")
        try:
            seed_database()
            logger.info("Seed data check / insertion completed.")
        except Exception as exc:
            logger.warning(f"Seed step encountered notice: {exc}")

    logger.info("Database initialization complete and ready for production traffic.")


if __name__ == "__main__":
    seed_arg = "--no-seed" not in sys.argv
    initialize_database(seed_if_empty=seed_arg)

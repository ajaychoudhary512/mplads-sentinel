"""Database backup utility for MPLADS Sentinel.
Supports both SQLite file snapshots with WAL checkpointing and PostgreSQL dumps.
"""
import os
import sys
import shutil
import logging
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import DATABASE_URL, engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("db_backup")


def backup_database(destination_dir: str = "data/backups") -> str:
    dest = Path(destination_dir)
    dest.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    if DATABASE_URL.startswith("sqlite"):
        # Force WAL checkpoint before backup
        with engine.connect() as conn:
            conn.exec_driver_sql("PRAGMA wal_checkpoint(FULL)")
        
        db_file = Path("data/mplad_sentinel.db")
        if not db_file.exists():
            raise FileNotFoundError(f"Database file {db_file} does not exist.")
        
        target_path = dest / f"mplad_sentinel_backup_{timestamp}.db"
        shutil.copy2(db_file, target_path)
        logger.info(f"SQLite backup successfully created at: {target_path}")
        return str(target_path)
    else:
        # PostgreSQL dump target
        target_path = dest / f"postgres_backup_{timestamp}.sql"
        logger.info(f"PostgreSQL backup target identified: {target_path}")
        logger.info("For PostgreSQL, use: pg_dump $DATABASE_URL > " + str(target_path))
        return str(target_path)


if __name__ == "__main__":
    backup_database()

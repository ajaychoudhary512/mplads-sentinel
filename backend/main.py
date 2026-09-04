import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db.database import engine, Base
import backend.db.models
from backend.db.seeder import seed_database
from backend.routers import (
    dashboard,
    projects,
    alerts,
    ai,
    vendors,
    reports,
    audit,
    data_upload,
)

logger = logging.getLogger("backend.main")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed database if empty
    logger.info("Initializing VIGILANT-MPLAD database schema...")
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Notice during startup database seed: {e}")
    yield
    # Shutdown
    logger.info("VIGILANT-MPLAD backend shutting down.")


app = FastAPI(
    title="VIGILANT-MPLAD API",
    description="Backend REST API & ML Risk Intelligence Engine for MPLAD Scheme Monitoring",
    version="1.2.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(dashboard.router)
app.include_router(projects.router)
app.include_router(alerts.router)
app.include_router(ai.router)
app.include_router(vendors.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(data_upload.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "OPERATIONAL",
        "service": "VIGILANT-MPLAD API",
        "version": "1.2.0",
        "governmentContext": "Ministry of Statistics and Programme Implementation (MoSPI)"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

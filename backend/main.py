import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.db.database import engine, Base, check_db_health
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

# Logging configuration
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("backend.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    logger.info(f"Starting {settings.APP_NAME} in [{settings.ENVIRONMENT}] mode...")
    logger.info("Initializing VIGILANT-MPLAD database schema...")
    try:
        Base.metadata.create_all(bind=engine)
        # Cloud low-memory optimization: seed only on local SQLite or when explicitly requested
        import os
        import gc
        if os.getenv("AUTO_SEED", "false").lower() in ("true", "1") or settings.DATABASE_URL.startswith("sqlite"):
            seed_database()
        gc.collect()
    except Exception as e:
        logger.warning(f"Notice during startup database initialization: {e}")
    yield
    # Shutdown
    logger.info(f"{settings.APP_NAME} backend shutting down cleanly.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend REST API & ML Risk Intelligence Engine for MPLAD Scheme Monitoring",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.ENVIRONMENT != "production" or settings.DEBUG else "/api/docs",
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" or settings.DEBUG else None,
    lifespan=lifespan
)

# Production Security Headers Middleware
@app.middleware("http")
async def add_security_and_timing_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000.0

    # Add performance telemetry header
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    
    # Add enterprise security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"

    return response


# Global Exception Handler (Sanitized for Production)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=settings.DEBUG)
    
    detail = str(exc) if settings.DEBUG or settings.ENVIRONMENT != "production" else "An internal server error occurred."
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": detail,
            "path": request.url.path
        }
    )


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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


# Health & Readiness Probes
@app.get("/api/health", tags=["Health"])
def health_check():
    """General operational health check."""
    return {
        "status": "OPERATIONAL",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "governmentContext": "Ministry of Statistics and Programme Implementation (MoSPI)"
    }


@app.get("/api/health/live", tags=["Health"])
def liveness_probe():
    """Kubernetes / Container Liveness probe."""
    return {"status": "LIVE"}


@app.get("/api/health/ready", tags=["Health"])
def readiness_probe():
    """Kubernetes / Load Balancer Readiness probe that verifies DB connectivity."""
    db_health = check_db_health()
    is_ready = db_health.get("status") == "HEALTHY"
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "READY" if is_ready else "NOT_READY",
            "database": db_health,
            "version": settings.APP_VERSION
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

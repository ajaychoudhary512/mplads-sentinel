"""Production Entrypoint for Render / Cloud Hosting.
Enforces single-worker, memory-optimized startup tailored for 512MB RAM instances.
"""
import os
import sys
import gc

# Memory allocator optimizations for Linux / Render
os.environ["MALLOC_TRIM_THRESHOLD_"] = "100000"
os.environ["PYTHONUNBUFFERED"] = "1"
os.environ["WEB_CONCURRENCY"] = "1"
os.environ["WORKERS"] = "1"

port = int(os.getenv("PORT", "8000"))
host = os.getenv("HOST", "0.0.0.0")

if __name__ == "__main__":
    import uvicorn
    gc.collect()
    print(f"[STARTUP] Launching MPLADS Sentinel backend on {host}:{port} with 1 worker (512MB RAM safe)...")
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        workers=1,
        log_level="info",
        access_log=True
    )

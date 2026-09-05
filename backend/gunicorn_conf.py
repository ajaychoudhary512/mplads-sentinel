"""Gunicorn production configuration for VIGILANT-MPLAD FastAPI backend.
Optimized for high-concurrency multi-worker deployments.
"""
import multiprocessing
import os

# Server socket
bind = f"{os.getenv('HOST', '0.0.0.0')}:{os.getenv('PORT', '8000')}"
backlog = 2048

# Worker processes
workers = int(os.getenv("WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
loglevel = os.getenv("LOG_LEVEL", "info").lower()
accesslog = "-"  # stdout
errorlog = "-"   # stderr
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" (%(L)s ms)'

# Process naming
proc_name = "mplads_sentinel_backend"

# Graceful restarts
graceful_timeout = 30
max_requests = 2000
max_requests_jitter = 200

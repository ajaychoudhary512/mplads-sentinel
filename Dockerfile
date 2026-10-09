# ─── Stage 1: Build Frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies (cached layer)
COPY frontend/package*.json ./
COPY frontend/pnpm-lock.yaml* ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Production Python Backend ───────────────────────────────────────
FROM python:3.10-slim AS production
WORKDIR /app

# System dependencies (libpq for PostgreSQL, gcc for native extensions)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY backend/ ./backend/
COPY data_pipeline/ ./data_pipeline/
COPY models/ ./models/
COPY risk_config.json ./
COPY start.py ./

# Copy pre-processed data (seed CSVs referenced by seeder.py)
COPY data/processed/ ./data/processed/
COPY data/raw/ ./data/raw/

# Create directories for runtime-generated files
RUN mkdir -p data/uploads data/exports logs

# Copy built React frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# ─── Runtime configuration ────────────────────────────────────────────────────
EXPOSE 8000

# Health check for Docker / orchestrators
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health/live')" || exit 1

# Use gunicorn + uvicorn workers for production
# (Falls back to single worker on 512 MB RAM instances via WEB_CONCURRENCY)
CMD ["sh", "-c", "gunicorn backend.main:app --worker-class uvicorn.workers.UvicornWorker --workers ${WEB_CONCURRENCY:-2} --bind 0.0.0.0:${PORT:-8000} --timeout 120 --graceful-timeout 30 --access-logfile - --error-logfile -"]

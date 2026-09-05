#!/usr/bin/env bash
set -e

echo "=============================================================================="
echo "       MPLADS Sentinel (e-drishti) - Production Launcher (No Docker)          "
echo "=============================================================================="

if [ ! -f ".env" ]; then
    echo "[NOTICE] .env file not found. Copying from .env.example..."
    cp .env.example .env
fi

echo "[1/3] Building production frontend assets..."
npm run build

echo "[2/3] Initializing Database..."
python backend/db/init_db.py

echo "[3/3] Starting Backend & Frontend..."
echo " - Backend API:     http://0.0.0.0:8000"
echo " - Frontend Web UI: http://0.0.0.0:8443"

# Start backend in background
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4 &
BACKEND_PID=$!

# Start frontend preview
npm run preview -- --host 0.0.0.0 --port 8443 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait

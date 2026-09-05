@echo off
title MPLADS Sentinel - Production Server (No Docker)
echo ==============================================================================
echo        MPLADS Sentinel (e-drishti) - Production Launcher (No Docker)
echo ==============================================================================
echo.

if not exist .env (
    echo [NOTICE] .env file not found. Creating .env from .env.example...
    copy .env.example .env
    echo Please edit .env with your Neon DATABASE_URL if needed.
    echo.
)

echo [1/3] Building production frontend bundle in frontend/ folder...
call npm --prefix frontend run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Checking Database Connection & Tables...
python backend/db/init_db.py
if %errorlevel% neq 0 (
    echo [ERROR] Database initialization failed! Check DATABASE_URL in .env.
    pause
    exit /b 1
)

echo.
echo [3/3] Starting Backend API (Port 8000) and Frontend Preview (Port 8443)...
echo.
echo ==============================================================================
echo  - Backend API:       http://localhost:8000
echo  - API Docs:          http://localhost:8000/docs
echo  - Frontend Web UI:   http://localhost:8443
echo ==============================================================================
echo.

start "MPLADS Backend API" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4"
start "MPLADS Frontend UI" cmd /k "npm --prefix frontend run preview -- --host 0.0.0.0 --port 8443"

echo Both services have been launched in dedicated terminal windows!
pause

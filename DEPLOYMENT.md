# Production Deployment Guide (No Docker & Neon PostgreSQL)

This guide walks you through deploying **MPLADS Sentinel (e-drishti)** in production **without Docker**, using **Neon Serverless PostgreSQL**.

---

## Architecture (No-Docker + Neon)

```
[ Frontend: Vercel / Netlify / Static Server ]
                  │
                  ▼
[ Backend API: Render / Railway / VPS / Systemd ]
                  │
                  ▼ (TLS / SSL Connection Pool)
[ Database: Neon Serverless PostgreSQL (neon.tech) ]
```

---

## Step 1: Setup Neon PostgreSQL Database

1. Go to [https://neon.tech](https://neon.tech) and create a project (e.g. `mplads-sentinel`).
2. In the Neon Console under **Connection Details**, select:
   - **Role / User**: `neondb_owner`
   - **Database**: `neondb`
   - **Connection string**: Copy the connection string with `Pooled connection` or standard endpoint.
   - Example format:
     ```
     postgresql://neondb_owner:npg_xyz123@ep-cool-morning-a5xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
3. In your project root, open `.env` (or copy `.env.example` to `.env`):
   ```ini
   DATABASE_URL=postgresql://neondb_owner:npg_xyz123@ep-cool-morning-a5xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 2: Initialize & Seed Neon Database

Run the 1-click migration and seeding command:
```bash
python backend/db/migrate_to_neon.py
```
This will:
- Establish secure SSL connection with Neon.
- Automatically create all 8 tables and indexes (`projects`, `expenditures`, `vendors`, `mps`, `alerts`, `dataset_versions`, `ai_analysis_runs`, `audit_logs`).
- Seed the baseline 28,706 projects and risk intelligence records into Neon.
- Verify table counts and query latency.

---

## Step 3: Run / Deploy Backend (No Docker)

### Option A: Local / Production Server Launch (Direct CLI)
```bash
# Multi-worker production ASGI server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Option B: Cloud Hosting (Render / Railway / AWS App Runner)
- **Root Directory**: `.`
- **Build Command**: `pip install -r requirements.txt && pip install python-calamine`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 4`
- **Environment Variables**:
  - `DATABASE_URL`: *(Your Neon connection string)*
  - `ENVIRONMENT`: `production`
  - `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app,http://localhost:8443`

---

## Step 4: Build & Deploy Frontend (No Docker)

### Option A: Deploy on Vercel / Netlify
1. Connect your repository to **Vercel** or **Netlify**.
2. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com` (Your deployed backend URL)

### Option B: Native Server / VPS Hosting
```bash
# Build optimized static bundle
npm run build

# Serve bundle using high-performance Node serve or Python server
npx serve -s dist -l 8443
# OR
npm run preview -- --host 0.0.0.0 --port 8443
```

---

## 1-Click Launch Scripts (Windows & Linux)

For zero-friction native execution on your local machine / server:

- **Windows**: Double click or run [`start-production.bat`](file:///c:/Users/jkgga/Downloads/mplads-sentinel-main/mplads-sentinel-main/start-production.bat)
- **Linux/macOS**: Run [`./start-production.sh`](file:///c:/Users/jkgga/Downloads/mplads-sentinel-main/mplads-sentinel-main/start-production.sh)

---

## Monitoring & Health Checks

Verify your deployment anytime with:
```bash
# Check Backend + Neon DB Connectivity
curl http://localhost:8000/api/health/ready
```
Expected response:
```json
{
  "status": "READY",
  "database": {
    "status": "HEALTHY",
    "dialect": "postgresql",
    "latency_ms": 12.4
  },
  "version": "1.2.0"
}
```

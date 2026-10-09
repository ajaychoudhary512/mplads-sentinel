# MPLADS Sentinel — Deployment Guide

**Architecture: Vercel (Frontend) + Render (Backend API) + Neon (PostgreSQL)**

```
[ Browser ]
     │
     ▼
[ Vercel — React + Vite SPA ]
 /api/* → proxied via vercel.json rewrites
     │
     ▼
[ Render — FastAPI + Gunicorn ]
     │
     ▼ (SSL / TLS)
[ Neon — Serverless PostgreSQL ]
```

---

## Step 1 — Set up Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech) → Create a project (e.g. `mplads-sentinel`)
2. In **Connection Details**, copy the **Pooled connection** string:
   ```
   postgresql://neondb_owner:PASSWORD@ep-ENDPOINT.neon.tech/neondb?sslmode=require
   ```
3. Run the one-click migration to create tables and seed baseline data:
   ```bash
   # Set your Neon URL in .env first, then:
   python backend/db/migrate_to_neon.py
   ```

---

## Step 2 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repository
3. Configure the service:
   | Setting | Value |
   |---|---|
   | **Runtime** | Python 3 |
   | **Root Directory** | `.` (repo root) |
   | **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
   | **Start Command** | `gunicorn backend.main:app --worker-class uvicorn.workers.UvicornWorker --workers 1 --bind 0.0.0.0:$PORT --timeout 120` |
   | **Health Check** | `/api/health/live` |

4. Add these **Environment Variables** in Render Dashboard:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon PostgreSQL connection string |
   | `SECRET_KEY` | Random 32+ character string |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` |
   | `ENVIRONMENT` | `production` |
   | `DEBUG` | `false` |
   | `AUTO_SEED` | `false` |
   | `WEB_CONCURRENCY` | `1` (free tier) or `2` (paid) |

5. Deploy → Note your **Render service URL** (e.g. `https://mplads-sentinel-api.onrender.com`)

---

## Step 3 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
2. Configure:
   | Setting | Value |
   |---|---|
   | **Root Directory** | `frontend` |
   | **Framework** | Vite |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

3. Add **Environment Variable**:
   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | *(leave empty — proxy rewrites handle routing)* |

4. **Update `frontend/vercel.json`** — replace the Render URL in the `/api/:path*` rewrite:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://YOUR-RENDER-SERVICE.onrender.com/api/:path*"
       },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

5. Redeploy on Vercel after updating `vercel.json`

6. Go back to Render and update `CORS_ORIGINS` to your Vercel URL.

---

## Step 4 — Verify Deployment

```bash
# Check backend health
curl https://your-api.onrender.com/api/health/ready

# Expected:
# {"status":"READY","database":{"status":"HEALTHY","dialect":"postgresql","latency_ms":12.4},"version":"1.2.0"}
```

Then open your Vercel URL in the browser — the dashboard should load with all data.

---

## Local Development (No Docker)

```bash
# 1. Install Python deps
pip install -r requirements.txt

# 2. Start backend (uses local SQLite by default)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000

# 3. Start frontend dev server (in a new terminal)
npm --prefix frontend run dev
# → http://localhost:8443
```

---

## Docker Deployment (Self-hosted / VPS)

```bash
# Copy and fill in your .env
cp .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, CORS_ORIGINS

# Build and start
docker compose up --build -d

# Check logs
docker compose logs -f
```

> **Note:** The Docker image builds the React frontend, copies `data/processed/` CSVs and ML model `.joblib` files into the image, and serves everything from a single container on port 8000.

---

## 1-Click Windows Launch (Local)

```bat
start-production.bat
```

This builds the frontend, verifies DB, and opens both backend (`:8000`) and frontend (`:8443`) in separate terminal windows.

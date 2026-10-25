# 🛡️ MPLADS SENTIEL :- E-DRISTHI

## AI-Powered Public Development Risk Intelligence Platform

> **Detect Risk. Explain Patterns. Enable Better Decisions.**

**MPLADS SENTIEL :- E-DRISTHI** is an AI-powered risk intelligence and decision-support platform designed to analyze public development project and financial data, identify unusual patterns, detect potential fraud-risk indicators and inefficiencies, and help authorized officials prioritize projects that require verification.

The system does **not declare fraud automatically**. It identifies anomalies and risk indicators and provides explainable insights for further human verification.

## Demo video

<video controls playsinline preload="metadata" width="100%">
  <source src="./E%20drishti%20protal%20.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>

> The video is stored in the repository root so it loads reliably in GitHub README previews.

---

## 🎯 Problem

Large-scale public development programs involve a large number of projects distributed across different locations, agencies, vendors and implementation authorities.

Manually monitoring every project with the same level of scrutiny can be:

- Time-consuming
- Difficult to scale
- Resource intensive
- Prone to missing hidden patterns
- Inefficient for prioritizing high-risk cases

Potential issues may include:

- Unusual expenditure patterns
- Cost overruns
- Delayed project execution
- Fund utilization vs. physical progress mismatch
- Duplicate or suspicious transactions
- Unusual vendor activity
- Geographic inconsistencies
- Financial or project outliers
- Repeated or suspicious project patterns

**MPLADS SENTIEL :- E-DRISTHI** addresses this problem through automated data analysis, machine learning, rule-based risk detection and explainable risk scoring.

---

# 💡 Solution

The platform works as an **AI-powered intelligence layer** over public development project data.

```text
Data Sources
     ↓
Data Ingestion
     ↓
Data Cleaning & Normalization
     ↓
Feature Engineering
     ↓
AI / ML Analysis
     ↓
Rule-Based Risk Analysis
     ↓
Risk Scoring
     ↓
Explainable Alerts
     ↓
Human Verification
     ↓
Action / Follow-up
```

---

## Why this project?

MPLADS (Members of Parliament Local Area Development Scheme) involves large-scale public spending across projects, vendors, and districts. Monitoring that data manually is slow and error-prone. MPLADS Sentinel helps teams:

- detect unusual expenditure patterns
- prioritize high-risk projects for review
- trace alert history back to datasets and model runs
- centralize project, vendor, and payment intelligence in a single dashboard

---

## Key capabilities

- Hybrid risk scoring combining ML and rule-based red flags
- Risk levels from Low to Critical with configurable thresholds
- Alert generation for suspicious expenditure and project behavior
- FastAPI-based backend with health and readiness checks
- Vite-based frontend dashboard for operational review
- PostgreSQL-backed storage for projects, expenditures, vendors, alerts, and audits
- Data ingestion workflows for CSV/Excel-based project datasets
- Model metadata and dataset version tracking for auditability

---

## Architecture

```text
[ Browser / Dashboard ]
          |
          v
[ Frontend: Vite + React/TS ]
          |
          v
[ FastAPI backend ]
          |
          v
[ Data pipeline + risk engine ]
          |
          v
[ PostgreSQL database ]
```

The backend pipeline typically looks like this:

```text
raw data (CSV / Excel) -> ingestion -> transformation -> risk scoring -> alerts -> API -> dashboard
```

---

## Tech stack

| Layer | Stack |
|---|---|
| API | FastAPI, Uvicorn, Gunicorn |
| Data validation | Pydantic |
| Database access | SQLAlchemy, psycopg |
| Database | PostgreSQL / Neon |
| Data processing | pandas, NumPy, SciPy, openpyxl |
| Machine learning | scikit-learn, joblib |
| Frontend | Vite, TypeScript, static web build |
| Testing | pytest |
| Deployment | Docker, Render, Railway, Vercel, VPS |
| Config | python-dotenv |

---

## Repository structure

```text
mplads-sentinel/
├── backend/                 # FastAPI application and routing logic
│   ├── db/                  # Database models, setup, schema, seeding, migration helpers
│   ├── routers/             # API endpoints for projects, alerts, AI, reports, etc.
│   └── main.py              # Application entry point
├── frontend/                # Vite dashboard frontend
├── data/                    # Local datasets, seeds, and processed outputs
├── data_pipeline/           # Data ingestion and transformation pipeline
├── models/                  # Trained models, risk artifacts, and outputs
├── tests/                   # Automated tests
├── risk_config.json         # Risk thresholds and rule/ML weighting
├── requirements.txt         # Python dependencies
├── package.json             # Root workspace scripts
├── Dockerfile               # Container image definition
├── docker-compose.yml       # Local containerized deployment
├── render.yaml              # Render deployment config
├── Procfile                 # Process definition for hosting providers
├── DEPLOYMENT.md            # Detailed deployment guide
├── start.py                 # Low-memory production startup
├── start-production.sh      # Linux/macOS launch script
├── start-production.bat     # Windows launch script
├── LICENSE                  # Project license
├── README.md                # Project overview and setup guide
└── .env.example             # Optional reference for expected environment variables
```

---

## Risk scoring engine

The score is designed to blend a predictive model with explainable rule-based checks.

### Final formula

```text
risk_score = 0.60 * ml_score + 0.40 * rule_score
```

| Parameter | Value |
|---|---|
| `ml_weight` | 0.60 |
| `rule_weight` | 0.40 |

### Risk levels

| Level | Score range |
|---|---|
| Low | 0 to 24.99 |
| Medium | 25 to 49.99 |
| High | 50 to 74.99 |
| Critical | 75 and above |

### Example rule flags

- unusual expenditure
- extreme cost overrun
- duplicate payments
- delayed projects
- suspicious vendor patterns
- geographic inconsistency
- transaction outliers

These flags are configured in [`risk_config.json`](./risk_config.json), making the risk model tunable without touching application logic.

> A high score is a risk signal for review, not proof of wrongdoing. Human verification remains essential.

---

## Database schema

The project uses a relational schema for core governance data and alerts:

| Table | Purpose |
|---|---|
| `projects` | MPLADS project records |
| `expenditures` | Payments and spending data |
| `vendors` | Vendor and contractor records |
| `mps` | MP / constituency metadata |
| `alerts` | Generated risk alerts |
| `dataset_versions` | Dataset provenance and version history |
| `ai_analysis_runs` | ML / analysis execution tracking |
| `audit_logs` | Operational and compliance audit trail |

---

## Quick start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL database (recommended: Neon or local PostgreSQL)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/CSrajput-ux/mplads-sentinel.git
cd mplads-sentinel
```

### 2. Create a virtual environment and install Python dependencies

```bash
python -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows
# .venv\Scripts\activate

pip install -r requirements.txt
pip install python-calamine
```

### 3. Configure environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://localhost:8443
```

### 4. Initialize the database

```bash
python backend/db/migrate_to_neon.py
```

This creates the schema and seeds the baseline data for projects and risk intelligence.

### 5. Install frontend dependencies

```bash
npm --prefix frontend install
```

---

## Run the app locally

### Start the backend

```bash
python -m uvicorn backend.main:app --reload --port 8000
```

### Start the frontend

```bash
npm run dev
```

### Access the app

- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Production and deployment

The project supports several deployment approaches.

### Docker

```bash
export DATABASE_URL="postgresql://..."
docker compose up --build
```

### Render / Railway / VPS

The repository includes deployment files and environment-based configuration for cloud hosting.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a detailed setup guide.

### One-click startup scripts

```bash
./start-production.sh
# Windows
start-production.bat
```

---

## Health checks and API

The FastAPI service exposes built-in health endpoints:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/health/live
curl http://localhost:8000/api/health/ready
```

Example readiness response:

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

---

## Testing

Run the project test suite with:

```bash
pytest
```

Tests are stored in the [`tests/`](./tests/) directory.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes and add tests when relevant
4. Validate with `pytest` and frontend build checks
5. Open a pull request with a clear summary of the change

---

## License

This project is distributed under the terms of the [LICENSE](./LICENSE) file.

---

## Acknowledgements

- Original project by [ajaychoudhary512](https://github.com/ajaychoudhary512/mplads-sentinel)
- Fork maintained by [CSrajput-ux](https://github.com/CSrajput-ux)
- Built with FastAPI, SQLAlchemy, scikit-learn, Vite, and PostgreSQL

---

## Notes

This repository is intended for project monitoring, anomaly detection, and audit-oriented analysis. It does not replace formal forensic review or statutory investigation, but it is designed to support faster prioritization and evidence-based review of large public-spending datasets.

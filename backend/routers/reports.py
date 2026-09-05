import io
from pathlib import Path
from datetime import datetime
from typing import Optional
import pandas as pd
from fastapi import APIRouter, Depends, Query, Body, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.db.database import get_db
from backend.db.models import Project, Alert, DatasetVersion

router = APIRouter(prefix="/api/reports", tags=["Report Generation"])


def get_effective_version(dataset_version: Optional[str], db: Session) -> str:
    if dataset_version and dataset_version.strip():
        return dataset_version.strip()
    active_v = db.query(DatasetVersion).filter(DatasetVersion.is_active == True).first()
    return active_v.version_id if active_v else "V1"


@router.post("/generate")
def generate_report(payload: dict = Body(...), db: Session = Depends(get_db)):
    """Generates analytical report summary based on user parameters for active dataset_version."""
    dataset_version = payload.get("dataset_version")
    ver = get_effective_version(dataset_version, db)

    report_type = payload.get("reportType", "AI Risk Report")
    district = payload.get("district", "All Districts")
    constituency = payload.get("constituency", "All")
    risk_category = payload.get("riskCategory", "All")
    financial_year = payload.get("financialYear", "2025-26")

    query = db.query(Project).filter(Project.dataset_version == ver)
    if district and district != "All Districts":
        query = query.filter(Project.state.ilike(f"%{district}%") | Project.constituency.ilike(f"%{district}%"))
    if constituency and constituency != "All":
        query = query.filter(Project.constituency.ilike(f"%{constituency}%"))
    if risk_category and risk_category != "All":
        query = query.filter(Project.risk_category == risk_category)

    total_projects = query.count()
    funds_allocated = query.with_entities(func.sum(Project.effective_sanction_amount)).scalar() or 0.0
    funds_utilized = query.with_entities(func.sum(Project.expenditure_amount)).scalar() or 0.0
    high_risk_count = query.filter(Project.risk_category.in_(["High", "Critical"])).count()
    anomalies_count = query.filter(Project.anomaly_count > 0).count()
    resolved_count = db.query(Alert).filter(Alert.dataset_version == ver, Alert.status == "Resolved").count()

    report_id = f"RPT-{ver}-{abs(hash(datetime.now().isoformat())) % 1000:03d}"

    summary_text = (
        f"The AI-based monitoring system analysed {total_projects:,} MPLAD projects in dataset {ver} for Financial Year {financial_year}. "
        f"A total of ₹{round(funds_allocated / 10000000.0, 2):,} Crore was allocated, of which ₹{round(funds_utilized / 10000000.0, 2):,} Crore "
        f"({round((funds_utilized / funds_allocated * 100.0), 1) if funds_allocated > 0 else 0}%) has been utilised. "
        f"AI algorithms detected {anomalies_count} anomalous patterns across {district if district != 'All Districts' else 'all monitored regions'}. "
        f"{high_risk_count} projects have been classified as high-risk or critical and require administrative attention."
    )

    return {
        "reportId": report_id,
        "datasetVersion": ver,
        "reportType": report_type,
        "financialYear": financial_year,
        "generatedAt": datetime.now().strftime("%d %B %Y"),
        "totalProjects": f"{total_projects:,}",
        "fundsAnalysed": f"₹{round(funds_allocated / 10000000.0, 1)} Cr",
        "highRiskProjects": str(high_risk_count),
        "anomaliesDetected": str(anomalies_count),
        "resolvedCases": str(resolved_count),
        "pendingAction": str(max(0, high_risk_count - resolved_count)),
        "summary": summary_text
    }


@router.get("/export")
def export_dataset(
    dataset_version: Optional[str] = Query(None),
    dataset_type: str = Query("projects", pattern="^(projects|alerts|vendors|state_risk|mp_risk)$"),
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db)
):
    """Exports filtered dataset as CSV or JSON stream for specific dataset version."""
    ver = get_effective_version(dataset_version, db)
    
    file_map = {
        "projects": f"project_risk_results_{ver}.csv",
        "alerts": f"anomaly_alerts_{ver}.csv",
        "vendors": f"vendor_payment_distribution_{ver}.csv",
        "state_risk": f"state_risk_summary_{ver}.csv",
        "mp_risk": f"mp_risk_summary_{ver}.csv",
    }
    canonical_map = {
        "projects": "project_risk_results.csv",
        "alerts": "anomaly_alerts.csv",
        "vendors": "vendor_payment_distribution.csv",
        "state_risk": "state_risk_summary.csv",
        "mp_risk": "mp_risk_summary.csv",
    }

    target_file = Path("data/processed") / file_map[dataset_type]
    if not target_file.exists():
        target_file = Path("data/processed") / canonical_map[dataset_type]

    if not target_file.exists():
        raise HTTPException(status_code=404, detail=f"Export file for {dataset_type} not found")

    df = pd.read_csv(target_file)

    if format == "csv":
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=mplad_{dataset_type}_{ver}_export.csv"
        return response
    else:
        return df.to_dict(orient="records")

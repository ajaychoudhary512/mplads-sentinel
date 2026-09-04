from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_

from backend.db.database import get_db
from backend.db.models import Project, ExpenditureTransaction, Alert, AuditLog, DatasetVersion

router = APIRouter(prefix="/api/projects", tags=["Projects"])


def get_effective_version(dataset_version: Optional[str], db: Session) -> str:
    if dataset_version and dataset_version.strip():
        return dataset_version.strip()
    active_v = db.query(DatasetVersion).filter(DatasetVersion.is_active == True).first()
    return active_v.version_id if active_v else "V1"


@router.get("")
def list_projects(
    dataset_version: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort_by: str = Query("risk_score"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Paginated, filterable, and searchable project listing strictly filtered by dataset_version."""
    ver = get_effective_version(dataset_version, db)
    query = db.query(Project).filter(Project.dataset_version == ver)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Project.work_id.ilike(s),
                Project.work_description.ilike(s),
                Project.constituency.ilike(s),
                Project.state.ilike(s),
                Project.vendor_name.ilike(s),
                Project.mp_name.ilike(s)
            )
        )

    if state and state != "All States":
        query = query.filter(Project.state == state)

    if risk_level and risk_level != "All Risk Levels" and risk_level != "All":
        query = query.filter(Project.risk_category == risk_level)

    if status and status != "All Statuses" and status != "All":
        query = query.filter(Project.dashboard_status == status)

    if category and category != "All Categories" and category != "All":
        query = query.filter(Project.work_category == category)

    # Sorting
    sort_column = getattr(Project, sort_by, Project.risk_score)
    if sort_dir.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    projects = query.offset((page - 1) * page_size).limit(page_size).all()

    # Get distinct filter options for this dataset version
    states = [s[0] for s in db.query(Project.state).distinct().filter(Project.dataset_version == ver, Project.state != "").order_by(Project.state).all()]
    categories = [c[0] for c in db.query(Project.work_category).distinct().filter(Project.dataset_version == ver, Project.work_category != "").order_by(Project.work_category).all()]

    items = []
    for p in projects:
        items.append({
            "id": p.work_id,
            "dataset_version": p.dataset_version,
            "name": p.work_description or p.work_id,
            "mp": p.mp_name or "Hon'ble MP",
            "constituency": p.constituency or p.state,
            "district": p.constituency or p.state,
            "state": p.state,
            "category": p.work_category or "Infrastructure",
            "approved": round((p.effective_sanction_amount or 0.0) / 10000000.0, 2),
            "utilized": round((p.expenditure_amount or 0.0) / 10000000.0, 2),
            "completion": 100 if p.dashboard_status == "Completed" else (40 if p.dashboard_status == "Delayed" else 75),
            "status": p.dashboard_status,
            "risk": round(p.risk_score, 1),
            "riskLevel": p.risk_category,
            "lastUpdated": p.sanction_date.strftime("%d %b %Y") if p.sanction_date else "26 Aug 2026",
            "agency": p.ida or "State Implementing Agency",
            "vendor": p.vendor_name or "Registered Implementing Contractor",
            "startDate": p.recommended_date.strftime("%d %b %Y") if p.recommended_date else "01 Jan 2025",
            "expectedCompletion": p.completion_date.strftime("%d %b %Y") if p.completion_date else "31 Dec 2026",
            "explanation": p.explanation,
            "anomaly_type": p.anomaly_type
        })

    return {
        "items": items,
        "total": total,
        "dataset_version": ver,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size else 1,
        "available_states": states,
        "available_categories": categories
    }


@router.get("/{work_id:path}")
def get_project_detail(
    work_id: str,
    dataset_version: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Comprehensive Project Intelligence details, financials, AI factors, transactions, and timeline."""
    ver = get_effective_version(dataset_version, db)
    clean_id = work_id.strip()
    
    p = db.query(Project).filter(
        Project.dataset_version == ver,
        Project.work_id == clean_id
    ).first()
    
    if not p:
        p = db.query(Project).filter(
            Project.dataset_version == ver,
            Project.work_id.ilike(f"%{clean_id}%")
        ).first()
        if not p:
            # Fallback across any version if not specified
            p = db.query(Project).filter(Project.work_id.ilike(f"%{clean_id}%")).first()
            if not p:
                raise HTTPException(status_code=404, detail=f"Project {work_id} not found in dataset {ver}")

    # Fetch transactions
    transactions = db.query(ExpenditureTransaction).filter(
        ExpenditureTransaction.dataset_version == p.dataset_version,
        ExpenditureTransaction.work_id == p.work_id
    ).all()
    
    tx_list = []
    for tx in transactions:
        tx_list.append({
            "id": tx.transaction_id,
            "date": tx.date.strftime("%d %b %Y") if tx.date else "24 Aug 2026",
            "type": "Works Payment",
            "amount": round(tx.amount / 100000.0, 2),  # in Lakhs
            "amount_cr": round(tx.amount / 10000000.0, 2),
            "vendor": tx.vendor_name or p.vendor_name or "Contractor",
            "status": "Flagged" if tx.ai_flag in ("HIGH", "CRITICAL") else "Normal",
            "expected_range": tx.expected_range,
            "deviation_percent": tx.deviation_percent,
            "ai_flag": tx.ai_flag
        })

    # AI Factors breakdown
    ai_factors = [
        {"label": "Cost Anomaly", "score": 24 if p.flag_extreme_cost_overrun or p.flag_cost_overrun else 5, "desc": f"Expenditure {abs(round(p.cost_deviation_pct or 0))}% above sanction" if p.cost_deviation_pct else "Standard expenditure range"},
        {"label": "Delayed Progress", "score": 18 if p.flag_delayed_project else 4, "desc": "Project duration extended beyond normal timeframe" if p.flag_delayed_project else "On schedule"},
        {"label": "Vendor Pattern", "score": 16 if p.flag_suspicious_vendor else 3, "desc": f"Vendor handling {p.vendor_project_count} concurrent projects" if p.vendor_project_count > 1 else "Normal vendor activity"},
        {"label": "Duplicate Transaction Indicator", "score": 14 if p.flag_duplicate_payment else 2, "desc": "Repeated invoice pattern detected" if p.flag_duplicate_payment else "No duplicate payments"},
        {"label": "Geographic Inconsistency", "score": 10 if p.flag_geographic_inconsistency else 1, "desc": "Multi-state contractor operations" if p.flag_geographic_inconsistency else "Local execution"},
    ]

    approved_cr = round((p.effective_sanction_amount or 1000000.0) / 10000000.0, 2)
    utilized_cr = round((p.expenditure_amount or (p.effective_sanction_amount or 1000000.0) * 0.8) / 10000000.0, 2)
    
    financial_stages = [
        {"stage": "Q1", "approved": round(approved_cr * 0.25, 2), "utilized": round(utilized_cr * 0.20, 2)},
        {"stage": "Q2", "approved": round(approved_cr * 0.25, 2), "utilized": round(utilized_cr * 0.30, 2)},
        {"stage": "Q3", "approved": round(approved_cr * 0.25, 2), "utilized": round(utilized_cr * 0.35, 2)},
        {"stage": "Q4 (Est.)", "approved": round(approved_cr * 0.25, 2), "utilized": round(utilized_cr * 0.15, 2)},
    ]

    return {
        "id": p.work_id,
        "dataset_version": p.dataset_version,
        "name": p.work_description or p.work_id,
        "mp": p.mp_name or "Hon'ble MP",
        "constituency": p.constituency or p.state,
        "district": p.constituency or p.state,
        "state": p.state,
        "category": p.work_category or "Infrastructure",
        "approved": approved_cr,
        "utilized": utilized_cr,
        "completion": 100 if p.dashboard_status == "Completed" else (40 if p.dashboard_status == "Delayed" else 75),
        "status": p.dashboard_status,
        "risk": round(p.risk_score, 1),
        "riskLevel": p.risk_category,
        "lastUpdated": p.sanction_date.strftime("%d %b %Y") if p.sanction_date else "26 Aug 2026",
        "agency": p.ida or "State Implementing Agency",
        "vendor": p.vendor_name or "Registered Implementing Contractor",
        "startDate": p.recommended_date.strftime("%d %b %Y") if p.recommended_date else "01 Jan 2025",
        "expectedCompletion": p.completion_date.strftime("%d %b %Y") if p.completion_date else "31 Dec 2026",
        "explanation": p.explanation or "Standard project execution parameters.",
        "anomaly_type": p.anomaly_type,
        "ai_factors": ai_factors,
        "transactions": tx_list,
        "financial_data": financial_stages
    }

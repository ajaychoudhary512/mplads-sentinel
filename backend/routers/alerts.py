from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_

from backend.db.database import get_db
from backend.db.models import Alert, Project, AuditLog, DatasetVersion

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Investigations"])


def get_effective_version(dataset_version: Optional[str], db: Session) -> str:
    if dataset_version and dataset_version.strip():
        return dataset_version.strip()
    active_v = db.query(DatasetVersion).filter(DatasetVersion.is_active == True).first()
    if active_v:
        has_data = db.query(Alert.id).filter(Alert.dataset_version == active_v.version_id).first() is not None
        if has_data:
            return active_v.version_id
    return "V1"


@router.get("")
def list_alerts(
    dataset_version: Optional[str] = Query(None),
    severity: Optional[str] = Query("All"),
    status: Optional[str] = Query("All"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Lists alerts with summary counts and status workflows strictly filtered by dataset_version."""
    ver = get_effective_version(dataset_version, db)
    
    query = db.query(Alert, Project).join(
        Project,
        and_(Alert.work_id == Project.work_id, Alert.dataset_version == Project.dataset_version)
    ).filter(Alert.dataset_version == ver)

    if severity and severity != "All":
        query = query.filter(Alert.severity == severity.upper())

    if status and status != "All":
        query = query.filter(Alert.status == status)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Alert.alert_id.ilike(s),
                Alert.work_id.ilike(s),
                Alert.alert_type.ilike(s),
                Alert.description.ilike(s),
                Project.work_description.ilike(s),
                Project.constituency.ilike(s)
            )
        )

    results = query.order_by(desc(Alert.risk_score)).limit(limit).all()

    # Dynamic counts for this dataset version
    count_critical = db.query(Alert).filter(Alert.dataset_version == ver, Alert.severity == "CRITICAL").count()
    count_high = db.query(Alert).filter(Alert.dataset_version == ver, Alert.severity == "HIGH").count()
    count_medium = db.query(Alert).filter(Alert.dataset_version == ver, Alert.severity == "MEDIUM").count()
    count_resolved = db.query(Alert).filter(Alert.dataset_version == ver, Alert.status == "Resolved").count()

    items = []
    for alert, proj in results:
        items.append({
            "id": alert.alert_id,
            "dataset_version": alert.dataset_version,
            "severity": alert.severity.title(),
            "project": alert.work_id,
            "projectName": proj.work_description or proj.work_id,
            "anomaly": alert.alert_type or "Expenditure Anomaly",
            "description": alert.description or "AI detected unusual parameter requiring review.",
            "amount": f"₹{round((alert.amount or 0.0) / 100000.0, 1)} Lakh" if (alert.amount or 0.0) < 10000000 else f"₹{round((alert.amount or 0.0) / 10000000.0, 2)} Cr",
            "amount_raw": alert.amount,
            "confidence": int(alert.confidence or 88),
            "district": proj.constituency or proj.state,
            "state": proj.state,
            "date": alert.detected_at.strftime("%d %b %Y") if alert.detected_at else "26 Aug 2026",
            "status": alert.status,
            "assignedTo": alert.assigned_to,
            "riskScore": alert.risk_score
        })

    return {
        "dataset_version": ver,
        "counts": {
            "critical": count_critical,
            "high": count_high,
            "medium": count_medium,
            "resolved": count_resolved
        },
        "items": items,
        "total": len(items)
    }


@router.post("/{alert_id}/status")
def update_alert_status(
    alert_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Updates status of an alert (Pending Verification, Under Review, Under Investigation, Resolved, Escalated)."""
    new_status = payload.get("status")
    notes = payload.get("notes", "")
    assigned_to = payload.get("assigned_to")

    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    old_status = alert.status
    alert.status = new_status
    if assigned_to:
        alert.assigned_to = assigned_to
    if notes:
        alert.resolution_notes = notes
    alert.reviewed_at = datetime.now(timezone.utc)

    # Record in audit trail
    audit = AuditLog(
        timestamp=datetime.now(timezone.utc),
        user="Admin Officer",
        role="Administrator",
        action=f"Updated Alert {alert_id} to {new_status}",
        module="Alerts & Investigations",
        project_id=alert.work_id,
        old_value=f"Status: {old_status}",
        new_value=f"Status: {new_status} | Notes: {notes}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "alert_id": alert.alert_id,
        "old_status": old_status,
        "new_status": alert.status,
        "assigned_to": alert.assigned_to,
        "reviewed_at": alert.reviewed_at.strftime("%d %b %Y, %H:%M")
    }


@router.post("/{alert_id}/review")
def mark_under_review(alert_id: str, db: Session = Depends(get_db)):
    return update_alert_status(alert_id, {"status": "Under Review", "notes": "Auditor marked for initial verification"}, db)


@router.post("/{alert_id}/investigate")
def mark_under_investigation(alert_id: str, db: Session = Depends(get_db)):
    return update_alert_status(alert_id, {"status": "Under Investigation", "notes": "Formal inquiry initiated"}, db)


@router.post("/{alert_id}/resolve")
def mark_resolved(alert_id: str, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    notes = payload.get("notes", "Administrative verification complete. Discrepancy explained.")
    return update_alert_status(alert_id, {"status": "Resolved", "notes": notes}, db)


@router.post("/{alert_id}/escalate")
def mark_escalated(alert_id: str, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    notes = payload.get("notes", "Escalated to Ministry Vigilance Division for comprehensive audit.")
    return update_alert_status(alert_id, {"status": "Escalated", "notes": notes}, db)

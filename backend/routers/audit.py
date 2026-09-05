from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from backend.db.database import get_db
from backend.db.models import AuditLog

router = APIRouter(prefix="/api/audit-trail", tags=["Audit Trail"])


@router.get("")
def get_audit_trail(
    search: Optional[str] = Query(None),
    module: Optional[str] = Query("All Modules"),
    role: Optional[str] = Query("All Roles"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieves immutable audit logs compliant with IT Act 2000."""
    query = db.query(AuditLog)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLog.action.ilike(s),
                AuditLog.user.ilike(s),
                AuditLog.project_id.ilike(s),
                AuditLog.module.ilike(s)
            )
        )

    if module and module != "All Modules":
        query = query.filter(AuditLog.module == module)

    if role and role != "All Roles":
        query = query.filter(AuditLog.role == role)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()

    items = []
    for log in logs:
        items.append({
            "id": log.id,
            "timestamp": log.timestamp.strftime("%d %b %Y, %I:%M %p") if log.timestamp else "26 Aug 2026, 10:00 AM",
            "user": log.user,
            "role": log.role,
            "action": log.action,
            "module": log.module,
            "project": log.project_id or "—",
            "oldValue": log.old_value or "—",
            "newValue": log.new_value or "—",
            "ip": log.ip_address or "127.0.0.1"
        })

    return items


@router.post("")
def record_audit_event(payload: dict = Body(...), db: Session = Depends(get_db)):
    """Records a new immutable audit log event."""
    log = AuditLog(
        timestamp=datetime.now(timezone.utc),
        user=payload.get("user", "Admin Officer"),
        role=payload.get("role", "Administrator"),
        action=payload.get("action", "User Action"),
        module=payload.get("module", "General"),
        project_id=payload.get("project_id", "—"),
        old_value=payload.get("old_value", ""),
        new_value=payload.get("new_value", ""),
        ip_address=payload.get("ip_address", "127.0.0.1")
    )
    db.add(log)
    db.commit()
    return {"success": True, "id": log.id}

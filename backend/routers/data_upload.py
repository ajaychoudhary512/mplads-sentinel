import shutil
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Depends, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.db.database import get_db
from backend.db.models import DatasetVersion, AuditLog, Project
from data_pipeline.ingestion.uploader import DatasetValidator

router = APIRouter(prefix="/api/data", tags=["Data Upload & Management"])


def get_next_version_id(db: Session) -> str:
    """Calculates next incremental version string e.g. V1 -> V2 -> V3."""
    versions = db.query(DatasetVersion.version_id).all()
    max_num = 1
    for (v_str,) in versions:
        if v_str.startswith("V"):
            try:
                num = int(v_str[1:])
                if num >= max_num:
                    max_num = num + 1
            except ValueError:
                pass
    return f"V{max_num}"


@router.post("/upload")
async def upload_dataset_files(
    files: List[UploadFile] = File(...),
    mode: str = Query("replace", pattern="^(replace|append)$"),
    dataset_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Uploads single or multiple Excel/CSV files, performs content-based schema auto-classification, and generates validation report."""
    upload_id = f"UPL-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    upload_dir = Path(f"data/uploads/{upload_id}")
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_file_paths = []
    for file in files:
        if not file.filename.lower().endswith((".xlsx", ".xls", ".csv")):
            continue
        dest_path = upload_dir / file.filename
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_file_paths.append(dest_path)

    if not saved_file_paths:
        raise HTTPException(status_code=400, detail="No valid .xlsx, .xls, or .csv files uploaded")

    # Run multi-file validation engine
    validator = DatasetValidator()
    val_report = validator.validate_multi_files(saved_file_paths)

    next_version = get_next_version_id(db)
    final_name = dataset_name or f"MPLAD Dataset {next_version} ({datetime.now().strftime('%B %Y')})"

    # Save staging DatasetVersion record
    ver_record = DatasetVersion(
        version_id=next_version,
        dataset_name=final_name,
        filename=", ".join([p.name for p in saved_file_paths]),
        upload_id=upload_id,
        uploaded_at=datetime.now(timezone.utc),
        uploaded_by="Admin Officer",
        row_count=val_report["total_records"],
        valid_row_count=val_report["total_valid_records"],
        invalid_row_count=val_report["total_records"] - val_report["total_valid_records"],
        is_active=False,
        status="VALIDATED",
        description=f"Uploaded {len(saved_file_paths)} files ({val_report['total_records']:,} rows). Awaiting processing."
    )
    db.add(ver_record)

    # Record Audit Log
    audit = AuditLog(
        timestamp=datetime.now(timezone.utc),
        user="Admin Officer",
        role="Administrator",
        action=f"Uploaded & Validated Dataset ({len(saved_file_paths)} files)",
        module="Data Management",
        project_id="ALL",
        old_value="",
        new_value=f"Upload ID: {upload_id} | Version: {next_version} | Records: {val_report['total_records']}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "upload_id": upload_id,
        "dataset_version": next_version,
        "dataset_name": final_name,
        "status": "VALIDATED",
        "validation_report": val_report,
        "message": f"Successfully uploaded and validated {len(saved_file_paths)} files. Click 'Process Dataset' to run AI analysis."
    }


@router.get("/datasets")
def list_dataset_versions(db: Session = Depends(get_db)):
    """Lists all available dataset versions and their activation status."""
    versions = db.query(DatasetVersion).order_by(desc(DatasetVersion.uploaded_at)).all()
    
    # If no versions exist, fallback
    if not versions:
        p_count = db.query(Project).filter(Project.dataset_version == "V1").count() or 28706
        return [{
            "version_id": "V1",
            "dataset_name": "MPLAD Baseline 2025–26",
            "filename": "Composite (6 Raw Datasets)",
            "uploaded_at": "2026-08-27T10:00:00",
            "uploaded_by": "System",
            "row_count": p_count,
            "is_active": True,
            "status": "READY",
            "model_version": "v1.2.0",
            "last_analysis_at": "2026-08-27T10:00:00",
            "description": "Baseline Master Dataset"
        }]

    res = []
    for v in versions:
        res.append({
            "version_id": v.version_id,
            "dataset_name": v.dataset_name,
            "filename": v.filename,
            "upload_id": v.upload_id,
            "uploaded_at": v.uploaded_at.strftime("%d %b %Y, %H:%M") if v.uploaded_at else "N/A",
            "uploaded_by": v.uploaded_by,
            "row_count": v.row_count,
            "valid_row_count": v.valid_row_count,
            "is_active": bool(v.is_active),
            "status": v.status,
            "model_version": v.model_version,
            "last_analysis_at": v.last_analysis_at.strftime("%d %b %Y, %H:%M") if v.last_analysis_at else "N/A",
            "description": v.description
        })
    return res


@router.get("/datasets/active")
def get_active_dataset(db: Session = Depends(get_db)):
    """Returns metadata for the currently active dataset version."""
    v = db.query(DatasetVersion).filter(DatasetVersion.is_active == True).first()
    if not v:
        v = db.query(DatasetVersion).filter(DatasetVersion.version_id == "V1").first()

    if not v:
        p_count = db.query(Project).count() or 28706
        return {
            "version_id": "V1",
            "dataset_name": "MPLAD Baseline 2025–26",
            "filename": "Composite (6 Raw Datasets)",
            "uploaded_at": "27 Aug 2026",
            "uploaded_by": "System",
            "row_count": p_count,
            "is_active": True,
            "status": "READY",
            "model_version": "v1.2.0",
            "last_analysis_at": "27 Aug 2026",
            "description": "Baseline Master Dataset"
        }

    return {
        "version_id": v.version_id,
        "dataset_name": v.dataset_name,
        "filename": v.filename,
        "upload_id": v.upload_id,
        "uploaded_at": v.uploaded_at.strftime("%d %b %Y") if v.uploaded_at else "N/A",
        "uploaded_by": v.uploaded_by,
        "row_count": v.row_count,
        "is_active": True,
        "status": v.status,
        "model_version": v.model_version,
        "last_analysis_at": v.last_analysis_at.strftime("%d %b %Y") if v.last_analysis_at else "N/A",
        "description": v.description
    }


@router.post("/datasets/{version}/activate")
def activate_dataset_version(version: str, db: Session = Depends(get_db)):
    """Switches the active dataset version (Rollback / Version Switching)."""
    target = db.query(DatasetVersion).filter(DatasetVersion.version_id == version).first()
    if not target:
        raise HTTPException(status_code=404, detail=f"Dataset version '{version}' not found")

    if target.status not in ("READY", "SUPERSEDED"):
        raise HTTPException(status_code=400, detail=f"Cannot activate version '{version}' in status '{target.status}'")

    # Deactivate all, activate target
    db.query(DatasetVersion).update({DatasetVersion.is_active: False, DatasetVersion.status: "SUPERSEDED"})
    target.is_active = True
    target.status = "READY"
    
    audit = AuditLog(
        timestamp=datetime.now(timezone.utc),
        user="Admin Officer",
        role="Administrator",
        action=f"Switched Active Dataset to {version}",
        module="Data Management",
        project_id="ALL",
        old_value="",
        new_value=f"Version: {version} | Name: {target.dataset_name}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "active_version": target.version_id,
        "dataset_name": target.dataset_name,
        "row_count": target.row_count,
        "message": f"Successfully activated dataset {target.version_id} ({target.dataset_name})."
    }

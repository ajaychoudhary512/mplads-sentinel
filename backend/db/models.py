from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index,
    UniqueConstraint,
    func
)
from sqlalchemy.orm import relationship
from backend.db.database import Base


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    version_id = Column(String(50), primary_key=True, index=True)  # V1, V2, V3...
    dataset_name = Column(String(200), nullable=False)
    filename = Column(String(500), default="")
    upload_id = Column(String(100), index=True, default="")
    uploaded_at = Column(DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc))
    uploaded_by = Column(String(100), default="Admin Officer")
    row_count = Column(Integer, default=0)
    valid_row_count = Column(Integer, default=0)
    invalid_row_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=False, index=True)
    status = Column(String(50), default="READY", index=True)  # VALIDATING, PROCESSING, READY, FAILED, SUPERSEDED
    analysis_run_id = Column(String(100), nullable=True)
    model_version = Column(String(50), default="v1.2.0")
    last_analysis_at = Column(DateTime, nullable=True)
    description = Column(Text, default="")
    metadata_json = Column(Text, default="{}")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    work_id = Column(String(120), index=True)
    dataset_version = Column(String(50), default="V1", index=True)
    
    state = Column(String(100), index=True, default="")
    ida = Column(String(200), default="")
    mp_name = Column(String(150), index=True, default="")
    mp_key = Column(String(150), index=True, default="")
    constituency = Column(String(150), index=True, default="")
    work_category = Column(String(150), index=True, default="")
    work_description = Column(Text, default="")
    
    # Financial metrics
    recommended_amount = Column(Float, nullable=True)
    sanction_amount = Column(Float, nullable=True)
    effective_sanction_amount = Column(Float, nullable=True)
    expenditure_amount = Column(Float, nullable=True)
    amount_disbursed = Column(Float, nullable=True)
    allocated_amount = Column(Float, nullable=True)
    cost_overrun_amount = Column(Float, default=0.0)
    cost_deviation_pct = Column(Float, nullable=True)
    utilization_pct = Column(Float, nullable=True)
    remaining_sanction_amount = Column(Float, nullable=True)

    # Dates & Timelines
    recommended_date = Column(DateTime, nullable=True)
    sanction_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    expenditure_date = Column(DateTime, nullable=True)
    recommendation_to_sanction_days = Column(Float, nullable=True)
    project_duration_days = Column(Float, nullable=True)

    # Status
    work_status = Column(String(100), default="")
    completion_status = Column(String(100), default="")
    dashboard_status = Column(String(100), index=True, default="Under Implementation")
    effectively_completed = Column(Integer, default=0)

    # Vendor & Agency
    vendor_name = Column(String(200), index=True, default="")
    vendor_key = Column(String(200), index=True, default="")
    vendor_project_count = Column(Integer, default=0)
    vendor_total_payment = Column(Float, default=0.0)

    # ML & Risk
    risk_score = Column(Float, index=True, default=0.0)
    risk_category = Column(String(50), index=True, default="Low")
    risk_signal_strength = Column(Float, default=50.0)
    ml_anomaly_score = Column(Float, default=0.0)
    rule_score = Column(Float, default=0.0)
    anomaly_count = Column(Integer, default=0)
    anomaly_type = Column(String(255), default="None")
    explanation = Column(Text, default="")
    
    # Rules
    flag_unusual_expenditure = Column(Integer, default=0)
    flag_cost_overrun = Column(Integer, default=0)
    flag_extreme_cost_overrun = Column(Integer, default=0)
    flag_delayed_project = Column(Integer, default=0)
    flag_suspicious_vendor = Column(Integer, default=0)
    flag_multiple_payments = Column(Integer, default=0)
    flag_duplicate_payment = Column(Integer, default=0)
    flag_geographic_inconsistency = Column(Integer, default=0)
    split_payment_flag = Column(Integer, default=0)
    is_govt_body = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_project_work_version", "work_id", "dataset_version"),
        UniqueConstraint("work_id", "dataset_version", name="uq_work_version"),
    )


class ExpenditureTransaction(Base):
    __tablename__ = "expenditures"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(50), index=True)
    work_id = Column(String(120), index=True)
    dataset_version = Column(String(50), default="V1", index=True)
    vendor_name = Column(String(200), index=True, default="")
    amount = Column(Float, default=0.0)
    date = Column(DateTime, nullable=True)
    expected_range = Column(String(100), default="")
    deviation_percent = Column(Float, default=0.0)
    ai_flag = Column(String(50), index=True, default="LOW")
    payment_status = Column(String(100), default="")

    __table_args__ = (
        Index("ix_tx_work_version", "work_id", "dataset_version"),
    )


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor_name = Column(String(200), index=True)
    vendor_key = Column(String(200), index=True)
    dataset_version = Column(String(50), default="V1", index=True)
    state = Column(String(100), default="")
    registration_id = Column(String(100), default="")
    project_count = Column(Integer, default=0)
    total_payments = Column(Float, default=0.0)
    average_project_cost = Column(Float, default=0.0)
    risk_score = Column(Float, default=0.0)
    anomaly_count = Column(Integer, default=0)
    status = Column(String(50), default="Active")

    __table_args__ = (
        Index("ix_vendor_name_version", "vendor_name", "dataset_version"),
    )


class MP(Base):
    __tablename__ = "mps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mp_key = Column(String(150), index=True)
    mp_name = Column(String(150), index=True)
    dataset_version = Column(String(50), default="V1", index=True)
    state = Column(String(100), index=True)
    constituency = Column(String(150), index=True)
    allocated_amount = Column(Float, default=0.0)
    total_sanctioned = Column(Float, default=0.0)
    total_expenditure = Column(Float, default=0.0)
    utilization_pct = Column(Float, default=0.0)
    total_projects = Column(Integer, default=0)
    high_critical_count = Column(Integer, default=0)
    avg_risk_score = Column(Float, default=0.0)

    __table_args__ = (
        Index("ix_mp_key_version", "mp_key", "dataset_version"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String(50), index=True)
    work_id = Column(String(120), index=True)
    dataset_version = Column(String(50), default="V1", index=True)
    analysis_run_id = Column(String(100), nullable=True, index=True)
    
    severity = Column(String(50), index=True, default="MEDIUM")
    risk_score = Column(Float, default=0.0)
    alert_type = Column(String(150), default="Anomaly")
    description = Column(Text, default="")
    amount = Column(Float, default=0.0)
    confidence = Column(Float, default=85.0)
    status = Column(String(50), index=True, default="Pending Verification")
    detected_at = Column(DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc))
    assigned_to = Column(String(150), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_alert_version", "dataset_version", "status"),
    )


class AIAnalysisRun(Base):
    __tablename__ = "ai_analysis_runs"

    run_id = Column(String(50), primary_key=True, index=True)
    dataset_version = Column(String(50), default="V1", index=True)
    status = Column(String(50), default="QUEUED")  # QUEUED, VALIDATING, PROCESSING, ML_ANALYSIS, AGGREGATING, COMPLETED, FAILED
    progress = Column(Integer, default=0)
    stage = Column(String(100), default="Queued")
    date_from = Column(String(50), nullable=True)
    date_to = Column(String(50), nullable=True)
    anomaly_type = Column(String(100), default="all")
    projects_analyzed = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    total_anomalies = Column(Integer, default=0)
    alerts_generated = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc), index=True)
    user = Column(String(100), default="Admin Officer")
    role = Column(String(100), default="Administrator")
    action = Column(String(150), index=True)
    module = Column(String(100), index=True)
    project_id = Column(String(120), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")

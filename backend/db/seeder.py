import logging
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from backend.db.database import engine, Base, SessionLocal
from backend.db.models import Project, ExpenditureTransaction, Vendor, MP, Alert, AuditLog, DatasetVersion

logger = logging.getLogger("backend.seeder")


def seed_database(db: Session = None, force_reseed: bool = False):
    """Populates relational tables from processed CSV datasets."""
    Base.metadata.create_all(bind=engine)
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        project_count = db.query(Project).filter(Project.dataset_version == "V1").count()
        if project_count > 0 and not force_reseed:
            logger.info(f"Database already contains {project_count:,} V1 projects. Skipping seed.")
            # Ensure DatasetVersion record exists
            v1_meta = db.query(DatasetVersion).filter(DatasetVersion.version_id == "V1").first()
            if not v1_meta:
                v1_meta = DatasetVersion(
                    version_id="V1",
                    dataset_name="MPLAD Baseline 2025–26",
                    filename="Composite (6 Raw Datasets)",
                    upload_id="UPL-BASELINE-2026",
                    uploaded_at=datetime.now(timezone.utc),
                    uploaded_by="System Administrator",
                    row_count=project_count,
                    valid_row_count=project_count,
                    invalid_row_count=0,
                    is_active=True,
                    status="READY",
                    model_version="v1.2.0",
                    last_analysis_at=datetime.now(timezone.utc),
                    description="Official Government of India MPLADS Master Baseline Dataset"
                )
                db.add(v1_meta)
                db.commit()
            else:
                active_any = db.query(DatasetVersion).filter(DatasetVersion.is_active == True).first()
                if not active_any:
                    v1_meta.is_active = True
                    v1_meta.status = "READY"
                    db.commit()
            return

        proj_csv = Path("data/processed/project_risk_results.csv")
        if not proj_csv.exists():
            logger.warning(f"{proj_csv} does not exist. Running pipeline first...")
            from data_pipeline.pipeline import MPLADDataPipeline
            MPLADDataPipeline().run()

        logger.info("Seeding database tables from processed datasets...")

        # 1. Projects
        p_df = pd.read_csv(proj_csv)
        p_df = p_df.replace({np.nan: None})

        # Clear existing if force
        if force_reseed:
            db.query(Alert).filter(Alert.dataset_version == "V1").delete()
            db.query(ExpenditureTransaction).filter(ExpenditureTransaction.dataset_version == "V1").delete()
            db.query(Project).filter(Project.dataset_version == "V1").delete()
            db.query(Vendor).filter(Vendor.dataset_version == "V1").delete()
            db.query(MP).filter(MP.dataset_version == "V1").delete()
            db.query(DatasetVersion).filter(DatasetVersion.version_id == "V1").delete()
            db.commit()

        projects_to_insert = []
        for _, row in p_df.iterrows():
            proj = Project(
                work_id=str(row["work_id"]),
                dataset_version="V1",
                state=str(row.get("state") or ""),
                ida=str(row.get("ida") or ""),
                mp_name=str(row.get("mp_name") or ""),
                mp_key=str(row.get("mp_name") or "").upper(),
                constituency=str(row.get("constituency") or ""),
                work_category=str(row.get("work_category") or ""),
                work_description=str(row.get("work_description") or ""),
                recommended_amount=float(row["recommended_amount"]) if row.get("recommended_amount") is not None else None,
                sanction_amount=float(row["sanction_amount"]) if row.get("sanction_amount") is not None else None,
                effective_sanction_amount=float(row["effective_sanction_amount"]) if row.get("effective_sanction_amount") is not None else (float(row["sanction_amount"]) if row.get("sanction_amount") is not None else None),
                expenditure_amount=float(row["expenditure_amount"]) if row.get("expenditure_amount") is not None else None,
                amount_disbursed=float(row["amount_disbursed"]) if row.get("amount_disbursed") is not None else None,
                allocated_amount=float(row["allocated_amount"]) if row.get("allocated_amount") is not None else None,
                cost_overrun_amount=float(row.get("cost_overrun_amount") or 0.0),
                cost_deviation_pct=float(row["cost_deviation_pct"]) if row.get("cost_deviation_pct") is not None else None,
                utilization_pct=float(row["utilization_pct"]) if row.get("utilization_pct") is not None else (float(row["utilization_pct_completed"]) if row.get("utilization_pct_completed") is not None else None),
                remaining_sanction_amount=float(row["remaining_sanction_amount"]) if row.get("remaining_sanction_amount") is not None else None,
                recommended_date=pd.to_datetime(row.get("recommended_date")).to_pydatetime() if pd.notna(row.get("recommended_date")) else None,
                sanction_date=pd.to_datetime(row.get("sanction_date")).to_pydatetime() if pd.notna(row.get("sanction_date")) else None,
                completion_date=pd.to_datetime(row.get("completion_date")).to_pydatetime() if pd.notna(row.get("completion_date")) else None,
                expenditure_date=pd.to_datetime(row.get("expenditure_date")).to_pydatetime() if pd.notna(row.get("expenditure_date")) else None,
                recommendation_to_sanction_days=float(row["recommendation_to_sanction_days"]) if row.get("recommendation_to_sanction_days") is not None else None,
                project_duration_days=float(row["project_duration_days"]) if row.get("project_duration_days") is not None else None,
                work_status=str(row.get("work_status") or ""),
                dashboard_status=str(row.get("dashboard_status") or ("Completed" if row.get("effectively_completed") else "Under Implementation")),
                effectively_completed=int(row.get("effectively_completed") or 0),
                vendor_name=str(row.get("vendor_name") or ""),
                vendor_key=str(row.get("vendor_name") or "").upper(),
                vendor_project_count=int(row.get("vendor_project_count") or 0),
                vendor_total_payment=float(row.get("vendor_total_payment") or 0.0),
                risk_score=float(row.get("risk_score") or 0.0),
                risk_category=str(row.get("risk_category") or "Low"),
                risk_signal_strength=float(row.get("risk_signal_strength") or 50.0),
                ml_anomaly_score=float(row.get("ml_anomaly_score") or 0.0),
                rule_score=float(row.get("rule_score") or 0.0),
                anomaly_count=int(row.get("anomaly_count") or 0),
                anomaly_type=str(row.get("anomaly_type") or "None"),
                explanation=str(row.get("explanation") or ""),
                flag_unusual_expenditure=int(row.get("flag_unusual_expenditure") or 0),
                flag_cost_overrun=int(row.get("flag_cost_overrun") or 0),
                flag_extreme_cost_overrun=int(row.get("flag_extreme_cost_overrun") or 0),
                flag_delayed_project=int(row.get("flag_delayed_project") or 0),
                flag_suspicious_vendor=int(row.get("flag_suspicious_vendor") or 0),
                flag_multiple_payments=int(row.get("flag_multiple_payments") or 0),
                flag_duplicate_payment=int(row.get("flag_duplicate_payment") or 0),
                flag_geographic_inconsistency=int(row.get("flag_geographic_inconsistency") or 0),
                split_payment_flag=int(row.get("split_payment_flag") or 0),
                is_govt_body=bool(row.get("is_govt_body") or False)
            )
            projects_to_insert.append(proj)

        db.bulk_save_objects(projects_to_insert)
        db.commit()
        logger.info(f"Seeded {len(projects_to_insert):,} projects for V1.")

        # 2. Expenditures
        tx_csv = Path("data/processed/transaction_anomaly_report.csv")
        if tx_csv.exists():
            tx_df = pd.read_csv(tx_csv).replace({np.nan: None})
            tx_objects = []
            for _, r in tx_df.iterrows():
                tx_obj = ExpenditureTransaction(
                    transaction_id=str(r["transaction_id"]),
                    work_id=str(r["work_id"]),
                    dataset_version="V1",
                    vendor_name=str(r.get("vendor_name") or ""),
                    amount=float(r.get("amount") or 0.0),
                    date=pd.to_datetime(r.get("date")).to_pydatetime() if pd.notna(r.get("date")) else None,
                    expected_range=str(r.get("expected_range") or ""),
                    deviation_percent=float(r.get("deviation_percent") or 0.0),
                    ai_flag=str(r.get("ai_flag") or "LOW"),
                    payment_status=str(r.get("payment_status") or "")
                )
                tx_objects.append(tx_obj)
            db.bulk_save_objects(tx_objects)
            db.commit()
            logger.info(f"Seeded {len(tx_objects):,} transactions for V1.")

        # 3. Alerts
        alt_csv = Path("data/processed/anomaly_alerts.csv")
        if alt_csv.exists():
            alt_df = pd.read_csv(alt_csv).replace({np.nan: None})
            alt_objects = []
            for _, r in alt_df.iterrows():
                alt_obj = Alert(
                    alert_id=str(r["alert_id"]),
                    work_id=str(r["work_id"]),
                    dataset_version="V1",
                    analysis_run_id="RUN-BASELINE-01",
                    severity=str(r.get("severity") or "HIGH"),
                    risk_score=float(r.get("risk_score") or 75.0),
                    alert_type=str(r.get("anomaly_type") or "Risk Anomaly"),
                    description=str(r.get("explanation") or "AI Anomaly detected"),
                    amount=float(r.get("effective_sanction_amount") or r.get("expenditure_amount") or 0.0),
                    confidence=float(r.get("risk_signal_strength") or 88.0),
                    status=str(r.get("status") or "Pending Verification"),
                    detected_at=datetime.now(timezone.utc)
                )
                alt_objects.append(alt_obj)
            db.bulk_save_objects(alt_objects)
            db.commit()
            logger.info(f"Seeded {len(alt_objects):,} alerts for V1.")

        # 4. Vendors
        v_csv = Path("data/processed/vendor_payment_distribution.csv")
        if v_csv.exists():
            v_df = pd.read_csv(v_csv).replace({np.nan: None})
            v_objects = []
            for i, r in v_df.iterrows():
                v_obj = Vendor(
                    vendor_name=str(r["vendor_name"]),
                    vendor_key=str(r["vendor_name"]).upper(),
                    dataset_version="V1",
                    state="",
                    registration_id=f"GSTIN-{2024000+i:07d}",
                    project_count=int(r.get("projects") or 1),
                    total_payments=float(r.get("total_payment") or 0.0),
                    average_project_cost=float(r.get("avg_cost") or 0.0),
                    risk_score=float(r.get("avg_risk") or 25.0),
                    anomaly_count=1 if float(r.get("avg_risk") or 0) >= 50 else 0,
                    status="Flagged" if float(r.get("avg_risk") or 0) >= 70 else "Active"
                )
                v_objects.append(v_obj)
            db.bulk_save_objects(v_objects)
            db.commit()
            logger.info(f"Seeded {len(v_objects):,} vendors for V1.")

        # 5. MPs
        mp_csv = Path("data/processed/mp_risk_summary.csv")
        if mp_csv.exists():
            mp_df = pd.read_csv(mp_csv).replace({np.nan: None})
            mp_objects = []
            for _, r in mp_df.iterrows():
                mp_obj = MP(
                    mp_key=f"{r.get('state')}_{r.get('mp_name')}".upper(),
                    mp_name=str(r.get("mp_name") or ""),
                    dataset_version="V1",
                    state=str(r.get("state") or ""),
                    constituency="",
                    allocated_amount=0.0,
                    total_sanctioned=float(r.get("total_sanctioned_amount") or 0.0),
                    total_expenditure=0.0,
                    utilization_pct=0.0,
                    total_projects=int(r.get("total_works") or 0),
                    high_critical_count=int(r.get("high_critical_count") or 0),
                    avg_risk_score=float(r.get("avg_risk_score") or 0.0)
                )
                mp_objects.append(mp_obj)
            db.bulk_save_objects(mp_objects)
            db.commit()
            logger.info(f"Seeded {len(mp_objects):,} MPs for V1.")

        # 6. Dataset Version V1 Record
        v1_version = DatasetVersion(
            version_id="V1",
            dataset_name="MPLAD Baseline 2025–26",
            filename="Composite (6 Raw Datasets)",
            upload_id="UPL-BASELINE-2026",
            uploaded_at=datetime.now(timezone.utc),
            uploaded_by="System Administrator",
            row_count=len(projects_to_insert),
            valid_row_count=len(projects_to_insert),
            invalid_row_count=0,
            is_active=True,
            status="READY",
            model_version="v1.2.0",
            last_analysis_at=datetime.now(timezone.utc),
            description="Official Government of India MPLADS Master Baseline Dataset"
        )
        db.add(v1_version)
        db.commit()

        # 7. Audit Trail initial seed
        audit_records = [
            AuditLog(timestamp=datetime.now(timezone.utc), user="System", role="System", action="System Initialization", module="System", project_id="ALL", old_value="", new_value="System Ready with Dataset V1", ip_address="127.0.0.1"),
            AuditLog(timestamp=datetime.now(timezone.utc), user="Admin Officer", role="Administrator", action="Dataset V1 Ingestion Completed", module="Data Management", project_id="ALL", old_value="0 records", new_value=f"{len(projects_to_insert)} records loaded into V1", ip_address="127.0.0.1"),
            AuditLog(timestamp=datetime.now(timezone.utc), user="AI Risk Engine", role="System", action="Risk Scoring Run Completed", module="AI Risk", project_id="ALL", old_value="", new_value="Model v1.2.0 executed for V1", ip_address="127.0.0.1")
        ]
        db.bulk_save_objects(audit_records)
        db.commit()

        logger.info("Database seeding for V1 completed successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        if should_close:
            db.close()

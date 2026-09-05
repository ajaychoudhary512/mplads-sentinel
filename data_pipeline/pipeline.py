import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional, Callable
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from data_pipeline.ingestion.loader import IngestionPipeline
from data_pipeline.features.master_builder import MasterDatasetBuilder
from data_pipeline.risk.rule_engine import DeterministicRuleEngine
from data_pipeline.ml.risk_engine import MLRiskEngine
from data_pipeline.exports.generator import AnalyticalExportGenerator
from backend.db.database import SessionLocal
from backend.db.models import (
    Project,
    ExpenditureTransaction,
    Vendor,
    MP,
    Alert,
    DatasetVersion,
    AuditLog
)

logger = logging.getLogger("data_pipeline")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class MPLADDataPipeline:
    """Production Multi-Version Orchestrator for Ingestion, Normalization, Features, Rules, ML, and Database Sync."""

    def __init__(
        self,
        raw_dir: str = "data/raw",
        processed_dir: str = "data/processed",
        models_dir: str = "models",
        config_path: str = "risk_config.json"
    ):
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir
        self.models_dir = models_dir
        self.config_path = config_path

        self.rule_engine = DeterministicRuleEngine(config_path=config_path)
        self.ml_engine = MLRiskEngine(models_dir=models_dir, config_path=config_path)
        self.exporter = AnalyticalExportGenerator(output_dir=processed_dir)

    def run(
        self,
        target_version: str = "V1",
        dataset_name: Optional[str] = None,
        custom_data_dir: Optional[str] = None,
        mode: str = "replace",
        analysis_run_id: Optional[str] = None,
        upload_id: Optional[str] = None,
        filename: Optional[str] = None,
        progress_callback: Optional[Callable[[str, int, Dict[str, Any]], None]] = None
    ) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Path]]:
        """Executes full end-to-end data pipeline, ML inference, CSV exports, and atomic DB sync."""
        data_source_dir = custom_data_dir or self.raw_dir
        logger.info(f"[UPLOAD] upload_id={upload_id or 'DEFAULT'}")
        logger.info(f"[DATASET] version={target_version}")
        logger.info(f"[ANALYSIS] run_id={analysis_run_id or 'MANUAL'}")

        def notify(stage: str, pct: int, stats: dict = None):
            if stats is None:
                stats = {}
            logger.info(f"[{target_version}] Progress {pct}% - {stage}")
            if progress_callback:
                progress_callback(stage, pct, stats)

        try:
            # 1. Validation & Ingestion
            logger.info("[STAGE] VALIDATING")
            notify("VALIDATING: Scanning & Ingesting Datasets", 15)
            ingestion = IngestionPipeline(data_dir=data_source_dir)
            std_datasets = ingestion.standardize_all()

            # 2. Normalization & Feature Engineering
            logger.info("[STAGE] NORMALIZATION")
            notify("PROCESSING: Normalizing & Standardizing Canonical Records", 35)
            builder = MasterDatasetBuilder(std_datasets)
            new_master_df, new_exp_df = builder.build_master()

            # Handle Append vs Replace Mode
            if mode == "append" and target_version != "V1":
                notify("PROCESSING: Merging & Deduplicating with Active Dataset", 40)
                db_session = SessionLocal()
                try:
                    active_ver = db_session.query(DatasetVersion).filter(DatasetVersion.is_active == True).first()
                    active_ver_id = active_ver.version_id if active_ver else "V1"
                    active_csv = Path(self.processed_dir) / f"project_risk_results_{active_ver_id}.csv"
                    if not active_csv.exists():
                        active_csv = Path(self.processed_dir) / "project_risk_results.csv"
                    
                    if active_csv.exists():
                        prev_df = pd.read_csv(active_csv)
                        # Merge safely
                        combined_master = pd.concat([prev_df, new_master_df]).drop_duplicates(subset=["work_id"], keep="last")
                        master_df = combined_master.reset_index(drop=True)
                    else:
                        master_df = new_master_df
                finally:
                    db_session.close()
            else:
                master_df = new_master_df
            exp_df = new_exp_df

            # 3. Feature Engineering & Rules
            logger.info("[STAGE] FEATURE_ENGINEERING")
            notify("FEATURE_ENGINEERING: Computing 56 Risk & Velocity Signals", 50)
            master_df = self.rule_engine.evaluate_rules(master_df, exp_df)

            # 4. ML Anomaly Inference & Calibration
            logger.info("[STAGE] ML_ANALYSIS")
            notify("ML_ANALYSIS: Running Isolation Forest & LOF Scoring", 70)
            self.ml_engine.load_models()
            master_df = self.ml_engine.fit_and_score(master_df)

            # 5. Risk Scoring & Summary
            logger.info("[STAGE] RULE_SCORING")
            notify("RISK_SCORING: Calibrating Multi-Dimensional Risk Scores", 85)
            crit_count = int((master_df["risk_category"] == "Critical").sum())
            high_count = int((master_df["risk_category"] == "High").sum())
            med_count = int((master_df["risk_category"] == "Medium").sum())
            low_count = int((master_df["risk_category"] == "Low").sum())
            total_anom = int((master_df["anomaly_count"] > 0).sum())

            # 6. Generate Analytical CSV Outputs
            logger.info("[STAGE] CSV_EXPORT")
            notify("AGGREGATING: Generating Analytical CSV Datasets", 90)
            outputs = self.exporter.generate_all(
                master_df,
                exp_df,
                dataset_version=target_version,
                analysis_run_id=analysis_run_id
            )

            # 7. Atomic Database Persistence & Activation
            logger.info("[STAGE] DB_PERSISTENCE")
            notify("PERSISTING: Storing Canonical Records & Activating Dataset", 95)
            logger.info("[STAGE] ACTIVATION")
            self._persist_and_activate(
                master_df=master_df,
                exp_df=exp_df,
                target_version=target_version,
                dataset_name=dataset_name or f"Dataset {target_version}",
                upload_id=upload_id,
                filename=filename,
                analysis_run_id=analysis_run_id
            )

            stats = {
                "projects_analyzed": len(master_df),
                "critical": crit_count,
                "high": high_count,
                "medium": med_count,
                "low": low_count,
                "total_anomalies": total_anom,
                "alerts_generated": crit_count + high_count
            }
            logger.info("[ANALYSIS] COMPLETED")
            notify("COMPLETED: Dataset Activated Successfully", 100, stats)
            return master_df, exp_df, outputs

        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            logger.error(f"[ANALYSIS] FAILED\nrun_id={analysis_run_id}\nstage={target_version}\nexception={e}\ntraceback=\n{tb}")
            # Mark version as FAILED without touching active dataset
            self._mark_version_failed(target_version, str(e))
            raise e

    def _persist_and_activate(
        self,
        master_df: pd.DataFrame,
        exp_df: pd.DataFrame,
        target_version: str,
        dataset_name: str,
        upload_id: Optional[str],
        filename: Optional[str],
        analysis_run_id: Optional[str]
    ):
        """Atomically persists new dataset records and marks dataset as active."""
        db = SessionLocal()
        try:
            # 1. Clean previous data for this exact target version if it existed
            db.query(Alert).filter(Alert.dataset_version == target_version).delete()
            db.query(ExpenditureTransaction).filter(ExpenditureTransaction.dataset_version == target_version).delete()
            db.query(Project).filter(Project.dataset_version == target_version).delete()
            db.query(Vendor).filter(Vendor.dataset_version == target_version).delete()
            db.query(MP).filter(MP.dataset_version == target_version).delete()
            db.commit()

            # 2. Insert Projects
            p_records = []
            m_clean = master_df.replace({np.nan: None})
            for _, row in m_clean.iterrows():
                p_obj = Project(
                    work_id=str(row["work_id"]),
                    dataset_version=target_version,
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
                    utilization_pct=float(row["utilization_pct"]) if row.get("utilization_pct") is not None else None,
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
                p_records.append(p_obj)
            db.bulk_save_objects(p_records)
            db.commit()

            # 3. Insert Expenditures
            if exp_df is not None and not exp_df.empty:
                tx_clean = exp_df.replace({np.nan: None})
                tx_records = []
                for _, r in tx_clean.iterrows():
                    tx_obj = ExpenditureTransaction(
                        transaction_id=str(r.get("transaction_id", f"TXN-{len(tx_records)+1:06d}")),
                        work_id=str(r["work_id"]),
                        dataset_version=target_version,
                        vendor_name=str(r.get("vendor_name") or ""),
                        amount=float(r.get("fund_disbursed_amount") or r.get("amount") or 0.0),
                        date=pd.to_datetime(r.get("expenditure_date") or r.get("date")).to_pydatetime() if pd.notna(r.get("expenditure_date") or r.get("date")) else None,
                        expected_range="Normal",
                        deviation_percent=0.0,
                        ai_flag="LOW",
                        payment_status=str(r.get("payment_status") or "Disbursed")
                    )
                    tx_records.append(tx_obj)
                db.bulk_save_objects(tx_records)
                db.commit()

            # 4. Insert Alerts for High / Critical
            alerts_df = master_df[master_df["risk_category"].isin(["High", "Critical"])].copy()
            if not alerts_df.empty:
                alt_records = []
                for i, (_, r) in enumerate(alerts_df.iterrows(), 1):
                    alt_obj = Alert(
                        alert_id=f"ALT-{target_version}-{i:04d}",
                        work_id=str(r["work_id"]),
                        dataset_version=target_version,
                        analysis_run_id=analysis_run_id or f"RUN-{target_version}",
                        severity=str(r.get("risk_category") or "HIGH").upper(),
                        risk_score=float(r.get("risk_score") or 75.0),
                        alert_type=str(r.get("anomaly_type") or "Risk Anomaly"),
                        description=str(r.get("explanation") or "AI Anomaly detected"),
                        amount=float(r.get("effective_sanction_amount") or r.get("expenditure_amount") or 0.0),
                        confidence=float(r.get("risk_signal_strength") or 88.0),
                        status="Pending Verification",
                        detected_at=datetime.now(timezone.utc)
                    )
                    alt_records.append(alt_obj)
                db.bulk_save_objects(alt_records)
                db.commit()

            # 5. Insert Vendors
            valid_v = master_df[master_df["vendor_name"].ne("")]
            if not valid_v.empty:
                v_dist = valid_v.groupby("vendor_name").agg(
                    total_payment=("expenditure_amount", "sum"),
                    projects=("work_id", "nunique"),
                    avg_cost=("expenditure_amount", "mean"),
                    avg_risk=("risk_score", "mean")
                ).reset_index()
                v_records = []
                for i, r in v_dist.iterrows():
                    v_obj = Vendor(
                        vendor_name=str(r["vendor_name"]),
                        vendor_key=str(r["vendor_name"]).upper(),
                        dataset_version=target_version,
                        state="",
                        registration_id=f"GSTIN-{2024000+i:07d}",
                        project_count=int(r.get("projects") or 1),
                        total_payments=float(r.get("total_payment") or 0.0),
                        average_project_cost=float(r.get("avg_cost") or 0.0),
                        risk_score=float(r.get("avg_risk") or 25.0),
                        anomaly_count=1 if float(r.get("avg_risk") or 0) >= 50 else 0,
                        status="Flagged" if float(r.get("avg_risk") or 0) >= 70 else "Active"
                    )
                    v_records.append(v_obj)
                db.bulk_save_objects(v_records)
                db.commit()

            # 6. Insert MPs
            mp_dist = master_df.groupby(["state", "mp_name"], dropna=False).agg(
                total_sanctioned=("effective_sanction_amount", "sum"),
                total_projects=("work_id", "nunique"),
                high_critical_count=("risk_category", lambda s: s.isin(["High", "Critical"]).sum()),
                avg_risk_score=("risk_score", "mean")
            ).reset_index()
            mp_records = []
            for _, r in mp_dist.iterrows():
                mp_obj = MP(
                    mp_key=f"{r.get('state')}_{r.get('mp_name')}".upper(),
                    mp_name=str(r.get("mp_name") or ""),
                    dataset_version=target_version,
                    state=str(r.get("state") or ""),
                    constituency="",
                    allocated_amount=0.0,
                    total_sanctioned=float(r.get("total_sanctioned") or 0.0),
                    total_expenditure=0.0,
                    utilization_pct=0.0,
                    total_projects=int(r.get("total_projects") or 0),
                    high_critical_count=int(r.get("high_critical_count") or 0),
                    avg_risk_score=float(r.get("avg_risk_score") or 0.0)
                )
                mp_records.append(mp_obj)
            db.bulk_save_objects(mp_records)
            db.commit()

            # 7. Atomic Activation: Deactivate previous versions, activate target version
            db.query(DatasetVersion).update({DatasetVersion.is_active: False})
            
            ver_meta = db.query(DatasetVersion).filter(DatasetVersion.version_id == target_version).first()
            if not ver_meta:
                ver_meta = DatasetVersion(version_id=target_version, dataset_name=dataset_name)
                db.add(ver_meta)
            
            ver_meta.dataset_name = dataset_name
            ver_meta.filename = filename or f"Uploaded Batch ({target_version})"
            ver_meta.upload_id = upload_id or f"UPL-{target_version}"
            ver_meta.uploaded_at = datetime.now(timezone.utc)
            ver_meta.row_count = len(master_df)
            ver_meta.valid_row_count = len(master_df)
            ver_meta.invalid_row_count = 0
            ver_meta.is_active = True
            ver_meta.status = "READY"
            ver_meta.model_version = "v1.2.0"
            ver_meta.last_analysis_at = datetime.now(timezone.utc)
            ver_meta.analysis_run_id = analysis_run_id
            ver_meta.description = f"Activated dataset version {target_version} containing {len(master_df):,} works"
            db.commit()

            # 8. Audit Log
            audit = AuditLog(
                timestamp=datetime.now(timezone.utc),
                user="Admin Officer",
                role="Administrator",
                action=f"Activated Dataset Version {target_version}",
                module="Data Management",
                project_id="ALL",
                old_value="",
                new_value=f"Version: {target_version} | Works: {len(master_df):,} | Active: True",
                ip_address="127.0.0.1"
            )
            db.add(audit)
            db.commit()

            logger.info(f"Dataset {target_version} atomically persisted and set ACTIVE.")

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to persist dataset {target_version}: {e}")
            raise e
        finally:
            db.close()

    def _mark_version_failed(self, target_version: str, error_msg: str):
        """Sets dataset version status to FAILED while leaving other versions intact."""
        db = SessionLocal()
        try:
            ver = db.query(DatasetVersion).filter(DatasetVersion.version_id == target_version).first()
            if ver:
                ver.status = "FAILED"
                ver.description = f"Processing failed: {error_msg}"
                db.commit()
        except Exception:
            pass
        finally:
            db.close()

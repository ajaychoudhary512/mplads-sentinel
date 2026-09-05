import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd

from data_pipeline.features.master_builder import pct

logger = logging.getLogger("data_pipeline.export_generator")


class AnalyticalExportGenerator:
    """Generates all target CSV datasets deterministically from processed master dataset with multi-version tagging."""

    def __init__(self, output_dir: str = "data/processed"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_all(
        self,
        master_df: pd.DataFrame,
        exp_df: pd.DataFrame = None,
        dataset_version: str = "V1",
        analysis_run_id: Optional[str] = None
    ) -> Dict[str, Path]:
        """Generates all required analytical CSV outputs with version tags."""
        outputs = {}
        m = master_df.copy()

        m["dataset_version"] = dataset_version
        if analysis_run_id:
            m["analysis_run_id"] = analysis_run_id

        # 1. project_risk_results.csv
        m["analysis_mode"] = np.where(m["effectively_completed"] == 1, "Audit", "Early-Warning")
        m["utilization_pct_completed"] = np.where(m["effectively_completed"] == 1, m["utilization_pct"], np.nan)
        m["known_false_positive"] = False

        target_project_cols = [
            "work_id", "dataset_version", "state", "constituency", "mp_name", "work_category",
            "sanction_amount", "work_status", "analysis_mode", "effectively_completed",
            "risk_score", "risk_category", "n_signals_available", "split_payment_flag",
            "is_govt_body", "any_is_anomaly_v2", "any_is_anomaly_lof", "cost_deviation_pct",
            "utilization_pct_completed", "recommendation_to_sanction_days",
            "rule_expenditure_over_sanction", "rule_extreme_delay", "rule_vendor_concentration",
            "known_false_positive"
        ]

        extra_cols = [
            "effective_sanction_amount", "expenditure_amount", "amount_disbursed",
            "allocated_amount", "recommended_date", "sanction_date", "completion_date",
            "expenditure_date", "project_duration_days", "vendor_name", "vendor_project_count",
            "vendor_total_payment", "anomaly_count", "anomaly_type", "ml_anomaly_score",
            "rule_score", "risk_signal_strength", "explanation", "dashboard_status",
            "analysis_run_id"
        ]
        
        all_cols = target_project_cols + [c for c in extra_cols if c in m.columns and c not in target_project_cols]
        project_results = m[[c for c in all_cols if c in m.columns]].sort_values("risk_score", ascending=False)
        
        p_path = self.output_dir / "project_risk_results.csv"
        p_v_path = self.output_dir / f"project_risk_results_{dataset_version}.csv"
        project_results.to_csv(p_path, index=False)
        project_results.to_csv(p_v_path, index=False)
        outputs["project_risk_results"] = p_path
        outputs[f"project_risk_results_{dataset_version}"] = p_v_path
        logger.info(f"Saved {p_path} & {p_v_path} ({len(project_results)} records)")

        # 2. state_risk_summary.csv
        state_summary = (
            m.groupby("state", dropna=False)
            .agg(
                total_works=("work_id", "nunique"),
                works_with_sanction_data=("sanction_amount", lambda s: s.notna().sum()),
                total_sanctioned_amount=("effective_sanction_amount", "sum"),
                high_critical_count=("risk_category", lambda s: s.isin(["High", "Critical"]).sum()),
                avg_risk_score=("risk_score", "mean"),
                max_risk_score=("risk_score", "max"),
                critical_count=("risk_category", lambda s: (s == "Critical").sum()),
                high_count=("risk_category", lambda s: (s == "High").sum()),
                medium_count=("risk_category", lambda s: (s == "Medium").sum()),
                low_count=("risk_category", lambda s: (s == "Low").sum()),
            )
            .reset_index()
        )
        state_summary["dataset_version"] = dataset_version
        state_summary["high_critical_rate_pct"] = np.round(
            pct(state_summary["high_critical_count"], state_summary["total_works"]),
            2
        )
        state_summary["small_sample_warning"] = state_summary["total_works"] < 10
        state_summary = state_summary.sort_values("high_critical_rate_pct", ascending=False)
        
        s_path = self.output_dir / "state_risk_summary.csv"
        s_v_path = self.output_dir / f"state_risk_summary_{dataset_version}.csv"
        state_summary.to_csv(s_path, index=False)
        state_summary.to_csv(s_v_path, index=False)
        outputs["state_risk_summary"] = s_path
        outputs[f"state_risk_summary_{dataset_version}"] = s_v_path
        logger.info(f"Saved {s_path} & {s_v_path} ({len(state_summary)} states)")

        # 3. mp_risk_summary.csv
        mp_summary = (
            m.groupby(["state", "mp_name"], dropna=False)
            .agg(
                total_works=("work_id", "nunique"),
                works_with_sanction_data=("sanction_amount", lambda s: s.notna().sum()),
                total_sanctioned_amount=("effective_sanction_amount", "sum"),
                high_critical_count=("risk_category", lambda s: s.isin(["High", "Critical"]).sum()),
                avg_risk_score=("risk_score", "mean"),
                max_risk_score=("risk_score", "max"),
                critical_count=("risk_category", lambda s: (s == "Critical").sum()),
                high_count=("risk_category", lambda s: (s == "High").sum()),
                medium_count=("risk_category", lambda s: (s == "Medium").sum()),
                low_count=("risk_category", lambda s: (s == "Low").sum()),
            )
            .reset_index()
        )
        mp_summary["dataset_version"] = dataset_version
        mp_summary["high_critical_rate_pct"] = np.round(
            pct(mp_summary["high_critical_count"], mp_summary["total_works"]),
            2
        )
        mp_summary["small_sample_warning"] = mp_summary["total_works"] < 5
        mp_summary = mp_summary.sort_values("high_critical_rate_pct", ascending=False)
        
        mp_path = self.output_dir / "mp_risk_summary.csv"
        mp_v_path = self.output_dir / f"mp_risk_summary_{dataset_version}.csv"
        mp_summary.to_csv(mp_path, index=False)
        mp_summary.to_csv(mp_v_path, index=False)
        outputs["mp_risk_summary"] = mp_path
        outputs[f"mp_risk_summary_{dataset_version}"] = mp_v_path
        logger.info(f"Saved {mp_path} & {mp_v_path} ({len(mp_summary)} MPs)")

        # 4. anomaly_alerts.csv
        alerts = m[m["risk_category"].isin(["High", "Critical"])].copy()
        if not alerts.empty:
            alerts["alert_id"] = [f"ALT-{dataset_version}-{i:04d}" for i in range(1, len(alerts) + 1)]
            alerts["severity"] = alerts["risk_category"].str.upper()
            alerts["status"] = "Pending Verification"
            alerts["dataset_version"] = dataset_version
            alerts["analysis_run_id"] = analysis_run_id or f"RUN-{dataset_version}"
            alerts["action_required"] = np.where(
                alerts["risk_category"].eq("Critical"),
                "Immediate administrative verification",
                "Review supporting records"
            )
        else:
            alerts = pd.DataFrame(columns=["alert_id", "work_id", "dataset_version", "severity", "status", "risk_score", "action_required"])
            
        alt_path = self.output_dir / "anomaly_alerts.csv"
        alt_v_path = self.output_dir / f"anomaly_alerts_{dataset_version}.csv"
        alerts.to_csv(alt_path, index=False)
        alerts.to_csv(alt_v_path, index=False)
        outputs["anomaly_alerts"] = alt_path
        outputs[f"anomaly_alerts_{dataset_version}"] = alt_v_path

        # 5. transaction_anomaly_report.csv
        if exp_df is not None and not exp_df.empty:
            tx = exp_df.copy()
            q10 = float(tx["fund_disbursed_amount"].quantile(0.10)) if tx["fund_disbursed_amount"].notna().any() else 0.0
            q90 = float(tx["fund_disbursed_amount"].quantile(0.90)) if tx["fund_disbursed_amount"].notna().any() else 0.0
            vendor_stats = tx.groupby("vendor_key")["fund_disbursed_amount"].agg(
                v10=lambda s: s.quantile(0.10),
                v90=lambda s: s.quantile(0.90)
            )

            tx_records = []
            for _, row in tx.iterrows():
                vk = row["vendor_key"]
                if vk in vendor_stats.index:
                    low = vendor_stats.loc[vk, "v10"]
                    high = vendor_stats.loc[vk, "v90"]
                else:
                    low, high = q10, q90
                low = q10 if pd.isna(low) else low
                high = q90 if pd.isna(high) else high
                center = (low + high) / 2.0
                amt = row["fund_disbursed_amount"]
                dev = ((amt - center) / center * 100.0) if pd.notna(amt) and center != 0 else 0.0
                flag = "HIGH" if abs(dev) >= 50 or amt >= 10000000 else "MEDIUM" if abs(dev) >= 20 else "LOW"

                tx_records.append({
                    "transaction_id": row.get("transaction_id", f"TXN-{len(tx_records)+1:06d}"),
                    "work_id": row["work_id"],
                    "dataset_version": dataset_version,
                    "vendor_name": row["vendor_name"],
                    "amount": amt,
                    "date": row["expenditure_date"],
                    "expected_range": f"{low:,.2f} - {high:,.2f}",
                    "deviation_percent": round(dev, 2),
                    "ai_flag": flag,
                    "payment_status": row["payment_status"]
                })
            tx_df = pd.DataFrame(tx_records)
            tx_path = self.output_dir / "transaction_anomaly_report.csv"
            tx_v_path = self.output_dir / f"transaction_anomaly_report_{dataset_version}.csv"
            tx_df.to_csv(tx_path, index=False)
            tx_df.to_csv(tx_v_path, index=False)
            outputs["transaction_anomaly_report"] = tx_path
            outputs[f"transaction_anomaly_report_{dataset_version}"] = tx_v_path

        # 6. vendor_payment_distribution.csv
        valid_v = m[m["vendor_name"].ne("")]
        if not valid_v.empty:
            vendor_dist = valid_v.groupby("vendor_name").agg(
                total_payment=("expenditure_amount", "sum"),
                projects=("work_id", "nunique"),
                avg_cost=("expenditure_amount", "mean"),
                avg_risk=("risk_score", "mean")
            ).reset_index().sort_values("total_payment", ascending=False)
            vendor_dist["dataset_version"] = dataset_version
            v_path = self.output_dir / "vendor_payment_distribution.csv"
            v_v_path = self.output_dir / f"vendor_payment_distribution_{dataset_version}.csv"
            vendor_dist.to_csv(v_path, index=False)
            vendor_dist.to_csv(v_v_path, index=False)
            outputs["vendor_payment_distribution"] = v_path
            outputs[f"vendor_payment_distribution_{dataset_version}"] = v_v_path

        # 7. monthly_expenditure_trend.csv
        m_san = m[m["sanction_date"].notna()].copy()
        if not m_san.empty:
            m_san["month"] = m_san["sanction_date"].dt.to_period("M").astype(str)
            monthly_alloc = m_san.groupby("month")["effective_sanction_amount"].sum().reset_index(name="allocated_amount")
        else:
            monthly_alloc = pd.DataFrame(columns=["month", "allocated_amount"])

        if exp_df is not None and not exp_df.empty:
            exp_clean = exp_df[exp_df["expenditure_date"].notna()].copy()
            if not exp_clean.empty:
                exp_clean["month"] = exp_clean["expenditure_date"].dt.to_period("M").astype(str)
                monthly_exp = exp_clean.groupby("month")["fund_disbursed_amount"].sum().reset_index(name="utilized_amount")
            else:
                monthly_exp = pd.DataFrame(columns=["month", "utilized_amount"])
        else:
            monthly_exp = pd.DataFrame(columns=["month", "utilized_amount"])

        monthly_trend = monthly_alloc.merge(monthly_exp, on="month", how="outer").fillna(0).sort_values("month")
        monthly_trend["dataset_version"] = dataset_version
        tr_path = self.output_dir / "monthly_expenditure_trend.csv"
        tr_v_path = self.output_dir / f"monthly_expenditure_trend_{dataset_version}.csv"
        monthly_trend.to_csv(tr_path, index=False)
        monthly_trend.to_csv(tr_v_path, index=False)
        outputs["monthly_expenditure_trend"] = tr_path
        outputs[f"monthly_expenditure_trend_{dataset_version}"] = tr_v_path

        return outputs

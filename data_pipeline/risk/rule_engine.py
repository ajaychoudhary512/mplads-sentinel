import json
import logging
from pathlib import Path
from typing import Dict, Any, List
import numpy as np
import pandas as pd

logger = logging.getLogger("data_pipeline.rule_engine")


def upper_quantile(s: pd.Series, q: float, minimum: float = 1.0) -> float:
    """Computes upper quantile threshold safely."""
    s_clean = pd.to_numeric(s, errors="coerce").replace([np.inf, -np.inf], np.nan).dropna()
    if len(s_clean) == 0:
        return float(minimum)
    return max(float(s_clean.quantile(q)), float(minimum))


def severity_above(value: pd.Series, threshold: float) -> pd.Series:
    """Return a 0-1 severity that grows after a data-driven threshold.

    The old rules used only a yes/no flag.  That made a project barely above
    a threshold receive exactly the same rule contribution as one far beyond
    it.  Flags are still retained for auditability, while this value preserves
    the magnitude of the observed deviation for the final score.
    """
    safe_threshold = max(float(threshold), 1e-9)
    numeric = pd.to_numeric(value, errors="coerce").fillna(0.0)
    return np.clip(0.5 + 0.5 * ((numeric - safe_threshold) / safe_threshold), 0.0, 1.0) * (numeric >= safe_threshold)


class DeterministicRuleEngine:
    """Evaluates transparent domain rules and anomaly criteria on MPLAD master dataset."""

    def __init__(self, config_path: str = "risk_config.json"):
        self.config_path = Path(config_path)
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if self.config_path.exists():
            try:
                with open(self.config_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error loading {self.config_path}, using defaults: {e}")
        return {
            "low_max": 24.99,
            "medium_max": 49.99,
            "high_max": 74.99,
            "critical_min": 75.0,
            "rule_weights": {
                "flag_unusual_expenditure": 18,
                "flag_extreme_cost_overrun": 18,
                "flag_delayed_project": 14,
                "flag_suspicious_vendor": 14,
                "flag_duplicate_payment": 18,
                "flag_geographic_inconsistency": 8,
                "flag_cost_overrun": 8,
                "flag_transaction_outlier": 8
            }
        }

    def compute_thresholds(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculates robust data-driven thresholds based on upper percentiles."""
        return {
            "cost_overrun_pct": upper_quantile(df["cost_deviation_pct"], 0.95, 15.0),
            "duration_days": upper_quantile(df["project_duration_days"], 0.95, 180.0),
            "vendor_project_count": upper_quantile(df["vendor_project_count"], 0.95, 5.0),
            "transaction_amount": upper_quantile(df["expenditure_amount"], 0.99, 1000000.0),
            "recommendation_to_sanction_days": upper_quantile(df["recommendation_to_sanction_days"], 0.95, 90.0)
        }

    def evaluate_rules(self, df: pd.DataFrame, raw_exp: pd.DataFrame = None) -> pd.DataFrame:
        """Evaluates all deterministic risk signals and calculates the rule score."""
        m = df.copy()
        thresholds = self.compute_thresholds(m)
        logger.info(f"Computed dynamic rule thresholds: {thresholds}")

        # Rule 1: Expenditure > Sanction
        m["flag_cost_overrun"] = (m["cost_overrun_amount"] > 0).astype(int)
        m["rule_expenditure_over_sanction"] = (m["cost_overrun_amount"] > 0)

        # Rule 2: Extreme Cost Overrun
        m["flag_extreme_cost_overrun"] = (m["cost_deviation_pct"] >= thresholds["cost_overrun_pct"]).astype(int)

        # Rule 3: Extreme Completion Delay
        m["flag_delayed_project"] = (
            (m["project_duration_days"] >= thresholds["duration_days"])
            | (m["completion_delay_days"] > 180)
            | m["work_status"].str.contains("delay", case=False, na=False)
        ).astype(int)
        m["rule_extreme_delay"] = (m["flag_delayed_project"] == 1)

        # Rule 4: Suspicious Vendor / Vendor Concentration
        m["flag_suspicious_vendor"] = (
            (m["vendor_project_count"] >= thresholds["vendor_project_count"])
            | (m["vendor_concentration"] >= 0.40)
        ).astype(int)
        m["rule_vendor_concentration"] = (m["flag_suspicious_vendor"] == 1)

        # Rule 5: Multiple / Split Payments
        m["flag_multiple_payments"] = (m["expenditure_transaction_count"] > 1).astype(int)
        m["rule_split_payment"] = (m["expenditure_transaction_count"] > 1)

        # Rule 6: Duplicate Payment pattern
        if raw_exp is not None and not raw_exp.empty:
            exp_dup = raw_exp.copy()
            exp_dup["dup_key"] = (
                exp_dup["work_id"].astype(str)
                + "|"
                + exp_dup["vendor_key"].astype(str)
                + "|"
                + exp_dup["fund_disbursed_amount"].round(2).astype(str)
            )
            dup_keys = set(exp_dup["dup_key"].value_counts().loc[lambda s: s > 1].index)
            m["flag_duplicate_payment"] = m.apply(
                lambda row: int(any(k.startswith(f"{row['work_id']}|{row['vendor_key']}|") for k in dup_keys)),
                axis=1
            )
        else:
            m["flag_duplicate_payment"] = 0

        # Rule 7: Duplicate Beneficiary (not present in source schemas)
        m["flag_duplicate_beneficiary"] = 0

        # Rule 8: Geographic Inconsistency
        m["flag_geographic_inconsistency"] = (m["vendor_state_count"] >= 4).astype(int)

        # Rule 9: Unusual Expenditure & Outliers
        m["flag_unusual_expenditure"] = (m["expenditure_amount"] >= thresholds["transaction_amount"]).astype(int)
        m["flag_transaction_outlier"] = m["flag_unusual_expenditure"]
        m["rule_suspicious_transaction"] = (m["flag_unusual_expenditure"] == 1)

        # Government body detection
        m["is_govt_body"] = m["ida"].str.contains("PWD|COLLECTOR|COMMISSIONER|DISTRICT|AUTHORITY|DEPT|DEPARTMENT|OFFICER|BOARD", case=False, na=False)

        # Total anomaly count
        rule_cols = [
            "flag_unusual_expenditure",
            "flag_cost_overrun",
            "flag_extreme_cost_overrun",
            "flag_delayed_project",
            "flag_suspicious_vendor",
            "flag_multiple_payments",
            "flag_duplicate_payment",
            "flag_geographic_inconsistency",
            "flag_transaction_outlier"
        ]
        m["anomaly_count"] = m[rule_cols].sum(axis=1)

        # Compute a magnitude-aware rule score.  Each flag remains binary for
        # filtering and explanations, but the score records how far this
        # particular project is from its relevant threshold.
        weights = self.config.get("rule_weights", {})
        overrun_pct = pd.to_numeric(m["cost_deviation_pct"], errors="coerce").clip(lower=0).fillna(0.0)
        duration = pd.to_numeric(m["project_duration_days"], errors="coerce").fillna(0.0)
        delay_days = pd.to_numeric(m["completion_delay_days"], errors="coerce").fillna(0.0)
        vendor_projects = pd.to_numeric(m["vendor_project_count"], errors="coerce").fillna(0.0)
        vendor_concentration = pd.to_numeric(m["vendor_concentration"], errors="coerce").fillna(0.0)
        vendor_states = pd.to_numeric(m["vendor_state_count"], errors="coerce").fillna(0.0)
        expenditure = pd.to_numeric(m["expenditure_amount"], errors="coerce").fillna(0.0)

        # Store the component severities as first-class output so an auditor
        # can see why two projects with the same flag have different scores.
        m["severity_cost_overrun"] = np.where(
            m["flag_cost_overrun"].eq(1),
            np.clip(overrun_pct / max(thresholds["cost_overrun_pct"], 1.0), 0.05, 1.0),
            0.0,
        )
        m["severity_extreme_cost_overrun"] = severity_above(overrun_pct, thresholds["cost_overrun_pct"])
        m["severity_delay"] = np.maximum(
            severity_above(duration, thresholds["duration_days"]),
            severity_above(delay_days, 180.0),
        )
        # A text status can be a valid delay signal even when dates are absent.
        m.loc[m["flag_delayed_project"].eq(1) & m["severity_delay"].eq(0), "severity_delay"] = 0.5
        m["severity_vendor"] = np.maximum(
            severity_above(vendor_projects, thresholds["vendor_project_count"]),
            severity_above(vendor_concentration, 0.40),
        )
        m["severity_duplicate_payment"] = m["flag_duplicate_payment"].astype(float)
        m["severity_geographic"] = np.clip((vendor_states - 3.0) / 3.0, 0.0, 1.0)
        m["severity_unusual_expenditure"] = severity_above(expenditure, thresholds["transaction_amount"])

        rule_score_calc = (
            m["severity_unusual_expenditure"] * weights.get("flag_unusual_expenditure", 18)
            + m["severity_extreme_cost_overrun"] * weights.get("flag_extreme_cost_overrun", 18)
            + m["severity_delay"] * weights.get("flag_delayed_project", 14)
            + m["severity_vendor"] * weights.get("flag_suspicious_vendor", 14)
            + m["severity_duplicate_payment"] * weights.get("flag_duplicate_payment", 18)
            + m["severity_geographic"] * weights.get("flag_geographic_inconsistency", 8)
            + m["severity_cost_overrun"] * weights.get("flag_cost_overrun", 8)
            + m["severity_unusual_expenditure"] * weights.get("flag_transaction_outlier", 8)
        )
        m["rule_score"] = np.round(np.clip(rule_score_calc, 0, 100), 2)

        # Anomaly Type Labeling
        anomaly_labels = [
            ("flag_unusual_expenditure", "Unusual Expenditure"),
            ("flag_extreme_cost_overrun", "Cost Overrun"),
            ("flag_delayed_project", "Delayed Project"),
            ("flag_duplicate_payment", "Duplicate Payment"),
            ("flag_suspicious_vendor", "Suspicious Vendor"),
            ("flag_geographic_inconsistency", "Geographic Inconsistency"),
            ("flag_transaction_outlier", "Transaction Outlier")
        ]

        def get_anomaly_type(row):
            types = [lbl for col_name, lbl in anomaly_labels if row.get(col_name) == 1]
            return "; ".join(types) if types else "None"

        m["anomaly_type"] = m.apply(get_anomaly_type, axis=1)

        # Human-readable Explanation
        def get_explanation(row):
            reasons = []
            if row.get("flag_unusual_expenditure"):
                reasons.append("expenditure is in an extreme upper range")
            if row.get("flag_extreme_cost_overrun"):
                reasons.append("cost deviation is unusually high vs sanction")
            elif row.get("flag_cost_overrun"):
                reasons.append("expenditure exceeds sanctioned budget")
            if row.get("flag_delayed_project"):
                reasons.append("project implementation duration is unusually prolonged")
            if row.get("flag_suspicious_vendor"):
                reasons.append("vendor has high project concentration")
            if row.get("flag_duplicate_payment"):
                reasons.append("possible repeated work/vendor/amount payment pattern")
            if row.get("flag_geographic_inconsistency"):
                reasons.append("vendor operates across multiple distant states")
            return "; ".join(reasons) if reasons else "No material anomaly signal detected."

        m["explanation"] = m.apply(get_explanation, axis=1)
        return m

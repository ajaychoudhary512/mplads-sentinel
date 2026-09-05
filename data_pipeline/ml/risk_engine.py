import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from datetime import datetime
import numpy as np
import pandas as pd

logger = logging.getLogger("data_pipeline.ml_engine")

ML_FEATURES = [
    "recommended_amount",
    "effective_sanction_amount",
    "expenditure_amount",
    "allocated_amount",
    "utilization_pct",
    "cost_overrun_amount",
    "cost_deviation_pct",
    "remaining_sanction_amount",
    "recommendation_to_sanction_days",
    "sanction_to_expenditure_days",
    "project_duration_days",
    "allocation_utilization_pct",
    "mp_total_projects",
    "mp_total_sanction_amount",
    "mp_total_expenditure_amount",
    "mp_utilization_pct",
    "category_median_sanction",
    "cost_vs_category_median_pct",
    "vendor_project_count",
    "vendor_total_payment",
    "vendor_average_payment",
    "vendor_mp_count",
    "vendor_state_count",
    "vendor_payment_share_pct",
    "expenditure_transaction_count",
    "calamity_count",
    "calamity_consent_amount"
]


class MLRiskEngine:
    """Manages Isolation Forest, LOF, and ensemble anomaly scoring for MPLAD projects."""

    def __init__(self, models_dir: str = "models", config_path: str = "risk_config.json"):
        self.models_dir = Path(models_dir)
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.model_metadata: Dict[str, Any] = {}
        self.scaler: Optional[StandardScaler] = None
        self.isolation_forest: Optional[IsolationForest] = None
        self.lof: Optional[LocalOutlierFactor] = None

    def _load_config(self) -> Dict[str, Any]:
        if self.config_path.exists():
            try:
                with open(self.config_path, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "low_max": 24.99,
            "medium_max": 49.99,
            "high_max": 74.99,
            "critical_min": 75.0,
            "ml_weight": 0.60,
            "rule_weight": 0.40
        }

    def load_models(self) -> bool:
        """Attempts to load pre-trained models from disk."""
        import joblib
        meta_path = self.models_dir / "model_metadata.json"
        if meta_path.exists():
            try:
                with open(meta_path, "r") as f:
                    self.model_metadata = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read model metadata: {e}")

        scaler_path = self.models_dir / "scaler.joblib"
        if scaler_path.exists():
            try:
                self.scaler = joblib.load(scaler_path)
            except Exception as e:
                logger.warning(f"Could not load scaler: {e}")

        if_path = self.models_dir / "isolation_forest.joblib"
        if if_path.exists():
            try:
                self.isolation_forest = joblib.load(if_path)
            except Exception as e:
                logger.warning(f"Could not load Isolation Forest: {e}")

        lof_path = self.models_dir / "lof_v2.joblib"
        if lof_path.exists():
            try:
                self.lof = joblib.load(lof_path)
            except Exception as e:
                logger.warning(f"Could not load LOF: {e}")

        return self.isolation_forest is not None

    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame]:
        """Extracts, cleans, and scales the feature matrix."""
        from sklearn.preprocessing import StandardScaler
        if len(df) == 0:
            return np.empty((0, len(ML_FEATURES))), pd.DataFrame(columns=ML_FEATURES)

        X = df.reindex(columns=ML_FEATURES).copy()
        X = X.replace([np.inf, -np.inf], np.nan)

        for col in ML_FEATURES:
            med = float(X[col].median()) if X[col].notna().any() else 0.0
            X[col] = X[col].fillna(med)
            
            # Robust quantile clipping
            lo = float(X[col].quantile(0.01))
            hi = float(X[col].quantile(0.99))
            if not np.isfinite(lo):
                lo = med - 1.0
            if not np.isfinite(hi):
                hi = med + 1.0
            if lo == hi:
                lo -= 1.0
                hi += 1.0
            X[col] = X[col].clip(lo, hi)

        if self.scaler is None:
            self.scaler = StandardScaler()
            XS = self.scaler.fit_transform(X)
        else:
            try:
                XS = self.scaler.transform(X)
            except Exception:
                # Re-fit scaler if feature shapes evolved
                self.scaler = StandardScaler()
                XS = self.scaler.fit_transform(X)

        return XS, X

    def fit_and_score(self, df: pd.DataFrame) -> pd.DataFrame:
        """Runs complete ML inference or training pipeline and computes final risk scores."""
        from sklearn.ensemble import IsolationForest
        from sklearn.neighbors import LocalOutlierFactor
        m = df.copy()
        if len(m) == 0:
            m["ml_anomaly_score"] = 0.0
            m["any_is_anomaly_v2"] = 0
            m["lof_anomaly_score"] = 0.0
            m["any_is_anomaly_lof"] = 0
            m["risk_score"] = 0.0
            m["risk_category"] = "Low"
            m["anomaly_type"] = "None"
            m["explanation"] = ""
            return m

        XS, X_clean = self.prepare_features(m)

        # Train / infer Isolation Forest
        logger.info("[ML] Isolation Forest started")
        if self.isolation_forest is None:
            logger.info(f"Fitting fresh Isolation Forest on {len(m)} records...")
            contamination = min(max(0.05, 10.0 / max(len(m), 100.0)), 0.15)
            self.isolation_forest = IsolationForest(
                n_estimators=300,
                contamination=contamination,
                random_state=42,
                n_jobs=-1
            )
            self.isolation_forest.fit(XS)

        raw_anomaly = -self.isolation_forest.decision_function(XS)
        lo, hi = np.quantile(raw_anomaly, [0.01, 0.99])
        if hi <= lo:
            hi = lo + 1e-9

        m["ml_anomaly_score"] = np.clip(((raw_anomaly - lo) / (hi - lo)) * 100.0, 0, 100)
        m["any_is_anomaly_v2"] = (m["ml_anomaly_score"] >= 70).astype(int)
        logger.info("[ML] Isolation Forest completed")

        # LOF Anomaly scoring
        try:
            logger.info("[ML] LOF started")
            n_samples = len(XS)
            n_neighbors = min(20, max(2, n_samples - 1))
            if self.lof is None or not hasattr(self.lof, "decision_function") or getattr(self.lof, "n_neighbors", 20) != n_neighbors:
                self.lof = LocalOutlierFactor(n_neighbors=n_neighbors, novelty=True)
                self.lof.fit(XS)
            lof_scores = -self.lof.decision_function(XS)
            lof_lo, lof_hi = np.quantile(lof_scores, [0.01, 0.99])
            if lof_hi <= lof_lo:
                lof_hi = lof_lo + 1e-9
            m["lof_anomaly_score"] = np.clip(((lof_scores - lof_lo) / (lof_hi - lof_lo)) * 100.0, 0, 100)
            m["any_is_anomaly_lof"] = (m["lof_anomaly_score"] >= 70).astype(int)
            logger.info("[ML] LOF completed")
        except Exception as e:
            logger.warning(f"LOF scoring notice: {e}")
            m["lof_anomaly_score"] = m["ml_anomaly_score"]
            m["any_is_anomaly_lof"] = m["any_is_anomaly_v2"]

        # Combined Weighted Risk Score
        ml_w = self.config.get("ml_weight", 0.60)
        rule_w = self.config.get("rule_weight", 0.40)
        rule_score = m["rule_score"] if "rule_score" in m.columns else 0.0

        m["risk_score"] = np.round(
            np.clip(ml_w * m["ml_anomaly_score"] + rule_w * rule_score, 0, 100),
            2
        )

        # Categorization based on transparent thresholds
        low_max = self.config.get("low_max", 24.99)
        med_max = self.config.get("medium_max", 49.99)
        high_max = self.config.get("high_max", 74.99)

        m["risk_category"] = np.select(
            [
                m["risk_score"] >= high_max,
                m["risk_score"] >= med_max,
                m["risk_score"] >= low_max
            ],
            ["Critical", "High", "Medium"],
            default="Low"
        )

        m["risk_signal_strength"] = np.round(
            np.clip(50.0 + (m["risk_score"] - 50.0) * 1.25, 0, 100),
            1
        )

        # Save model metadata
        self.model_metadata = {
            "model_version": "1.2.0",
            "last_run": datetime.now().isoformat(),
            "algorithm": "Isolation Forest + LOF + Deterministic Rules",
            "training_rows": len(m),
            "features_used": ML_FEATURES,
            "feature_count": len(ML_FEATURES),
            "contamination": 0.05,
            "weights": {"ml_weight": ml_w, "rule_weight": rule_w},
            "thresholds": {"low_max": low_max, "medium_max": med_max, "high_max": high_max}
        }
        self._save_metadata()

        return m

    def _save_metadata(self):
        self.models_dir.mkdir(parents=True, exist_ok=True)
        try:
            with open(self.models_dir / "model_metadata.json", "w") as f:
                json.dump(self.model_metadata, f, indent=2)
        except Exception as e:
            logger.warning(f"Error saving model metadata: {e}")

import logging
from typing import Dict, Tuple, Optional
import numpy as np
import pandas as pd

from data_pipeline.normalization.normalizer import (
    normalize_text,
    normalize_namekey,
)

logger = logging.getLogger("data_pipeline.master_builder")


def pct(a: pd.Series, b: pd.Series) -> pd.Series:
    """Safe percentage calculation avoiding zero/inf division."""
    a_num = pd.to_numeric(a, errors="coerce")
    b_num = pd.to_numeric(b, errors="coerce")
    res = np.where(
        pd.notna(b_num) & (b_num != 0),
        (a_num / b_num) * 100.0,
        np.nan
    )
    return pd.Series(res, index=a.index)


class MasterDatasetBuilder:
    """Builds canonical project-level dataset from standardized source dataframes."""

    def __init__(self, standardized_datasets: Dict[str, pd.DataFrame]):
        self.std = standardized_datasets

    def build_master(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Builds canonical master project dataset and transaction dataset.
        Returns (master_df, transaction_df).
        """
        rec_df = self.std.get("recommended", pd.DataFrame())
        san_df = self.std.get("sanctioned", pd.DataFrame())
        comp_df = self.std.get("completed", pd.DataFrame())
        exp_df = self.std.get("expenditure", pd.DataFrame())
        alloc_df = self.std.get("allocation", pd.DataFrame())
        cal_df = self.std.get("calamity", pd.DataFrame())

        # Clean work_ids
        rec = rec_df[rec_df["work_id"].ne("")].sort_values(["work_id", "recommended_date"]).drop_duplicates("work_id", keep="last") if not rec_df.empty else pd.DataFrame()
        san = san_df[san_df["work_id"].ne("")].sort_values(["work_id", "sanction_date"]).drop_duplicates("work_id", keep="last") if not san_df.empty else pd.DataFrame()
        comp = comp_df[comp_df["work_id"].ne("")].sort_values(["work_id", "completion_date"]).drop_duplicates("work_id", keep="last") if not comp_df.empty else pd.DataFrame()

        # Build clean transaction records
        exp = exp_df[exp_df["work_id"].ne("")].copy() if not exp_df.empty else pd.DataFrame()
        if not exp.empty:
            exp["transaction_id"] = [f"TXN-{i:06d}" for i in range(1, len(exp) + 1)]
            
            # Aggregate expenditures to work level
            expg = exp.groupby("work_id", as_index=False).agg(
                expenditure_amount=("fund_disbursed_amount", "sum"),
                expenditure_date=("expenditure_date", "max"),
                vendor_name=("vendor_name", lambda s: next((normalize_text(x) for x in s if normalize_text(x)), "")),
                vendor_key=("vendor_key", lambda s: next((normalize_text(x) for x in s if normalize_text(x)), "")),
                expenditure_transaction_count=("transaction_id", "count"),
                payment_status=("payment_status", lambda s: next((normalize_text(x) for x in s if normalize_text(x)), ""))
            )
        else:
            expg = pd.DataFrame(columns=["work_id", "expenditure_amount", "expenditure_date", "vendor_name", "vendor_key", "expenditure_transaction_count", "payment_status"])

        # Merge projects outer to preserve every single project without loss
        all_work_ids = set()
        for df_sub in [rec, san, comp, expg]:
            if not df_sub.empty and "work_id" in df_sub.columns:
                all_work_ids.update(df_sub["work_id"].dropna().unique())

        master = pd.DataFrame({"work_id": sorted(all_work_ids)})

        # Merge datasets onto master
        if not rec.empty:
            master = master.merge(rec[["work_id", "recommended_date", "recommended_amount", "state", "ida", "mp_name", "mp_key", "constituency", "work_category", "work_description"]], on="work_id", how="left")
        
        if not san.empty:
            san_sub = san[["work_id", "sanction_date", "sanction_amount", "work_status", "state", "ida", "mp_name", "mp_key", "constituency", "work_category", "work_description"]]
            master = master.merge(san_sub, on="work_id", how="left", suffixes=("", "_san"))
            # Backfill missing metadata from sanctioned records
            for col in ["state", "ida", "mp_name", "mp_key", "constituency", "work_category", "work_description"]:
                san_col = f"{col}_san"
                if san_col in master.columns:
                    master[col] = master[col].fillna("").replace("", np.nan).combine_first(master[san_col].fillna("").replace("", np.nan)).fillna("")
                    master.drop(columns=[san_col], inplace=True)

        if not comp.empty:
            comp_sub = comp[["work_id", "completion_date", "amount_disbursed", "completion_status", "state", "ida", "mp_name", "mp_key", "constituency", "work_category", "work_description"]]
            master = master.merge(comp_sub, on="work_id", how="left", suffixes=("", "_comp"))
            for col in ["state", "ida", "mp_name", "mp_key", "constituency", "work_category", "work_description"]:
                comp_col = f"{col}_comp"
                if comp_col in master.columns:
                    master[col] = master[col].fillna("").replace("", np.nan).combine_first(master[comp_col].fillna("").replace("", np.nan)).fillna("")
                    master.drop(columns=[comp_col], inplace=True)

        if not expg.empty:
            master = master.merge(expg, on="work_id", how="left")

        # Merge MP Allocation
        if not alloc_df.empty:
            alloc_agg = alloc_df.groupby("mp_key", as_index=False).agg(
                allocated_amount=("allocated_amount", "sum"),
                allocation_state=("state", "first"),
                allocation_constituency=("constituency", "first")
            )
            master = master.merge(alloc_agg, on="mp_key", how="left")
        else:
            master["allocated_amount"] = np.nan

        # Merge Calamity
        if not cal_df.empty:
            cal_agg = cal_df.groupby("mp_key", as_index=False).agg(
                calamity_count=("calamity_name", lambda s: s.astype(str).replace("", np.nan).notna().sum()),
                calamity_consent_amount=("consent_amount", "sum"),
                calamity_types=("calamity_type", lambda s: "; ".join(sorted(set(normalize_text(x) for x in s if normalize_text(x)))))
            )
            master = master.merge(cal_agg, on="mp_key", how="left")
        else:
            master["calamity_count"] = 0
            master["calamity_consent_amount"] = 0.0
            master["calamity_types"] = ""

        # Normalize numeric and date datatypes
        for c in ["recommended_amount", "sanction_amount", "expenditure_amount", "amount_disbursed", "allocated_amount", "calamity_consent_amount"]:
            if c not in master.columns:
                master[c] = np.nan
            master[c] = pd.to_numeric(master[c], errors="coerce")

        for c in ["recommended_date", "sanction_date", "expenditure_date", "completion_date"]:
            if c not in master.columns:
                master[c] = pd.NaT
            master[c] = pd.to_datetime(master[c], errors="coerce")

        for c in ["state", "ida", "mp_name", "mp_key", "constituency", "work_category", "work_description", "work_status", "completion_status", "vendor_name", "vendor_key", "payment_status", "calamity_types"]:
            if c not in master.columns:
                master[c] = ""
            master[c] = master[c].fillna("").astype(str)

        # Feature Engineering
        master = self._engineer_features(master, exp)
        logger.info(f"Master dataset built with {len(master):,} unique projects and {len(master.columns)} features.")
        return master, exp

    def _engineer_features(self, m: pd.DataFrame, exp: pd.DataFrame) -> pd.DataFrame:
        """Computes all domain, financial, temporal, vendor, and category features."""
        m = m.copy()

        # Financial Core
        m["effective_sanction_amount"] = m["sanction_amount"].combine_first(m["recommended_amount"])
        m["cost_overrun_amount"] = m["expenditure_amount"] - m["effective_sanction_amount"]
        m["cost_deviation_pct"] = pct(m["cost_overrun_amount"], m["effective_sanction_amount"])
        m["utilization_pct"] = pct(m["expenditure_amount"], m["effective_sanction_amount"])
        m["remaining_sanction_amount"] = m["effective_sanction_amount"] - m["expenditure_amount"]
        m["allocation_utilization_pct"] = pct(m["effective_sanction_amount"], m["allocated_amount"])
        m["expenditure_over_sanction_ratio"] = np.where(
            pd.notna(m["effective_sanction_amount"]) & (m["effective_sanction_amount"] > 0),
            m["expenditure_amount"] / m["effective_sanction_amount"],
            np.nan
        )

        # Temporal Core
        m["recommendation_to_sanction_days"] = (m["sanction_date"] - m["recommended_date"]).dt.days
        m["sanction_to_expenditure_days"] = (m["expenditure_date"] - m["sanction_date"]).dt.days
        m["project_duration_days"] = (m["completion_date"] - m["recommended_date"]).dt.days
        m["completion_delay_days"] = np.where(
            m["completion_date"].notna() & m["sanction_date"].notna(),
            (m["completion_date"] - m["sanction_date"]).dt.days - 365,
            np.nan
        )

        # Status normalization
        m["effectively_completed"] = (
            m["completion_date"].notna()
            | m["completion_status"].str.contains("complete", case=False, na=False)
            | m["work_status"].str.contains("complete", case=False, na=False)
        ).astype(int)

        m["dashboard_status"] = np.select(
            [
                m["effectively_completed"].eq(1),
                m["work_status"].str.contains("delay", case=False, na=False),
                m["work_status"].str.contains("ongoing|implementation|sanction|physical inspection", case=False, na=False)
            ],
            ["Completed", "Delayed", "Under Implementation"],
            default="Under Implementation"
        )

        # MP Aggregations
        m["mp_total_projects"] = m.groupby("mp_key")["work_id"].transform("count")
        m["mp_total_sanction_amount"] = m.groupby("mp_key")["effective_sanction_amount"].transform("sum")
        m["mp_total_expenditure_amount"] = m.groupby("mp_key")["expenditure_amount"].transform("sum")
        m["mp_utilization_pct"] = pct(m["mp_total_expenditure_amount"], m["mp_total_sanction_amount"])

        # Category Aggregations
        m["category_median_sanction"] = m.groupby("work_category")["effective_sanction_amount"].transform("median")
        m["cost_vs_category_median_pct"] = pct(m["effective_sanction_amount"] - m["category_median_sanction"], m["category_median_sanction"])

        # Vendor Aggregations
        valid_vendor = m["vendor_key"].ne("")
        m["vendor_project_count"] = np.where(valid_vendor, m.groupby("vendor_key")["work_id"].transform("count"), 0)
        m["vendor_total_payment"] = np.where(valid_vendor, m.groupby("vendor_key")["expenditure_amount"].transform("sum"), 0.0)
        m["vendor_average_payment"] = np.where(valid_vendor, m.groupby("vendor_key")["expenditure_amount"].transform("mean"), 0.0)
        m["vendor_mp_count"] = np.where(valid_vendor, m.groupby("vendor_key")["mp_key"].transform("nunique"), 0)
        m["vendor_state_count"] = np.where(valid_vendor, m.groupby("vendor_key")["state"].transform("nunique"), 0)
        m["vendor_payment_share_pct"] = pct(m["expenditure_amount"], m["vendor_total_payment"])
        m["vendor_concentration"] = np.where(valid_vendor, m["vendor_project_count"] / np.maximum(m["mp_total_projects"], 1), 0.0)

        # Split payment and transaction count
        m["expenditure_transaction_count"] = m["expenditure_transaction_count"].fillna(0)
        m["split_payment_flag"] = (m["expenditure_transaction_count"] > 1).astype(int)
        m["n_signals_available"] = (
            m["sanction_amount"].notna().astype(int)
            + m["expenditure_amount"].notna().astype(int)
            + m["completion_date"].notna().astype(int)
            + m["recommended_date"].notna().astype(int)
            + (m["vendor_key"].ne("")).astype(int)
        )

        return m

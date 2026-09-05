import os
import glob
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import numpy as np
import pandas as pd

from data_pipeline.normalization.normalizer import (
    normalize_text,
    normalize_header,
    normalize_namekey,
    normalize_amount,
    normalize_date,
    normalize_work_id,
)

logger = logging.getLogger("data_pipeline.ingestion")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

REQUIRED_SCHEMAS = {
    "completed": {
        "sr no", "work category", "work", "state", "ida",
        "honble members of parliament", "constituency",
        "completion date", "amount disbursed"
    },
    "expenditure": {
        "sr no", "state", "work", "work id", "ida",
        "honble members of parliament", "constituency",
        "expenditure date", "vendor name", "payment status",
        "fund disbursed amount"
    },
    "calamity": {
        "sr no", "calamity type", "calamity name",
        "honble members of parliament", "date of consent",
        "consent amount"
    },
    "recommended": {
        "sr no", "work category", "work", "state", "ida",
        "honble members of parliament", "constituency",
        "recommended date", "recommended amount", "sanction date"
    },
    "allocation": {
        "sr no", "state", "honble members of parliaments",
        "constituency", "allocated amount"
    },
    "sanctioned": {
        "sr no", "work category", "work", "state", "ida",
        "honble members of parliament", "constituency",
        "recommended date", "sanction date",
        "sanction amount", "work status"
    }
}

FILENAME_HINTS = {
    "completed": ["completed"],
    "expenditure": ["expenditure", "on-going", "ongoing"],
    "calamity": ["calamity", "consent"],
    "recommended": ["recommended"],
    "allocation": ["allocated", "limit"],
    "sanctioned": ["sanctioned"]
}


def find_header_row(df_raw: pd.DataFrame) -> int:
    """
    Detect the header row even if there are title rows or blank rows before headers.
    Scans the first 10 rows and finds the row that matches the most known header terms.
    """
    all_known_terms = set()
    for req in REQUIRED_SCHEMAS.values():
        all_known_terms.update(req)
    all_known_terms.update({"sr", "state", "ida", "work", "amount", "date", "constituency", "vendor", "category", "status"})

    best_row = 0
    best_score = -1

    for row_idx in range(min(15, len(df_raw))):
        row_vals = [normalize_header(v) for v in df_raw.iloc[row_idx].values if pd.notna(v) and str(v).strip()]
        if not row_vals:
            continue
        score = sum(1 for v in row_vals if any(term in v or v in term for term in all_known_terms))
        if score > best_score:
            best_score = score
            best_row = row_idx

    return best_row


def read_file_safely(file_path: str) -> pd.DataFrame:
    """Read an Excel (.xlsx, .xls) or CSV file robustly, handling headers automatically."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = path.suffix.lower()
    if ext in (".xlsx", ".xls"):
        # Use calamine for fast, error-tolerant excel parsing
        try:
            raw = pd.read_excel(path, engine="calamine", header=None)
        except Exception as e:
            logger.warning(f"Calamity reading {path} via calamine failed ({e}), falling back to openpyxl/default")
            raw = pd.read_excel(path, header=None)
    elif ext == ".csv":
        for enc in ("utf-8", "utf-8-sig", "latin1", "cp1252"):
            try:
                raw = pd.read_csv(path, header=None, encoding=enc, low_memory=False)
                break
            except Exception:
                continue
        else:
            raise ValueError(f"Unable to read CSV with standard encodings: {file_path}")
    else:
        raise ValueError(f"Unsupported file format: {ext}")

    # Remove completely empty rows & cols
    raw = raw.dropna(how="all").dropna(axis=1, how="all")

    # Detect header row
    header_idx = find_header_row(raw)
    headers = [normalize_text(h) for h in raw.iloc[header_idx].values]
    
    # Slice dataframe from row after header
    data = raw.iloc[header_idx + 1:].copy()
    data.columns = [h if h else f"col_{i}" for i, h in enumerate(headers)]
    data = data.dropna(how="all")
    return data


def read_file_to_df(file_path: Any) -> Tuple[pd.DataFrame, List[str]]:
    """Helper used by dataset validator to load file and return dataframe plus raw columns list."""
    df = read_file_safely(str(file_path))
    return df, list(df.columns)


def classify_file_type(df: pd.DataFrame, filename: str) -> Tuple[str, float]:
    """Helper used to classify file type."""
    k, score, _ = classify_dataset(df, filename)
    return k.upper(), score


def classify_dataset(df: pd.DataFrame, filename: str) -> Tuple[str, float, List[str]]:
    """Identify dataset type based on column signatures and filename."""
    norm_cols = {normalize_header(c) for c in df.columns}
    best_type = "unknown"
    best_score = -1.0
    missing_for_best = []

    for kind, req_set in REQUIRED_SCHEMAS.items():
        matched = set()
        for r in req_set:
            if any(r in c or c in r for c in norm_cols):
                matched.add(r)
        coverage = len(matched) / max(1, len(req_set))
        bonus = 0.05 if any(hint in filename.lower() for hint in FILENAME_HINTS[kind]) else 0.0
        score = coverage + bonus

        if score > best_score:
            best_score = score
            best_type = kind
            missing_for_best = sorted(req_set - matched)

    return best_type, best_score, missing_for_best


def find_matching_column(df: pd.DataFrame, *aliases: str) -> Optional[str]:
    """Find a column in df matching any of the given aliases."""
    mapping = {normalize_header(c): c for c in df.columns}
    for alias in aliases:
        norm_a = normalize_header(alias)
        if norm_a in mapping:
            return mapping[norm_a]
    # Fuzzy match
    for norm_c, orig_c in mapping.items():
        for alias in aliases:
            norm_a = normalize_header(alias)
            if norm_a and (norm_a in norm_c or norm_c in norm_a):
                return orig_c
    return None


class IngestionPipeline:
    """Manages full dataset ingestion, schema classification, standardization, and quality reporting."""

    def __init__(self, data_dir: str = "data/raw"):
        self.data_dir = Path(data_dir)
        self.raw_datasets: Dict[str, pd.DataFrame] = {}
        self.standardized_datasets: Dict[str, pd.DataFrame] = {}
        self.data_quality_report: pd.DataFrame = pd.DataFrame()
        self.logs: List[str] = []

    def log(self, message: str):
        logger.info(message)
        self.logs.append(message)

    def load_all_datasets(self) -> Dict[str, pd.DataFrame]:
        """Loads and classifies all 6 Excel/CSV files in the data directory."""
        files = list(self.data_dir.glob("*.xlsx")) + list(self.data_dir.glob("*.csv"))
        if not files:
            # Check for parent dataset dir or Downloads fallback if needed
            fallback_dir = Path("data/raw")
            files = list(fallback_dir.glob("*.xlsx")) + list(fallback_dir.glob("*.csv"))

        self.log(f"Found {len(files)} files in {self.data_dir}")
        quality_rows = []

        for fpath in files:
            fname = fpath.name
            try:
                df = read_file_safely(str(fpath))
                dtype, score, missing = classify_dataset(df, fname)
                self.log(f"File [{fname}] classified as [{dtype}] (Confidence: {score*100:.1f}%)")

                if dtype != "unknown":
                    self.raw_datasets[dtype] = df

                quality_rows.append({
                    "filename": fname,
                    "classified_type": dtype,
                    "confidence_score": round(score, 3),
                    "total_raw_rows": len(df),
                    "total_raw_cols": len(df.columns),
                    "missing_expected_columns": "; ".join(missing) if missing else "None",
                    "status": "VALID" if score >= 0.65 else "UNRECOGNIZED"
                })
            except Exception as e:
                self.log(f"ERROR reading {fname}: {e}")
                quality_rows.append({
                    "filename": fname,
                    "classified_type": "ERROR",
                    "confidence_score": 0.0,
                    "total_raw_rows": 0,
                    "total_raw_cols": 0,
                    "missing_expected_columns": str(e),
                    "status": "FAILED"
                })

        self.data_quality_report = pd.DataFrame(quality_rows)
        return self.raw_datasets

    def standardize_dataset(self, df: pd.DataFrame, kind: str) -> pd.DataFrame:
        """Transforms a raw dataframe into a canonical schema for its dataset type."""
        d = df.copy()

        def get_col(*aliases):
            return find_matching_column(d, *aliases)

        def get_series(col_name):
            if col_name is None:
                return pd.Series("", index=d.index)
            return d[col_name].map(normalize_text)

        out = pd.DataFrame(index=d.index)

        # Common administrative fields
        out["sr_no"] = get_series(get_col("Sr. No.", "Sr No", "S No"))
        out["state"] = get_series(get_col("State"))
        out["ida"] = get_series(get_col("IDA"))
        mp_col = get_col("Hon'ble Members of Parliament", "Hon'ble Members of Parliaments", "Honble Members of Parliament", "MP Name")
        out["mp_name"] = get_series(mp_col)
        out["mp_key"] = out["mp_name"].map(normalize_namekey)
        out["constituency"] = get_series(get_col("Constituency"))

        if kind == "calamity":
            out["calamity_type"] = get_series(get_col("Calamity Type"))
            out["calamity_name"] = get_series(get_col("Calamity Name"))
            c_col = get_col("Date of Consent", "Consent Date")
            a_col = get_col("Consent Amount", "Amount Consented")
            out["consent_date"] = d[c_col].map(normalize_date) if c_col else pd.NaT
            out["consent_amount"] = d[a_col].map(normalize_amount) if a_col else np.nan
            return out

        if kind == "allocation":
            a_col = get_col("Allocated Amount", "Allocated AMOUNT", "Limit")
            out["allocated_amount"] = d[a_col].map(normalize_amount) if a_col else np.nan
            return out

        # Project level datasets
        work_col = get_col("Work", "WORK")
        work_id_col = get_col("Work ID", "Work_ID")

        raw_work = get_series(work_col)
        raw_work_id = get_series(work_id_col) if work_id_col else raw_work

        # Work ID normalization
        norm_tuples = [normalize_work_id(w) for w in raw_work_id]
        out["original_work_id"] = [t[0] for t in norm_tuples]
        out["work_id"] = [t[1] for t in norm_tuples]
        out["match_method"] = [t[2] for t in norm_tuples]
        out["match_confidence"] = [t[3] for t in norm_tuples]

        out["work_category"] = get_series(get_col("Work Category", "Work category"))
        out["work_description"] = get_series(get_col("Work Description", "Work description"))

        if kind == "recommended":
            rd = get_col("Recommended date", "Recommended Date")
            ra = get_col("Recommended Amount", "RECOMMENDED AMOUNT")
            sd = get_col("Sanction Date", "Sanction date")
            out["recommended_date"] = d[rd].map(normalize_date) if rd else pd.NaT
            out["recommended_amount"] = d[ra].map(normalize_amount) if ra else np.nan
            out["sanction_date"] = d[sd].map(normalize_date) if sd else pd.NaT

        elif kind == "sanctioned":
            rd = get_col("Recommended date", "Recommended Date")
            sd = get_col("Sanction Date", "Sanction date")
            sa = get_col("Sanction Amount", "Sanction AMOUNT")
            ws = get_col("Work Status", "Work status")
            out["recommended_date"] = d[rd].map(normalize_date) if rd else pd.NaT
            out["sanction_date"] = d[sd].map(normalize_date) if sd else pd.NaT
            out["sanction_amount"] = d[sa].map(normalize_amount) if sa else np.nan
            out["work_status"] = get_series(ws)

        elif kind == "completed":
            cd = get_col("Completion Date", "Completion date")
            ad = get_col("Amount Disbursed", "Amount disbursed")
            out["completion_date"] = d[cd].map(normalize_date) if cd else pd.NaT
            out["amount_disbursed"] = d[ad].map(normalize_amount) if ad else np.nan
            out["completion_status"] = "Completed"

        elif kind == "expenditure":
            ed = get_col("Expenditure Date", "Expenditure date")
            vn = get_col("Vendor Name", "Vendor name")
            ps = get_col("Payment Status", "Payment status")
            fa = get_col("Fund Disbursed Amount", "Fund Disbursed AMOUNT")
            out["expenditure_date"] = d[ed].map(normalize_date) if ed else pd.NaT
            out["vendor_name"] = get_series(vn)
            out["vendor_key"] = out["vendor_name"].map(normalize_namekey)
            out["payment_status"] = get_series(ps)
            out["fund_disbursed_amount"] = d[fa].map(normalize_amount) if fa else np.nan

        return out

    def standardize_all(self) -> Dict[str, pd.DataFrame]:
        """Standardizes all loaded raw datasets."""
        if not self.raw_datasets:
            self.load_all_datasets()

        for kind, df in self.raw_datasets.items():
            std_df = self.standardize_dataset(df, kind)
            self.standardized_datasets[kind] = std_df
            self.log(f"Standardized [{kind}]: {len(std_df):,} rows")

        return self.standardized_datasets

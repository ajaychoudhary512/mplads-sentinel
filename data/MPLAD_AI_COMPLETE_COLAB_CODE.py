# ================================================================
# MPLAD AI RISK INTELLIGENCE ENGINE — COMPLETE GOOGLE COLAB
# ================================================================
# HOW TO USE:
# 1) Run this single cell.
# 2) Upload exactly the 6 MPLAD CSV files when prompted.
# 3) The notebook automatically identifies files from their columns.
# 4) It validates, integrates, trains Isolation Forest, creates
#    risk/anomaly/financial outputs, charts, model artifacts and ZIP.
# 5) A download button appears at the end.
#
# NOTE:
# - Current six datasets have no verified fraud labels.
# - Therefore this is anomaly/risk detection, NOT proof of fraud.
# - Duplicate beneficiary detection is disabled because no beneficiary
#   identifier exists in the supplied six schemas.
# ================================================================

!pip -q install -U pandas numpy scikit-learn joblib matplotlib openpyxl ipywidgets

import os, re, json, zipfile, warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from IPython.display import display, HTML, clear_output
from google.colab import files

warnings.filterwarnings("ignore")
pd.set_option("display.max_columns", 200)
pd.set_option("display.width", 200)

# ================================================================
# CONFIG
# ================================================================

OUTPUT_DIR = Path("/content/MPLAD_AI_RESULTS")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ZIP_PATH = Path("/content/MPLAD_AI_RESULTS.zip")
RANDOM_STATE = 42
MODEL_VERSION = "1.1.0"

# ================================================================
# REQUIRED DATASET SCHEMAS
# IMPORTANT: these are raw human-readable names. They are normalized
# before comparison, so Hon'ble and Hon ble variations work.
# ================================================================

REQUIRED = {
    "completed": {
        "sr no", "work category", "work", "state", "ida",
        "hon'ble members of parliament", "constituency",
        "completion date", "amount disbursed"
    },

    "expenditure": {
        "sr no", "state", "work", "work id", "ida",
        "hon'ble members of parliament", "constituency",
        "expenditure date", "vendor name", "payment status",
        "fund disbursed amount"
    },

    "calamity": {
        "sr no", "calamity type", "calamity name",
        "hon'ble members of parliament", "date of consent",
        "consent amount"
    },

    "recommended": {
        "sr no", "work category", "work", "state", "ida",
        "hon'ble members of parliament", "constituency",
        "recommended date", "recommended amount", "sanction date"
    },

    "allocation": {
        "sr no", "state", "hon'ble members of parliaments",
        "constituency", "allocated amount"
    },

    "sanctioned": {
        "sr no", "work category", "work", "state", "ida",
        "hon'ble members of parliament", "constituency",
        "recommended date", "sanction date",
        "sanction amount", "work status"
    }
}

FNAME_TERMS = {
    "completed": ["completed"],
    "expenditure": ["expenditure", "on-going", "ongoing"],
    "calamity": ["calamity", "consent"],
    "recommended": ["recommended"],
    "allocation": ["allocated", "limit"],
    "sanctioned": ["sanctioned"]
}

# ================================================================
# HELPERS
# ================================================================

def nh(x):
    """Normalize column/header text consistently."""
    x = str(x).strip().lower()
    x = x.replace("₹", " ")
    x = x.replace("&", " and ")
    x = re.sub(r"[^a-z0-9]+", " ", x)
    return re.sub(r"\s+", " ", x).strip()

def txt(x):
    if pd.isna(x):
        return ""
    return re.sub(r"\s+", " ", str(x).strip())

def namekey(x):
    x = txt(x).upper()
    x = re.sub(r"[^A-Z0-9]+", " ", x)
    return re.sub(r"\s+", " ", x).strip()

def num(s):
    s = s.astype(str)
    s = s.str.replace(",", "", regex=False)
    s = s.str.replace("₹", "", regex=False)
    s = s.str.replace("INR", "", regex=False)
    s = s.str.replace("Rs.", "", regex=False)
    s = s.str.replace("Rs", "", regex=False)
    return pd.to_numeric(s, errors="coerce")

def dt(s):
    return pd.to_datetime(s, errors="coerce", dayfirst=True)

def wid(x):
    """
    Canonical MPLAD Work ID.
    Handles:
      WS/ MP620 / ABC / 12345
      WS/MP620/ABC/12345
      WS/MP620/ABC/12345 - description
    """
    s = txt(x).upper().replace(" ", "")
    if not s:
        return ""

    # Most specific pattern first.
    m = re.findall(r"(WS/[A-Z0-9]+/[A-Z0-9]+/\d+)", s)
    if m:
        return m[-1]

    # General WS identifier fallback.
    m = re.findall(r"(WS/[A-Z0-9/]+\d+)", s)
    if m:
        return re.sub(r"[^A-Z0-9/]", "", m[-1])

    return s[:120]

def readcsv(path):
    for enc in [None, "utf-8-sig", "latin1"]:
        try:
            if enc is None:
                return pd.read_csv(path, low_memory=False)
            return pd.read_csv(path, encoding=enc, low_memory=False)
        except Exception:
            pass
    raise ValueError(f"Cannot read CSV: {path}")

def classify(df, filename):
    """
    Schema is PRIMARY.
    Filename is only a tiny tie-breaker.
    """
    sig = {nh(c) for c in df.columns}
    candidates = []

    for kind, raw_required in REQUIRED.items():
        required = {nh(c) for c in raw_required}
        matched = required & sig
        coverage = len(matched) / max(1, len(required))
        bonus = 0.01 if any(t in filename.lower()
                            for t in FNAME_TERMS[kind]) else 0.0
        candidates.append({
            "type": kind,
            "coverage": coverage,
            "matched": len(matched),
            "required": len(required),
            "score": coverage + bonus,
            "missing": sorted(required - sig)
        })

    candidates.sort(key=lambda x: x["score"], reverse=True)
    best = candidates[0]
    return best, candidates

def col(df, *aliases):
    """
    Exact normalized match first, then safe fuzzy match.
    """
    mapping = {nh(c): c for c in df.columns}

    for alias in aliases:
        a = nh(alias)
        if a in mapping:
            return mapping[a]

    # fuzzy fallback
    for c in df.columns:
        nc = nh(c)
        for alias in aliases:
            na = nh(alias)
            if na and (na in nc or nc in na):
                return c

    return None

def standardize(df, kind):
    d = df.copy()
    d.columns = [txt(c) for c in d.columns]

    def g(*aliases):
        return col(d, *aliases)

    def S(c):
        if c is None:
            return pd.Series("", index=d.index)
        return d[c].map(txt)

    o = pd.DataFrame(index=d.index)

    sr = g("Sr. No.")
    state = g("State")
    ida = g("IDA")
    mp = g("Hon'ble Members of Parliament",
            "Hon'ble Members of Parliaments")
    constituency = g("Constituency")

    o["sr_no"] = S(sr)
    o["state"] = S(state)
    o["ida"] = S(ida)
    o["mp_name"] = S(mp)
    o["mp_key"] = o["mp_name"].map(namekey)
    o["constituency"] = S(constituency)

    if kind == "calamity":
        o["calamity_type"] = S(g("Calamity Type"))
        o["calamity_name"] = S(g("Calamity Name"))
        c = g("Date of Consent")
        a = g("Consent Amount")
        o["consent_date"] = dt(d[c]) if c else pd.NaT
        o["consent_amount"] = num(d[a]) if a else np.nan
        return o

    if kind == "allocation":
        a = g("Allocated AMOUNT", "Allocated Amount")
        o["allocated_amount"] = num(d[a]) if a else np.nan
        return o

    work_col = g("Work", "WORK")
    work_id_col = g("Work ID")

    o["work_raw"] = S(work_col)

    if work_id_col:
        o["work_id"] = d[work_id_col].map(wid)
    else:
        o["work_id"] = o["work_raw"].map(wid)

    o["work_category"] = S(g("Work Category"))
    o["work_description"] = S(
        g("Work Description", "Work description")
    )

    if kind == "recommended":
        rd = g("Recommended date")
        ra = g("RECOMMENDED AMOUNT", "Recommended Amount")
        sd = g("Sanction Date")
        o["recommended_date"] = dt(d[rd]) if rd else pd.NaT
        o["recommended_amount"] = num(d[ra]) if ra else np.nan
        o["sanction_date"] = dt(d[sd]) if sd else pd.NaT

    elif kind == "sanctioned":
        rd = g("Recommended date")
        sd = g("Sanction Date")
        sa = g("Sanction Amount")
        ws = g("Work Status")

        o["recommended_date"] = dt(d[rd]) if rd else pd.NaT
        o["sanction_date"] = dt(d[sd]) if sd else pd.NaT
        o["sanction_amount"] = num(d[sa]) if sa else np.nan
        o["work_status"] = S(ws)

    elif kind == "completed":
        cd = g("Completion Date")
        ad = g("Amount Disbursed")

        o["completion_date"] = dt(d[cd]) if cd else pd.NaT
        o["amount_disbursed"] = num(d[ad]) if ad else np.nan
        o["completion_status"] = "Completed"

    elif kind == "expenditure":
        ed = g("Expenditure Date")
        vn = g("Vendor Name")
        ps = g("Payment Status")
        fa = g("Fund Disbursed Amount")

        o["expenditure_date"] = dt(d[ed]) if ed else pd.NaT
        o["vendor_name"] = S(vn)
        o["vendor_key"] = o["vendor_name"].map(namekey)
        o["payment_status"] = S(ps)
        o["fund_disbursed_amount"] = num(d[fa]) if fa else np.nan

    return o

def pct(a, b):
    a = pd.to_numeric(a, errors="coerce")
    b = pd.to_numeric(b, errors="coerce")
    return np.where(
        pd.notna(b) & (b != 0),
        a / b * 100,
        np.nan
    )

def upper_quantile(s, q, minimum=1):
    s = pd.to_numeric(s, errors="coerce")
    s = s.replace([np.inf, -np.inf], np.nan).dropna()
    if len(s) == 0:
        return float(minimum)
    return max(float(s.quantile(q)), float(minimum))

def safe_sheet(name):
    name = re.sub(r"[^A-Za-z0-9_]+", "_", name)
    return name[:31] or "Sheet"

# ================================================================
# STEP 1 — UPLOAD
# ================================================================

print("=" * 76)
print("🇮🇳 MPLAD AI RISK INTELLIGENCE ENGINE")
print("=" * 76)
print("\n📂 Upload ALL 6 MPLAD CSV files together.\n")

uploaded = files.upload()

if len(uploaded) != 6:
    raise RuntimeError(
        f"❌ Expected exactly 6 CSV files, but received {len(uploaded)}."
    )

UPLOADED_FILES = {
    fn: Path("/content") / fn
    for fn in uploaded.keys()
}

# ================================================================
# STEP 2 — AUTOMATIC SCHEMA VALIDATION
# ================================================================

print("\n" + "=" * 76)
print("🔍 AUTOMATIC DATASET IDENTIFICATION + VALIDATION")
print("=" * 76)

classified = {}
validation_rows = []
classification_details = {}

for filename, path in UPLOADED_FILES.items():
    df = readcsv(path)
    best, candidates = classify(df, filename)
    classification_details[filename] = candidates

    detected = best["type"] if best["coverage"] >= 0.70 else "UNKNOWN"

    validation_rows.append({
        "file": filename,
        "rows": len(df),
        "columns": len(df.columns),
        "detected_type": detected,
        "schema_match_percent": round(best["coverage"] * 100, 2),
        "missing_required_columns": "; ".join(best["missing"])
    })

    if detected != "UNKNOWN":
        if detected in classified:
            raise RuntimeError(
                f"❌ Two files were detected as '{detected}'. "
                f"Upload only one file for each dataset."
            )

        classified[detected] = {
            "filename": filename,
            "path": path,
            "df": df
        }

validation_df = pd.DataFrame(validation_rows)
display(validation_df)

missing = sorted(set(REQUIRED) - set(classified))

if missing:
    print("\n❌ DATASET VALIDATION FAILED")
    print("\nMissing/unrecognized datasets:")
    for x in missing:
        print("  •", x)

    print("\nThe uploaded files and their detected schemas are shown above.")
    raise RuntimeError(
        "❌ Missing/unrecognized datasets: " + ", ".join(missing)
    )

print("\n🟢 ALL 6 DATASETS VALIDATED SUCCESSFULLY.")

for kind in REQUIRED:
    print(f"  ✓ {kind:12s} → {classified[kind]['filename']}")

# ================================================================
# STEP 3 — STANDARDIZE
# ================================================================

print("\n" + "=" * 76)
print("🧹 STANDARDIZING DATA")
print("=" * 76)

t = {}

for kind in REQUIRED:
    t[kind] = standardize(classified[kind]["df"], kind)
    print(f"✓ {kind:12s}: {len(t[kind]):,} rows")

# ================================================================
# STEP 4 — WORK ID OVERLAP
# ================================================================

print("\n🔗 Building Work ID relationship matrix...")

overlap_rows = []

for a in ["recommended", "sanctioned", "completed", "expenditure"]:
    for b in ["recommended", "sanctioned", "completed", "expenditure"]:
        A = set(
            t[a].loc[t[a]["work_id"].ne(""), "work_id"]
        )
        B = set(
            t[b].loc[t[b]["work_id"].ne(""), "work_id"]
        )

        overlap_rows.append({
            "source_a": a,
            "source_b": b,
            "unique_ids_a": len(A),
            "unique_ids_b": len(B),
            "overlap_ids": len(A & B)
        })

overlap = pd.DataFrame(overlap_rows)

# ================================================================
# STEP 5 — BUILD WORK-LEVEL MASTER
# ================================================================

rec = (
    t["recommended"]
    .query("work_id != ''")
    .sort_values(["work_id", "recommended_date"])
    .drop_duplicates("work_id", keep="last")
)

san = (
    t["sanctioned"]
    .query("work_id != ''")
    .sort_values(["work_id", "sanction_date"])
    .drop_duplicates("work_id", keep="last")
)

comp = (
    t["completed"]
    .query("work_id != ''")
    .sort_values(["work_id", "completion_date"])
    .drop_duplicates("work_id", keep="last")
)

exp = (
    t["expenditure"]
    .query("work_id != ''")
    .copy()
)

exp["transaction_id"] = [
    f"TXN-{i:06d}"
    for i in range(1, len(exp) + 1)
]

# Aggregate expenditure at project level.
expg = (
    exp.groupby("work_id", as_index=False)
    .agg(
        expenditure_amount=("fund_disbursed_amount", "sum"),
        expenditure_date=("expenditure_date", "max"),
        vendor_name=(
            "vendor_name",
            lambda s: next((x for x in s if txt(x)), "")
        ),
        vendor_key=(
            "vendor_key",
            lambda s: next((x for x in s if txt(x)), "")
        ),
        expenditure_transaction_count=("transaction_id", "count"),
        payment_status=(
            "payment_status",
            lambda s: next((x for x in s if txt(x)), "")
        )
    )
)

def drop_existing(df, columns):
    return [c for c in columns if c in df.columns]

m = rec.merge(
    san.drop(
        columns=drop_existing(
            san,
            [
                "state", "mp_name", "mp_key", "constituency",
                "ida", "work_category", "work_description",
                "recommended_date"
            ]
        )
    ),
    on="work_id",
    how="outer",
    suffixes=("", "_san")
)

m = m.merge(
    comp.drop(
        columns=drop_existing(
            comp,
            [
                "state", "mp_name", "mp_key", "constituency",
                "ida", "work_category", "work_description"
            ]
        )
    ),
    on="work_id",
    how="left",
    suffixes=("", "_comp")
)

m = m.merge(
    expg,
    on="work_id",
    how="left",
    suffixes=("", "_exp")
)

# Fill identifying fields from sanctioned records where needed.
sf = san.set_index("work_id")

for c in [
    "state", "ida", "mp_name", "mp_key",
    "constituency", "work_category",
    "work_description", "recommended_date"
]:
    if c in m.columns and c in sf.columns:
        m[c] = (
            m[c]
            .replace("", np.nan)
            .fillna(m["work_id"].map(sf[c]))
        )

# ================================================================
# STEP 6 — MP ALLOCATION + CALAMITY
# ================================================================

allocation = t["allocation"].copy()
allocation["mp_key"] = allocation["mp_name"].map(namekey)

# One MP allocation row only after aggregation.
allocation = (
    allocation
    .groupby("mp_key", as_index=False)
    .agg(
        allocated_amount=("allocated_amount", "sum"),
        allocation_state=("state", "first"),
        allocation_constituency=("constituency", "first")
    )
)

m = m.merge(
    allocation,
    on="mp_key",
    how="left",
    suffixes=("", "_allocation")
)

calamity = t["calamity"].copy()

calamity = (
    calamity
    .groupby("mp_key", as_index=False)
    .agg(
        calamity_count=(
            "calamity_name",
            lambda s: s.astype(str)
            .replace("", np.nan)
            .notna()
            .sum()
        ),
        calamity_consent_amount=("consent_amount", "sum"),
        calamity_types=(
            "calamity_type",
            lambda s: "; ".join(
                sorted(
                    set(
                        x for x in s
                        if txt(x)
                    )
                )
            )
        )
    )
)

m = m.merge(
    calamity,
    on="mp_key",
    how="left"
)

# ================================================================
# STEP 7 — BASIC TYPES
# ================================================================

numeric_columns = [
    "recommended_amount",
    "sanction_amount",
    "expenditure_amount",
    "amount_disbursed",
    "allocated_amount",
    "calamity_consent_amount"
]

for c in numeric_columns:
    if c not in m.columns:
        m[c] = np.nan
    m[c] = pd.to_numeric(m[c], errors="coerce")

date_columns = [
    "recommended_date",
    "sanction_date",
    "expenditure_date",
    "completion_date"
]

for c in date_columns:
    if c not in m.columns:
        m[c] = pd.NaT
    m[c] = pd.to_datetime(m[c], errors="coerce")

text_columns = [
    "state", "ida", "mp_name", "mp_key",
    "constituency", "work_category",
    "work_description", "work_status",
    "completion_status", "vendor_name",
    "vendor_key", "payment_status"
]

for c in text_columns:
    if c not in m.columns:
        m[c] = ""
    m[c] = m[c].fillna("").astype(str)

# ================================================================
# STEP 8 — FEATURE ENGINEERING
# ================================================================

print("\n🧠 Engineering financial, time, vendor and MP features...")

m["effective_sanction_amount"] = (
    m["sanction_amount"]
    .fillna(m["recommended_amount"])
)

m["recommendation_to_sanction_days"] = (
    m["sanction_date"] - m["recommended_date"]
).dt.days

m["sanction_to_expenditure_days"] = (
    m["expenditure_date"] - m["sanction_date"]
).dt.days

m["project_duration_days"] = (
    m["completion_date"] - m["recommended_date"]
).dt.days

m["utilization_pct"] = pct(
    m["expenditure_amount"],
    m["effective_sanction_amount"]
)

m["cost_overrun_amount"] = (
    m["expenditure_amount"] -
    m["effective_sanction_amount"]
)

m["cost_deviation_pct"] = pct(
    m["cost_overrun_amount"],
    m["effective_sanction_amount"]
)

m["remaining_sanction_amount"] = (
    m["effective_sanction_amount"] -
    m["expenditure_amount"]
)

m["allocation_utilization_pct"] = pct(
    m["effective_sanction_amount"],
    m["allocated_amount"]
)

m["effectively_completed"] = (
    m["completion_date"].notna()
    |
    m["completion_status"].str.contains(
        "complete", case=False, na=False
    )
    |
    m["work_status"].str.contains(
        "complete", case=False, na=False
    )
).astype(int)

# MP features
m["mp_total_projects"] = (
    m.groupby("mp_key")["work_id"].transform("count")
)

m["mp_total_sanction_amount"] = (
    m.groupby("mp_key")["effective_sanction_amount"]
    .transform("sum")
)

m["mp_total_expenditure_amount"] = (
    m.groupby("mp_key")["expenditure_amount"]
    .transform("sum")
)

m["mp_utilization_pct"] = pct(
    m["mp_total_expenditure_amount"],
    m["mp_total_sanction_amount"]
)

# Category features
m["category_median_sanction"] = (
    m.groupby("work_category")
    ["effective_sanction_amount"]
    .transform("median")
)

m["cost_vs_category_median_pct"] = pct(
    m["effective_sanction_amount"] -
    m["category_median_sanction"],
    m["category_median_sanction"]
)

# Vendor features
valid_vendor = m["vendor_key"].ne("")

m["vendor_project_count"] = np.where(
    valid_vendor,
    m.groupby("vendor_key")["work_id"].transform("count"),
    0
)

m["vendor_total_payment"] = np.where(
    valid_vendor,
    m.groupby("vendor_key")["expenditure_amount"].transform("sum"),
    0
)

m["vendor_average_payment"] = np.where(
    valid_vendor,
    m.groupby("vendor_key")["expenditure_amount"].transform("mean"),
    0
)

m["vendor_mp_count"] = np.where(
    valid_vendor,
    m.groupby("vendor_key")["mp_key"].transform("nunique"),
    0
)

m["vendor_state_count"] = np.where(
    valid_vendor,
    m.groupby("vendor_key")["state"].transform("nunique"),
    0
)

m["vendor_payment_share_pct"] = pct(
    m["expenditure_amount"],
    m["vendor_total_payment"]
)

# ================================================================
# STEP 9 — ROBUST RULE THRESHOLDS
# ================================================================

thresholds = {
    "cost_overrun_pct":
        upper_quantile(m["cost_deviation_pct"], .95, 10),

    "duration_days":
        upper_quantile(m["project_duration_days"], .95, 180),

    "vendor_project_count":
        upper_quantile(m["vendor_project_count"], .95, 5),

    "transaction_amount":
        upper_quantile(m["expenditure_amount"], .99, 1),

    "recommendation_to_sanction_days":
        upper_quantile(
            m["recommendation_to_sanction_days"],
            .95,
            90
        )
}

# ================================================================
# STEP 10 — DOMAIN RULE ENGINE
# ================================================================

m["flag_unusual_expenditure"] = (
    m["expenditure_amount"] >=
    thresholds["transaction_amount"]
).astype(int)

m["flag_cost_overrun"] = (
    m["cost_overrun_amount"] > 0
).astype(int)

m["flag_extreme_cost_overrun"] = (
    m["cost_deviation_pct"] >=
    thresholds["cost_overrun_pct"]
).astype(int)

m["flag_delayed_project"] = (
    m["project_duration_days"] >=
    thresholds["duration_days"]
).astype(int)

m["flag_suspicious_vendor"] = (
    m["vendor_project_count"] >=
    thresholds["vendor_project_count"]
).astype(int)

m["flag_multiple_payments"] = (
    m["expenditure_transaction_count"]
    .fillna(0) > 1
).astype(int)

# Conservative transaction duplicate detection.
# Same work + same vendor + same amount repeated.
exp_dup = exp.copy()

exp_dup["dup_key"] = (
    exp_dup["work_id"].astype(str)
    + "|"
    + exp_dup["vendor_key"].astype(str)
    + "|"
    + exp_dup["fund_disbursed_amount"]
    .round(2)
    .astype(str)
)

dup_keys = set(
    exp_dup["dup_key"]
    .value_counts()
    .loc[lambda s: s > 1]
    .index
)

def duplicate_payment_flag(row):
    prefix = (
        str(row["work_id"])
        + "|"
        + str(row["vendor_key"])
        + "|"
    )

    return int(
        any(k.startswith(prefix) for k in dup_keys)
    )

m["flag_duplicate_payment"] = (
    m.apply(duplicate_payment_flag, axis=1)
)

# No beneficiary ID in source data.
m["flag_duplicate_beneficiary"] = 0

# Weak heuristic only.
m["flag_geographic_inconsistency"] = (
    m["vendor_state_count"] >= 4
).astype(int)

m["flag_transaction_outlier"] = (
    m["flag_unusual_expenditure"]
)

rule_columns = [
    "flag_unusual_expenditure",
    "flag_cost_overrun",
    "flag_extreme_cost_overrun",
    "flag_delayed_project",
    "flag_suspicious_vendor",
    "flag_multiple_payments",
    "flag_duplicate_payment",
    "flag_duplicate_beneficiary",
    "flag_geographic_inconsistency",
    "flag_transaction_outlier"
]

m["anomaly_count"] = (
    m[rule_columns].sum(axis=1)
)

m["rule_score"] = np.clip(
    m["flag_unusual_expenditure"] * 18
    + m["flag_extreme_cost_overrun"] * 18
    + m["flag_delayed_project"] * 14
    + m["flag_suspicious_vendor"] * 14
    + m["flag_duplicate_payment"] * 18
    + m["flag_geographic_inconsistency"] * 8
    + m["flag_cost_overrun"] * 8
    + m["flag_transaction_outlier"] * 8,
    0,
    100
)

# ================================================================
# STEP 11 — ISOLATION FOREST
# ================================================================

print("\n🤖 Training Isolation Forest anomaly model...")

features = [
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

X = m[features].copy()
X = X.replace([np.inf, -np.inf], np.nan)

medians = {}
clips = {}

for c in features:
    med = (
        float(X[c].median())
        if X[c].notna().any()
        else 0.0
    )

    medians[c] = med
    X[c] = X[c].fillna(med)

    lo = float(X[c].quantile(.01))
    hi = float(X[c].quantile(.99))

    if not np.isfinite(lo):
        lo = med - 1

    if not np.isfinite(hi):
        hi = med + 1

    if lo == hi:
        lo -= 1
        hi += 1

    clips[c] = [lo, hi]
    X[c] = X[c].clip(lo, hi)

scaler = StandardScaler()
XS = scaler.fit_transform(X)

# Conservative contamination.
contamination = min(
    max(0.05, 10 / max(len(m), 100)),
    0.15
)

model = IsolationForest(
    n_estimators=400,
    contamination=contamination,
    random_state=RANDOM_STATE,
    n_jobs=-1
)

model.fit(XS)

raw_anomaly = -model.decision_function(XS)

lo, hi = np.quantile(raw_anomaly, [0.01, 0.99])

if hi <= lo:
    hi = lo + 1e-9

m["ml_anomaly_score"] = np.clip(
    (raw_anomaly - lo) /
    (hi - lo) * 100,
    0,
    100
)

# Final combined score.
m["risk_score"] = np.round(
    np.clip(
        .60 * m["ml_anomaly_score"]
        + .40 * m["rule_score"],
        0,
        100
    ),
    2
)

m["risk_category"] = pd.cut(
    m["risk_score"],
    bins=[-np.inf, 30, 60, 80, np.inf],
    labels=["Low", "Medium", "High", "Critical"]
).astype(str)

# Signal strength — NOT fraud probability.
m["risk_signal_strength"] = np.round(
    np.clip(
        50 + (m["risk_score"] - 50) * 1.25,
        0,
        100
    ),
    1
)

# ================================================================
# STEP 12 — EXPLANATIONS
# ================================================================

types = [
    ("flag_unusual_expenditure", "Unusual Expenditure"),
    ("flag_extreme_cost_overrun", "Cost Overrun"),
    ("flag_delayed_project", "Delayed Project"),
    ("flag_duplicate_payment", "Duplicate Payment"),
    ("flag_suspicious_vendor", "Suspicious Vendor"),
    ("flag_duplicate_beneficiary", "Duplicate Beneficiary"),
    ("flag_geographic_inconsistency", "Geographic Inconsistency"),
    ("flag_transaction_outlier", "Transaction Outlier")
]

def anomaly_type(row):
    vals = [
        label
        for c, label in types
        if row[c] == 1
    ]

    if vals:
        return "; ".join(vals)

    if row["ml_anomaly_score"] >= 70:
        return "ML Anomaly"

    return "None"

m["anomaly_type"] = m.apply(
    anomaly_type,
    axis=1
)

def explanation(row):
    reasons = []

    if row["flag_unusual_expenditure"]:
        reasons.append(
            "expenditure is in an extreme upper range"
        )

    if row["flag_extreme_cost_overrun"]:
        reasons.append(
            "cost deviation is unusually high"
        )
    elif row["flag_cost_overrun"]:
        reasons.append(
            "expenditure exceeds effective sanctioned amount"
        )

    if row["flag_delayed_project"]:
        reasons.append(
            "project duration is unusually long"
        )

    if row["flag_suspicious_vendor"]:
        reasons.append(
            "vendor has unusually high project activity"
        )

    if row["flag_duplicate_payment"]:
        reasons.append(
            "possible repeated work/vendor/amount payment pattern"
        )

    if row["flag_geographic_inconsistency"]:
        reasons.append(
            "vendor appears across many states; verification required"
        )

    if (
        not reasons
        and row["ml_anomaly_score"] >= 70
    ):
        reasons.append(
            "multivariate pattern is unusual versus uploaded batch"
        )

    if not reasons:
        return "No material anomaly signal detected."

    return "; ".join(reasons)

m["explanation"] = m.apply(
    explanation,
    axis=1
)

# ================================================================
# STEP 13 — TRANSACTION ANOMALY REPORT
# ================================================================

print("\n💳 Creating transaction-level anomaly report...")

tx = exp.copy()

global_q10 = (
    float(tx["fund_disbursed_amount"].quantile(.10))
    if tx["fund_disbursed_amount"].notna().any()
    else 0
)

global_q90 = (
    float(tx["fund_disbursed_amount"].quantile(.90))
    if tx["fund_disbursed_amount"].notna().any()
    else 0
)

vendor_stats = (
    tx.groupby("vendor_key")["fund_disbursed_amount"]
    .agg(
        v10=lambda s: s.quantile(.10),
        v90=lambda s: s.quantile(.90),
        median="median"
    )
)

lows = []
highs = []
deviations = []

for _, row in tx.iterrows():
    vk = row["vendor_key"]

    if vk in vendor_stats.index:
        low = vendor_stats.loc[vk, "v10"]
        high = vendor_stats.loc[vk, "v90"]
    else:
        low = global_q10
        high = global_q90

    if pd.isna(low):
        low = global_q10

    if pd.isna(high):
        high = global_q90

    center = (low + high) / 2

    if (
        pd.notna(row["fund_disbursed_amount"])
        and center != 0
    ):
        dev = (
            (row["fund_disbursed_amount"] - center)
            / center * 100
        )
    else:
        dev = 0

    lows.append(low)
    highs.append(high)
    deviations.append(dev)

tx["expected_low"] = lows
tx["expected_high"] = highs
tx["deviation_percent"] = deviations

tx["ai_flag"] = np.where(
    (
        tx["deviation_percent"].abs() >= 50
    )
    |
    (
        tx["fund_disbursed_amount"]
        >= thresholds["transaction_amount"]
    ),
    "HIGH",
    np.where(
        tx["deviation_percent"].abs() >= 20,
        "MEDIUM",
        "LOW"
    )
)

tx["expected_range"] = (
    tx["expected_low"].round(2).astype(str)
    + " - "
    + tx["expected_high"].round(2).astype(str)
)

transaction_results = tx[
    [
        "transaction_id",
        "work_id",
        "vendor_name",
        "fund_disbursed_amount",
        "expenditure_date",
        "expected_range",
        "deviation_percent",
        "ai_flag",
        "payment_status"
    ]
].rename(
    columns={
        "fund_disbursed_amount": "amount",
        "expenditure_date": "date"
    }
)

# ================================================================
# STEP 14 — PROJECT RESULT
# ================================================================

project_columns = [
    "work_id",
    "state",
    "ida",
    "mp_name",
    "constituency",
    "work_category",
    "work_description",
    "recommended_amount",
    "effective_sanction_amount",
    "expenditure_amount",
    "amount_disbursed",
    "allocated_amount",
    "work_status",
    "completion_status",
    "effectively_completed",
    "recommended_date",
    "sanction_date",
    "expenditure_date",
    "completion_date",
    "recommendation_to_sanction_days",
    "sanction_to_expenditure_days",
    "project_duration_days",
    "utilization_pct",
    "cost_overrun_amount",
    "cost_deviation_pct",
    "remaining_sanction_amount",
    "vendor_name",
    "vendor_project_count",
    "vendor_total_payment",
    "vendor_average_payment",
    "vendor_mp_count",
    "vendor_state_count",
    "vendor_payment_share_pct",
    "expenditure_transaction_count",
    "calamity_count",
    "calamity_consent_amount",
    "anomaly_count",
    "anomaly_type",
    "ml_anomaly_score",
    "rule_score",
    "risk_score",
    "risk_category",
    "risk_signal_strength",
    "explanation"
]

project_results = (
    m[
        [
            c for c in project_columns
            if c in m.columns
        ]
    ]
    .sort_values(
        "risk_score",
        ascending=False
    )
)

# ================================================================
# STEP 15 — MP SUMMARY
# ================================================================

mp_summary = (
    m.groupby(
        [
            "mp_key",
            "mp_name",
            "state",
            "constituency"
        ],
        dropna=False
    )
    .agg(
        projects_analyzed=(
            "work_id", "nunique"
        ),
        total_recommended=(
            "recommended_amount", "sum"
        ),
        total_sanctioned=(
            "effective_sanction_amount", "sum"
        ),
        total_expenditure=(
            "expenditure_amount", "sum"
        ),
        total_cost_overrun=(
            "cost_overrun_amount",
            lambda s: s.clip(lower=0).sum()
        ),
        average_risk_score=(
            "risk_score", "mean"
        ),
        max_risk_score=(
            "risk_score", "max"
        ),
        high_risk_projects=(
            "risk_category",
            lambda s: s.isin(
                ["High", "Critical"]
            ).sum()
        ),
        critical_projects=(
            "risk_category",
            lambda s: (s == "Critical").sum()
        ),
        anomaly_projects=(
            "anomaly_count",
            lambda s: (s > 0).sum()
        )
    )
    .reset_index()
)

mp_summary["utilization_pct"] = pct(
    mp_summary["total_expenditure"],
    mp_summary["total_sanctioned"]
)

mp_summary["risk_category"] = pd.cut(
    mp_summary["average_risk_score"],
    [-np.inf, 30, 60, 80, np.inf],
    labels=["Low", "Medium", "High", "Critical"]
).astype(str)

mp_summary = mp_summary.sort_values(
    "average_risk_score",
    ascending=False
)

# ================================================================
# STEP 16 — STATE SUMMARY
# ================================================================

state_summary = (
    m.groupby(
        "state",
        dropna=False
    )
    .agg(
        projects_analyzed=(
            "work_id", "nunique"
        ),
        total_sanctioned=(
            "effective_sanction_amount", "sum"
        ),
        total_expenditure=(
            "expenditure_amount", "sum"
        ),
        total_cost_overrun=(
            "cost_overrun_amount",
            lambda s: s.clip(lower=0).sum()
        ),
        average_project_cost=(
            "effective_sanction_amount",
            "mean"
        ),
        average_risk_score=(
            "risk_score", "mean"
        ),
        high_risk_projects=(
            "risk_category",
            lambda s: s.isin(
                ["High", "Critical"]
            ).sum()
        ),
        critical_projects=(
            "risk_category",
            lambda s: (s == "Critical").sum()
        ),
        anomaly_projects=(
            "anomaly_count",
            lambda s: (s > 0).sum()
        )
    )
    .reset_index()
)

state_summary["utilization_pct"] = pct(
    state_summary["total_expenditure"],
    state_summary["total_sanctioned"]
)

state_summary = state_summary.sort_values(
    "average_risk_score",
    ascending=False
)

# ================================================================
# STEP 17 — ALERT CENTRE
# ================================================================

alerts = project_results[
    project_results["risk_category"]
    .isin(["High", "Critical"])
].copy()

alerts["alert_id"] = [
    f"ALT-{datetime.now().strftime('%Y%m%d')}-{i:04d}"
    for i in range(1, len(alerts) + 1)
]

alerts["severity"] = alerts[
    "risk_category"
].str.upper()

alerts["status"] = "Pending Verification"

alerts["action_required"] = np.where(
    alerts["risk_category"].eq("Critical"),
    "Immediate administrative verification",
    "Review supporting records"
)

# ================================================================
# STEP 18 — FINANCIAL DATASETS
# ================================================================

monthly_tx = exp.copy()

monthly_tx["month"] = (
    monthly_tx["expenditure_date"]
    .dt.to_period("M")
    .astype(str)
)

monthly_expenditure = (
    monthly_tx
    .groupby("month", dropna=False)
    ["fund_disbursed_amount"]
    .sum()
    .reset_index(
        name="utilised_amount"
    )
)

monthly_san = m.copy()

monthly_san["month"] = (
    monthly_san["sanction_date"]
    .dt.to_period("M")
    .astype(str)
)

monthly_allocated = (
    monthly_san
    .groupby("month", dropna=False)
    ["effective_sanction_amount"]
    .sum()
    .reset_index(
        name="allocated_amount"
    )
)

monthly_trend = (
    monthly_allocated
    .merge(
        monthly_expenditure,
        on="month",
        how="outer"
    )
    .fillna(0)
    .sort_values("month")
)

vendor_distribution = (
    m[m["vendor_name"].ne("")]
    .groupby("vendor_name")
    .agg(
        total_payment=(
            "expenditure_amount", "sum"
        ),
        projects=(
            "work_id", "nunique"
        )
    )
    .reset_index()
    .sort_values(
        "total_payment",
        ascending=False
    )
)

constituency_financial = (
    m.groupby(
        "constituency",
        dropna=False
    )
    .agg(
        budget=(
            "effective_sanction_amount",
            "sum"
        ),
        expenditure=(
            "expenditure_amount",
            "sum"
        ),
        projects=(
            "work_id",
            "nunique"
        )
    )
    .reset_index()
    .sort_values(
        "expenditure",
        ascending=False
    )
)

constituency_financial["utilization_pct"] = pct(
    constituency_financial["expenditure"],
    constituency_financial["budget"]
)

cost_overrun_analysis = (
    m[m["cost_overrun_amount"] > 0]
    .groupby(
        "work_category",
        dropna=False
    )
    .agg(
        projects=(
            "work_id", "nunique"
        ),
        total_overrun=(
            "cost_overrun_amount",
            "sum"
        ),
        average_overrun_pct=(
            "cost_deviation_pct",
            "mean"
        )
    )
    .reset_index()
    .sort_values(
        "total_overrun",
        ascending=False
    )
)

status_base = m.assign(
    dashboard_status=np.select(
        [
            m["effectively_completed"].eq(1),
            m["work_status"].str.contains(
                "delay",
                case=False,
                na=False
            ),
            m["work_status"].str.contains(
                "ongoing|implementation",
                case=False,
                na=False
            )
        ],
        [
            "Completed",
            "Delayed",
            "Under Implementation"
        ],
        default="Not Started"
    )
)

project_status_distribution = (
    status_base
    .groupby("dashboard_status")
    .size()
    .reset_index(name="projects")
)

# ================================================================
# STEP 19 — RISK TREND
# ================================================================

trend = m.copy()

trend["month"] = (
    trend["expenditure_date"]
    .fillna(trend["sanction_date"])
    .fillna(trend["recommended_date"])
    .dt.to_period("M")
    .astype(str)
)

risk_trend = (
    trend
    .groupby(
        "month",
        dropna=False
    )
    .agg(
        projects=(
            "work_id", "nunique"
        ),
        average_risk_score=(
            "risk_score", "mean"
        ),
        critical=(
            "risk_category",
            lambda s: (s == "Critical").sum()
        ),
        high=(
            "risk_category",
            lambda s: (s == "High").sum()
        ),
        medium=(
            "risk_category",
            lambda s: (s == "Medium").sum()
        ),
        low=(
            "risk_category",
            lambda s: (s == "Low").sum()
        )
    )
    .reset_index()
    .sort_values("month")
)

# ================================================================
# STEP 20 — DATA QUALITY
# ================================================================

data_quality_rows = []

for kind, info in classified.items():
    raw = info["df"]
    best, _ = classify(
        raw,
        info["filename"]
    )

    data_quality_rows.append({
        "dataset": kind,
        "filename": info["filename"],
        "rows": len(raw),
        "columns": len(raw.columns),
        "duplicate_rows": int(
            raw.duplicated().sum()
        ),
        "missing_cells": int(
            raw.isna().sum().sum()
        ),
        "schema_match_percent": round(
            best["coverage"] * 100,
            2
        )
    })

data_quality = pd.DataFrame(
    data_quality_rows
)

# ================================================================
# STEP 21 — SAVE OUTPUTS
# ================================================================

print("\n💾 Saving result datasets...")

master_export = m.copy()

for c in master_export.select_dtypes(
    include=["datetime64[ns]"]
).columns:
    master_export[c] = (
        master_export[c]
        .dt.strftime("%Y-%m-%d")
    )

outputs = {
    "master_mplad_dataset.csv":
        master_export,

    "project_risk_results.csv":
        project_results,

    "mp_risk_summary.csv":
        mp_summary,

    "state_risk_summary.csv":
        state_summary,

    "anomaly_alerts.csv":
        alerts,

    "transaction_anomaly_report.csv":
        transaction_results,

    "monthly_expenditure_trend.csv":
        monthly_trend,

    "vendor_payment_distribution.csv":
        vendor_distribution,

    "constituency_expenditure_comparison.csv":
        constituency_financial,

    "cost_overrun_analysis.csv":
        cost_overrun_analysis,

    "project_status_distribution.csv":
        project_status_distribution,

    "risk_trend.csv":
        risk_trend,

    "data_quality_report.csv":
        data_quality,

    "work_id_overlap_matrix.csv":
        overlap
}

for filename, dataframe in outputs.items():
    dataframe.to_csv(
        OUTPUT_DIR / filename,
        index=False
    )

# ================================================================
# STEP 22 — EXCEL REPORT
# ================================================================

excel_path = (
    OUTPUT_DIR /
    "MPLAD_AI_Risk_Report.xlsx"
)

with pd.ExcelWriter(
    excel_path,
    engine="openpyxl"
) as writer:

    for filename, dataframe in outputs.items():
        dataframe.to_excel(
            writer,
            sheet_name=safe_sheet(
                filename[:-4]
            ),
            index=False
        )

# ================================================================
# STEP 23 — MODEL ARTIFACTS
# ================================================================

pipeline_config = {
    "model_version": MODEL_VERSION,
    "features": features,
    "medians": medians,
    "clip_bounds": clips,
    "raw_anomaly_min": float(lo),
    "raw_anomaly_max": float(hi),
    "risk_formula":
        "0.60 * ML anomaly score + 0.40 * rule score",
    "risk_bins": {
        "Low": "<=30",
        "Medium": "30<score<=60",
        "High": "60<score<=80",
        "Critical": ">80"
    }
}

joblib.dump(
    model,
    OUTPUT_DIR /
    "isolation_forest.joblib"
)

joblib.dump(
    scaler,
    OUTPUT_DIR /
    "scaler.joblib"
)

joblib.dump(
    pipeline_config,
    OUTPUT_DIR /
    "feature_pipeline.joblib"
)

metadata = {
    "model_version": MODEL_VERSION,
    "created_at": datetime.now().isoformat(),
    "algorithm":
        "Isolation Forest + transparent domain rules",
    "random_state": RANDOM_STATE,
    "training_rows": int(len(m)),
    "unique_projects":
        int(m["work_id"].nunique()),
    "feature_count": len(features),
    "features": features,
    "contamination": contamination,
    "thresholds": thresholds,
    "risk_definition":
        "Anomaly/risk signal requiring verification; "
        "not proof of fraud.",
    "signal_definition":
        "risk_signal_strength is not a calibrated "
        "fraud probability.",
    "labels_available": False,
    "district_note":
        "The supplied six datasets contain Constituency "
        "but no District field.",
    "beneficiary_note":
        "No beneficiary identifier exists in the supplied "
        "six datasets, so duplicate-beneficiary detection "
        "is disabled.",
    "transaction_note":
        "Raw expenditure transactions are retained separately "
        "for transaction-level anomaly analysis."
}

with open(
    OUTPUT_DIR /
    "model_metadata.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        metadata,
        f,
        indent=2,
        default=str
    )

# ================================================================
# STEP 24 — SUMMARY
# ================================================================

counts = (
    m["risk_category"]
    .value_counts()
    .reindex(
        ["Critical", "High", "Medium", "Low"],
        fill_value=0
    )
)

total_sanctioned = float(
    m["effective_sanction_amount"]
    .sum(skipna=True)
)

total_expenditure = float(
    m["expenditure_amount"]
    .sum(skipna=True)
)

total_overrun = float(
    m["cost_overrun_amount"]
    .clip(lower=0)
    .sum(skipna=True)
)

summary = {
    "run_completed_at":
        datetime.now().isoformat(),

    "projects_analyzed":
        int(m["work_id"].nunique()),

    "master_rows":
        int(len(m)),

    "critical_projects":
        int(counts["Critical"]),

    "high_projects":
        int(counts["High"]),

    "medium_projects":
        int(counts["Medium"]),

    "low_projects":
        int(counts["Low"]),

    "high_or_critical_projects":
        int(
            counts["Critical"]
            + counts["High"]
        ),

    "total_sanctioned_amount":
        total_sanctioned,

    "total_expenditure_amount":
        total_expenditure,

    "utilization_percent":
        round(
            total_expenditure /
            total_sanctioned * 100,
            2
        )
        if total_sanctioned
        else None,

    "total_positive_cost_overrun":
        total_overrun,

    "anomaly_projects":
        int(
            (m["anomaly_count"] > 0).sum()
        ),

    "transaction_rows_analyzed":
        int(len(exp)),

    "high_or_medium_transactions":
        int(
            transaction_results[
                "ai_flag"
            ]
            .isin(["HIGH", "MEDIUM"])
            .sum()
        )
}

with open(
    OUTPUT_DIR /
    "analysis_summary.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        summary,
        f,
        indent=2,
        default=str
    )

# ================================================================
# STEP 25 — CHARTS
# ================================================================

chart_dir = OUTPUT_DIR / "charts"
chart_dir.mkdir(
    parents=True,
    exist_ok=True
)

# Risk distribution
plt.figure(figsize=(7, 5))
plt.pie(
    counts.values,
    labels=counts.index,
    autopct="%1.1f%%",
    startangle=90,
    wedgeprops={"width": .38}
)
plt.title("MPLAD Risk Distribution")
plt.tight_layout()
plt.savefig(
    chart_dir / "risk_distribution.png",
    dpi=160
)
plt.show()
plt.close()

# Anomaly categories
cat = pd.Series({
    label: int(m[c].sum())
    for c, label in types
}).sort_values()

plt.figure(figsize=(10, 5))
plt.barh(cat.index, cat.values)
plt.title("Detected Anomaly Categories")
plt.xlabel("Projects")
plt.tight_layout()
plt.savefig(
    chart_dir /
    "detected_anomaly_categories.png",
    dpi=160
)
plt.show()
plt.close()

# Monthly expenditure
if len(monthly_trend):
    plt.figure(figsize=(11, 5))
    plt.plot(
        monthly_trend["month"],
        monthly_trend["allocated_amount"],
        marker="o",
        label="Allocated"
    )
    plt.plot(
        monthly_trend["month"],
        monthly_trend["utilised_amount"],
        marker="o",
        label="Utilised"
    )
    plt.title("Monthly Expenditure Trend")
    plt.xlabel("Month")
    plt.ylabel("Amount")
    plt.xticks(rotation=45)
    plt.legend()
    plt.tight_layout()
    plt.savefig(
        chart_dir /
        "monthly_expenditure_trend.png",
        dpi=160
    )
    plt.show()
    plt.close()

# Top vendors
top = vendor_distribution.head(10)

if len(top):
    plt.figure(figsize=(10, 5))
    plt.barh(
        top["vendor_name"].iloc[::-1],
        top["total_payment"].iloc[::-1]
    )
    plt.title("Top Vendors by MPLAD Payments")
    plt.xlabel("Total Payment")
    plt.tight_layout()
    plt.savefig(
        chart_dir /
        "vendor_payment_distribution.png",
        dpi=160
    )
    plt.show()
    plt.close()

# Constituency comparison
top = constituency_financial.head(10)

if len(top):
    x = np.arange(len(top))
    width = .38

    plt.figure(figsize=(11, 5))
    plt.bar(
        x - width / 2,
        top["budget"],
        width,
        label="Budget"
    )
    plt.bar(
        x + width / 2,
        top["expenditure"],
        width,
        label="Expenditure"
    )

    plt.xticks(
        x,
        top["constituency"].astype(str),
        rotation=45,
        ha="right"
    )

    plt.title(
        "Constituency-wise Expenditure Comparison"
    )
    plt.ylabel("Amount")
    plt.legend()
    plt.tight_layout()
    plt.savefig(
        chart_dir /
        "constituency_expenditure_comparison.png",
        dpi=160
    )
    plt.show()
    plt.close()

# Cost overrun
top = cost_overrun_analysis.head(10)

if len(top):
    plt.figure(figsize=(10, 5))
    plt.bar(
        top["work_category"].astype(str),
        top["total_overrun"]
    )
    plt.title(
        "Cost Overrun Analysis by Work Category"
    )
    plt.ylabel("Total Overrun")
    plt.xticks(
        rotation=45,
        ha="right"
    )
    plt.tight_layout()
    plt.savefig(
        chart_dir /
        "cost_overrun_analysis.png",
        dpi=160
    )
    plt.show()
    plt.close()

# Status distribution
if len(project_status_distribution):
    plt.figure(figsize=(7, 5))
    plt.pie(
        project_status_distribution["projects"],
        labels=project_status_distribution[
            "dashboard_status"
        ],
        autopct="%1.1f%%"
    )
    plt.title("Project Status Distribution")
    plt.tight_layout()
    plt.savefig(
        chart_dir /
        "project_status_distribution.png",
        dpi=160
    )
    plt.show()
    plt.close()

# Risk trend
if len(risk_trend):
    plt.figure(figsize=(11, 5))
    plt.plot(
        risk_trend["month"],
        risk_trend["critical"],
        marker="o",
        label="Critical"
    )
    plt.plot(
        risk_trend["month"],
        risk_trend["high"],
        marker="o",
        label="High"
    )
    plt.plot(
        risk_trend["month"],
        risk_trend["medium"],
        marker="o",
        label="Medium"
    )
    plt.xticks(
        rotation=45
    )
    plt.title("MPLAD Risk Trend")
    plt.ylabel("Projects")
    plt.legend()
    plt.tight_layout()
    plt.savefig(
        chart_dir /
        "risk_trend.png",
        dpi=160
    )
    plt.show()
    plt.close()

# ================================================================
# STEP 26 — CREATE ZIP
# ================================================================

if ZIP_PATH.exists():
    ZIP_PATH.unlink()

with zipfile.ZipFile(
    ZIP_PATH,
    "w",
    zipfile.ZIP_DEFLATED
) as z:

    for p in OUTPUT_DIR.rglob("*"):
        if p.is_file():
            z.write(
                p,
                arcname=p.relative_to(
                    OUTPUT_DIR.parent
                )
            )

# ================================================================
# STEP 27 — FINAL RESULT SCREEN
# ================================================================

print("\n" + "=" * 76)
print("🎉 MPLAD AI ANALYSIS COMPLETED SUCCESSFULLY")
print("=" * 76)

print(
    f"Projects analyzed       : "
    f"{summary['projects_analyzed']:,}"
)

print(
    f"Critical                : "
    f"{summary['critical_projects']:,}"
)

print(
    f"High                    : "
    f"{summary['high_projects']:,}"
)

print(
    f"Medium                  : "
    f"{summary['medium_projects']:,}"
)

print(
    f"Low                     : "
    f"{summary['low_projects']:,}"
)

print(
    f"High + Critical         : "
    f"{summary['high_or_critical_projects']:,}"
)

print(
    f"Total sanctioned        : "
    f"₹{summary['total_sanctioned_amount']:,.2f}"
)

print(
    f"Total expenditure       : "
    f"₹{summary['total_expenditure_amount']:,.2f}"
)

print(
    f"Utilization             : "
    f"{summary['utilization_percent']}%"
)

print(
    f"Positive cost overrun   : "
    f"₹{summary['total_positive_cost_overrun']:,.2f}"
)

print(
    f"Anomaly projects        : "
    f"{summary['anomaly_projects']:,}"
)

print(
    f"Transaction rows        : "
    f"{summary['transaction_rows_analyzed']:,}"
)

print(
    f"Suspicious transactions : "
    f"{summary['high_or_medium_transactions']:,}"
)

print("=" * 76)

display(
    HTML(
        f"""
        <div style="
            padding:20px;
            border:2px solid #1f4e79;
            border-radius:12px;
            background:#f5f9ff;
            margin-top:15px;
        ">
        <h2 style="color:#1f4e79">
            ✅ AI Risk Analysis Complete
        </h2>

        <p>
            <b>{summary['projects_analyzed']:,}</b>
            projects analyzed.
        </p>

        <p>
            🔴 Critical:
            <b>{summary['critical_projects']:,}</b>
            &nbsp;&nbsp;
            🟠 High:
            <b>{summary['high_projects']:,}</b>
            &nbsp;&nbsp;
            🟡 Medium:
            <b>{summary['medium_projects']:,}</b>
            &nbsp;&nbsp;
            🟢 Low:
            <b>{summary['low_projects']:,}</b>
        </p>

        <p>
            <b>Risk score:</b>
            Isolation Forest + domain rules
        </p>

        <p>
            <b>ZIP ready:</b>
            MPLAD_AI_RESULTS.zip
        </p>

        <p>
            <b>Important:</b>
            anomaly/risk signals require verification;
            they are not proof of fraud.
        </p>
        </div>
        """
    )
)

# Show top alerts immediately.
print("\n🚨 TOP 20 HIGH-RISK PROJECTS")
display(
    project_results.head(20)
)

print("\n📦 Downloading final ZIP...")
files.download(
    str(ZIP_PATH)
)

print("\n✅ DONE.")
print("All CSVs, Excel report, charts and model artifacts are inside:")
print(ZIP_PATH)

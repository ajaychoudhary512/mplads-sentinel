import re
import decimal
import unicodedata
from typing import Tuple, Optional, Any
import numpy as np
import pandas as pd


def normalize_text(val: Any) -> str:
    """Normalize any text string: strip, collapse whitespace, unicode normalization."""
    if val is None or pd.isna(val):
        return ""
    s = str(val).strip()
    s = unicodedata.normalize("NFKD", s)
    s = re.sub(r"\s+", " ", s)
    return s


def normalize_header(header: Any) -> str:
    """Normalize column header text consistently."""
    x = str(header).strip().lower()
    x = x.replace("₹", " ")
    x = x.replace("&", " and ")
    x = x.replace("'", "")
    x = re.sub(r"[^a-z0-9]+", " ", x)
    return re.sub(r"\s+", " ", x).strip()


def normalize_namekey(name: Any) -> str:
    """Create a standardized key for MP and vendor name matching."""
    s = normalize_text(name).upper()
    s = re.sub(r"\b(SHRI|SMT|DR|PROF|ADV|HONBLE|HON BLE|MS|M/S|PVT|LTD|LIMITED|INC|CORP)\b", " ", s)
    s = re.sub(r"[^A-Z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def normalize_amount(val: Any) -> Optional[float]:
    """
    Parse numerical/currency strings into clean floats.
    Handles commas, currency symbols, scientific notation.
    """
    if val is None or pd.isna(val):
        return np.nan
    if isinstance(val, (int, float)):
        if np.isnan(val) or np.isinf(val):
            return np.nan
        return float(val)
    s = str(val).strip()
    s = s.replace("₹", "").replace(",", "")
    s = re.sub(r"(?i)\b(INR|Rs\.?)\b", "", s)
    s = s.replace(" ", "").strip()
    if not s or s.lower() in ("nan", "none", "null", "-", "nil", "n/a"):
        return np.nan
    try:
        return float(s)
    except ValueError:
        return np.nan


normalize_currency = normalize_amount
normalize_state = normalize_text
normalize_agency = normalize_text


def normalize_date(val: Any) -> Optional[pd.Timestamp]:
    """Parse dates safely handling multiple formats (DD/MM/YYYY, YYYY-MM-DD, Excel serials)."""
    if val is None or pd.isna(val):
        return pd.NaT
    if isinstance(val, (pd.Timestamp, np.datetime64)):
        return pd.to_datetime(val)
    s = str(val).strip()
    if not s or s.lower() in ("nan", "none", "null", "-", "nil", "n/a"):
        return pd.NaT
    # Handle numeric excel serials
    if s.isdigit() and len(s) == 5:
        try:
            return pd.to_datetime(int(s), unit="D", origin="1899-12-30")
        except Exception:
            pass
    try:
        return pd.to_datetime(s, errors="coerce", format="mixed")
    except Exception:
        try:
            return pd.to_datetime(s, dayfirst=True, errors="coerce")
        except Exception:
            return pd.NaT


def normalize_work_id(raw_id: Any) -> Tuple[str, str, str, float]:
    """
    Canonical Work ID Normalization Function.
    
    Handles formats like:
      - 'WS/ MP620 / 2024-2025 / 133166-Construction of...'
      - 'WS/MP620/2024-2025/133166'
      - 'WS/MP18152/2024-2025/133691'
      - 'WS/MP345/2024-2025/134140'
      
    Returns:
      (original_id, normalized_id, match_method, match_confidence)
    """
    orig = normalize_text(raw_id)
    if not orig:
        return ("", "", "empty", 0.0)

    compact = orig.upper().replace(" ", "")

    # Pattern 1: Standard full MPLAD Work ID (e.g. WS/MP620/2024-2025/133166)
    m1 = re.findall(r"(WS/[A-Z0-9]+/\d{4}-\d{4}/\d+)", compact)
    if m1:
        return (orig, m1[-1], "regex_standard_mp_fy", 1.0)

    # Pattern 2: Triple component WS ID (e.g. WS/MP620/ABC/133166)
    m2 = re.findall(r"(WS/[A-Z0-9]+/[A-Z0-9-]+/\d+)", compact)
    if m2:
        return (orig, m2[-1], "regex_triple_segment", 0.95)

    # Pattern 3: Dual segment WS ID (e.g. WS/133166 or WS/MP620/133166)
    m3 = re.findall(r"(WS/[A-Z0-9/]+\d+)", compact)
    if m3:
        clean_id = re.sub(r"[^A-Z0-9/]", "", m3[-1])
        return (orig, clean_id, "regex_general_ws", 0.90)

    # Fallback
    fallback = re.sub(r"[^A-Za-z0-9/_-]", "", compact)[:80]
    return (orig, fallback, "fallback_truncate", 0.60)

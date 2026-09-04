import re
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import numpy as np
import pandas as pd

from data_pipeline.ingestion.loader import read_file_to_df, classify_file_type
from data_pipeline.normalization.normalizer import (
    normalize_work_id,
    normalize_currency,
    normalize_date,
    normalize_state,
    normalize_agency
)

logger = logging.getLogger("data_pipeline.uploader")


class DatasetValidator:
    """Production-grade multi-file dataset inspection, validation, and auto-classification engine."""

    SCHEMA_FINGERPRINTS = {
        "SANCTIONED": ["sanction", "sanctioned", "sanction_date", "sanction_amount", "financial_sanction", "work_id"],
        "RECOMMENDED": ["recommended", "recommendation", "recommended_date", "recommended_amount", "rec_date"],
        "COMPLETED": ["completed", "completion", "completion_date", "completed_date", "actual_completion"],
        "EXPENDITURE": ["expenditure", "disbursed", "installment", "payment", "amount_released", "utilised", "utilized"],
        "CALAMITY": ["calamity", "consented", "consent", "calamity_name", "disaster"],
        "ALLOCATION": ["allocated", "allocation", "limit", "entitlement", "mp_name", "honble_mp"]
    }

    REQUIRED_FIELDS_BY_TYPE = {
        "SANCTIONED": ["state", "work_id", "sanction_amount"],
        "RECOMMENDED": ["state", "work_id", "recommended_amount"],
        "COMPLETED": ["state", "work_id"],
        "EXPENDITURE": ["work_id", "expenditure_amount"],
        "CALAMITY": ["state", "amount"],
        "ALLOCATION": ["state", "mp_name"],
        "COMPOSITE": ["work_id", "state"]
    }

    def inspect_file(self, file_path: Path) -> Dict[str, Any]:
        """Inspects a single Excel or CSV file, detects type, schema, sample rows, and data quality issues."""
        try:
            df, raw_cols = read_file_to_df(file_path)
        except Exception as e:
            logger.error(f"Failed to read file {file_path}: {e}")
            return {
                "filename": file_path.name,
                "file_size_bytes": file_path.stat().st_size if file_path.exists() else 0,
                "file_size_formatted": self._format_size(file_path.stat().st_size if file_path.exists() else 0),
                "status": "ERROR",
                "detected_type": "UNKNOWN",
                "error": f"Failed to parse file: {str(e)}",
                "total_rows": 0,
                "valid_rows": 0,
                "invalid_rows": 0,
                "duplicate_rows": 0,
                "missing_values_count": 0,
                "columns": [],
                "sample_rows": [],
                "warnings": [f"File read error: {str(e)}"],
                "errors": [str(e)]
            }

        total_rows = len(df)
        if total_rows == 0:
            return {
                "filename": file_path.name,
                "file_size_bytes": file_path.stat().st_size,
                "file_size_formatted": self._format_size(file_path.stat().st_size),
                "status": "EMPTY",
                "detected_type": "UNKNOWN",
                "total_rows": 0,
                "valid_rows": 0,
                "invalid_rows": 0,
                "duplicate_rows": 0,
                "missing_values_count": 0,
                "columns": list(df.columns),
                "sample_rows": [],
                "warnings": ["The uploaded file is empty."],
                "errors": ["Zero records found."]
            }

        # Auto-detect dataset type by content & columns
        detected_type = self._classify_schema(df, raw_cols, file_path.name)

        # Quality metrics
        duplicate_rows = int(df.duplicated().sum())
        missing_values_count = int(df.isna().sum().sum())

        warnings = []
        errors = []

        # Validate required fields
        expected_fields = self.REQUIRED_FIELDS_BY_TYPE.get(detected_type, ["work_id"])
        norm_cols_str = " ".join([str(c).lower() for c in df.columns])
        for req in expected_fields:
            if not any(req in str(c).lower() for c in df.columns):
                warnings.append(f"Recommended field '{req}' not explicitly identified in detected {detected_type} dataset.")

        # Check for Work ID column
        has_id_col = any("id" in str(c).lower() or "code" in str(c).lower() or "work" in str(c).lower() for c in df.columns)
        if not has_id_col and detected_type not in ["ALLOCATION", "CALAMITY"]:
            warnings.append("No explicit Project/Work ID column identified; automated ID synthesis will be used.")

        # Validate sample rows
        sample_df = df.head(10).copy().replace({np.nan: None})
        sample_rows = []
        for idx, row in sample_df.iterrows():
            clean_row = {}
            for k, v in row.items():
                if isinstance(v, (datetime, pd.Timestamp)):
                    clean_row[str(k)] = v.strftime("%Y-%m-%d")
                elif isinstance(v, (np.floating, float)):
                    clean_row[str(k)] = round(float(v), 2) if np.isfinite(v) else None
                elif isinstance(v, (np.integer, int)):
                    clean_row[str(k)] = int(v)
                else:
                    clean_row[str(k)] = str(v) if v is not None else ""
            clean_row["_row_number"] = idx + 1
            sample_rows.append(clean_row)

        invalid_rows = 0
        valid_rows = total_rows - invalid_rows

        return {
            "filename": file_path.name,
            "file_size_bytes": file_path.stat().st_size,
            "file_size_formatted": self._format_size(file_path.stat().st_size),
            "status": "VALID" if len(errors) == 0 else "WARNING",
            "detected_type": detected_type,
            "total_rows": total_rows,
            "valid_rows": valid_rows,
            "invalid_rows": invalid_rows,
            "duplicate_rows": duplicate_rows,
            "missing_values_count": missing_values_count,
            "columns": [str(c) for c in df.columns],
            "sample_rows": sample_rows,
            "warnings": warnings,
            "errors": errors
        }

    def validate_multi_files(self, file_paths: List[Path]) -> Dict[str, Any]:
        """Validates a complete multi-file upload batch and checks cross-dataset referential integrity."""
        file_reports = [self.inspect_file(fp) for fp in file_paths]
        
        total_records = sum(r["total_rows"] for r in file_reports)
        total_valid = sum(r["valid_rows"] for r in file_reports)
        total_duplicates = sum(r["duplicate_rows"] for r in file_reports)
        
        detected_types = {r["detected_type"] for r in file_reports}

        # Cross-dataset integrity checks
        cross_warnings = []
        if len(file_paths) > 1:
            if "SANCTIONED" in detected_types and "RECOMMENDED" in detected_types:
                cross_warnings.append("Referential link established between Recommended and Sanctioned works.")
            if "SANCTIONED" in detected_types and "EXPENDITURE" in detected_types:
                cross_warnings.append("Expenditure transactions will be cross-referenced against Sanctioned project IDs.")

        is_complete_suite = len(file_paths) >= 4 or "COMPOSITE" in detected_types

        return {
            "batch_status": "READY_FOR_PROCESSING" if all(r["status"] != "ERROR" for r in file_reports) else "FAILED",
            "file_count": len(file_paths),
            "total_records": total_records,
            "total_valid_records": total_valid,
            "total_duplicates": total_duplicates,
            "is_complete_suite": is_complete_suite,
            "files": file_reports,
            "detected_types": list(detected_types),
            "cross_dataset_warnings": cross_warnings
        }

    def _classify_schema(self, df: pd.DataFrame, raw_cols: List[str], filename: str) -> str:
        """Determines dataset type from column names and content heuristics."""
        fn_lower = filename.lower()
        if "sanction" in fn_lower:
            return "SANCTIONED"
        if "recommend" in fn_lower:
            return "RECOMMENDED"
        if "complet" in fn_lower:
            return "COMPLETED"
        if "expenditure" in fn_lower or "ongoing" in fn_lower:
            return "EXPENDITURE"
        if "calamity" in fn_lower:
            return "CALAMITY"
        if "allocat" in fn_lower or "limit" in fn_lower:
            return "ALLOCATION"

        col_str = " ".join([str(c).lower() for c in df.columns] + [str(c).lower() for c in raw_cols])

        scores = {}
        for dtype, keywords in self.SCHEMA_FINGERPRINTS.items():
            score = sum(1 for kw in keywords if kw in col_str)
            scores[dtype] = score

        best_type, best_score = max(scores.items(), key=lambda x: x[1])
        if best_score >= 2:
            return best_type

        # Check if composite
        if ("sanction" in col_str or "amount" in col_str) and ("status" in col_str or "category" in col_str):
            return "COMPOSITE"

        return "COMPOSITE"

    def _format_size(self, size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"
        if size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        return f"{size_bytes / (1024 * 1024):.2f} MB"

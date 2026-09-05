import os
import unittest
import pandas as pd
import numpy as np
from pathlib import Path

from data_pipeline.normalization.normalizer import (
    normalize_text,
    normalize_header,
    normalize_namekey,
    normalize_amount,
    normalize_date,
    normalize_work_id,
)
from data_pipeline.ingestion.loader import IngestionPipeline, find_header_row, classify_dataset
from data_pipeline.features.master_builder import MasterDatasetBuilder
from data_pipeline.risk.rule_engine import DeterministicRuleEngine
from data_pipeline.ml.risk_engine import MLRiskEngine
from data_pipeline.exports.generator import AnalyticalExportGenerator
from data_pipeline.pipeline import MPLADDataPipeline


class TestMPLADPipeline(unittest.TestCase):

    def test_normalization_utilities(self):
        # Text normalization
        self.assertEqual(normalize_text("  hello   world  "), "hello world")
        self.assertEqual(normalize_text(None), "")

        # Header normalization
        self.assertEqual(normalize_header("Hon'ble Members of Parliament (₹)"), "honble members of parliament")

        # Namekey normalization
        self.assertEqual(normalize_namekey("Shri Pralhad Venkatesh Joshi"), "PRALHAD VENKATESH JOSHI")
        self.assertEqual(normalize_namekey("M/s Sharma Constructions Pvt. Ltd."), "SHARMA CONSTRUCTIONS")

        # Amount normalization
        self.assertEqual(normalize_amount("₹ 1,23,456.78"), 123456.78)
        self.assertEqual(normalize_amount("INR 50,000"), 50000.0)
        self.assertTrue(np.isnan(normalize_amount("N/A")))
        self.assertTrue(np.isnan(normalize_amount(None)))

        # Date normalization
        d1 = normalize_date("26/08/2026")
        self.assertEqual(d1.year, 2026)
        self.assertEqual(d1.month, 8)
        self.assertEqual(d1.day, 26)

        # Work ID normalization
        orig, wid, method, conf = normalize_work_id("WS/ MP620 / 2024-2025 / 133166-Construction of Community Hall")
        self.assertEqual(wid, "WS/MP620/2024-2025/133166")
        self.assertEqual(method, "regex_standard_mp_fy")
        self.assertGreaterEqual(conf, 0.95)

    def test_header_detection(self):
        # DataFrame with title banner at row 0, header at row 1
        raw_df = pd.DataFrame([
            ["Works Completed Report", None, None],
            ["Sr. No.", "State", "Work"],
            ["1", "Karnataka", "WS/MP620/2024-2025/133166"]
        ])
        header_row = find_header_row(raw_df)
        self.assertEqual(header_row, 1)

    def test_end_to_end_pipeline(self):
        pipeline = MPLADDataPipeline(raw_dir="data/raw", processed_dir="data/processed")
        master_df, exp_df, outputs = pipeline.run()

        # Validate master dataset
        self.assertGreater(len(master_df), 1000)
        self.assertIn("work_id", master_df.columns)
        self.assertIn("risk_score", master_df.columns)
        self.assertIn("risk_category", master_df.columns)
        self.assertIn("effective_sanction_amount", master_df.columns)

        # Validate output CSVs exist
        self.assertTrue(Path("data/processed/project_risk_results.csv").exists())
        self.assertTrue(Path("data/processed/state_risk_summary.csv").exists())
        self.assertTrue(Path("data/processed/mp_risk_summary.csv").exists())

        # Validate CSV contents
        p_df = pd.read_csv("data/processed/project_risk_results.csv")
        s_df = pd.read_csv("data/processed/state_risk_summary.csv")
        mp_df = pd.read_csv("data/processed/mp_risk_summary.csv")

        self.assertGreater(len(p_df), 1000)
        self.assertGreater(len(s_df), 10)
        self.assertGreater(len(mp_df), 50)

        # Validate risk score range
        self.assertTrue((p_df["risk_score"] >= 0).all())
        self.assertTrue((p_df["risk_score"] <= 100).all())

        # Validate risk categories
        categories = set(p_df["risk_category"].dropna().unique())
        self.assertTrue(categories.issubset({"Low", "Medium", "High", "Critical"}))


if __name__ == "__main__":
    unittest.main()

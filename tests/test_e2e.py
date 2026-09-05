import sys
import unittest
from pathlib import Path
import pandas as pd
from fastapi.testclient import TestClient

from backend.main import app
from backend.db.database import SessionLocal
from backend.db.models import Project, Alert, Vendor, ExpenditureTransaction
from data_pipeline.pipeline import MPLADDataPipeline


class TestE2EComplete(unittest.TestCase):
    """Full End-to-End System Validation for VIGILANT-MPLAD."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_processed_csv_artifacts_exist_and_populated(self):
        """Verifies all required CSV files are present and contain valid records."""
        expected_files = {
            "project_risk_results.csv": 28000,
            "state_risk_summary.csv": 30,
            "mp_risk_summary.csv": 400,
            "anomaly_alerts.csv": 1000,
            "transaction_anomaly_report.csv": 4000,
            "vendor_payment_distribution.csv": 1500,
            "monthly_expenditure_trend.csv": 10,
            "data_quality_report.csv": 6
        }
        for filename, min_rows in expected_files.items():
            filepath = Path("data/processed") / filename
            self.assertTrue(filepath.exists(), f"Missing processed CSV: {filepath}")
            df = pd.read_csv(filepath)
            self.assertGreaterEqual(len(df), min_rows, f"{filename} row count {len(df)} is below {min_rows}")

    def test_02_database_seeded_properly(self):
        """Verifies database tables have canonical data loaded."""
        proj_count = self.db.query(Project).count()
        self.assertGreaterEqual(proj_count, 28000)

        alert_count = self.db.query(Alert).count()
        self.assertGreaterEqual(alert_count, 1000)

        vendor_count = self.db.query(Vendor).count()
        self.assertGreaterEqual(vendor_count, 1500)

        tx_count = self.db.query(ExpenditureTransaction).count()
        self.assertGreaterEqual(tx_count, 4000)

    def test_03_dashboard_api_endpoints(self):
        """Validates all dashboard analytics endpoints."""
        endpoints = [
            "/api/dashboard/summary",
            "/api/dashboard/fund-utilization?timeframe=monthly",
            "/api/dashboard/project-status",
            "/api/dashboard/risk-distribution",
            "/api/dashboard/risk-trend",
            "/api/dashboard/anomaly-categories",
            "/api/dashboard/vendor-distribution",
            "/api/dashboard/district-expenditure",
            "/api/dashboard/cost-overrun",
            "/api/dashboard/geo-projects",
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 200, f"Failed endpoint: {ep}")
            self.assertIsNotNone(res.json())

    def test_04_projects_api_listing_and_filtering(self):
        """Tests project pagination, search, and detail lookup."""
        res = self.client.get("/api/projects?page=1&page_size=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["items"]), 10)
        self.assertGreaterEqual(data["total"], 28000)

        # Detail lookup
        first_id = data["items"][0]["id"]
        detail_res = self.client.get(f"/api/projects/{first_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail_data = detail_res.json()
        self.assertEqual(detail_data["id"], first_id)
        self.assertIn("ai_factors", detail_data)
        self.assertIn("financial_data", detail_data)

    def test_05_alerts_workflow_api(self):
        """Tests alert retrieval and status update workflow."""
        res = self.client.get("/api/alerts?limit=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("counts", data)
        self.assertGreater(data["counts"]["critical"] + data["counts"]["high"] + data["counts"]["medium"], 0)
        self.assertGreater(len(data["items"]), 0)

        first_alert_id = data["items"][0]["id"]
        update_res = self.client.post(f"/api/alerts/{first_alert_id}/status", json={"status": "Under Review", "notes": "E2E automated test"})
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["new_status"], "Under Review")

    def test_06_ai_intelligence_api(self):
        """Tests AI anomaly endpoints and model status metadata."""
        status_res = self.client.get("/api/ai/model-status")
        self.assertEqual(status_res.status_code, 200)
        self.assertIn("modelVersion", status_res.json())

        anom_res = self.client.get("/api/ai/anomalies?limit=10")
        self.assertEqual(anom_res.status_code, 200)
        self.assertGreater(len(anom_res.json()), 0)

    def test_07_vendor_and_beneficiary_api(self):
        """Tests vendor list and beneficiary intelligence endpoints."""
        v_res = self.client.get("/api/vendors?limit=10")
        self.assertEqual(v_res.status_code, 200)
        self.assertGreater(len(v_res.json()), 0)

        b_res = self.client.get("/api/vendors/beneficiaries-summary")
        self.assertEqual(b_res.status_code, 200)
        self.assertIn("totalBeneficiaries", b_res.json())

    def test_08_reports_and_export_api(self):
        """Tests report generation and dataset export stream."""
        gen_res = self.client.post("/api/reports/generate", json={
            "reportType": "AI Risk Report",
            "district": "All Districts",
            "constituency": "All",
            "riskCategory": "All",
            "financialYear": "2025-26"
        })
        self.assertEqual(gen_res.status_code, 200)
        self.assertIn("reportId", gen_res.json())

        export_res = self.client.get("/api/reports/export?dataset_type=projects&format=csv")
        self.assertEqual(export_res.status_code, 200)
        self.assertEqual(export_res.headers["content-type"], "text/csv; charset=utf-8")


if __name__ == "__main__":
    unittest.main()

import io
import time
import unittest
from pathlib import Path
import pandas as pd
from fastapi.testclient import TestClient

from backend.main import app
from backend.db.database import SessionLocal
from backend.db.models import DatasetVersion, Project, Alert, Vendor, ExpenditureTransaction


class TestUploadPipelineE2E(unittest.TestCase):
    """End-to-End Automated Test Suite for Dataset Upload, Multi-File Schema Auto-Classification,
    Async ML Analysis, Atomic Activation, Multi-Version Isolation, and Two-Way Rollback.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_datasets_list_and_active(self):
        """Verifies initial active dataset is V1 baseline."""
        res = self.client.get("/api/data/datasets")
        self.assertEqual(res.status_code, 200)
        datasets = res.json()
        self.assertIsInstance(datasets, list)
        self.assertGreaterEqual(len(datasets), 1)
        v1 = next((d for d in datasets if d["version_id"] == "V1"), None)
        self.assertIsNotNone(v1, "V1 baseline dataset must exist")

        active_res = self.client.get("/api/data/datasets/active")
        self.assertEqual(active_res.status_code, 200)
        active_data = active_res.json()
        self.assertEqual(active_data["version_id"], "V1")
        self.assertTrue(active_data["is_active"])

    def test_02_upload_and_auto_classification(self):
        """Tests uploading multi-file dataset with automatic content/schema classification."""
        # 1. Create a synthetic Works Sanctioned DataFrame
        sanctioned_data = {
            "Work ID": [f"WS/TEST/2026/{i:05d}" for i in range(1, 31)],
            "Work Name": [f"Solar Community Installation Phase {i}" for i in range(1, 31)],
            "State": ["Rajasthan" if i % 2 == 0 else "Maharashtra" for i in range(1, 31)],
            "District": ["Jaipur" if i % 2 == 0 else "Pune" for i in range(1, 31)],
            "Honble MP": ["Shri Testing MP A" if i % 2 == 0 else "Smt Testing MP B" for i in range(1, 31)],
            "Sanction Date": ["2026-01-15"] * 30,
            "Sanction Amount": [500000 + (i * 20000) for i in range(1, 31)],
            "Category": ["Rural Development"] * 30,
            "Implementing Agency": ["District Rural Dev Agency"] * 30,
        }
        df_sanctioned = pd.DataFrame(sanctioned_data)
        buf_sanctioned = io.BytesIO()
        df_sanctioned.to_csv(buf_sanctioned, index=False)
        buf_sanctioned.seek(0)

        # 2. Create a synthetic Expenditure DataFrame
        expenditure_data = {
            "Work ID": [f"WS/TEST/2026/{i:05d}" for i in range(1, 21)],
            "Payment Date": ["2026-03-01"] * 20,
            "Expenditure Amount": [450000 + (i * 15000) for i in range(1, 21)],
            "Vendor / Contractor": [f"Contractor Alpha {i % 5}" for i in range(1, 21)],
            "Installment": [1] * 20,
        }
        df_exp = pd.DataFrame(expenditure_data)
        buf_exp = io.BytesIO()
        df_exp.to_csv(buf_exp, index=False)
        buf_exp.seek(0)

        # 3. Post to /api/data/upload
        files = [
            ("files", ("Works Sanctioned Batch.csv", buf_sanctioned.getvalue(), "text/csv")),
            ("files", ("Expenditure Batch.csv", buf_exp.getvalue(), "text/csv")),
        ]
        res = self.client.post("/api/data/upload?mode=replace&dataset_name=Automated+Test+V2", files=files)
        self.assertEqual(res.status_code, 200, f"Upload failed: {res.text}")
        data = res.json()

        self.assertIn("upload_id", data)
        self.assertIn("dataset_version", data)
        self.assertEqual(data["status"], "VALIDATED")
        self.assertIn("validation_report", data)
        val_report = data["validation_report"]
        self.assertEqual(len(val_report["files"]), 2)

        # Check detected types
        detected_types = {f["detected_type"] for f in val_report["files"]}
        self.assertIn("SANCTIONED", detected_types)
        self.assertIn("EXPENDITURE", detected_types)

        # Check summary metrics
        self.assertEqual(val_report["file_count"], 2)
        self.assertGreater(val_report["total_records"], 0)
        self.assertIn("cross_dataset_warnings", val_report)

        # Store for next test
        TestUploadPipelineE2E.test_upload_id = data["upload_id"]
        TestUploadPipelineE2E.test_dataset_version = data["dataset_version"]

    def test_03_async_ml_analysis_and_polling(self):
        """Tests triggering async ML analysis, polling progress stepper, and atomic activation."""
        upload_id = getattr(self, "test_upload_id", None)
        target_version = getattr(self, "test_dataset_version", None)
        self.assertIsNotNone(upload_id, "Must have valid upload_id from test_02")

        # 1. Trigger ML Analysis
        res = self.client.post("/api/ai/analyze", json={
            "upload_id": upload_id,
            "dataset_version": target_version,
            "mode": "replace",
            "dataset_name": "Automated Test V2",
            "anomaly_type": "all"
        })
        self.assertEqual(res.status_code, 200)
        run_data = res.json()
        run_id = run_data["run_id"]
        self.assertIsNotNone(run_id)

        # 2. Poll until COMPLETED or FAILED (max 30s)
        completed = False
        final_status = None
        for _ in range(30):
            poll_res = self.client.get(f"/api/ai/runs/{run_id}")
            self.assertEqual(poll_res.status_code, 200)
            status_data = poll_res.json()
            if status_data["status"] == "COMPLETED":
                completed = True
                final_status = status_data
                break
            elif status_data["status"] == "FAILED":
                self.fail(f"Pipeline failed: {status_data.get('error_message')}")
            time.sleep(1)

        self.assertTrue(completed, "Async pipeline did not complete within 30 seconds")
        self.assertEqual(final_status["progress"], 100)
        self.assertIn("total_anomalies", final_status)
        self.assertIn("critical", final_status)
        self.assertIn("high", final_status)
        self.assertIn("medium", final_status)
        self.assertIn("low", final_status)

        # 3. Check Database Activation
        self.db.expire_all()
        v_rec = self.db.query(DatasetVersion).filter(DatasetVersion.version_id == target_version).first()
        self.assertIsNotNone(v_rec)
        self.assertIn(v_rec.status, ["READY", "ACTIVE"])
        self.assertTrue(v_rec.is_active)

    def test_04_multi_version_isolation_and_analytics(self):
        """Verifies complete data isolation between V1 and newly activated dataset version."""
        target_version = getattr(self, "test_dataset_version", None)
        self.assertIsNotNone(target_version)

        # 1. Query V1 Summary - must retain baseline 28,000+ projects
        res_v1 = self.client.get("/api/dashboard/summary?dataset_version=V1")
        self.assertEqual(res_v1.status_code, 200)
        data_v1 = res_v1.json()
        self.assertGreaterEqual(data_v1["total_projects"], 28000, "V1 must be preserved with full baseline")

        # 2. Query Target Version Summary - must reflect uploaded 30 projects
        res_v2 = self.client.get(f"/api/dashboard/summary?dataset_version={target_version}")
        self.assertEqual(res_v2.status_code, 200)
        data_v2 = res_v2.json()
        self.assertEqual(data_v2["total_projects"], 30, "Target version must contain exactly 30 projects")

        # 3. Query Projects List for V1 vs V2
        proj_v1 = self.client.get("/api/projects?dataset_version=V1&page=1&page_size=5").json()
        proj_v2 = self.client.get(f"/api/projects?dataset_version={target_version}&page=1&page_size=5").json()
        self.assertGreaterEqual(proj_v1["total"], 28000)
        self.assertEqual(proj_v2["total"], 30)

        # 4. Verify versioned analytical CSV was generated
        csv_path = Path(f"data/processed/project_risk_results_{target_version}.csv")
        self.assertTrue(csv_path.exists(), f"Analytical CSV for {target_version} not found at {csv_path}")
        df_res = pd.read_csv(csv_path)
        self.assertEqual(len(df_res), 30)

    def test_05_version_switching_and_rollback(self):
        """Tests switching active dataset between versions and clean rollback to V1."""
        target_version = getattr(self, "test_dataset_version", None)
        self.assertIsNotNone(target_version)

        # 1. Rollback activation to V1
        res_act_v1 = self.client.post("/api/data/datasets/V1/activate")
        self.assertEqual(res_act_v1.status_code, 200)
        active_1 = self.client.get("/api/data/datasets/active").json()
        self.assertEqual(active_1["version_id"], "V1")

        # 2. Re-activate Target Version
        res_act_v2 = self.client.post(f"/api/data/datasets/{target_version}/activate")
        self.assertEqual(res_act_v2.status_code, 200)
        active_2 = self.client.get("/api/data/datasets/active").json()
        self.assertEqual(active_2["version_id"], target_version)

        # 3. Clean restore to V1 baseline
        self.client.post("/api/data/datasets/V1/activate")
        active_final = self.client.get("/api/data/datasets/active").json()
        self.assertEqual(active_final["version_id"], "V1")


if __name__ == "__main__":
    unittest.main()

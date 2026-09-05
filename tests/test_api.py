import unittest
from fastapi.testclient import TestClient
from backend.main import app


class TestBackendAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "OPERATIONAL")

    def test_dashboard_summary(self):
        res = self.client.get("/api/dashboard/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_projects", data)
        self.assertGreater(data["total_projects"], 1000)
        self.assertIn("funds_allocated_cr", data)
        self.assertIn("funds_utilized_cr", data)
        self.assertIn("high_risk_projects", data)
        self.assertIn("priority_actions", data)

    def test_dashboard_charts(self):
        # Fund utilization
        res = self.client.get("/api/dashboard/fund-utilization")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

        # Project status
        res = self.client.get("/api/dashboard/project-status")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

        # Risk distribution
        res = self.client.get("/api/dashboard/risk-distribution")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

        # Anomaly categories
        res = self.client.get("/api/dashboard/anomaly-categories")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

        # Geo projects
        res = self.client.get("/api/dashboard/geo-projects")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("states", data)
        self.assertIn("markers", data)

    def test_projects_endpoints(self):
        # List projects
        res = self.client.get("/api/projects?page=1&page_size=5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertGreater(len(data["items"]), 0)
        self.assertIn("total", data)

        # Get first project detail
        first_id = data["items"][0]["id"]
        res_det = self.client.get(f"/api/projects/{first_id}")
        self.assertEqual(res_det.status_code, 200)
        det = res_det.json()
        self.assertEqual(det["id"], first_id)
        self.assertIn("ai_factors", det)
        self.assertIn("financial_data", det)

    def test_alerts_endpoints(self):
        # List alerts
        res = self.client.get("/api/alerts")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("counts", data)
        self.assertIn("items", data)
        self.assertGreater(data["counts"]["critical"] + data["counts"]["high"] + data["counts"]["medium"], 0)

        # Update status of first alert
        if data["items"]:
            first_alert_id = data["items"][0]["id"]
            res_up = self.client.post(f"/api/alerts/{first_alert_id}/investigate")
            self.assertEqual(res_up.status_code, 200)
            self.assertEqual(res_up.json()["new_status"], "Under Investigation")

    def test_ai_endpoints(self):
        # Trigger analyze (async endpoint)
        res = self.client.post("/api/ai/analyze", json={"anomaly_type": "all"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("run_id", data)
        self.assertIn("status", data)

        # Check run status endpoint
        run_res = self.client.get(f"/api/ai/runs/{data['run_id']}")
        self.assertEqual(run_res.status_code, 200)
        self.assertIn("progress", run_res.json())

        # Model status
        res_st = self.client.get("/api/ai/model-status")
        self.assertEqual(res_st.status_code, 200)
        self.assertIn("algorithm", res_st.json())

    def test_vendors_and_audit(self):
        # Vendors
        res_v = self.client.get("/api/vendors?limit=10")
        self.assertEqual(res_v.status_code, 200)
        self.assertIsInstance(res_v.json(), list)

        # Audit
        res_a = self.client.get("/api/audit-trail?limit=10")
        self.assertEqual(res_a.status_code, 200)
        self.assertIsInstance(res_a.json(), list)


if __name__ == "__main__":
    unittest.main()

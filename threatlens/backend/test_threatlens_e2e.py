import sys
import io
import json
from pathlib import Path

# Force UTF-8 on Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import create_app
from app.database import db
from app.models.activity import Activity
from app.models.alert import Alert
from app.models.dataset import Dataset
from app.models.model_run import ModelRun

def run_e2e_tests():
    print("=" * 60)
    print("  ThreatLens AI — End-to-End System Verification")
    print("=" * 60)

    app = create_app()
    client = app.test_client()

    with app.app_context():
        # 1. Test System Status API
        print("\n[1] Testing GET /api/system/status...")
        res = client.get("/api/system/status")
        assert res.status_code == 200, f"Status failed: {res.status_code}"
        data = res.get_json()["data"]
        print(f"    -> API: {data['api']['status']}, DB: {data['database']['status']}, ML: {data['ml_engine']['status']}")
        assert data["database"]["ok"] is True
        assert data["ml_engine"]["ok"] is True

        # 2. Test Presets API
        print("\n[2] Testing GET /api/presets...")
        res = client.get("/api/presets")
        assert res.status_code == 200
        presets = res.get_json()["data"]
        print(f"    -> Loaded {len(presets)} test activity presets.")
        assert len(presets) >= 4

        # 3. Test Dataset Listing & Profile
        print("\n[3] Testing GET /api/datasets...")
        res = client.get("/api/datasets")
        assert res.status_code == 200
        datasets = res.get_json()["data"]
        print(f"    -> Datasets in database: {len(datasets)}")
        assert len(datasets) > 0

        # 4. Test Model Training
        print("\n[4] Testing POST /api/dataset/train...")
        res = client.post("/api/dataset/train", json={"dataset_id": datasets[0]["id"], "version": "v1.1.0"})
        assert res.status_code == 200, f"Train failed: {res.get_json()}"
        train_res = res.get_json()["data"]
        print(f"    -> Trained model {train_res['version']}: Accuracy={round(train_res['accuracy']*100, 2)}%, Classes={train_res['classes']}")
        assert train_res["accuracy"] > 0.85

        # 5. Test Model Performance & Info API
        print("\n[5] Testing GET /api/model/performance & GET /api/model/info...")
        res = client.get("/api/model/performance")
        assert res.status_code == 200
        perf = res.get_json()["data"]["model"]
        print(f"    -> Active Model: {perf['model_name']} ({perf['version']}), F1={perf['f1_score']}%")

        res_info = client.get("/api/model/info")
        assert res_info.status_code == 200
        info = res_info.get_json()["data"]
        assert info["is_ready"] is True
        print(f"    -> Model Ready: True, Training Runs: {len(info['history'])}")

        # 6. Test Activity Analysis with DoS SYN Flood
        print("\n[6] Testing POST /api/analyze with DoS Attack Payload...")
        dos_payload = presets[1]["data"] # DoS SYN Flood
        res = client.post("/api/analyze", json=dos_payload)
        assert res.status_code == 201, f"Analyze failed: {res.get_json()}"
        act_dos = res.get_json()["data"]
        print(f"    -> Prediction: {act_dos['prediction']} ({act_dos['attack_type']}), Risk: {act_dos['risk_score']}/100 ({act_dos['severity']}), Confidence: {act_dos['confidence']}%")
        assert act_dos["prediction"] == "Attack"
        assert act_dos["risk_score"] >= 65
        assert len(act_dos["contributing_signals"]) > 0
        print(f"    -> Signals identified: {[s['title'] for s in act_dos['contributing_signals']]}")

        # 7. Test Activity Analysis with Normal HTTP
        print("\n[7] Testing POST /api/analyze with Normal Traffic Payload...")
        normal_payload = presets[0]["data"] # Normal HTTP
        res = client.post("/api/analyze", json=normal_payload)
        assert res.status_code == 201
        act_norm = res.get_json()["data"]
        print(f"    -> Prediction: {act_norm['prediction']} ({act_norm['attack_type']}), Risk: {act_norm['risk_score']}/100 ({act_norm['severity']})")
        assert act_norm["prediction"] == "Normal"

        # 8. Test Activity Analysis with PortScan Probe
        print("\n[8] Testing POST /api/analyze with Probe PortScan Payload...")
        probe_payload = presets[2]["data"] # Probe
        res = client.post("/api/analyze", json=probe_payload)
        assert res.status_code == 201
        act_probe = res.get_json()["data"]
        print(f"    -> Prediction: {act_probe['prediction']} ({act_probe['attack_type']}), Risk: {act_probe['risk_score']}/100 ({act_probe['severity']})")

        # 9. Verify Activity History / Events API
        print("\n[9] Testing GET /api/activities & GET /api/activities/<id>...")
        res = client.get("/api/activities?limit=10")
        assert res.status_code == 200
        acts = res.get_json()["data"]
        print(f"    -> Total activities recorded: {acts['total']}, Retreived: {len(acts['activities'])}")
        assert acts["total"] >= 3

        # Test single activity detail & timeline
        single_id = acts["activities"][0]["id"]
        res_single = client.get(f"/api/activities/{single_id}")
        assert res_single.status_code == 200
        detail = res_single.get_json()["data"]
        print(f"    -> Single Event Detail #{single_id}: {detail['endpoint']}, Timeline Items: {len(detail.get('timeline', []))}")

        # 10. Verify Alert Creation & Acknowledge
        print("\n[10] Testing GET /api/alerts & PATCH /api/alerts/<id>...")
        res = client.get("/api/alerts")
        assert res.status_code == 200
        alerts_data = res.get_json()["data"]
        print(f"    -> Total alerts: {alerts_data['total']}, Unread: {alerts_data['unread_count']}")
        assert alerts_data["total"] >= 1

        alert_id = alerts_data["alerts"][0]["id"]
        res_patch = client.patch(f"/api/alerts/{alert_id}", json={"status": "ACKNOWLEDGED"})
        assert res_patch.status_code == 200
        assert res_patch.get_json()["data"]["status"] == "ACKNOWLEDGED"
        print(f"    -> Alert #{alert_id} acknowledged successfully.")

        # 11. Verify Dashboard API
        print("\n[11] Testing GET /api/dashboard...")
        res = client.get("/api/dashboard")
        assert res.status_code == 200
        dash = res.get_json()["data"]
        print(f"    -> Dashboard Metrics: Activity={dash['metrics']['network_activity']['total']}, Threats={dash['metrics']['threats_detected']['total']}, Health={dash['metrics']['security_health']['score']}/100")
        assert dash["metrics"]["network_activity"]["total"] >= 3
        assert dash["threat_landscape"]["total_threats"] >= 1
        assert len(dash["recent_events"]) >= 3

        # 12. Verify Analytics API
        print("\n[12] Testing GET /api/analytics...")
        res = client.get("/api/analytics")
        assert res.status_code == 200
        analytics = res.get_json()["data"]
        print(f"    -> Analytics Threat Dist: {analytics['threat_distribution']}")
        print(f"    -> Severity Dist: {analytics['severity_distribution']}")
        print(f"    -> Risk Dist: {analytics['risk_distribution']}")

        # 13. Verify Report Generation API
        print("\n[13] Testing POST /api/report/generate...")
        res = client.post("/api/report/generate")
        assert res.status_code == 200
        report = res.get_json()["data"]
        print(f"    -> Generated Brief ID: {report['report_id']}")
        print(f"    -> Key Findings: {len(report['findings_and_recommendations'])} findings compiled.")
        assert len(report["findings_and_recommendations"]) > 0

        # 14. Verify Threat Advisor AI Q&A API
        print("\n[14] Testing POST /api/advisor/query...")
        test_questions = [
            "What happened today?",
            "What is our security health score?",
            "What is the highest risk attack detected?",
            "Tell me about the active machine learning model",
        ]
        for q in test_questions:
            res = client.post("/api/advisor/query", json={"query": q})
            assert res.status_code == 200
            ans = res.get_json()["data"]["response"]
            print(f"    -> Q: '{q}'")
            print(f"       A: {ans.splitlines()[0]} (Length: {len(ans)} chars)")

        # 15. Verify Root & Static Frontend Serving
        print("\n[15] Testing Frontend Serving at GET / and GET /static/css/tokens.css...")
        res_root = client.get("/")
        assert res_root.status_code == 200
        assert b"ThreatLens AI" in res_root.data
        assert b"See the Threat. Understand the Risk." in res_root.data

        res_css = client.get("/static/css/tokens.css")
        assert res_css.status_code == 200
        assert b"--bg-primary: #070b14" in res_css.data

        print("\n" + "=" * 60)
        print("  ALL 15 END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY! ")
        print("=" * 60 + "\n")

if __name__ == "__main__":
    run_e2e_tests()

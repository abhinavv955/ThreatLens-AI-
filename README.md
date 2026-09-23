# ThreatLens AI ◉
> **See the Threat. Understand the Risk.**

ThreatLens AI is an AI-powered network security intelligence platform that analyzes network activity, detects suspicious and malicious behavior, calculates dynamic risk scores, explains ML predictions, and provides security analytics.

---

## Brand Identity & Design System
- **Theme**: Deep Midnight Navy (`#070B14`, `#0C1322`) with glassmorphism panels
- **Accents**: Electric Blue (`#38BDF8`), Soft Violet (`#8B5CF6`)
- **Status Indicators**: Cool Green (Safe), Warm Amber (Warning), Coral/Red (Critical)
- **Architecture**: Modern Top Navigation architecture on desktop; responsive bottom navigation on mobile.
- **Brand Icon**: Abstract icon combining an analytical lens, network nodes, and a subtle shield contour.

---

## Key Modules & Experiences
1. **Landing Console**: Introductory hero with interactive HTML5 canvas animated network nodes and particle flows.
2. **Security Overview (Dashboard)**: Real-time telemetry, 4 core metric cards (Network Activity, Threats Detected, Anomalies, Security Health), horizontal security health meter with dynamic factor breakdowns, Chart.js area chart (24H/7D/30D toggles), Threat Landscape radial chart, and live event stream.
3. **Analyze Network Activity**: Two-column flow inspection interface with realistic preset test vectors (DoS SYN Flood, PortScan, Brute-Force, Buffer Overflow), simulated multi-stage validation, detection result card, and **"Why did ThreatLens flag this?"** explainable signals.
4. **Threat Investigation Drawer**: Deep-dive dossier for any selected activity showing endpoint data, complete feature profile, detection reasoning, and related host activity timeline.
5. **Live Security Monitor**: Real-time connected monitoring stream with animated network pulse frequency indicator.
6. **Security Events**: Filterable investigation table with keyword search, type, severity, and backend pagination.
7. **Threat Alerts**: Prioritized alert queue with acknowledge/resolve workflow generated from high-risk events.
8. **Security Analytics**: Multi-dimensional analytics workspace (Attack Distribution, Severity Breakdown, 20-point Risk Histogram, Active Model evaluation).
9. **Data Laboratory**: Drag-and-drop CSV dataset upload, schema & class profiling, and one-click model retraining.
10. **Model Center**: Active model telemetry, versioning history, and empirical Random Forest Feature Importance rankings (*"What Drives Detection?"*).
11. **Security Briefs**: Generate and print/export formal executive audit reports compiled from live platform data.
12. **Threat Advisor**: Grounded conversational AI assistant answering security questions directly from real database metrics without hallucinations.
13. **Control Center**: Dynamic health probes across API, SQLite Database, Scikit-learn ML engine, and active models.

---

## Machine Learning Pipeline
- **Classifier**: Scikit-learn `RandomForestClassifier` (100 estimators, max depth 16) for multi-class classification (`normal`, `DoS`, `Probe`, `R2L`, `U2R`).
- **Anomaly Detection**: `IsolationForest` fitted on normal baseline instances for unsupervised outlier scoring.
- **Preprocessor**: Scikit-learn `ColumnTransformer` (StandardScaler for numerics, OneHotEncoder for categoricals) fitted exclusively on training splits to prevent data leakage.
- **Risk Engine**: 0-100 normalized risk score combining classifier probabilities, anomaly flags, service criticality, and signature heuristics.
- **Explainability**: Quantified feature deviations against baseline centroids to explain detection rationales.

---

## Quick Start

### 1. Install Dependencies
```bash
pip install -r threatlens/backend/requirements.txt
```

### 2. Run ThreatLens AI Server
```bash
python run_threatlens.py
```
Open your browser at **http://127.0.0.1:5050** to explore the security intelligence console.

### 3. Run Automated End-to-End Verification Tests
```bash
python threatlens/backend/test_threatlens_e2e.py
```

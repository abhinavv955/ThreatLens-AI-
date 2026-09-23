# 🛡️ ThreatLens AI

### AI-Powered Network Intrusion Detection & Security Intelligence Platform

**Python** • **Flask** • **Scikit-learn** • **SQLite** • **Chart.js**

> **See the Threat. Understand the Risk.**

ThreatLens AI is an AI-powered network security intelligence platform that analyzes network activity, detects suspicious and malicious behavior, calculates dynamic risk scores, explains machine-learning predictions, and provides security analytics through a modern web-based dashboard.

---

## 📌 Overview

**ThreatLens AI** is an end-to-end **Machine Learning based Network Intrusion Detection System (NIDS)** developed as an academic cybersecurity project.

The platform allows users to:

1. **Analyze** network activity using a trained ML model
2. **Detect** normal, suspicious, and malicious behavior
3. **Calculate** dynamic risk scores and severity
4. **Explain** why an activity was flagged
5. **Monitor** security events and alerts
6. **Analyze** attack patterns and security trends
7. **Upload** datasets and retrain ML models
8. **View** model performance and feature importance

---

## 👥 Team

> **Academic Project · 2026**

| Name             | Contribution                                   |
| ---------------- | ---------------------------------------------- |
| **Abinav V.P**   | Machine Learning, Backend & System Integration |
| **Bhupesh More** | Frontend, UI/UX & Testing                      |

---

## ✨ Features

| Module                 | Capabilities                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| 🛡️ **Dashboard**      | Security health, network activity, threats, anomalies & live events |
| 🔍 **Analyze**         | Network activity analysis and ML-based threat detection             |
| 📡 **Live Monitor**    | Real-time security activity monitoring                              |
| 📋 **Security Events** | Searchable and filterable activity history                          |
| 🚨 **Threat Alerts**   | Risk-based alerts with acknowledge/resolve workflow                 |
| 📊 **Analytics**       | Attack distribution, severity analysis & risk trends                |
| 🧪 **Data Laboratory** | CSV upload, dataset profiling & model retraining                    |
| 🤖 **Model Center**    | Model performance, versioning & feature importance                  |
| 📄 **Security Briefs** | Generate security reports from platform data                        |
| 💬 **Threat Advisor**  | Security questions based on platform data                           |
| ⚙️ **Control Center**  | API, database and ML system health monitoring                       |

---

## 🖥️ Dashboard

The ThreatLens AI dashboard provides a centralized overview of the current security state.

### Dashboard includes:

* Network Activity
* Threats Detected
* Anomalies
* Security Health
* Activity Trends
* Threat Distribution
* Recent Security Events
* Dynamic Security Metrics

The interface follows a modern **midnight navy, electric blue, and soft violet** cybersecurity theme with glass-style panels and responsive layouts.

---

## 🧠 Machine Learning

ThreatLens AI uses a combination of supervised classification and anomaly detection.

### Random Forest

The primary classifier is:

```text
RandomForestClassifier
```

Configuration:

```text
Estimators    : 100
Max Depth     : 16
Classification: Multi-Class
```

### Detection Classes

```text
normal
DoS
Probe
R2L
U2R
```

### Isolation Forest

**Isolation Forest** is used for anomaly detection by identifying network activities that differ from the normal baseline.

---

## 🔬 ML Pipeline

```text
CSV Dataset
     ↓
Data Validation
     ↓
Preprocessing
     ↓
Feature Transformation
     ↓
Train / Test Split
     ↓
Random Forest
     ↓
Model Evaluation
     ↓
Model Storage
     ↓
Network Activity
     ↓
Prediction + Anomaly Detection
     ↓
Risk Analysis
     ↓
Threat Explanation
     ↓
Alert / Dashboard
```

The preprocessing pipeline uses:

* `ColumnTransformer`
* `StandardScaler`
* `OneHotEncoder`

Preprocessing is fitted using training data to help prevent data leakage.

---

## ⚠️ Risk Engine

ThreatLens AI generates a normalized **0–100 risk score**.

The risk calculation combines multiple security signals including:

* ML classifier probabilities
* Anomaly detection
* Service criticality
* Security heuristics

The resulting score is used to determine the severity of the detected activity.

---

## 🧠 Explainable Detection

ThreatLens AI is designed to explain **why an activity was flagged**, instead of displaying only a prediction.

The explanation system analyzes feature deviations against baseline behavior and provides relevant detection signals.

Example:

```text
High traffic deviation
Unusual network behavior
Elevated anomaly score
High classification confidence
```

---

## 📊 Analytics

The Security Analytics module provides:

* Attack Distribution
* Severity Breakdown
* Risk Histogram
* Activity Trends
* Threat Categories
* Model Evaluation
* Feature Importance

Charts and visualizations are generated using **Chart.js**.

---

## 🧪 Data Laboratory

The Data Laboratory allows users to work with machine-learning datasets.

### Features

* CSV upload
* Dataset validation
* Schema inspection
* Feature profiling
* Class distribution
* Dataset management
* Model retraining

---

## 🤖 Model Center

The Model Center provides information about the active machine-learning model.

### Includes

* Active model
* Model version
* Training information
* Accuracy
* Precision
* Recall
* F1-score
* Confusion Matrix
* Feature Importance

---

## 🗂️ Architecture

```text
ThreatLens-AI/
│
├── threatlens/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── ml/
│   │   │   └── utils/
│   │   │
│   │   ├── data/
│   │   │   ├── raw/
│   │   │   └── processed/
│   │   │
│   │   ├── models/
│   │   │   ├── trained/
│   │   │   └── metadata/
│   │   │
│   │   ├── uploads/
│   │   ├── tests/
│   │   └── requirements.txt
│   │
├── run_threatlens.py
└── README.md
```

---

## 🔗 API

| Method  | Endpoint                 | Purpose                  |
| ------- | ------------------------ | ------------------------ |
| `GET`   | `/api/dashboard`         | Dashboard data           |
| `POST`  | `/api/analyze`           | Analyze network activity |
| `GET`   | `/api/activities`        | Activity history         |
| `GET`   | `/api/activities/<id>`   | Activity details         |
| `GET`   | `/api/alerts`            | Security alerts          |
| `PATCH` | `/api/alerts/<id>`       | Update alert             |
| `GET`   | `/api/analytics`         | Security analytics       |
| `POST`  | `/api/dataset/upload`    | Upload dataset           |
| `GET`   | `/api/datasets`          | Dataset information      |
| `POST`  | `/api/dataset/train`     | Train model              |
| `GET`   | `/api/model/performance` | Model metrics            |
| `GET`   | `/api/model/info`        | Model information        |
| `POST`  | `/api/report/generate`   | Generate report          |

---

## 🛠️ Tech Stack

| Layer                | Technology              |
| -------------------- | ----------------------- |
| **Backend**          | Python, Flask           |
| **Frontend**         | HTML5, CSS3, JavaScript |
| **Visualization**    | Chart.js                |
| **Database**         | SQLite, SQLAlchemy      |
| **Machine Learning** | Scikit-learn            |
| **Data Processing**  | Pandas, NumPy           |
| **Model Storage**    | Joblib                  |
| **API**              | REST API                |

---

## 🚀 Quick Start

### Prerequisites

* Python 3.11+
* pip

### 1. Clone the Repository

```bash
git clone https://github.com/abhinavv955/ThreatLens-AI.git
cd ThreatLens-AI
```

### 2. Install Dependencies

```bash
pip install -r threatlens/backend/requirements.txt
```

### 3. Run ThreatLens AI

```bash
python run_threatlens.py
```

### 4. Open the Application

Open your browser at:

```text
http://127.0.0.1:5050
```

### 5. Run End-to-End Tests

```bash
python threatlens/backend/test_threatlens_e2e.py
```

---

## 📈 System Workflow

```text
User
 ↓
ThreatLens AI Web Interface
 ↓
Flask REST API
 ↓
Validation & Business Logic
 ↓
Machine Learning Engine
 ↓
Prediction + Anomaly Detection
 ↓
Risk Engine
 ↓
Explanation Engine
 ↓
Database & Alerts
 ↓
Dashboard / Analytics
```

---

## 🔮 Future Scope

* Real-time packet capture
* Network interface monitoring
* SIEM integration
* Threat intelligence integration
* Automated incident response
* Cloud deployment
* Deep-learning-based detection
* Model drift monitoring
* Automated model retraining

---

> **ThreatLens AI ◉ — See the Threat. Understand the Risk.**

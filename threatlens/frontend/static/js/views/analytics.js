import { ApiClient } from '../api.js';
import { Store } from '../store.js';

let chartTrend = null;
let chartAttackDist = null;
let chartSeverityDist = null;
let chartRiskDist = null;

export async function renderAnalytics(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>Security Analytics</h1>
        <p class="page-subtitle">Deep intelligence telemetry, risk distributions, and classifier performance</p>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button id="btn-refresh-analytics" class="btn btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          <span>Refresh Analytics</span>
        </button>
      </div>
    </div>

    <!-- Activity Overview KPI Strip -->
    <div class="metrics-grid">
      <div class="glass-panel metric-card">
        <div class="metric-title">Total Monitored Flows</div>
        <div class="metric-number" id="an-total-flows">--</div>
        <div class="metric-sub">100% database grounded</div>
      </div>
      <div class="glass-panel metric-card">
        <div class="metric-title">Attacks Identified</div>
        <div class="metric-number" id="an-total-threats" style="color: var(--color-critical);">--</div>
        <div class="metric-sub">Signature & heuristic matches</div>
      </div>
      <div class="glass-panel metric-card">
        <div class="metric-title">Isolation Outliers</div>
        <div class="metric-number" id="an-total-anom" style="color: #a78bfa;">--</div>
        <div class="metric-sub">Unsupervised anomaly flags</div>
      </div>
      <div class="glass-panel metric-card">
        <div class="metric-title">Health Index</div>
        <div class="metric-number" id="an-health-idx" style="color: var(--color-safe);">--</div>
        <div class="metric-sub">Multi-factor security posture</div>
      </div>
    </div>

    <!-- Charts Row 1: Attack Distribution & Severity Distribution -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
      <div class="glass-panel chart-card">
        <div class="chart-header">
          <h3 style="font-size: 1.05rem; font-weight: 700;">Attack Distribution</h3>
        </div>
        <div style="height: 260px; position: relative;">
          <canvas id="an-attack-chart"></canvas>
        </div>
      </div>

      <div class="glass-panel chart-card">
        <div class="chart-header">
          <h3 style="font-size: 1.05rem; font-weight: 700;">Severity Distribution</h3>
        </div>
        <div style="height: 260px; position: relative;">
          <canvas id="an-severity-chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Charts Row 2: Risk Score Distribution Histogram & Detection Performance -->
    <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
      <div class="glass-panel chart-card">
        <div class="chart-header">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700;">Risk Score Distribution</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Event counts grouped into 20-point risk brackets</p>
          </div>
        </div>
        <div style="height: 260px; position: relative;">
          <canvas id="an-risk-chart"></canvas>
        </div>
      </div>

      <!-- Detection Performance Card -->
      <div class="glass-panel" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h3 style="font-size: 1.05rem; font-weight: 700;">Detection Performance</h3>
            <span class="badge badge-normal" id="an-model-status">ACTIVE</span>
          </div>
          <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Empirical validation metrics computed on test split of active Random Forest intelligence model.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md); text-align: center;">
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-blue);" id="an-perf-acc">--</div>
              <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">Accuracy</div>
            </div>
            <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md); text-align: center;">
              <div style="font-size: 1.6rem; font-weight: 800; color: #a78bfa;" id="an-perf-f1">--</div>
              <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">F1-Score</div>
            </div>
            <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md); text-align: center;">
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--color-safe);" id="an-perf-prec">--</div>
              <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">Precision</div>
            </div>
            <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md); text-align: center;">
              <div style="font-size: 1.6rem; font-weight: 800; color: #38bdf8;" id="an-perf-rec">--</div>
              <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">Recall</div>
            </div>
          </div>
        </div>

        <button id="btn-view-model-center" class="btn btn-secondary btn-sm" style="width: 100%;">
          <span>Open Model Center & Feature Rankings</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-refresh-analytics')?.addEventListener('click', () => loadAnalyticsData());
  document.getElementById('btn-view-model-center')?.addEventListener('click', () => Store.setView('models'));

  await loadAnalyticsData();
}

async function loadAnalyticsData() {
  try {
    const res = await ApiClient.getAnalytics();
    if (!res.success) throw new Error(res.error || 'Failed to fetch analytics');

    const data = res.data;

    // Overview KPIs
    const ov = data.overview;
    document.getElementById('an-total-flows').innerText = ov.total_activities;
    document.getElementById('an-total-threats').innerText = ov.total_threats;
    document.getElementById('an-total-anom').innerText = ov.total_anomalies;
    document.getElementById('an-health-idx').innerText = `${ov.health_score} / 100`;

    // 1. Attack Distribution Donut
    renderAttackDistChart(data.threat_distribution);

    // 2. Severity Distribution Bar
    renderSeverityChart(data.severity_distribution);

    // 3. Risk Score Histogram
    renderRiskDistChart(data.risk_distribution);

    // 4. Model Performance
    if (data.model_performance) {
      const mp = data.model_performance;
      document.getElementById('an-perf-acc').innerText = `${mp.accuracy}%`;
      document.getElementById('an-perf-f1').innerText = `${mp.f1_score}%`;
      document.getElementById('an-perf-prec').innerText = `${mp.precision}%`;
      document.getElementById('an-perf-rec').innerText = `${mp.recall}%`;
    }

  } catch (err) {
    console.error('Analytics load error:', err);
    Store.showToast('Unable to load analytics data.', 'critical');
  }
}

function renderAttackDistChart(threatDist) {
  const ctx = document.getElementById('an-attack-chart')?.getContext('2d');
  if (!ctx) return;
  if (chartAttackDist) chartAttackDist.destroy();

  const labels = Object.keys(threatDist || {});
  const vals = Object.values(threatDist || {});

  if (labels.length === 0) {
    chartAttackDist = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['No Threats'], datasets: [{ data: [1], backgroundColor: ['#1e293b'] }] },
      options: { cutout: '70%', responsive: true, maintainAspectRatio: false },
    });
    return;
  }

  chartAttackDist = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: vals,
        backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#38bdf8', '#ec4899'],
        borderWidth: 2,
        borderColor: '#0c1322',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 12 } },
      },
    },
  });
}

function renderSeverityChart(sevDist) {
  const ctx = document.getElementById('an-severity-chart')?.getContext('2d');
  if (!ctx) return;
  if (chartSeverityDist) chartSeverityDist.destroy();

  const keys = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const vals = keys.map(k => sevDist[k] || 0);

  chartSeverityDist = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: keys,
      datasets: [{
        label: 'Events',
        data: vals,
        backgroundColor: ['#10b981', '#f59e0b', '#f87171', '#ef4444'],
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
        y: { ticks: { color: '#64748b', precision: 0 }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });
}

function renderRiskDistChart(riskDist) {
  const ctx = document.getElementById('an-risk-chart')?.getContext('2d');
  if (!ctx) return;
  if (chartRiskDist) chartRiskDist.destroy();

  const keys = ['0-20', '21-40', '41-60', '61-80', '81-100'];
  const vals = keys.map(k => riskDist[k] || 0);

  chartRiskDist = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['0-20 (Safe)', '21-40 (Low)', '41-60 (Med)', '61-80 (High)', '81-100 (Crit)'],
      datasets: [{
        label: 'Flow Count',
        data: vals,
        backgroundColor: ['#10b981', '#38bdf8', '#f59e0b', '#f87171', '#ef4444'],
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
        y: { ticks: { color: '#64748b', precision: 0 }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });
}

import { ApiClient } from '../api.js';
import { Store } from '../store.js';

let activityChartInstance = null;
let threatLandscapeChartInstance = null;

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>Security Overview</h1>
        <p class="page-subtitle">Real-time intelligence from your network activity</p>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button id="btn-quick-analyze" class="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
          <span>New Analysis</span>
        </button>
        <div class="system-status-badge">
          <span class="status-dot"></span>
          <span>SYSTEM OPERATIONAL</span>
        </div>
      </div>
    </div>

    <!-- 4 Metric Cards -->
    <div class="metrics-grid">
      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span class="metric-title">Network Activity</span>
          <div class="metric-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
        </div>
        <div id="metric-activity-val">
          <div style="height: 38px; display: flex; align-items: center; color: var(--text-subtle);">Loading...</div>
        </div>
        <div class="metric-sub" id="metric-activity-sub">Inspected flows</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span class="metric-title">Threats Detected</span>
          <div class="metric-icon-wrap" style="color: var(--color-critical);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
        </div>
        <div id="metric-threats-val">
          <div style="height: 38px; display: flex; align-items: center; color: var(--text-subtle);">Loading...</div>
        </div>
        <div class="metric-sub" id="metric-threats-sub">Malicious signatures</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span class="metric-title">Anomalies</span>
          <div class="metric-icon-wrap" style="color: var(--accent-violet);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
        </div>
        <div id="metric-anomalies-val">
          <div style="height: 38px; display: flex; align-items: center; color: var(--text-subtle);">Loading...</div>
        </div>
        <div class="metric-sub" id="metric-anomalies-sub">Unsupervised outliers</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span class="metric-title">Security Health</span>
          <div class="metric-icon-wrap" style="color: var(--color-safe);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
        </div>
        <div id="metric-health-val">
          <div style="height: 38px; display: flex; align-items: center; color: var(--text-subtle);">Loading...</div>
        </div>
        <div class="metric-sub" id="metric-health-sub">Composite posture</div>
      </div>
    </div>

    <!-- Horizontal Security Health Meter Component -->
    <div class="glass-panel security-health-card">
      <div class="health-header">
        <div class="health-title-group">
          <h3>SECURITY HEALTH</h3>
          <p>Current network posture dynamically computed from multi-factor telemetry</p>
        </div>
        <div class="health-score-display" id="health-score-container">
          <span class="health-score-number" id="health-num">--</span>
          <span class="health-score-denom">/ 100</span>
        </div>
      </div>

      <!-- Horizontal Meter Bar -->
      <div class="health-meter-track">
        <div class="health-meter-fill" id="health-fill" style="width: 0%;"></div>
      </div>

      <!-- Factors Breakdown -->
      <div class="health-factors-grid" id="health-factors-container">
        <!-- Rendered dynamically -->
      </div>
    </div>

    <!-- Charts & Activity Streams Grid -->
    <div class="dashboard-grid">
      <!-- Left: Network Activity Chart -->
      <div class="glass-panel chart-card">
        <div class="chart-header">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700;">Network Activity</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Normal, suspicious, and malicious traffic distribution</p>
          </div>
          <div class="chart-controls">
            <button class="chart-tab-btn active" data-period="24H">24H</button>
            <button class="chart-tab-btn" data-period="7D">7D</button>
            <button class="chart-tab-btn" data-period="30D">30D</button>
          </div>
        </div>
        <div class="chart-container-wrap">
          <canvas id="activity-chart"></canvas>
          <div id="activity-chart-empty" style="display: none;" class="empty-state">
            <p>No activity recorded in this timeframe.</p>
            <button class="btn btn-secondary btn-sm" id="btn-chart-sample">Inspect Test Packet</button>
          </div>
        </div>
      </div>

      <!-- Right: Threat Landscape -->
      <div class="glass-panel chart-card">
        <div class="chart-header">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700;">Threat Landscape</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Attack taxonomy & categorization</p>
          </div>
        </div>
        <div class="donut-wrap">
          <canvas id="threat-donut-chart"></canvas>
          <div class="donut-center-text">
            <span class="donut-center-num" id="donut-total">0</span>
            <span class="donut-center-lbl">TOTAL THREATS</span>
          </div>
        </div>
        <div id="threat-legend-list" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </div>

    <!-- Recent Security Events Section -->
    <div class="glass-panel" style="padding: 1.75rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700;">RECENT SECURITY EVENTS</h3>
          <p style="font-size: 0.825rem; color: var(--text-muted);">Live inspection stream from database</p>
        </div>
        <button id="btn-view-all-events" class="btn btn-secondary btn-sm">
          <span>View All Events</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      <div class="event-stream-container" id="recent-events-stream">
        <div style="text-align: center; padding: 2rem; color: var(--text-subtle);">Fetching recent events...</div>
      </div>
    </div>
  `;

  // Hook actions
  document.getElementById('btn-quick-analyze')?.addEventListener('click', () => Store.setView('analyze'));
  document.getElementById('btn-view-all-events')?.addEventListener('click', () => Store.setView('events'));
  document.getElementById('btn-chart-sample')?.addEventListener('click', () => Store.setView('analyze'));

  // Load Dashboard Data
  await loadDashboardData();
}

async function loadDashboardData() {
  try {
    const res = await ApiClient.getDashboard();
    if (!res.success) throw new Error(res.error || 'Failed to load dashboard data');
    const data = res.data;

    // 1. Render Metrics Cards
    renderMetricCards(data.metrics);

    // 2. Render Horizontal Security Health
    renderSecurityHealth(data.metrics.security_health);

    // 3. Render Network Activity Chart (Default 24H)
    setupActivityChart(data.activity_trends);

    // 4. Render Threat Landscape
    setupThreatLandscape(data.threat_landscape);

    // 5. Render Recent Events Stream
    renderRecentEvents(data.recent_events);

  } catch (err) {
    console.error('Dashboard load error:', err);
    Store.showToast('Unable to load dashboard data. Check backend connection.', 'critical');
  }
}

function renderMetricCards(metrics) {
  const act = metrics.network_activity;
  const thr = metrics.threats_detected;
  const anom = metrics.anomalies;
  const hlth = metrics.security_health;

  // Activity Card
  const actVal = document.getElementById('metric-activity-val');
  if (actVal) {
    if (!act.has_data) {
      actVal.innerHTML = `<div class="metric-empty-text">No activity yet<br><span style="color:var(--accent-blue); cursor:pointer;" id="link-start-analysis">Start your first analysis</span></div>`;
      document.getElementById('link-start-analysis')?.addEventListener('click', () => Store.setView('analyze'));
    } else {
      actVal.innerHTML = `<div class="metric-value-wrap"><span class="metric-number">${act.total}</span></div>`;
    }
  }

  // Threats Card
  const thrVal = document.getElementById('metric-threats-val');
  if (thrVal) {
    if (!thr.has_data) {
      thrVal.innerHTML = `<div class="metric-empty-text">0 threats detected<br><span style="color:var(--color-safe);">Perimeter clear</span></div>`;
    } else {
      thrVal.innerHTML = `
        <div class="metric-value-wrap">
          <span class="metric-number" style="color: ${thr.total > 0 ? 'var(--color-critical)' : 'var(--text-main)'};">${thr.total}</span>
          <span style="font-size: 0.85rem; color: var(--text-subtle);">(${thr.rate}%)</span>
        </div>
      `;
    }
  }

  // Anomalies Card
  const anomVal = document.getElementById('metric-anomalies-val');
  if (anomVal) {
    if (!anom.has_data) {
      anomVal.innerHTML = `<div class="metric-empty-text">0 anomalies<br><span style="color:var(--text-subtle);">Baseline nominal</span></div>`;
    } else {
      anomVal.innerHTML = `<div class="metric-value-wrap"><span class="metric-number" style="color: #a78bfa;">${anom.total}</span></div>`;
    }
  }

  // Health Card
  const hlthVal = document.getElementById('metric-health-val');
  if (hlthVal) {
    const color = hlth.score >= 80 ? 'var(--color-safe)' : hlth.score >= 60 ? 'var(--color-warning)' : 'var(--color-critical)';
    hlthVal.innerHTML = `
      <div class="metric-value-wrap">
        <span class="metric-number" style="color: ${color};">${hlth.score}</span>
        <span style="font-size: 0.9rem; color: var(--text-subtle);">/ 100</span>
      </div>
    `;
    const hlthSub = document.getElementById('metric-health-sub');
    if (hlthSub) hlthSub.innerText = `${hlth.label} Posture`;
  }
}

function renderSecurityHealth(health) {
  const numElem = document.getElementById('health-num');
  const fillElem = document.getElementById('health-fill');
  const factorsElem = document.getElementById('health-factors-container');

  if (numElem) numElem.innerText = health.score;
  if (fillElem) {
    fillElem.style.width = `${health.score}%`;
    if (health.score < 60) {
      fillElem.style.background = 'linear-gradient(90deg, #ef4444, #f59e0b)';
    } else if (health.score < 80) {
      fillElem.style.background = 'linear-gradient(90deg, #2563eb, #f59e0b)';
    } else {
      fillElem.style.background = 'linear-gradient(90deg, #2563eb, #38bdf8, #10b981)';
    }
  }

  if (factorsElem && health.factors) {
    let factorsHtml = '';
    for (const key of Object.keys(health.factors)) {
      const f = health.factors[key];
      factorsHtml += `
        <div class="factor-item">
          <div class="factor-label-row">
            <span class="factor-name">${f.name}</span>
            <span class="factor-status">${f.status}</span>
          </div>
          <div class="factor-bar">
            <div class="factor-bar-fill" style="width: ${f.score}%;"></div>
          </div>
        </div>
      `;
    }
    factorsElem.innerHTML = factorsHtml;
  }
}

function setupActivityChart(trends) {
  const ctx = document.getElementById('activity-chart')?.getContext('2d');
  if (!ctx) return;

  if (activityChartInstance) {
    activityChartInstance.destroy();
  }

  const periodData = trends['24H'] || { labels: [], normal: [], suspicious: [], attacks: [] };

  activityChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: periodData.labels,
      datasets: [
        {
          label: 'Normal Activity',
          data: periodData.normal,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: periodData.labels.length > 20 ? 0 : 3,
        },
        {
          label: 'Suspicious / Anomaly',
          data: periodData.suspicious,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: periodData.labels.length > 20 ? 0 : 3,
        },
        {
          label: 'Attacks',
          data: periodData.attacks,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: periodData.labels.length > 20 ? 0 : 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#94a3b8', font: { family: 'inherit', size: 11 }, boxWidth: 12 },
        },
        tooltip: {
          backgroundColor: '#0c1322',
          borderColor: 'rgba(56, 189, 248, 0.25)',
          borderWidth: 1,
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#64748b', maxTicksLimit: 8, font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#64748b', precision: 0, font: { size: 10 } },
        },
      },
    },
  });

  // Attach period toggles
  document.querySelectorAll('.chart-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.chart-tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const p = e.target.dataset.period;
      const cur = trends[p];
      if (cur && activityChartInstance) {
        activityChartInstance.data.labels = cur.labels;
        activityChartInstance.data.datasets[0].data = cur.normal;
        activityChartInstance.data.datasets[1].data = cur.suspicious;
        activityChartInstance.data.datasets[2].data = cur.attacks;
        activityChartInstance.update();
      }
    });
  });
}

function setupThreatLandscape(landscape) {
  const ctx = document.getElementById('threat-donut-chart')?.getContext('2d');
  const totalElem = document.getElementById('donut-total');
  const legendElem = document.getElementById('threat-legend-list');
  if (!ctx) return;

  if (threatLandscapeChartInstance) {
    threatLandscapeChartInstance.destroy();
  }

  const dist = landscape.distribution || {};
  const labels = Object.keys(dist);
  const dataVals = Object.values(dist);
  const total = landscape.total_threats || 0;

  if (totalElem) totalElem.innerText = total;

  if (labels.length === 0) {
    // Empty state
    if (legendElem) {
      legendElem.innerHTML = `<div class="empty-state" style="padding: 1rem;"><p style="font-size: 0.8rem;">No threats detected yet.</p></div>`;
    }
    threatLandscapeChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No Threats'],
        datasets: [{ data: [1], backgroundColor: ['#1e293b'], borderWidth: 0 }],
      },
      options: {
        cutout: '76%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      },
    });
    return;
  }

  const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#38bdf8', '#ec4899'];

  threatLandscapeChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: dataVals,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#0c1322',
        },
      ],
    },
    options: {
      cutout: '76%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0c1322',
          borderColor: 'rgba(56, 189, 248, 0.25)',
          borderWidth: 1,
        },
      },
    },
  });

  // Render legend list with count and %
  if (legendElem) {
    let legHtml = '';
    labels.forEach((lbl, idx) => {
      const cnt = dataVals[idx];
      const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
      const col = colors[idx % colors.length];
      legHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${col};"></span>
            <span style="color: var(--text-main); font-weight: 500;">${lbl}</span>
          </div>
          <div style="color: var(--text-muted); font-family: var(--font-mono);">${cnt} (${pct}%)</div>
        </div>
      `;
    });
    legendElem.innerHTML = legHtml;
  }
}

function renderRecentEvents(events) {
  const container = document.getElementById('recent-events-stream');
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 2.5rem 1rem;">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
        <h4>No security events yet</h4>
        <p>Analyze a network flow in the Analyze tab to begin observing intelligence.</p>
        <button class="btn btn-primary btn-sm" id="btn-empty-analyze">Analyze Network Activity</button>
      </div>
    `;
    document.getElementById('btn-empty-analyze')?.addEventListener('click', () => Store.setView('analyze'));
    return;
  }

  let html = '';
  events.forEach(ev => {
    const isAttack = ev.prediction === 'Attack';
    const badgeClass = `badge-${ev.severity.toLowerCase()}`;
    const dotClass = isAttack ? 'event-dot attack' : 'event-dot';
    const titleText = isAttack ? `${ev.attack_type.toUpperCase()} Attack Detected` : 'Normal Network Activity';

    html += `
      <div class="event-stream-item" data-id="${ev.id}">
        <div class="event-dot-wrap">
          <div class="${dotClass}"></div>
        </div>
        <div class="event-details">
          <div class="event-meta-row">
            <span class="event-time">${ev.time_formatted || 'Recently'}</span>
            <span class="badge ${badgeClass}">${ev.severity} RISK (${ev.risk_score}/100)</span>
          </div>
          <div class="event-title">${titleText}</div>
          <div class="event-endpoint">${ev.endpoint} &bull; ${ev.protocol}/${ev.service} &bull; ${ev.confidence}% conf</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Add click listeners to open investigation drawer
  container.querySelectorAll('.event-stream-item').forEach(item => {
    item.addEventListener('click', () => {
      const actId = item.dataset.id;
      Store.openInvestigationDrawer(actId);
    });
  });
}

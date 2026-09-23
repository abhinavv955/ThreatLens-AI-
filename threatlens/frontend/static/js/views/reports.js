import { ApiClient } from '../api.js';
import { Store } from '../store.js';

export async function renderReports(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>Security Briefs</h1>
        <p class="page-subtitle">Generate auditable executive intelligence reports compiled from live platform state</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button id="btn-generate-report" class="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span>Generate Fresh Brief</span>
        </button>
        <button id="btn-print-report" class="btn btn-secondary btn-sm" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          <span>Print / Export PDF</span>
        </button>
      </div>
    </div>

    <!-- Report Viewer Area -->
    <div id="report-view-container">
      <div class="glass-panel empty-state" style="min-height: 480px; justify-content: center;">
        <div style="width: 58px; height: 58px; border-radius: var(--radius-lg); background: var(--accent-blue-dim); border: 1px solid rgba(56, 189, 248, 0.25); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; color: var(--accent-blue);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <h4>SECURITY BRIEF GENERATOR</h4>
        <p>Compile a formal audit document with threat statistics, model metrics, and recommended mitigations.</p>
        <button class="btn btn-primary btn-sm" id="btn-trigger-gen">Generate Security Brief</button>
      </div>
    </div>
  `;

  document.getElementById('btn-generate-report')?.addEventListener('click', () => generateAndDisplayReport());
  document.getElementById('btn-trigger-gen')?.addEventListener('click', () => generateAndDisplayReport());
  document.getElementById('btn-print-report')?.addEventListener('click', () => {
    window.print();
  });
}

async function generateAndDisplayReport() {
  const container = document.getElementById('report-view-container');
  const printBtn = document.getElementById('btn-print-report');
  if (!container) return;

  container.innerHTML = `
    <div class="glass-panel" style="min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
      <div style="width: 44px; height: 44px; border: 3px solid rgba(56, 189, 248, 0.2); border-top-color: var(--accent-blue); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1.25rem;"></div>
      <h3 style="font-size: 1.2rem; font-weight: 700;">Compiling Intelligence Brief...</h3>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">Querying database telemetry and active model performance.</p>
    </div>
  `;

  try {
    const res = await ApiClient.generateReport();
    if (!res.success) throw new Error(res.error || 'Failed to generate report');

    const rep = res.data;
    if (printBtn) printBtn.disabled = false;

    // Render Clean Printable Brief
    const sum = rep.executive_summary;
    const sev = rep.severity_breakdown;
    const model = rep.active_model;

    let atkHtml = '';
    for (const [atk, count] of Object.entries(rep.attack_breakdown || {})) {
      atkHtml += `<div style="background:#090e1c; padding:0.75rem 1rem; border-radius:var(--radius-sm);"><strong style="color:#f87171;">${atk.toUpperCase()}</strong>: ${count} flows</div>`;
    }

    let findingsHtml = '';
    (rep.findings_and_recommendations || []).forEach(f => {
      findingsHtml += `<li style="margin-bottom: 0.65rem; color: var(--text-main); font-size: 0.9rem; line-height: 1.5;">${f}</li>`;
    });

    let incidentsHtml = '';
    (rep.high_risk_incidents || []).forEach(inc => {
      incidentsHtml += `
        <tr>
          <td style="font-family: var(--font-mono); font-size: 0.78rem;">${inc.time_formatted || inc.date_formatted}</td>
          <td style="font-family: var(--font-mono); font-size: 0.78rem;">${inc.endpoint}</td>
          <td><strong>${inc.attack_type.toUpperCase()}</strong></td>
          <td><span style="font-weight: 700; color: #ef4444;">${inc.risk_score}</span> / 100</td>
          <td><span class="badge badge-${inc.severity.toLowerCase()}">${inc.severity}</span></td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div class="glass-panel" style="padding: 2.5rem; background: var(--bg-card); border-top: 4px solid var(--accent-blue);">
        <!-- Report Header -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem; margin-bottom: 2rem;">
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-blue); text-transform: uppercase; letter-spacing: 0.08em;">THREATLENS AI &bull; EXECUTIVE SECURITY BRIEF</div>
            <h1 style="font-size: 1.85rem; font-weight: 800; margin-top: 0.25rem;">Network Intelligence Posture Report</h1>
            <p style="color: var(--text-muted); font-size: 0.85rem;">Generated on ${rep.date_formatted}</p>
          </div>
          <div style="text-align: right; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-subtle);">
            <div>REPORT ID: <strong>${rep.report_id}</strong></div>
            <div>STATUS: CONFIDENTIAL</div>
          </div>
        </div>

        <!-- Section 1: Executive Overview -->
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 1rem;">1. Executive Summary</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
            <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Analyzed Flows</div>
              <div style="font-size: 1.5rem; font-weight: 800;">${sum.total_activities.toLocaleString()}</div>
            </div>
            <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Detected Attacks</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">${sum.total_threats} (${sum.threat_rate_pct}%)</div>
            </div>
            <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Anomalies</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #a78bfa;">${sum.total_anomalies}</div>
            </div>
            <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Security Health</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-safe);">${sum.security_health_score} / 100</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Attack Categories & Severity Breakdown -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">2. Attack Taxonomy</h3>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${atkHtml || '<div style="color:var(--text-subtle); font-size:0.85rem;">No attacks recorded in database.</div>'}
            </div>
          </div>
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">3. Severity Tiers</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <div style="background: #090e1c; padding: 0.75rem; border-radius: var(--radius-sm); border-left: 3px solid #ef4444;">
                <div style="font-size: 0.72rem; color: var(--text-subtle);">CRITICAL</div>
                <div style="font-size: 1.25rem; font-weight: 700;">${sev.CRITICAL}</div>
              </div>
              <div style="background: #090e1c; padding: 0.75rem; border-radius: var(--radius-sm); border-left: 3px solid #f87171;">
                <div style="font-size: 0.72rem; color: var(--text-subtle);">HIGH</div>
                <div style="font-size: 1.25rem; font-weight: 700;">${sev.HIGH}</div>
              </div>
              <div style="background: #090e1c; padding: 0.75rem; border-radius: var(--radius-sm); border-left: 3px solid #f59e0b;">
                <div style="font-size: 0.72rem; color: var(--text-subtle);">MEDIUM</div>
                <div style="font-size: 1.25rem; font-weight: 700;">${sev.MEDIUM}</div>
              </div>
              <div style="background: #090e1c; padding: 0.75rem; border-radius: var(--radius-sm); border-left: 3px solid #10b981;">
                <div style="font-size: 0.72rem; color: var(--text-subtle);">LOW</div>
                <div style="font-size: 1.25rem; font-weight: 700;">${sev.LOW}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Model & Detection Performance -->
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">4. ML Classifier Telemetry</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            Architecture: <strong>${model.model_name}</strong> (Version: <code>${model.version}</code>).
            Trained on empirical network flow features with leak-free preprocessing.
          </p>
          <div style="display: flex; gap: 2rem; background: #090e1c; padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem;">
            <div>Accuracy: <strong style="color: var(--color-safe);">${model.accuracy}%</strong></div>
            <div>Precision: <strong style="color: var(--accent-blue);">${model.precision}%</strong></div>
            <div>Recall: <strong style="color: #38bdf8;">${model.recall}%</strong></div>
            <div>F1-Score: <strong style="color: #a78bfa;">${model.f1_score}%</strong></div>
          </div>
        </div>

        <!-- Section 4: Key Findings & Recommendations -->
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">5. Intelligence Findings & Recommended Actions</h3>
          <ul style="padding-left: 1.25rem;">
            ${findingsHtml}
          </ul>
        </div>

        <!-- Section 5: High Risk Incidents Table -->
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">6. Critical & High-Risk Incidents</h3>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Origin & Target</th>
                  <th>Attack Type</th>
                  <th>Risk</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                ${incidentsHtml || '<tr><td colspan="5" style="text-align: center; color: var(--text-subtle); padding: 1.5rem;">No high-risk incidents recorded.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    Store.showToast('Security Brief compiled from live telemetry.', 'success');
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="glass-panel empty-state"><p style="color: var(--color-critical);">${err.message}</p></div>`;
  }
}

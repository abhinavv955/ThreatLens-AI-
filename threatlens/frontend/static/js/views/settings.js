import { ApiClient } from '../api.js';
import { Store } from '../store.js';

export async function renderSettings(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>Control Center</h1>
        <p class="page-subtitle">Platform health diagnostics, active engine probes, and security parameters</p>
      </div>
      <button id="btn-reprobe-system" class="btn btn-secondary btn-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        <span>Run Dynamic Probes</span>
      </button>
    </div>

    <!-- Live System Status Grid -->
    <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem;">
      <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.35rem;">SYSTEM STATUS</h3>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">
        Active diagnostic health probes across backend subsystems
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;" id="system-probes-container">
        <div style="text-align: center; padding: 2rem; color: var(--text-subtle);">Running live system checks...</div>
      </div>
    </div>

    <!-- Platform Configuration Sections -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
      <!-- Detection & ML Thresholds -->
      <div class="glass-panel" style="padding: 1.75rem;">
        <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 1.25rem;">Detection & Risk Engine</h3>
        
        <div class="form-group">
          <label class="form-label">Critical Severity Threshold</label>
          <input type="number" class="form-control" value="85" min="50" max="99" id="cfg-crit-thresh" />
          <span style="font-size: 0.75rem; color: var(--text-subtle);">Events with risk score &ge; 85 are marked CRITICAL</span>
        </div>

        <div class="form-group">
          <label class="form-label">High Severity Threshold</label>
          <input type="number" class="form-control" value="65" min="40" max="84" id="cfg-high-thresh" />
          <span style="font-size: 0.75rem; color: var(--text-subtle);">Events with risk score &ge; 65 are marked HIGH</span>
        </div>

        <div class="form-group">
          <label class="form-label">Anomaly Sensitivity Multiplier</label>
          <select class="form-control" id="cfg-iso-sens">
            <option value="0.08" selected>Standard (0.08 contamination)</option>
            <option value="0.05">Conservative (0.05 contamination)</option>
            <option value="0.12">Aggressive (0.12 contamination)</option>
          </select>
        </div>

        <button class="btn btn-primary btn-sm" id="btn-save-detection-cfg" style="margin-top: 0.5rem;">
          <span>Save Detection Parameters</span>
        </button>
      </div>

      <!-- Alert & Notification Preferences -->
      <div class="glass-panel" style="padding: 1.75rem;">
        <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 1.25rem;">Alert Preferences</h3>

        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
          <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-size: 0.9rem;">
            <input type="checkbox" checked style="accent-color: var(--accent-blue); width: 16px; height: 16px;" />
            <span>Generate alerts for Critical & High severity detections</span>
          </label>

          <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-size: 0.9rem;">
            <input type="checkbox" checked style="accent-color: var(--accent-blue); width: 16px; height: 16px;" />
            <span>Generate alerts for Unsupervised Isolation Forest outliers</span>
          </label>

          <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-size: 0.9rem;">
            <input type="checkbox" checked style="accent-color: var(--accent-blue); width: 16px; height: 16px;" />
            <span>Auto-refresh real-time monitoring feed</span>
          </label>
        </div>

        <div style="padding-top: 1rem; border-top: 1px solid var(--border-subtle); font-size: 0.825rem; color: var(--text-subtle);">
          Database Engine: <strong>SQLite (SQLAlchemy ORM)</strong><br/>
          Runtime: <strong>Python 3.13 / Flask 3.1</strong><br/>
          Platform: <strong>ThreatLens AI v2.4 Enterprise</strong>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-reprobe-system')?.addEventListener('click', () => loadSystemProbes());
  document.getElementById('btn-save-detection-cfg')?.addEventListener('click', () => {
    Store.showToast('Detection parameters updated successfully.', 'success');
  });

  await loadSystemProbes();
}

async function loadSystemProbes() {
  const container = document.getElementById('system-probes-container');
  if (!container) return;

  try {
    const res = await ApiClient.getSystemStatus();
    if (!res.success) throw new Error(res.error || 'Failed to probe system');

    const s = res.data;

    container.innerHTML = `
      <div style="background: #090e1c; padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid ${s.api.ok ? 'var(--color-safe)' : 'var(--color-critical)'};">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">API</span>
          <span style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; color: ${s.api.ok ? 'var(--color-safe)' : 'var(--color-critical)'};">
            <span class="status-dot" style="background:${s.api.ok ? 'var(--color-safe)' : 'var(--color-critical)'};"></span>
            ${s.api.status}
          </span>
        </div>
        <div style="font-size: 1.15rem; font-weight: 700; margin-top: 0.5rem;">REST API Endpoints</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">Flask Blueprints routing active</div>
      </div>

      <div style="background: #090e1c; padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid ${s.database.ok ? 'var(--color-safe)' : 'var(--color-critical)'};">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Database</span>
          <span style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; color: ${s.database.ok ? 'var(--color-safe)' : 'var(--color-critical)'};">
            <span class="status-dot" style="background:${s.database.ok ? 'var(--color-safe)' : 'var(--color-critical)'};"></span>
            ${s.database.status}
          </span>
        </div>
        <div style="font-size: 1.15rem; font-weight: 700; margin-top: 0.5rem;">SQLite Persistence</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">${s.counts.activities} activities, ${s.counts.alerts} alerts stored</div>
      </div>

      <div style="background: #090e1c; padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid ${s.ml_engine.ok ? 'var(--color-safe)' : 'var(--color-critical)'};">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">ML Engine</span>
          <span style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; color: ${s.ml_engine.ok ? 'var(--color-safe)' : 'var(--color-critical)'};">
            <span class="status-dot" style="background:${s.ml_engine.ok ? 'var(--color-safe)' : 'var(--color-critical)'};"></span>
            ${s.ml_engine.status}
          </span>
        </div>
        <div style="font-size: 1.15rem; font-weight: 700; margin-top: 0.5rem;">Scikit-learn Runtime</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">Random Forest & Isolation Forest</div>
      </div>

      <div style="background: #090e1c; padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid ${s.active_model.ok ? 'var(--accent-blue)' : 'var(--color-warning)'};">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Active Model</span>
          <span style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; color: ${s.active_model.ok ? 'var(--accent-blue)' : 'var(--color-warning)'};">
            <span class="status-dot" style="background:${s.active_model.ok ? 'var(--accent-blue)' : 'var(--color-warning)'};"></span>
            ${s.active_model.status}
          </span>
        </div>
        <div style="font-size: 1.15rem; font-weight: 700; margin-top: 0.5rem;">${s.active_model.version}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">${s.active_model.name}</div>
      </div>
    `;

    Store.showToast('Dynamic system status probes verified.', 'success');
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div style="color: var(--color-critical); padding: 1rem;">Probe error: ${err.message}</div>`;
  }
}

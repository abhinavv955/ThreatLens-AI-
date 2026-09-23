import { ApiClient } from '../api.js';
import { Store } from '../store.js';

let presetsCache = [];

export async function renderAnalyze(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>Analyze Network Activity</h1>
        <p class="page-subtitle">Submit network characteristics for ML-powered inspection.</p>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <span style="font-size: 0.825rem; color: var(--text-muted);">Quick Preset:</span>
        <select id="preset-selector" class="form-control" style="width: auto; min-width: 240px; padding: 0.4rem 0.8rem; font-size: 0.825rem;">
          <option value="">-- Choose Sample Attack or Flow --</option>
        </select>
      </div>
    </div>

    <div class="analyze-layout">
      <!-- Left Column: Activity Input Form -->
      <div class="glass-panel" style="padding: 1.75rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle);">
          <h3 style="font-size: 1.05rem; font-weight: 700;">Activity Input</h3>
          <span style="font-size: 0.75rem; color: var(--text-subtle);">TCP/IP Flow Characteristics</span>
        </div>

        <form id="analyze-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Source IP</label>
              <input type="text" id="inp-src-ip" class="form-control" value="192.168.1.105" required />
            </div>
            <div class="form-group">
              <label class="form-label">Destination IP</label>
              <input type="text" id="inp-dst-ip" class="form-control" value="10.0.0.15" required />
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">Protocol</label>
              <select id="inp-protocol" class="form-control">
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Service</label>
              <select id="inp-service" class="form-control">
                <option value="http">HTTP (Web)</option>
                <option value="ssh">SSH (22)</option>
                <option value="dns">DNS (53)</option>
                <option value="smtp">SMTP (25)</option>
                <option value="telnet">Telnet (23)</option>
                <option value="ftp">FTP (21)</option>
                <option value="private">Private / Custom</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">TCP Flag</label>
              <select id="inp-flag" class="form-control">
                <option value="SF">SF (Normal Syn-Fin)</option>
                <option value="S0">S0 (SYN without ACK)</option>
                <option value="REJ">REJ (Rejected)</option>
                <option value="RSTO">RSTO (Reset by Origin)</option>
                <option value="RSTR">RSTR (Reset by Responder)</option>
              </select>
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">Duration (sec)</label>
              <input type="number" id="inp-duration" class="form-control" step="0.01" value="0.15" />
            </div>
            <div class="form-group">
              <label class="form-label">Source Bytes</label>
              <input type="number" id="inp-src-bytes" class="form-control" value="450" />
            </div>
            <div class="form-group">
              <label class="form-label">Destination Bytes</label>
              <input type="number" id="inp-dst-bytes" class="form-control" value="3200" />
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">Host Count (2s)</label>
              <input type="number" id="inp-count" class="form-control" value="4" />
            </div>
            <div class="form-group">
              <label class="form-label">Srv Count (2s)</label>
              <input type="number" id="inp-srv-count" class="form-control" value="4" />
            </div>
            <div class="form-group">
              <label class="form-label">SYN Error Rate</label>
              <input type="number" id="inp-serror" class="form-control" step="0.01" min="0" max="1" value="0.0" />
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">Failed Logins</label>
              <input type="number" id="inp-failed-logins" class="form-control" value="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Root Shell</label>
              <select id="inp-root-shell" class="form-control">
                <option value="0">0 (No root)</option>
                <option value="1">1 (Root shell obtained)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Diff Srv Rate</label>
              <input type="number" id="inp-diff-srv" class="form-control" step="0.01" min="0" max="1" value="0.0" />
            </div>
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button type="submit" id="btn-submit-analyze" class="btn btn-primary" style="flex: 1;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/></svg>
              <span>Run Intelligence Inspection</span>
            </button>
            <button type="button" id="btn-reset-form" class="btn btn-secondary">
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Right Column: Analysis Preview / Results Experience -->
      <div id="analyze-preview-container">
        <!-- Default Pre-submission State -->
        <div class="glass-panel empty-state" style="min-height: 480px; justify-content: center;">
          <div style="width: 58px; height: 58px; border-radius: var(--radius-lg); background: var(--accent-blue-dim); border: 1px solid rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <h4 style="font-size: 1.2rem; font-weight: 700;">READY FOR ANALYSIS</h4>
          <p style="color: var(--text-muted); max-width: 320px; margin-top: 0.4rem;">
            Provide network activity parameters on the left or select a preset to begin detection.
          </p>
        </div>
      </div>
    </div>
  `;

  // Attach handlers
  loadPresets();
  setupAnalyzeForm();
}

async function loadPresets() {
  try {
    const res = await ApiClient.getPresets();
    if (res.success && res.data) {
      presetsCache = res.data;
      const sel = document.getElementById('preset-selector');
      if (sel) {
        res.data.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.innerText = `${p.category}: ${p.name}`;
          sel.appendChild(opt);
        });

        sel.addEventListener('change', (e) => {
          const chosen = presetsCache.find(p => p.id === e.target.value);
          if (chosen) applyPresetData(chosen.data);
        });
      }
    }
  } catch (err) {
    console.error('Error loading presets:', err);
  }
}

function applyPresetData(d) {
  if (!d) return;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('inp-src-ip', d.source_ip);
  setVal('inp-dst-ip', d.destination_ip);
  setVal('inp-protocol', d.protocol_type);
  setVal('inp-service', d.service);
  setVal('inp-flag', d.flag);
  setVal('inp-duration', d.duration);
  setVal('inp-src-bytes', d.src_bytes);
  setVal('inp-dst-bytes', d.dst_bytes);
  setVal('inp-count', d.count);
  setVal('inp-srv-count', d.srv_count);
  setVal('inp-serror', d.serror_rate);
  setVal('inp-failed-logins', d.num_failed_logins);
  setVal('inp-root-shell', d.root_shell);
  setVal('inp-diff-srv', d.diff_srv_rate);

  Store.showToast(`Preset loaded into inspection form.`, 'info');
}

function setupAnalyzeForm() {
  const form = document.getElementById('analyze-form');
  const previewBox = document.getElementById('analyze-preview-container');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      source_ip: document.getElementById('inp-src-ip').value,
      destination_ip: document.getElementById('inp-dst-ip').value,
      protocol_type: document.getElementById('inp-protocol').value,
      service: document.getElementById('inp-service').value,
      flag: document.getElementById('inp-flag').value,
      duration: parseFloat(document.getElementById('inp-duration').value || 0),
      src_bytes: parseInt(document.getElementById('inp-src-bytes').value || 0),
      dst_bytes: parseInt(document.getElementById('inp-dst-bytes').value || 0),
      count: parseInt(document.getElementById('inp-count').value || 1),
      srv_count: parseInt(document.getElementById('inp-srv-count').value || 1),
      serror_rate: parseFloat(document.getElementById('inp-serror').value || 0),
      num_failed_logins: parseInt(document.getElementById('inp-failed-logins').value || 0),
      root_shell: parseInt(document.getElementById('inp-root-shell').value || 0),
      diff_srv_rate: parseFloat(document.getElementById('inp-diff-srv').value || 0),
    };

    // Stage 1: Animated Progress Steps
    renderAnalyzingStages(previewBox);

    try {
      // Small visual delay to show actual stages
      await new Promise(r => setTimeout(r, 650));

      const res = await ApiClient.analyzeActivity(payload);
      if (!res.success) throw new Error(res.error || 'Failed to inspect activity');

      // Stage 2: Render Result Experience
      renderAnalysisResult(previewBox, res.data);

      Store.showToast(`Analysis completed: ${res.data.prediction} (${res.data.severity} Risk)`, res.data.prediction === 'Attack' ? 'danger' : 'success');
    } catch (err) {
      console.error(err);
      previewBox.innerHTML = `
        <div class="glass-panel empty-state">
          <h4 style="color: var(--color-critical);">Analysis Error</h4>
          <p>${err.message}</p>
        </div>
      `;
    }
  });

  document.getElementById('btn-reset-form')?.addEventListener('click', () => {
    form.reset();
    document.getElementById('inp-src-ip').value = "192.168.1.105";
    document.getElementById('inp-dst-ip').value = "10.0.0.15";
  });
}

function renderAnalyzingStages(container) {
  container.innerHTML = `
    <div class="glass-panel" style="min-height: 480px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center;">
      <div style="width: 50px; height: 50px; border: 3px solid rgba(56, 189, 248, 0.2); border-top-color: var(--accent-blue); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1.5rem;"></div>
      <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1.25rem;">ANALYZING...</h3>
      <div style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left; width: 100%; max-width: 280px;">
        <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-safe); font-size: 0.875rem;">
          <span>✓</span><span>Validating activity</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--accent-blue); font-size: 0.875rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-blue); animation: pulse-dot 1.5s infinite;"></span>
          <span>Running Random Forest</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-subtle); font-size: 0.875rem;">
          <span>○</span><span>Calculating risk & signals</span>
        </div>
      </div>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `;
}

function renderAnalysisResult(container, data) {
  const isAttack = data.prediction === 'Attack';
  const stateClass = isAttack ? 'attack-state' : 'normal-state';
  const verdictClass = isAttack ? 'attack' : 'normal';
  const badgeClass = `badge-${data.severity.toLowerCase()}`;

  let signalsHtml = '';
  if (data.contributing_signals && data.contributing_signals.length > 0) {
    data.contributing_signals.forEach(sig => {
      const sigLvlClass = `badge-${sig.level.toLowerCase()}`;
      signalsHtml += `
        <div class="signal-item">
          <div class="signal-header">
            <span class="signal-title">${sig.title}</span>
            <span class="badge ${sigLvlClass}">${sig.level}</span>
          </div>
          <p class="signal-desc">${sig.description}</p>
        </div>
      `;
    });
  } else {
    signalsHtml = `<div style="color: var(--text-subtle); font-size: 0.85rem; font-style: italic;">No anomalous feature contributions detected. Flow conforms to normal baseline.</div>`;
  }

  container.innerHTML = `
    <div class="result-card ${stateClass}">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
        <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-subtle);">DETECTION RESULT</span>
        <span class="badge ${badgeClass}">${data.severity} SEVERITY</span>
      </div>

      <div class="result-header">
        <div class="result-verdict ${verdictClass}">${data.prediction.toUpperCase()}</div>
        <div style="font-size: 1.15rem; font-weight: 600; color: var(--text-main); margin-top: 0.25rem;">
          ${data.attack_type.toUpperCase()}
        </div>
      </div>

      <!-- Result Metrics Bar -->
      <div class="result-metrics-bar">
        <div>
          <div class="res-metric-val" style="color: ${data.risk_score >= 65 ? '#ef4444' : '#38bdf8'};">${data.risk_score} / 100</div>
          <div class="res-metric-lbl">Risk Score</div>
        </div>
        <div>
          <div class="res-metric-val">${data.confidence}%</div>
          <div class="res-metric-lbl">Confidence</div>
        </div>
        <div>
          <div class="res-metric-val" style="color: ${data.is_anomaly ? '#a78bfa' : '#10b981'};">${data.is_anomaly ? 'ANOMALY' : 'NORMAL'}</div>
          <div class="res-metric-lbl">Isolation Forest</div>
        </div>
      </div>

      <!-- Why did ThreatLens flag this? -->
      <div style="margin-top: 1.75rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.85rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">Why did ThreatLens flag this?</h4>
        </div>
        <div class="signals-container">
          ${signalsHtml}
        </div>
      </div>

      <!-- Action Footer -->
      <div style="display: flex; gap: 0.75rem; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--border-subtle);">
        <button id="btn-inspect-full" class="btn btn-secondary btn-sm" style="flex: 1;">
          <span>Investigate Timeline</span>
        </button>
        <button id="btn-analyze-another" class="btn btn-primary btn-sm">
          <span>New Analysis</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-inspect-full')?.addEventListener('click', () => {
    Store.openInvestigationDrawer(data.id);
  });
  document.getElementById('btn-analyze-another')?.addEventListener('click', () => {
    container.innerHTML = `
      <div class="glass-panel empty-state" style="min-height: 480px; justify-content: center;">
        <h4 style="font-size: 1.2rem; font-weight: 700;">READY FOR ANALYSIS</h4>
        <p style="color: var(--text-muted); max-width: 320px; margin-top: 0.4rem;">
          Provide network activity parameters on the left or select a preset to begin detection.
        </p>
      </div>
    `;
  });
}

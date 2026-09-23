import { ApiClient } from './api.js';
import { Store } from './store.js';

export function setupInvestigationDrawer() {
  let drawer = document.getElementById('investigation-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'investigation-drawer';
    drawer.className = 'drawer-overlay';
    drawer.innerHTML = `
      <div class="drawer-panel" id="investigation-drawer-panel">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-subtle);">
          <div>
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-blue); text-transform: uppercase; letter-spacing: 0.08em;">THREAT INVESTIGATION</div>
            <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text-main);" id="inv-header-title">Event Deep Dive</h2>
          </div>
          <button id="btn-close-drawer" class="btn btn-secondary btn-sm" style="padding: 0.35rem 0.65rem;">
            ✕ Close
          </button>
        </div>

        <div id="investigation-content" style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="text-align: center; padding: 3rem; color: var(--text-subtle);">Loading investigation dossier...</div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    // Close on overlay click or button
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) closeDrawer();
    });
    document.getElementById('btn-close-drawer')?.addEventListener('click', closeDrawer);
  }

  // Listen for open events
  window.addEventListener('open-investigation', async (e) => {
    const actId = e.detail?.activityId;
    if (actId) openDrawer(actId);
  });
}

function closeDrawer() {
  const drawer = document.getElementById('investigation-drawer');
  if (drawer) drawer.classList.remove('active');
}

async function openDrawer(activityId) {
  const drawer = document.getElementById('investigation-drawer');
  const content = document.getElementById('investigation-content');
  if (!drawer || !content) return;

  drawer.classList.add('active');
  content.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-subtle);">Fetching telemetry dossier for event #${activityId}...</div>`;

  try {
    const res = await ApiClient.getActivityDetail(activityId);
    if (!res.success) throw new Error(res.error || 'Failed to fetch event');

    const act = res.data;
    const isAttack = act.prediction === 'Attack';
    const badgeClass = `badge-${act.severity.toLowerCase()}`;
    const detBadge = isAttack ? 'badge-attack' : 'badge-normal';

    let featRows = '';
    const feats = act.features || {};
    const keyFeats = [
      { name: 'Protocol / Service', val: `${act.protocol} / ${act.service}` },
      { name: 'TCP Flag', val: act.flag },
      { name: 'Duration', val: `${act.duration}s` },
      { name: 'Source Bytes', val: act.src_bytes.toLocaleString() },
      { name: 'Destination Bytes', val: act.dst_bytes.toLocaleString() },
      { name: 'Host Count (2s)', val: act.count },
      { name: 'Service Count (2s)', val: act.srv_count },
      { name: 'SYN Error Rate', val: `${(act.serror_rate * 100).toFixed(1)}%` },
      { name: 'REJ Error Rate', val: `${(act.rerror_rate * 100).toFixed(1)}%` },
      { name: 'Failed Logins', val: feats.num_failed_logins || 0 },
      { name: 'Root Shell Obtained', val: feats.root_shell || 0 },
      { name: 'Service Variance', val: `${((feats.diff_srv_rate || 0) * 100).toFixed(1)}%` },
    ];

    keyFeats.forEach(f => {
      featRows += `
        <div style="background: #090e1c; padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; font-size: 0.825rem;">
          <span style="color: var(--text-muted);">${f.name}</span>
          <span style="font-family: var(--font-mono); font-weight: 600; color: var(--text-main);">${f.val}</span>
        </div>
      `;
    });

    let signalsHtml = '';
    if (act.contributing_signals && act.contributing_signals.length > 0) {
      act.contributing_signals.forEach(s => {
        signalsHtml += `
          <div class="signal-item">
            <div class="signal-header">
              <span class="signal-title">${s.title}</span>
              <span class="badge badge-${s.level.toLowerCase()}">${s.level}</span>
            </div>
            <p class="signal-desc">${s.description}</p>
          </div>
        `;
      });
    } else {
      signalsHtml = `<div style="color: var(--text-subtle); font-size: 0.85rem; font-style: italic;">No anomalous feature signals flagged. Standard traffic profile.</div>`;
    }

    let timelineHtml = '';
    if (act.timeline && act.timeline.length > 0) {
      act.timeline.forEach(t => {
        const isCur = t.is_current;
        const curStyle = isCur ? 'border-color: var(--accent-blue); background: rgba(56, 189, 248, 0.06);' : '';
        timelineHtml += `
          <div style="padding: 0.75rem 0.95rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); font-size: 0.825rem; ${curStyle} cursor: pointer;" class="timeline-row" data-id="${t.id}">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span style="font-family: var(--font-mono); color: var(--text-muted);">${t.time_formatted} ${isCur ? '<strong style="color: var(--accent-blue);">(Selected)</strong>' : ''}</span>
              <span class="badge badge-${t.severity.toLowerCase()}">${t.severity} (${t.risk_score})</span>
            </div>
            <div style="font-weight: 600; color: var(--text-main);">${t.prediction}: ${t.attack_type.toUpperCase()}</div>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-subtle);">${t.endpoint}</div>
          </div>
        `;
      });
    }

    content.innerHTML = `
      <!-- Verdict Summary Banner -->
      <div style="background: #090e1c; padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid ${isAttack ? '#ef4444' : '#10b981'};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div style="display: flex; gap: 0.5rem;">
            <span class="badge ${detBadge}">${act.prediction}</span>
            <span class="badge ${badgeClass}">${act.severity} SEVERITY</span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-subtle);">${act.date_formatted} ${act.time_formatted}</span>
        </div>
        <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">${act.attack_type.toUpperCase()}</div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-blue); margin-top: 0.25rem;">${act.endpoint}</div>
      </div>

      <!-- Quick Metrics Strip -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; text-align: center;">
        <div style="background: #090e1c; padding: 0.85rem; border-radius: var(--radius-md);">
          <div style="font-size: 1.35rem; font-weight: 800; color: ${act.risk_score >= 65 ? '#ef4444' : 'var(--accent-blue)'};">${act.risk_score} / 100</div>
          <div style="font-size: 0.7rem; color: var(--text-subtle); text-transform: uppercase;">Calculated Risk</div>
        </div>
        <div style="background: #090e1c; padding: 0.85rem; border-radius: var(--radius-md);">
          <div style="font-size: 1.35rem; font-weight: 800;">${act.confidence}%</div>
          <div style="font-size: 0.7rem; color: var(--text-subtle); text-transform: uppercase;">Model Confidence</div>
        </div>
        <div style="background: #090e1c; padding: 0.85rem; border-radius: var(--radius-md);">
          <div style="font-size: 1.35rem; font-weight: 800; color: ${act.is_anomaly ? '#a78bfa' : '#10b981'};">${act.is_anomaly ? 'ANOMALY' : 'NORMAL'}</div>
          <div style="font-size: 0.7rem; color: var(--text-subtle); text-transform: uppercase;">Isolation Forest</div>
        </div>
      </div>

      <!-- Section: Detection Reasoning (Explainable Signals) -->
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.65rem;">Detection Reasoning</h4>
        <div class="signals-container">
          ${signalsHtml}
        </div>
      </div>

      <!-- Section: Activity Profile (Features) -->
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.65rem;">Activity Profile (Inspected Features)</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          ${featRows}
        </div>
      </div>

      <!-- Section: Related Activity Timeline -->
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.65rem;">Related Host Activity Timeline</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${timelineHtml || '<div style="color: var(--text-subtle); font-size: 0.8rem;">No historical activity recorded for this endpoint.</div>'}
        </div>
      </div>
    `;

    // Attach row switches
    content.querySelectorAll('.timeline-row').forEach(row => {
      row.addEventListener('click', () => {
        openDrawer(row.dataset.id);
      });
    });

  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="empty-state"><p style="color: var(--color-critical);">${err.message}</p></div>`;
  }
}

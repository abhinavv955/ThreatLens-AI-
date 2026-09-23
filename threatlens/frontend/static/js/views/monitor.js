import { ApiClient } from '../api.js';
import { Store } from '../store.js';

let pollTimer = null;
let lastKnownId = null;

export async function renderMonitor(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>LIVE SECURITY MONITOR</h1>
        <p class="page-subtitle">Real-time incoming analysis telemetry & frequency pulse</p>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button id="btn-toggle-poll" class="btn btn-secondary btn-sm">
          <span id="poll-icon">⏸</span>
          <span id="poll-text">Pause Stream</span>
        </button>
        <div class="system-status-badge">
          <span class="status-dot"></span>
          <span>CONNECTED</span>
        </div>
      </div>
    </div>

    <!-- Network Pulse Visualizer -->
    <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem; text-align: center; position: relative; overflow: hidden;">
      <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-subtle); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.5rem;">
        NETWORK PULSE
      </div>
      <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 1.5rem;" id="pulse-frequency-text">
        Real-time Activity Density
      </div>

      <!-- Pulse SVG Visualization -->
      <div style="display: flex; justify-content: center; align-items: center; height: 120px; position: relative;">
        <svg id="pulse-svg" width="600" height="90" viewBox="0 0 600 90" style="width: 100%; max-width: 600px; overflow: visible;">
          <defs>
            <linearGradient id="pulseLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2" />
              <stop offset="50%" stop-color="#38bdf8" stop-opacity="1" />
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.2" />
            </linearGradient>
          </defs>
          <path id="pulse-wave-path" d="M 0 45 L 200 45 L 210 20 L 220 70 L 230 10 L 240 80 L 250 45 L 600 45" 
                fill="none" stroke="url(#pulseLineGrad)" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </div>

      <div style="display: flex; justify-content: center; gap: 2.5rem; margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted);">
        <div>Stream State: <strong style="color: var(--color-safe);">Active</strong></div>
        <div>Monitored Feed: <strong style="color: var(--accent-blue);" id="monitor-event-count">0 events</strong></div>
        <div>Latest Ingestion: <strong style="color: var(--text-main);" id="monitor-latest-time">Awaiting packet</strong></div>
      </div>
    </div>

    <!-- Incoming Events Stream List -->
    <div class="glass-panel" style="padding: 1.75rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700;">INCOMING EVENTS</h3>
          <p style="font-size: 0.825rem; color: var(--text-muted);">Synchronized activity feed</p>
        </div>
        <button id="btn-monitor-new-flow" class="btn btn-primary btn-sm">
          <span>Analyze Sample Flow</span>
        </button>
      </div>

      <div id="monitor-events-list" style="display: flex; flex-direction: column; gap: 0.85rem;">
        <div style="text-align: center; padding: 3rem; color: var(--text-subtle);">Connecting to security telemetry stream...</div>
      </div>
    </div>
  `;

  document.getElementById('btn-monitor-new-flow')?.addEventListener('click', () => Store.setView('analyze'));

  let isPolling = true;
  const toggleBtn = document.getElementById('btn-toggle-poll');
  toggleBtn?.addEventListener('click', () => {
    isPolling = !isPolling;
    const txt = document.getElementById('poll-text');
    const ico = document.getElementById('poll-icon');
    if (txt) txt.innerText = isPolling ? 'Pause Stream' : 'Resume Stream';
    if (ico) ico.innerText = isPolling ? '⏸' : '▶';
  });

  // Initial fetch and start interval polling
  await fetchMonitorEvents();

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (isPolling) fetchMonitorEvents();
  }, 4000);

  // Clear timer when leaving page
  window.addEventListener('hashchange', () => {
    if (pollTimer) clearInterval(pollTimer);
  }, { once: true });
}

async function fetchMonitorEvents() {
  try {
    const res = await ApiClient.getActivities({ limit: 12 });
    if (!res.success) return;

    const data = res.data;
    const countEl = document.getElementById('monitor-event-count');
    const timeEl = document.getElementById('monitor-latest-time');
    const listEl = document.getElementById('monitor-events-list');

    if (countEl) countEl.innerText = `${data.total} recorded`;

    if (!data.activities || data.activities.length === 0) {
      if (listEl) {
        listEl.innerHTML = `
          <div class="empty-state" style="padding: 3.5rem 1rem;">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <h4>WAITING FOR NETWORK ACTIVITY</h4>
            <p>No events have been analyzed yet.</p>
            <button class="btn btn-primary btn-sm" id="btn-monitor-empty-run">Inspect Network Flow</button>
          </div>
        `;
        document.getElementById('btn-monitor-empty-run')?.addEventListener('click', () => Store.setView('analyze'));
      }
      return;
    }

    const latest = data.activities[0];
    if (timeEl && latest.time_formatted) {
      timeEl.innerText = `${latest.time_formatted} (${latest.prediction})`;
    }

    // Trigger subtle wave animation
    animatePulse();

    let html = '';
    data.activities.forEach(ev => {
      const isAttack = ev.prediction === 'Attack';
      const badgeClass = `badge-${ev.severity.toLowerCase()}`;
      const dotClass = isAttack ? 'event-dot attack' : 'event-dot';
      const title = isAttack ? `MALICIOUS: ${ev.attack_type.toUpperCase()} ATTACK` : 'NORMAL NETWORK FLOW';

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
            <div class="event-title">${title}</div>
            <div class="event-endpoint">${ev.endpoint} &bull; ${ev.protocol}/${ev.service} &bull; ${ev.confidence}% confidence</div>
          </div>
        </div>
      `;
    });

    if (listEl) {
      listEl.innerHTML = html;
      listEl.querySelectorAll('.event-stream-item').forEach(item => {
        item.addEventListener('click', () => Store.openInvestigationDrawer(item.dataset.id));
      });
    }

  } catch (err) {
    console.error('Monitor polling error:', err);
  }
}

function animatePulse() {
  const path = document.getElementById('pulse-wave-path');
  if (!path) return;
  path.style.transition = 'transform 0.2s ease';
  path.style.transform = 'scaleY(1.3)';
  setTimeout(() => {
    if (path) path.style.transform = 'scaleY(1)';
  }, 250);
}

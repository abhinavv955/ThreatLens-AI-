import { ApiClient } from '../api.js';
import { Store } from '../store.js';

let alertFilter = 'ALL';

export async function renderAlerts(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>Threat Alerts</h1>
        <p class="page-subtitle">Actionable alerts generated from high-risk detection signatures</p>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary btn-sm alert-filter-btn active" data-status="ALL">All Alerts</button>
        <button class="btn btn-secondary btn-sm alert-filter-btn" data-status="UNREAD">Unread Only</button>
        <button class="btn btn-secondary btn-sm alert-filter-btn" data-status="ACKNOWLEDGED">Acknowledged</button>
      </div>
    </div>

    <!-- Alert List Container -->
    <div id="alerts-cards-container" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <div style="text-align: center; padding: 3rem; color: var(--text-subtle);">Fetching threat alerts...</div>
    </div>
  `;

  document.querySelectorAll('.alert-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.alert-filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      alertFilter = e.target.dataset.status;
      loadAlerts();
    });
  });

  await loadAlerts();
}

async function loadAlerts() {
  const container = document.getElementById('alerts-cards-container');
  if (!container) return;

  try {
    const res = await ApiClient.getAlerts({ status: alertFilter, limit: 30 });
    if (!res.success) throw new Error(res.error || 'Failed to load alerts');

    const alerts = res.data.alerts;

    // Update Store unread count
    Store.unreadAlertCount = res.data.unread_count || 0;
    const badge = document.getElementById('unread-alert-count');
    if (badge) badge.innerText = Store.unreadAlertCount;

    if (!alerts || alerts.length === 0) {
      container.innerHTML = `
        <div class="glass-panel empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <h4>No alerts in this category</h4>
          <p>No unhandled threat alerts require attention at this time.</p>
          <button class="btn btn-secondary btn-sm" id="btn-alerts-test">Analyze Suspicious Flow</button>
        </div>
      `;
      document.getElementById('btn-alerts-test')?.addEventListener('click', () => Store.setView('analyze'));
      return;
    }

    let html = '';
    alerts.forEach(al => {
      const isCritical = al.severity === 'CRITICAL';
      const isHigh = al.severity === 'HIGH';
      const badgeClass = `badge-${al.severity.toLowerCase()}`;
      const statusClass = al.status === 'UNREAD' ? 'style="border-left: 4px solid var(--color-critical);"' : 'style="border-left: 4px solid var(--text-subtle);"';

      html += `
        <div class="glass-panel" ${statusClass} style="padding: 1.5rem; position: relative;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.75rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.4rem;">
                <span class="badge ${badgeClass}">${al.severity}</span>
                <span style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-subtle);">${al.date_formatted} ${al.time_formatted || ''}</span>
                <span class="badge" style="background: rgba(255,255,255,0.04); color: var(--text-muted);">${al.status}</span>
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">${al.title}</h3>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.45rem; font-weight: 800; color: ${al.risk_score >= 65 ? '#ef4444' : 'var(--accent-blue)'};">${al.risk_score} / 100</div>
              <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">Calculated Risk</div>
            </div>
          </div>

          <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.25rem;">
            ${al.description}
          </p>

          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle);">
            <div style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--text-muted);">
              <strong>Endpoint:</strong> ${al.endpoint || 'Unknown Origin'} &bull; <strong>Attack:</strong> ${al.attack_type.toUpperCase()}
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${al.activity_id ? `
                <button class="btn btn-secondary btn-sm btn-alert-view" data-actid="${al.activity_id}">
                  <span>View Event</span>
                </button>
              ` : ''}
              ${al.status === 'UNREAD' ? `
                <button class="btn btn-primary btn-sm btn-alert-ack" data-id="${al.id}">
                  <span>Acknowledge</span>
                </button>
              ` : ''}
              ${al.status !== 'RESOLVED' ? `
                <button class="btn btn-secondary btn-sm btn-alert-resolve" data-id="${al.id}">
                  <span>Resolve</span>
                </button>
              ` : `
                <span style="font-size: 0.78rem; color: var(--color-safe); font-weight: 600;">✓ Resolved</span>
              `}
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach actions
    container.querySelectorAll('.btn-alert-view').forEach(btn => {
      btn.addEventListener('click', () => Store.openInvestigationDrawer(btn.dataset.actid));
    });

    container.querySelectorAll('.btn-alert-ack').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await ApiClient.updateAlertStatus(id, 'ACKNOWLEDGED');
        Store.showToast('Alert acknowledged.', 'success');
        loadAlerts();
      });
    });

    container.querySelectorAll('.btn-alert-resolve').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await ApiClient.updateAlertStatus(id, 'RESOLVED');
        Store.showToast('Alert marked as resolved.', 'success');
        loadAlerts();
      });
    });

  } catch (err) {
    console.error('Alerts load error:', err);
    container.innerHTML = `<div class="glass-panel empty-state"><p style="color: var(--color-critical);">${err.message}</p></div>`;
  }
}

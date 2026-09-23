import { ApiClient } from '../api.js';
import { Store } from '../store.js';

let currentOffset = 0;
const pageSize = 15;
let currentFilters = { q: '', type: 'ALL', severity: 'ALL' };

export async function renderEvents(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>Security Events</h1>
        <p class="page-subtitle">Investigation log of all inspected network activity</p>
      </div>
      <button id="btn-export-events" class="btn btn-secondary btn-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        <span>Export Log</span>
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="glass-panel" style="padding: 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 220px; position: relative;">
        <input type="text" id="event-search-input" class="form-control" placeholder="Search events by IP, attack type, or protocol..." style="padding-left: 2.25rem;" />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-subtle);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
        <select id="event-type-filter" class="form-control" style="width: auto; font-size: 0.825rem;">
          <option value="ALL">TYPE: All Types</option>
          <option value="ATTACK">Attacks Only</option>
          <option value="NORMAL">Normal Only</option>
          <option value="DoS">DoS</option>
          <option value="Probe">Probe</option>
          <option value="R2L">R2L</option>
          <option value="U2R">U2R</option>
        </select>

        <select id="event-severity-filter" class="form-control" style="width: auto; font-size: 0.825rem;">
          <option value="ALL">SEVERITY: All</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <button id="btn-apply-filters" class="btn btn-primary btn-sm">
          <span>Filter</span>
        </button>
      </div>
    </div>

    <!-- Events Investigation Table -->
    <div class="glass-panel" style="overflow: hidden;">
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Endpoint</th>
              <th>Detection</th>
              <th>Type</th>
              <th>Risk Score</th>
              <th>Confidence</th>
              <th>Severity</th>
              <th>Anomaly</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="events-table-body">
            <tr>
              <td colspan="9" style="text-align: center; padding: 3rem; color: var(--text-subtle);">
                Loading security events...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: #080d1a; border-top: 1px solid var(--border-subtle);">
        <span style="font-size: 0.825rem; color: var(--text-muted);" id="pagination-status">
          Showing 0-0 of 0 events
        </span>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-page-prev" class="btn btn-secondary btn-sm" disabled>Previous</button>
          <button id="btn-page-next" class="btn btn-secondary btn-sm" disabled>Next</button>
        </div>
      </div>
    </div>
  `;

  setupFilterEvents();
  await loadEventsData();
}

function setupFilterEvents() {
  document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
    currentFilters.q = document.getElementById('event-search-input').value.trim();
    currentFilters.type = document.getElementById('event-type-filter').value;
    currentFilters.severity = document.getElementById('event-severity-filter').value;
    currentOffset = 0;
    loadEventsData();
  });

  document.getElementById('event-search-input')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      currentFilters.q = e.target.value.trim();
      currentOffset = 0;
      loadEventsData();
    }
  });

  document.getElementById('btn-page-prev')?.addEventListener('click', () => {
    if (currentOffset >= pageSize) {
      currentOffset -= pageSize;
      loadEventsData();
    }
  });

  document.getElementById('btn-page-next')?.addEventListener('click', () => {
    currentOffset += pageSize;
    loadEventsData();
  });

  document.getElementById('btn-export-events')?.addEventListener('click', () => {
    Store.showToast('Generating security events CSV log...', 'info');
  });
}

async function loadEventsData() {
  const tbody = document.getElementById('events-table-body');
  const pageStatus = document.getElementById('pagination-status');
  const prevBtn = document.getElementById('btn-page-prev');
  const nextBtn = document.getElementById('btn-page-next');

  try {
    const res = await ApiClient.getActivities({
      q: currentFilters.q,
      type: currentFilters.type,
      severity: currentFilters.severity,
      limit: pageSize,
      offset: currentOffset,
    });

    if (!res.success) throw new Error(res.error || 'Failed to query events');

    const total = res.data.total;
    const records = res.data.activities;

    if (pageStatus) {
      const from = total === 0 ? 0 : currentOffset + 1;
      const to = Math.min(currentOffset + pageSize, total);
      pageStatus.innerText = `Showing ${from}-${to} of ${total} events`;
    }

    if (prevBtn) prevBtn.disabled = currentOffset === 0;
    if (nextBtn) nextBtn.disabled = currentOffset + pageSize >= total;

    if (!records || records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state" style="padding: 3rem 1rem;">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <h4>No security events found</h4>
              <p>No network traffic matches your query or no activities have been inspected.</p>
              <button class="btn btn-primary btn-sm" id="btn-events-inspect-now">Run Inspection</button>
            </div>
          </td>
        </tr>
      `;
      document.getElementById('btn-events-inspect-now')?.addEventListener('click', () => Store.setView('analyze'));
      return;
    }

    let html = '';
    records.forEach(r => {
      const isAttack = r.prediction === 'Attack';
      const badgeClass = `badge-${r.severity.toLowerCase()}`;
      const detBadge = isAttack ? 'badge-attack' : 'badge-normal';

      html += `
        <tr data-id="${r.id}">
          <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${r.time_formatted || r.date_formatted}</td>
          <td style="font-family: var(--font-mono); font-size: 0.825rem;">${r.endpoint}</td>
          <td><span class="badge ${detBadge}">${r.prediction}</span></td>
          <td style="font-weight: 600;">${r.attack_type.toUpperCase()}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-weight: 700; color: ${r.risk_score >= 65 ? '#ef4444' : 'var(--text-main)'};">${r.risk_score}</span>
              <span style="font-size: 0.75rem; color: var(--text-subtle);">/100</span>
            </div>
          </td>
          <td>${r.confidence}%</td>
          <td><span class="badge ${badgeClass}">${r.severity}</span></td>
          <td>
            ${r.is_anomaly ? '<span style="color: #a78bfa; font-size: 0.8rem; font-weight: 600;">ANOMALY</span>' : '<span style="color: var(--text-subtle); font-size: 0.8rem;">Normal</span>'}
          </td>
          <td>
            <button class="btn btn-secondary btn-sm btn-inspect-row" data-id="${r.id}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
              Investigate
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    // Attach click listeners to rows & investigate buttons
    tbody.querySelectorAll('.btn-inspect-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Store.openInvestigationDrawer(btn.dataset.id);
      });
    });

    tbody.querySelectorAll('tr[data-id]').forEach(row => {
      row.addEventListener('click', () => {
        Store.openInvestigationDrawer(row.dataset.id);
      });
    });

  } catch (err) {
    console.error('Events load error:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--color-critical); padding: 2rem;">${err.message}</td></tr>`;
  }
}

import { Store } from './store.js';
import { ApiClient } from './api.js';
import { setupInvestigationDrawer } from './investigation.js';

// View renderers
import { renderLanding } from './views/landing.js';
import { renderDashboard } from './views/dashboard.js';
import { renderAnalyze } from './views/analyze.js';
import { renderMonitor } from './views/monitor.js';
import { renderEvents } from './views/events.js';
import { renderAlerts } from './views/alerts.js';
import { renderAnalytics } from './views/analytics.js';
import { renderLaboratory } from './views/laboratory.js';
import { renderModels } from './views/models.js';
import { renderReports } from './views/reports.js';
import { renderAdvisor } from './views/advisor.js';
import { renderSettings } from './views/settings.js';

const routes = {
  landing: renderLanding,
  dashboard: renderDashboard,
  analyze: renderAnalyze,
  monitor: renderMonitor,
  events: renderEvents,
  alerts: renderAlerts,
  analytics: renderAnalytics,
  laboratory: renderLaboratory,
  models: renderModels,
  reports: renderReports,
  advisor: renderAdvisor,
  settings: renderSettings,
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // 1. Setup Investigation Drawer
  setupInvestigationDrawer();

  // 2. Setup Navigation Links
  setupNavLinks();

  // 3. Setup Hash Router
  setupRouter();

  // 4. Start Background Status Polling
  startHeaderStatusPoll();

  // 5. Initial View Load
  const initialHash = window.location.hash.replace('#', '') || 'landing';
  Store.setView(routes[initialHash] ? initialHash : 'landing');
}

function setupNavLinks() {
  // Brand Logo Click -> Landing or Dashboard
  document.getElementById('brand-logo-btn')?.addEventListener('click', () => {
    Store.setView('dashboard');
  });

  // Top Nav Items
  document.querySelectorAll('.top-nav .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.view;
      if (target && routes[target]) {
        Store.setView(target);
      }
    });
  });

  // Mobile Bottom Nav Items
  document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.dataset.view;
      if (target === 'more') {
        toggleMobileMoreMenu();
      } else if (target && routes[target]) {
        Store.setView(target);
      }
    });
  });

  // Top Right Alerts Bell Click
  document.getElementById('btn-header-alerts')?.addEventListener('click', () => {
    Store.setView('alerts');
  });

  // Top Right Active Model Chip Click
  document.getElementById('header-model-chip')?.addEventListener('click', () => {
    Store.setView('models');
  });
}

function setupRouter() {
  const container = document.getElementById('main-view-container');

  Store.subscribe((state) => {
    updateActiveNavIndicators(state.currentView);

    const renderFn = routes[state.currentView] || renderDashboard;
    if (container) {
      container.innerHTML = '';
      renderFn(container);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && routes[hash] && Store.currentView !== hash) {
      Store.setView(hash);
    }
  });
}

function updateActiveNavIndicators(currentView) {
  // Top nav
  document.querySelectorAll('.top-nav .nav-link').forEach(link => {
    if (link.dataset.view === currentView) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Mobile bottom nav
  document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach(item => {
    if (item.dataset.view === currentView) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function toggleMobileMoreMenu() {
  let menu = document.getElementById('mobile-more-drawer');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'mobile-more-drawer';
    menu.className = 'drawer-overlay';
    menu.innerHTML = `
      <div class="drawer-panel" style="max-width: 320px; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.15rem; font-weight: 700;">More Modules</h3>
          <button id="btn-close-mobile-more" class="btn btn-secondary btn-sm">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm mobile-more-link" data-view="events" style="justify-content: flex-start;">Security Events</button>
          <button class="btn btn-secondary btn-sm mobile-more-link" data-view="analytics" style="justify-content: flex-start;">Security Analytics</button>
          <button class="btn btn-secondary btn-sm mobile-more-link" data-view="laboratory" style="justify-content: flex-start;">Data Laboratory</button>
          <button class="btn btn-secondary btn-sm mobile-more-link" data-view="models" style="justify-content: flex-start;">Model Center</button>
          <button class="btn btn-secondary btn-sm mobile-more-link" data-view="reports" style="justify-content: flex-start;">Security Briefs</button>
          <button class="btn btn-secondary btn-sm mobile-more-link" data-view="advisor" style="justify-content: flex-start;">Threat Advisor</button>
          <button class="btn btn-secondary btn-sm mobile-more-link" data-view="settings" style="justify-content: flex-start;">Control Center</button>
        </div>
      </div>
    `;
    document.body.appendChild(menu);

    menu.addEventListener('click', (e) => {
      if (e.target === menu) menu.classList.remove('active');
    });
    document.getElementById('btn-close-mobile-more')?.addEventListener('click', () => {
      menu.classList.remove('active');
    });

    menu.querySelectorAll('.mobile-more-link').forEach(btn => {
      btn.addEventListener('click', () => {
        menu.classList.remove('active');
        Store.setView(btn.dataset.view);
      });
    });
  }

  menu.classList.toggle('active');
}

async function startHeaderStatusPoll() {
  async function updateHeader() {
    try {
      const res = await ApiClient.getSystemStatus();
      if (res.success) {
        const s = res.data;
        // Update alert counter badge
        const alertBadge = document.getElementById('unread-alert-count');
        if (alertBadge) {
          const unread = s.counts?.unread_alerts || 0;
          alertBadge.innerText = unread;
          alertBadge.style.display = unread > 0 ? 'flex' : 'none';
        }

        // Update active model chip
        const modelChip = document.getElementById('header-model-chip');
        if (modelChip && s.active_model) {
          modelChip.innerHTML = `
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #a78bfa;"></span>
            <span>${s.active_model.version}</span>
          `;
        }
      }
    } catch (err) {
      // Quiet fail in background poll
    }
  }

  await updateHeader();
  setInterval(updateHeader, 12000);
}

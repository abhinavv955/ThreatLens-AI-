/**
 * ThreatLens AI — Reactive State Store & UI Helpers
 */

export const Store = {
  currentView: 'landing', // 'landing', 'dashboard', 'analyze', 'monitor', 'events', 'alerts', 'analytics', 'laboratory', 'models', 'reports', 'advisor', 'settings'
  activeActivity: null,
  activeAlert: null,
  unreadAlertCount: 0,
  activeModel: null,
  listeners: new Set(),

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  },

  setView(viewName) {
    this.currentView = viewName;
    window.location.hash = `#${viewName}`;
    this.notify();
  },

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger' || type === 'critical') icon = '⚠️';
    if (type === 'warning') icon = '⚡';

    toast.innerHTML = `<span>${icon}</span><span style="flex: 1;">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  openInvestigationDrawer(activityId) {
    window.dispatchEvent(new CustomEvent('open-investigation', { detail: { activityId } }));
  }
};

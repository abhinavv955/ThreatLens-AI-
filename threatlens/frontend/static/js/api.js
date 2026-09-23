/**
 * ThreatLens AI — API Client Module
 * Communicates with Flask backend REST endpoints
 */

const API_BASE = '/api';

export const ApiClient = {
  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`);
    return await res.json();
  },

  async analyzeActivity(payload) {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async getActivities(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.type) query.set('type', params.type);
    if (params.severity) query.set('severity', params.severity);
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);

    const res = await fetch(`${API_BASE}/activities?${query.toString()}`);
    return await res.json();
  },

  async getActivityDetail(id) {
    const res = await fetch(`${API_BASE}/activities/${id}`);
    return await res.json();
  },

  async getAlerts(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.severity) query.set('severity', params.severity);
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);

    const res = await fetch(`${API_BASE}/alerts?${query.toString()}`);
    return await res.json();
  },

  async updateAlertStatus(alertId, newStatus) {
    const res = await fetch(`${API_BASE}/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    return await res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`);
    return await res.json();
  },

  async uploadDataset(formData) {
    const res = await fetch(`${API_BASE}/dataset/upload`, {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  },

  async getDatasets() {
    const res = await fetch(`${API_BASE}/datasets`);
    return await res.json();
  },

  async trainModel(datasetId = null, version = null) {
    const res = await fetch(`${API_BASE}/dataset/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId, version: version }),
    });
    return await res.json();
  },

  async generateSampleDataset() {
    const res = await fetch(`${API_BASE}/dataset/generate-sample`, {
      method: 'POST',
    });
    return await res.json();
  },

  async getModelPerformance() {
    const res = await fetch(`${API_BASE}/model/performance`);
    return await res.json();
  },

  async getModelInfo() {
    const res = await fetch(`${API_BASE}/model/info`);
    return await res.json();
  },

  async generateReport() {
    const res = await fetch(`${API_BASE}/report/generate`, {
      method: 'POST',
    });
    return await res.json();
  },

  async queryAdvisor(question) {
    const res = await fetch(`${API_BASE}/advisor/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question }),
    });
    return await res.json();
  },

  async getSystemStatus() {
    const res = await fetch(`${API_BASE}/system/status`);
    return await res.json();
  },

  async getPresets() {
    const res = await fetch(`${API_BASE}/presets`);
    return await res.json();
  },
};

import { ApiClient } from '../api.js';
import { Store } from '../store.js';

export async function renderModels(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>Model Center</h1>
        <p class="page-subtitle">Production machine learning model telemetry, evaluation metrics, and feature explainability</p>
      </div>
      <button id="btn-retrain-model" class="btn btn-primary btn-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        <span>Train New Model in Lab</span>
      </button>
    </div>

    <!-- Active Model Profile Card -->
    <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem;" id="active-model-card">
      <div style="text-align: center; padding: 3rem; color: var(--text-subtle);">Fetching active intelligence model...</div>
    </div>

    <!-- What Drives Detection? Feature Importance Section -->
    <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
        <div>
          <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">What Drives Detection?</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Empirical Random Forest Mean Decrease in Impurity (MDI) feature rankings</p>
        </div>
        <span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #c4b5fd;">Gini Importance</span>
      </div>

      <div id="feature-rankings-container">
        <div style="text-align: center; padding: 2rem; color: var(--text-subtle);">Computing feature importances...</div>
      </div>
    </div>

    <!-- Model Versions History -->
    <div class="glass-panel" style="padding: 1.75rem;">
      <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem;">Model Runs & Training History</h3>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Model Name</th>
              <th>Version</th>
              <th>Created</th>
              <th>Status</th>
              <th>Accuracy</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1 Score</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody id="model-history-tbody">
            <tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-subtle);">Loading model history...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btn-retrain-model')?.addEventListener('click', () => Store.setView('laboratory'));

  await loadModelDetails();
}

async function loadModelDetails() {
  const activeCard = document.getElementById('active-model-card');
  const featContainer = document.getElementById('feature-rankings-container');
  const histTbody = document.getElementById('model-history-tbody');

  try {
    const res = await ApiClient.getModelInfo();
    if (!res.success) throw new Error(res.error || 'Failed to fetch model info');

    const m = res.data.active_model;
    const history = res.data.history || [];

    if (!m) {
      if (activeCard) {
        activeCard.innerHTML = `
          <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <h4>NO ACTIVE MODEL TRAINED</h4>
            <p>Visit the Data Laboratory to train the production Random Forest Classifier.</p>
            <button class="btn btn-primary btn-sm" id="btn-empty-train-now">Open Data Laboratory</button>
          </div>
        `;
        document.getElementById('btn-empty-train-now')?.addEventListener('click', () => Store.setView('laboratory'));
      }
      if (featContainer) {
        featContainer.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: var(--text-subtle);">Train a model to display empirical feature importance rankings.</div>`;
      }
      return;
    }

    // 1. Render Active Model Card
    if (activeCard) {
      activeCard.innerHTML = `
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle);">
          <div>
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.4rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-blue); text-transform: uppercase;">ACTIVE MODEL</span>
              <span class="system-status-badge" style="padding: 0.2rem 0.6rem; font-size: 0.7rem;">
                <span class="status-dot"></span>
                <span>ACTIVE</span>
              </span>
            </div>
            <h2 style="font-size: 1.65rem; font-weight: 800; color: var(--text-main);">${m.model_name}</h2>
          </div>
          <div style="display: flex; gap: 2rem; font-size: 0.85rem;">
            <div>
              <div style="color: var(--text-subtle); text-transform: uppercase; font-size: 0.7rem;">VERSION</div>
              <div style="font-weight: 700; color: var(--text-main); font-family: var(--font-mono);">${m.version}</div>
            </div>
            <div>
              <div style="color: var(--text-subtle); text-transform: uppercase; font-size: 0.7rem;">TRAINED</div>
              <div style="font-weight: 600; color: var(--text-muted);">${m.date_formatted || 'Recently'}</div>
            </div>
          </div>
        </div>

        <!-- Metric Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem;">
          <div style="background: #090e1c; padding: 1.15rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">Accuracy</div>
            <div style="font-size: 1.85rem; font-weight: 800; color: var(--color-safe);">${m.accuracy}%</div>
          </div>
          <div style="background: #090e1c; padding: 1.15rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">Precision</div>
            <div style="font-size: 1.85rem; font-weight: 800; color: var(--accent-blue);">${m.precision}%</div>
          </div>
          <div style="background: #090e1c; padding: 1.15rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">Recall</div>
            <div style="font-size: 1.85rem; font-weight: 800; color: #38bdf8;">${m.recall}%</div>
          </div>
          <div style="background: #090e1c; padding: 1.15rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">F1-Score</div>
            <div style="font-size: 1.85rem; font-weight: 800; color: #a78bfa;">${m.f1_score}%</div>
          </div>
          <div style="background: #090e1c; padding: 1.15rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">Training Samples</div>
            <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main);">${m.train_samples.toLocaleString()}</div>
          </div>
          <div style="background: #090e1c; padding: 1.15rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.72rem; color: var(--text-subtle); text-transform: uppercase;">Testing Samples</div>
            <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-muted);">${m.test_samples.toLocaleString()}</div>
          </div>
        </div>
      `;
    }

    // 2. Render Feature Importance Rankings
    if (featContainer && m.feature_importances) {
      const topFeatures = m.feature_importances.slice(0, 8);
      const maxVal = topFeatures.length > 0 ? topFeatures[0][1] : 1.0;

      let featHtml = '';
      topFeatures.forEach(([name, val]) => {
        const pctWidth = Math.max(4, Math.round((val / maxVal) * 100));
        featHtml += `
          <div class="feature-rank-row">
            <span class="feature-rank-name">${name}</span>
            <div class="feature-rank-track">
              <div class="feature-rank-fill" style="width: ${pctWidth}%;"></div>
            </div>
            <span class="feature-rank-val">${(val * 100).toFixed(1)}%</span>
          </div>
        `;
      });
      featContainer.innerHTML = featHtml;
    }

    // 3. Render History Table
    if (histTbody && history.length > 0) {
      let hHtml = '';
      history.forEach(run => {
        const isAct = run.status === 'ACTIVE';
        hHtml += `
          <tr>
            <td style="font-weight: 600;">${run.model_name}</td>
            <td style="font-family: var(--font-mono);">${run.version}</td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">${run.date_formatted}</td>
            <td><span class="badge ${isAct ? 'badge-normal' : ''}">${run.status}</span></td>
            <td>${run.accuracy}%</td>
            <td>${run.precision}%</td>
            <td>${run.recall}%</td>
            <td>${run.f1_score}%</td>
            <td>${run.total_samples.toLocaleString()}</td>
          </tr>
        `;
      });
      histTbody.innerHTML = hHtml;
    }

  } catch (err) {
    console.error('Model Center error:', err);
    activeCard.innerHTML = `<div class="empty-state"><p style="color: var(--color-critical);">${err.message}</p></div>`;
  }
}

import { ApiClient } from '../api.js';
import { Store } from '../store.js';

let selectedDatasetId = null;

export async function renderLaboratory(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>DATA LABORATORY</h1>
        <p class="page-subtitle">Train and evaluate the intelligence behind ThreatLens.</p>
      </div>
      <button id="btn-load-sample-dataset" class="btn btn-secondary btn-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        <span>Load Baseline Network Dataset</span>
      </button>
    </div>

    <!-- Dropzone Upload Area -->
    <div class="glass-panel" style="margin-bottom: 2rem; padding: 2rem;">
      <div class="dropzone" id="dataset-dropzone">
        <input type="file" id="dataset-file-input" accept=".csv" style="display: none;" />
        <div style="width: 52px; height: 52px; border-radius: var(--radius-lg); background: var(--accent-blue-dim); border: 1px solid rgba(56, 189, 248, 0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto; color: var(--accent-blue);">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.35rem;">Drop CSV dataset here</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          Supports NSL-KDD, CICIDS, or custom network flow CSV files
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="btn-browse-dataset">
          <span>Browse Files</span>
        </button>
      </div>
    </div>

    <!-- Dataset Profile Display -->
    <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem;" id="dataset-profile-section">
      <div style="text-align: center; padding: 2.5rem; color: var(--text-subtle);">
        Select or upload a dataset to view schema profiling and class distribution.
      </div>
    </div>

    <!-- Datasets Repository Table -->
    <div class="glass-panel" style="padding: 1.75rem;">
      <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem;">Available Datasets</h3>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Uploaded</th>
              <th>Size</th>
              <th>Rows</th>
              <th>Columns</th>
              <th>Target</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="datasets-table-body">
            <tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-subtle);">Loading datasets...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  setupDropzone();
  setupSampleLoader();
  await loadDatasetsList();
}

function setupDropzone() {
  const dropzone = document.getElementById('dataset-dropzone');
  const fileInput = document.getElementById('dataset-file-input');
  const browseBtn = document.getElementById('btn-browse-dataset');

  browseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  dropzone?.addEventListener('click', () => fileInput?.click());

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileUpload(fileInput.files[0]);
    }
  });
}

function setupSampleLoader() {
  document.getElementById('btn-load-sample-dataset')?.addEventListener('click', async () => {
    Store.showToast('Generating baseline network dataset...', 'info');
    try {
      const res = await ApiClient.generateSampleDataset();
      if (res.success) {
        Store.showToast('Baseline dataset loaded successfully!', 'success');
        displayDatasetProfile(res.data);
        loadDatasetsList();
      }
    } catch (err) {
      Store.showToast('Failed to load sample dataset.', 'critical');
    }
  });
}

async function handleFileUpload(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    Store.showToast('Only .csv files are supported', 'warning');
    return;
  }

  Store.showToast(`Uploading and profiling ${file.name}...`, 'info');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_column', 'label');

  try {
    const res = await ApiClient.uploadDataset(formData);
    if (!res.success) throw new Error(res.error || 'Upload failed');

    Store.showToast('Dataset profiled and registered!', 'success');
    displayDatasetProfile(res.data);
    loadDatasetsList();
  } catch (err) {
    console.error(err);
    Store.showToast(`Upload error: ${err.message}`, 'critical');
  }
}

async function loadDatasetsList() {
  const tbody = document.getElementById('datasets-table-body');
  if (!tbody) return;

  try {
    const res = await ApiClient.getDatasets();
    if (!res.success) return;

    const datasets = res.data;
    if (datasets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-subtle);">No datasets uploaded yet. Click 'Load Baseline Network Dataset' above.</td></tr>`;
      return;
    }

    let html = '';
    datasets.forEach(d => {
      html += `
        <tr>
          <td style="font-weight: 600;">${d.filename}</td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${d.date_formatted}</td>
          <td>${d.file_size_kb} KB</td>
          <td>${d.row_count.toLocaleString()}</td>
          <td>${d.column_count}</td>
          <td><span class="badge" style="background: rgba(56, 189, 248, 0.1); color: var(--accent-blue);">${d.target_column}</span></td>
          <td><span class="badge ${d.is_active ? 'badge-normal' : ''}">${d.is_active ? 'Active' : 'Archived'}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm btn-select-dataset" data-id="${d.id}">
              Inspect & Train
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    // Attach row inspection
    tbody.querySelectorAll('.btn-select-dataset').forEach(btn => {
      btn.addEventListener('click', () => {
        const sel = datasets.find(x => x.id === parseInt(btn.dataset.id));
        if (sel) displayDatasetProfile(sel);
      });
    });

    // Auto-select latest dataset if none selected
    if (!selectedDatasetId && datasets.length > 0) {
      displayDatasetProfile(datasets[0]);
    }

  } catch (err) {
    console.error(err);
  }
}

function displayDatasetProfile(d) {
  selectedDatasetId = d.id;
  const section = document.getElementById('dataset-profile-section');
  if (!section) return;

  const classDist = d.class_distribution || {};
  let distPills = '';
  for (const [k, v] of Object.entries(classDist)) {
    const isNormal = k.toLowerCase() === 'normal';
    distPills += `
      <span class="badge ${isNormal ? 'badge-normal' : 'badge-attack'}" style="padding: 0.4rem 0.8rem; font-size: 0.78rem;">
        ${k.toUpperCase()}: ${v} samples
      </span>
    `;
  }

  section.innerHTML = `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle);">
      <div>
        <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-blue); text-transform: uppercase;">DATASET PROFILE</span>
        <h2 style="font-size: 1.45rem; font-weight: 700; color: var(--text-main); margin-top: 0.2rem;">${d.filename}</h2>
      </div>
      <button id="btn-train-active-dataset" class="btn btn-primary" style="padding: 0.7rem 1.5rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        <span>Train Model</span>
      </button>
    </div>

    <!-- Metadata Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Rows</div>
        <div style="font-size: 1.4rem; font-weight: 700; color: var(--text-main);">${d.row_count.toLocaleString()}</div>
      </div>
      <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Columns</div>
        <div style="font-size: 1.4rem; font-weight: 700; color: var(--text-main);">${d.column_count}</div>
      </div>
      <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">File Size</div>
        <div style="font-size: 1.4rem; font-weight: 700; color: var(--text-main);">${d.file_size_kb} KB</div>
      </div>
      <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Missing Values</div>
        <div style="font-size: 1.4rem; font-weight: 700; color: ${d.missing_values_count > 0 ? '#f59e0b' : '#10b981'};">${d.missing_values_count}</div>
      </div>
      <div style="background: #090e1c; padding: 1rem; border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Target Column</div>
        <div style="font-size: 1.4rem; font-weight: 700; color: var(--accent-blue);">${d.target_column}</div>
      </div>
    </div>

    <!-- Class Distribution -->
    <div style="margin-bottom: 1.5rem;">
      <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.75rem;">Class Distribution</h4>
      <div style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
        ${distPills || '<span style="color: var(--text-subtle);">No distribution data</span>'}
      </div>
    </div>
  `;

  // Attach Train Model Action
  document.getElementById('btn-train-active-dataset')?.addEventListener('click', async () => {
    await runModelTraining(d.id);
  });
}

async function runModelTraining(datasetId) {
  const trainBtn = document.getElementById('btn-train-active-dataset');
  if (trainBtn) {
    trainBtn.disabled = true;
    trainBtn.innerHTML = `<span>Training Random Forest...</span>`;
  }

  Store.showToast('Initiating ML training pipeline: Data split, ColumnTransformer, RF & Isolation Forest...', 'info');

  try {
    const res = await ApiClient.trainModel(datasetId);
    if (!res.success) throw new Error(res.error || 'Training failed');

    Store.showToast(`Model ${res.data.version} trained! Accuracy: ${(res.data.accuracy * 100).toFixed(1)}%`, 'success');
    
    // Jump to Model Center to view metrics & feature rankings
    setTimeout(() => {
      Store.setView('models');
    }, 1200);

  } catch (err) {
    console.error(err);
    Store.showToast(`Training error: ${err.message}`, 'critical');
    if (trainBtn) {
      trainBtn.disabled = false;
      trainBtn.innerHTML = `<span>Train Model</span>`;
    }
  }
}

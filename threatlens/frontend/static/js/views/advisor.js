import { ApiClient } from '../api.js';
import { Store } from '../store.js';

let conversationHistory = [];

export function renderAdvisor(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>THREAT ADVISOR</h1>
        <p class="page-subtitle">Context-grounded security intelligence assistant powered by live telemetry</p>
      </div>
      <button id="btn-clear-chat" class="btn btn-secondary btn-sm">
        <span>Clear History</span>
      </button>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.75rem; align-items: start;">
      <!-- Chat Interface -->
      <div class="glass-panel" style="display: flex; flex-direction: column; height: 600px; padding: 1.5rem;">
        <!-- Messages Area -->
        <div id="advisor-messages-container" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem; padding-right: 0.5rem; margin-bottom: 1.25rem;">
          <!-- Initial Welcome Message -->
          <div style="display: flex; gap: 0.85rem;">
            <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--accent-blue), var(--accent-violet)); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/></svg>
            </div>
            <div style="flex: 1; background: #090e1c; padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 0.9rem; line-height: 1.5;">
              <strong style="color: var(--accent-blue);">Threat Advisor</strong>
              <p style="margin-top: 0.4rem; color: var(--text-main);">
                Welcome to ThreatLens AI Intelligence. I am directly connected to your active database and machine learning pipeline. Ask me about current activity, specific attacks, model accuracy, or recommended mitigations.
              </p>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <form id="advisor-form" style="display: flex; gap: 0.75rem;">
          <input type="text" id="advisor-input" class="form-control" placeholder="Ask about your security data (e.g. 'What happened today?', 'What is our security health?')..." required style="flex: 1; padding: 0.8rem 1rem;" />
          <button type="submit" id="btn-advisor-send" class="btn btn-primary" style="padding: 0.8rem 1.5rem;">
            <span>Ask Threat Advisor</span>
          </button>
        </form>
      </div>

      <!-- Quick Prompt Suggestions & Context Stats -->
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div class="glass-panel" style="padding: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Suggested Inquiries</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;" id="prompt-chips-container">
            <button class="btn btn-secondary btn-sm prompt-chip" style="text-align: left; justify-content: flex-start;">
              What happened today?
            </button>
            <button class="btn btn-secondary btn-sm prompt-chip" style="text-align: left; justify-content: flex-start;">
              What is our current security health score?
            </button>
            <button class="btn btn-secondary btn-sm prompt-chip" style="text-align: left; justify-content: flex-start;">
              What is the highest risk attack detected?
            </button>
            <button class="btn btn-secondary btn-sm prompt-chip" style="text-align: left; justify-content: flex-start;">
              Tell me about the active machine learning model
            </button>
            <button class="btn btn-secondary btn-sm prompt-chip" style="text-align: left; justify-content: flex-start;">
              Are there any unhandled threat alerts?
            </button>
          </div>
        </div>

        <div class="glass-panel" style="padding: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem;">Zero-Hallucination Grounding</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
            Threat Advisor never fabricates telemetry. All metrics, counts, confidence percentages, and timestamps are pulled directly from your local SQLite database and active model runs.
          </p>
        </div>
      </div>
    </div>
  `;

  setupAdvisor();
}

function setupAdvisor() {
  const form = document.getElementById('advisor-form');
  const input = document.getElementById('advisor-input');
  const msgContainer = document.getElementById('advisor-messages-container');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;

    input.value = '';
    await sendAdvisorQuery(q);
  });

  document.querySelectorAll('.prompt-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      sendAdvisorQuery(btn.innerText.trim());
    });
  });

  document.getElementById('btn-clear-chat')?.addEventListener('click', () => {
    if (msgContainer) {
      msgContainer.innerHTML = `
        <div style="display: flex; gap: 0.85rem;">
          <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--accent-blue), var(--accent-violet)); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/></svg>
          </div>
          <div style="flex: 1; background: #090e1c; padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 0.9rem;">
            <strong style="color: var(--accent-blue);">Threat Advisor</strong>
            <p style="margin-top: 0.4rem; color: var(--text-main);">Chat history cleared. What would you like to investigate next?</p>
          </div>
        </div>
      `;
    }
  });
}

async function sendAdvisorQuery(queryText) {
  const msgContainer = document.getElementById('advisor-messages-container');
  if (!msgContainer) return;

  // Append user bubble
  const userBubble = document.createElement('div');
  userBubble.style.cssText = 'display: flex; justify-content: flex-end;';
  userBubble.innerHTML = `
    <div style="background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #fff; padding: 0.85rem 1.2rem; border-radius: var(--radius-md); font-size: 0.9rem; max-width: 80%;">
      ${escapeHtml(queryText)}
    </div>
  `;
  msgContainer.appendChild(userBubble);
  msgContainer.scrollTop = msgContainer.scrollHeight;

  // Append Loading placeholder
  const botBubble = document.createElement('div');
  botBubble.style.cssText = 'display: flex; gap: 0.85rem;';
  botBubble.innerHTML = `
    <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--accent-blue), var(--accent-violet)); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/></svg>
    </div>
    <div style="flex: 1; background: #090e1c; padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 0.9rem; color: var(--text-subtle);">
      Consulting telemetry database...
    </div>
  `;
  msgContainer.appendChild(botBubble);
  msgContainer.scrollTop = msgContainer.scrollHeight;

  try {
    const res = await ApiClient.queryAdvisor(queryText);
    if (!res.success) throw new Error(res.error || 'Failed to get answer');

    const formatted = formatMarkdownText(res.data.response);
    botBubble.querySelector('div:last-child').innerHTML = `
      <strong style="color: var(--accent-blue);">Threat Advisor</strong>
      <div style="margin-top: 0.5rem; color: var(--text-main); line-height: 1.6;">${formatted}</div>
    `;
  } catch (err) {
    botBubble.querySelector('div:last-child').innerHTML = `
      <span style="color: var(--color-critical);">Unable to consult intelligence database: ${err.message}</span>
    `;
  }

  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function formatMarkdownText(md) {
  if (!md) return '';
  return md
    .replace(/^### (.*$)/gim, '<h4 style="color: #f8fafc; font-size: 1rem; margin: 0.6rem 0 0.4rem 0;">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#1e293b; padding:2px 6px; border-radius:4px; font-family:var(--font-mono); font-size:0.85em;">$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n- (.*)/g, '<div style="margin-left: 1rem;">&bull; $1</div>');
}

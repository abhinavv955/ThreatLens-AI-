import { Store } from '../store.js';

export function renderLanding(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; min-height: calc(100vh - 160px); justify-content: space-between; flex-wrap: wrap; gap: 3rem;">
      <!-- Left Side Content -->
      <div style="flex: 1; min-width: 320px; max-width: 580px;">
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.9rem; background: var(--accent-blue-dim); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: var(--radius-full); margin-bottom: 1.5rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-blue); box-shadow: 0 0 8px var(--accent-blue);"></span>
          <span style="font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-blue);">Next-Gen Security Intelligence</span>
        </div>

        <h1 style="font-size: 3.25rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 1rem;">
          THREATLENS AI
        </h1>

        <p style="font-size: 1.75rem; font-weight: 600; color: #cbd5e1; margin-bottom: 1.25rem; line-height: 1.3;">
          See the Threat.<br/>
          <span style="background: linear-gradient(120deg, var(--accent-blue), var(--accent-violet)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Understand the Risk.</span>
        </p>

        <p style="font-size: 1.05rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 2.25rem; max-width: 480px;">
          AI-powered network intelligence for modern infrastructure. Analyze flow characteristics, detect zero-day anomalies, quantify threat severity, and explain ML detections in real time.
        </p>

        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <button id="btn-explore-console" class="btn btn-primary" style="padding: 0.85rem 1.75rem; font-size: 1rem; border-radius: var(--radius-md);">
            <span>Explore Security Console</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button id="btn-explore-analyze" class="btn btn-secondary" style="padding: 0.85rem 1.5rem; font-size: 1rem;">
            <span>Inspect Live Activity</span>
          </button>
        </div>

        <div style="display: flex; gap: 2rem; margin-top: 3.5rem; padding-top: 1.75rem; border-top: 1px solid var(--border-subtle);">
          <div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Multi-Class RF</div>
            <div style="font-size: 0.78rem; color: var(--text-subtle); text-transform: uppercase;">Classifier Engine</div>
          </div>
          <div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent-blue);">Isolation Forest</div>
            <div style="font-size: 0.78rem; color: var(--text-subtle); text-transform: uppercase;">Anomaly Detection</div>
          </div>
          <div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--color-safe);">Explainable AI</div>
            <div style="font-size: 0.78rem; color: var(--text-subtle); text-transform: uppercase;">Signal Attributions</div>
          </div>
        </div>
      </div>

      <!-- Right Side Abstract Network Visualization Canvas -->
      <div style="flex: 1; min-width: 320px; display: flex; justify-content: center; position: relative;">
        <div style="position: absolute; width: 420px; height: 420px; background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(139, 92, 246, 0.06) 50%, transparent 70%); border-radius: 50%; pointer-events: none; filter: blur(30px);"></div>
        <canvas id="network-canvas" width="540" height="500" style="width: 100%; max-width: 540px; height: 500px; border-radius: var(--radius-xl); border: 1px solid var(--border-subtle); background: rgba(12, 19, 34, 0.6); box-shadow: var(--shadow-lg);"></canvas>
      </div>
    </div>
  `;

  // Attach button events
  document.getElementById('btn-explore-console')?.addEventListener('click', () => {
    Store.setView('dashboard');
  });
  document.getElementById('btn-explore-analyze')?.addEventListener('click', () => {
    Store.setView('analyze');
  });

  // Initialize Network Canvas Animation
  initNetworkAnimation();
}

function initNetworkAnimation() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  const nodeCount = 22;
  const nodes = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * (width - 60) + 30,
      y: Math.random() * (height - 60) + 30,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 3 + 2.5,
      isCore: i === 0,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.03 + Math.random() * 0.03,
      color: i === 0 ? '#38bdf8' : i % 3 === 0 ? '#8b5cf6' : '#38bdf8',
    });
  }

  // Packets traveling along links
  const packets = [];
  for (let i = 0; i < 6; i++) {
    packets.push({
      sourceIdx: Math.floor(Math.random() * nodeCount),
      targetIdx: Math.floor(Math.random() * nodeCount),
      progress: Math.random(),
      speed: 0.007 + Math.random() * 0.008,
    });
  }

  let animationId;
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Update & draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 25 || n.x > width - 25) n.vx *= -1;
      if (n.y < 25 || n.y > height - 25) n.vy *= -1;

      n.pulse += n.pulseSpeed;

      // Draw connections
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n.x - n2.x;
        const dy = n.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.35;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw pulsing node
      const currentRadius = n.radius + Math.sin(n.pulse) * 1.5;
      ctx.beginPath();
      ctx.arc(n.x, n.y, Math.max(1.5, currentRadius), 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = n.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Center Core Ring
      if (n.isCore) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius + 8 + Math.sin(n.pulse) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Update and draw packets
    for (const p of packets) {
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.progress = 0;
        p.sourceIdx = Math.floor(Math.random() * nodeCount);
        p.targetIdx = Math.floor(Math.random() * nodeCount);
      }

      const s = nodes[p.sourceIdx];
      const t = nodes[p.targetIdx];
      const px = s.x + (t.x - s.x) * p.progress;
      const py = s.y + (t.y - s.y) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#38bdf8';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Cleanup on view exit
  window.addEventListener('hashchange', () => {
    cancelAnimationFrame(animationId);
  }, { once: true });
}

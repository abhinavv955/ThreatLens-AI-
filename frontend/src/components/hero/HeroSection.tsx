import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNutrition } from '../../context/NutritionContext';

export const HeroSection: React.FC = () => {
  const { user } = useAuth();
  const { metrics, runScan } = useNutrition();

  const handleAnalyzeClick = () => {
    const scannerEl = document.getElementById('scanner');
    if (scannerEl) {
      scannerEl.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        runScan();
      }, 500);
    }
  };

  const remaining = Math.max(0, metrics.dailyCalorieTarget - metrics.dailyCaloriesEaten);
  const strokeDash = 326.7;
  const ratio = Math.min(1, metrics.dailyCaloriesEaten / metrics.dailyCalorieTarget);
  const offset = strokeDash - strokeDash * ratio;

  return (
    <section className="hero" id="home">
      <div>
        <h1>
          Your Food.<br />
          <span className="line-green">Your Goals.</span><br />
          Your AI Nutrition<br />
          Coach.
        </h1>
        <p className="lede">
          Track what you eat, understand your nutrition, and get personalized
          recommendations powered by AI — so small choices add up to a healthier you.
        </p>

        <div className="hero-actions">
          <button
            className="btn btn-green"
            id="heroAnalyzeBtn"
            onClick={handleAnalyzeClick}
          >
            Analyze my meal ⟲
          </button>
          <a href="#dashboard" className="btn btn-outline">
            Explore dashboard →
          </a>
        </div>

        <div className="hero-tags">
          <span>✦ AI-POWERED</span>
          <span>PERSONALIZED</span>
          <span>GOAL-FOCUSED</span>
        </div>

        <p className="hero-social">
          <b>12,000+ curious eaters</b> building better habits
        </p>
      </div>

      <div className="hero-card">
        <div className="hero-toast">
          <span className="icon">🤖</span>
          <div>
            <div className="t1">NUTRITRACK AI</div>
            <div className="t2">You're on a roll ✨</div>
            <div className="t3">{metrics.streakDays} day meal consistency streak</div>
          </div>
        </div>

        <div className="today-label">TODAY, 24 MAY</div>
        <div className="greeting">Good morning, {user.name} 👋</div>

        <div className="energy-row">
          <div className="energy-left">
            <div className="lbl">ENERGY LEFT</div>
            <div className="ring-wrap">
              <svg viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#dff5e8"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#0BD57E"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="326.7"
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="ring-num">{remaining}</div>
            </div>
            <div className="energy-foot">
              <span>{metrics.dailyCaloriesEaten.toLocaleString()} eaten</span>
              <span>{metrics.dailyCalorieTarget.toLocaleString()} goal</span>
            </div>
          </div>

          <div className="energy-right">
            <img
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"
              alt="Fresh bowl of vegetables"
            />
            <div className="macro-bar">
              <span style={{ width: '34%', background: 'var(--blue)' }}></span>
              <span style={{ width: '44%', background: 'var(--orange)' }}></span>
              <span style={{ width: '22%', background: 'var(--pink)' }}></span>
            </div>
            <div className="macro-legend">
              <span>Protein</span>
              <span>Carbs</span>
              <span>Fats</span>
            </div>
          </div>
        </div>

        <div className="stat-cards">
          <div className="card">
            <div className="k">Protein</div>
            <div className="v">{metrics.proteinEatenG}g</div>
          </div>
          <div className="card">
            <div className="k">Water</div>
            <div className="v">{metrics.waterCups}/{metrics.waterTargetCups} cups</div>
          </div>
          <div className="card">
            <div className="k">BMI</div>
            <div className="v green">{metrics.bmi}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

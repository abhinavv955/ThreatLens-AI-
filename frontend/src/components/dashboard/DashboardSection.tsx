import React from 'react';
import { useNutrition } from '../../context/NutritionContext';

export const DashboardSection: React.FC = () => {
  const { metrics, meals, deleteMeal } = useNutrition();

  const proteinPct = Math.min(100, Math.round((metrics.proteinEatenG / metrics.proteinTargetG) * 100));
  const carbsPct = Math.min(100, Math.round((metrics.carbsEatenG / metrics.carbsTargetG) * 100));
  const fatPct = Math.min(100, Math.round((metrics.fatEatenG / metrics.fatTargetG) * 100));

  return (
    <section className="dash-section" id="dashboard">
      <div className="wrap">
        <div className="eyebrow">
          <span className="dot"></span>02 · YOUR PERSONAL COCKPIT
        </div>
        <p className="section-lede">
          Your daily health signals, translated into a calm, actionable view. No guilt, no noise — just a helpful next step.
        </p>

        <div className="dash-grid" style={{ marginTop: '40px' }}>
          <div className="dcard">
            <div className="lbl">Daily energy</div>
            <div className="big">
              {metrics.dailyCaloriesEaten.toLocaleString()}{' '}
              <small>/ {metrics.dailyCalorieTarget.toLocaleString()} kcal</small>
            </div>
            <div className="trend">{metrics.calorieTrendText}</div>

            <div className="chart-wrap">
              <svg viewBox="0 0 620 200" width="100%" height="180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0BD57E" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0BD57E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,90 C40,60 70,60 100,85 C140,118 170,120 200,95 C240,62 270,58 300,80 C340,108 370,112 400,90 C440,60 470,30 500,42 C540,55 570,80 620,95 L620,200 L0,200 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M0,90 C40,60 70,60 100,85 C140,118 170,120 200,95 C240,62 270,58 300,80 C340,108 370,112 400,90 C440,60 470,30 500,42 C540,55 570,80 620,95"
                  fill="none"
                  stroke="#0BD57E"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              <div className="chart-foot" style={{ marginTop: '-6px' }}>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
              <div className="chart-foot">
                <span>Calorie rhythm · last 7 days</span>
                <span>Avg 1917 kcal</span>
              </div>
            </div>
          </div>

          <div className="dash-col-right">
            <div className="dcard">
              <div className="goal-icon">🎯</div>
              <div className="lbl" style={{ marginTop: '14px' }}>
                Daily goal progress
              </div>
              <div className="big">{metrics.goalProgressPercent}%</div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${metrics.goalProgressPercent}%` }}
                ></div>
              </div>
              <div className="trend">{metrics.streakDays} day streak</div>
            </div>

            <div className="dcard">
              <div className="goal-icon">⚖️</div>
              <div className="weight-row" style={{ marginTop: '14px' }}>
                <div>
                  <div className="lbl">Current weight</div>
                  <div className="big" style={{ fontSize: '26px' }}>
                    {metrics.currentWeightKg} <small style={{ fontSize: '14px' }}>kg</small>
                  </div>
                </div>
                <div className="bmi">
                  <div className="lbl">BMI</div>
                  <div className="v">{metrics.bmi}</div>
                </div>
              </div>
              <div className="trend">{metrics.weightTrendText}</div>
            </div>
          </div>
        </div>

        <div className="dash-bottom">
          <div className="dcard">
            <h4 style={{ fontSize: '17px', fontWeight: 800 }}>Macro balance</h4>
            <div className="macro-row">
              <div className="mtitle">
                <span>Protein</span>
                <span>
                  {metrics.proteinEatenG}g / {metrics.proteinTargetG}g
                </span>
              </div>
              <div className="mtrack">
                <span style={{ width: `${proteinPct}%`, background: 'var(--blue)' }}></span>
              </div>

              <div className="mtitle">
                <span>Carbs</span>
                <span>
                  {metrics.carbsEatenG}g / {metrics.carbsTargetG}g
                </span>
              </div>
              <div className="mtrack">
                <span style={{ width: `${carbsPct}%`, background: 'var(--orange)' }}></span>
              </div>

              <div className="mtitle">
                <span>Fats</span>
                <span>
                  {metrics.fatEatenG}g / {metrics.fatTargetG}g
                </span>
              </div>
              <div className="mtrack" style={{ marginBottom: 0 }}>
                <span style={{ width: `${fatPct}%`, background: 'var(--pink)' }}></span>
              </div>
            </div>
          </div>

          <div className="dcard">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h4 style={{ fontSize: '17px', fontWeight: 800 }}>
                You're fueling beautifully
              </h4>
              <span className="logged-pill">{meals.length} logged</span>
            </div>

            <div className="meal-log">
              {meals.map((meal) => (
                <div className="mlcard" key={meal.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span className="tag">{meal.tag}</span>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#717b8f',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: 0,
                      }}
                      title="Remove meal"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="name">{meal.name}</div>
                  <div className="kcal">{meal.kcal} kcal</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

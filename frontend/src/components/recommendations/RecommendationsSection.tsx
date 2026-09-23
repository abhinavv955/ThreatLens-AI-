import React, { useState } from 'react';
import { INITIAL_RECOMMENDATIONS } from '../../services/recommendationService';

export const RecommendationsSection: React.FC = () => {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section id="recommendations">
      <div className="wrap">
        <div className="eyebrow">
          <span className="dot"></span>03 · GENTLE NUDGES, NOT NOISE
        </div>
        <h2 style={{ fontSize: '38px', fontWeight: 800, marginTop: '8px' }}>
          Recommendations made for you.
        </h2>
        <p
          className="section-lede"
          style={{ marginTop: '14px', marginBottom: '40px' }}
        >
          The more NutriTrack learns about your goals and patterns, the more
          relevant every suggestion becomes.
        </p>

        <div className="rec-grid">
          {INITIAL_RECOMMENDATIONS.map((rec) => {
            const isSaved = savedIds.has(rec.id);
            return (
              <div
                key={rec.id}
                className={`rec-card ${rec.isHighlight ? 'hl' : ''}`}
              >
                {rec.imageUrl ? (
                  <div className="rec-media">
                    <img src={rec.imageUrl} alt={rec.title} />
                  </div>
                ) : (
                  <div
                    className={`rec-media icon ${
                      rec.iconBg ? rec.iconBg : ''
                    }`}
                  >
                    {rec.icon}
                  </div>
                )}

                <div className="rec-body">
                  <div className="tag">{rec.tag}</div>
                  <h4>{rec.title}</h4>
                  <p>{rec.description}</p>
                  <button
                    className="save"
                    onClick={() => toggleSave(rec.id)}
                  >
                    {isSaved ? '✓ Saved to daily plan' : 'Save suggestion →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

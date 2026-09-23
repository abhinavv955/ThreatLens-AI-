import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileEditModal } from './ProfileEditModal';

export const PersonalizationSection: React.FC = () => {
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <section id="personalization">
      <div className="wrap">
        <div className="personal-grid">
          <div>
            <div className="eyebrow">
              <span className="dot"></span>YOUR CONTEXT MATTERS
            </div>
            <h2 style={{ fontSize: '38px', fontWeight: 800 }}>
              Personalization that starts with you.
            </h2>
            <p className="section-lede" style={{ marginTop: '16px' }}>
              Set your context once. NutriTrack uses it to make every scan,
              goal, and recommendation feel like it belongs to your life.
            </p>
            <button
              className="btn btn-dark"
              style={{ marginTop: '26px' }}
              id="createProfileBtn"
              onClick={() => setIsEditOpen(true)}
            >
              Update my nutrition profile →
            </button>
          </div>

          <div className="personal-cards">
            <div className="pcard">
              <div className="ic">👤</div>
              <div>
                <div className="k">Age</div>
                <div className="v">{user.age} years</div>
              </div>
            </div>

            <div className="pcard">
              <div className="ic">⚖️</div>
              <div>
                <div className="k">Height &amp; weight</div>
                <div className="v">
                  {user.heightCm} cm · {user.weightKg} kg
                </div>
              </div>
            </div>

            <div className="pcard">
              <div className="ic">🎯</div>
              <div>
                <div className="k">Main goal</div>
                <div className="v">{user.healthGoal}</div>
              </div>
            </div>

            <div className="pcard">
              <div className="ic">🌿</div>
              <div>
                <div className="k">Preferences</div>
                <div className="v">{user.dietaryPreferences}</div>
              </div>
            </div>

            <div className="pref-banner">
              <div className="ic">🧬</div>
              <div>
                <div className="t1">Your preferences power better suggestions</div>
                <div className="t2">
                  Allergies, routines and wins are part of the picture.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileEditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </section>
  );
};

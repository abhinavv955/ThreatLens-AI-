import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user.name,
    age: user.age,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    healthGoal: user.healthGoal,
    dietaryPreferences: user.dietaryPreferences,
    allergies: user.allergies,
    calorieTarget: user.calorieTarget,
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile(formData);
    setIsSaving(false);
    onClose();
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: '500px' }}>
        <button className="close-x" onClick={onClose}>
          ✕
        </button>

        <div className="mbrand">
          <span className="logo-circ">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M6 21c8 0 12-4 12-13 0-1 0-2-.3-3C13 5 6 8 6 15v6z" />
              <path d="M6 21c0-5 2-8 5-10" />
            </svg>
          </span>
          NutriTrack AI
        </div>

        <div className="eyebrow">
          <span className="dot"></span>PERSONAL CONTEXT
        </div>

        <h3>Your Nutrition Profile</h3>
        <p className="sub">
          Customize your metrics to tailor calorie limits, macro splits, and AI nudges.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                required
                min={10}
                max={120}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="field">
              <label>Height (cm)</label>
              <input
                type="number"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                required
                min={100}
                max={250}
              />
            </div>
            <div className="field">
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                required
                min={30}
                max={300}
              />
            </div>
          </div>

          <div className="field">
            <label>Main Health Goal</label>
            <input
              type="text"
              value={formData.healthGoal}
              onChange={(e) => setFormData({ ...formData, healthGoal: e.target.value })}
              required
              placeholder="e.g. Feel stronger, Weight maintenance, Lean muscle"
            />
          </div>

          <div className="field">
            <label>Dietary Preferences &amp; Allergies</label>
            <input
              type="text"
              value={formData.dietaryPreferences}
              onChange={(e) => setFormData({ ...formData, dietaryPreferences: e.target.value })}
              required
              placeholder="e.g. Vegetarian · no peanuts"
            />
          </div>

          <div className="field">
            <label>Daily Calorie Target (kcal)</label>
            <input
              type="number"
              value={formData.calorieTarget}
              onChange={(e) => setFormData({ ...formData, calorieTarget: Number(e.target.value) })}
              required
              min={1000}
              max={5000}
            />
          </div>

          <button
            className="btn btn-green submit-btn"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Saving Profile...' : 'Save Profile Changes →'}
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, register, openAuthModal } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const isSignIn = authModalMode === 'signin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignIn) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`modal-backdrop ${isAuthModalOpen ? 'open' : ''}`}
      id="modalBackdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="modal">
        <button className="close-x" id="modalClose" onClick={closeAuthModal}>
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
          <span className="dot"></span>YOUR HEALTH, IN SYNC
        </div>

        <h3 id="modalTitle">
          {isSignIn ? 'Welcome back, explorer' : 'Start your journey'}
        </h3>
        <p className="sub" id="modalSub">
          {isSignIn
            ? 'Pick up where your nutrition journey left off.'
            : 'Create a free account to save your scans and goals.'}
        </p>

        {error && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              background: '#fff0f0',
              border: '1px solid #ffc2c2',
              borderRadius: '10px',
              color: '#d62828',
              fontSize: '13.5px',
            }}
          >
            {error}
          </div>
        )}

        <form id="modalForm" onSubmit={handleSubmit}>
          {!isSignIn && (
            <div className="field">
              <label>Full name</label>
              <input
                type="text"
                placeholder="Maya Peterson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="8+ characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button
            className="btn btn-green submit-btn"
            type="submit"
            id="modalSubmitBtn"
            disabled={loading}
          >
            {loading
              ? isSignIn
                ? 'Signing in...'
                : 'Creating account...'
              : isSignIn
              ? 'Sign in →'
              : 'Create account →'}
          </button>
        </form>

        <div className="swap-row">
          <span id="modalSwapText">
            {isSignIn ? 'New to NutriTrack?' : 'Already have an account?'}
          </span>
          <button
            id="modalSwapLink"
            onClick={() => openAuthModal(isSignIn ? 'signup' : 'signin')}
          >
            {isSignIn ? 'Create account' : 'Sign in'}
          </button>
        </div>

        <div className="secure">🔒 Your session is private and secure</div>
      </div>
    </div>
  );
};

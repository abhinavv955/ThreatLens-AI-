import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <div className="top-badge-row">
        <span className="top-badge">
          <span className="dot"></span> AI NUTRITION, MADE HUMAN
        </span>
      </div>

      <header className="nav">
        <div className="nav-inner">
          <a href="#" className="brand">
            <span className="logo-circ">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                <path d="M6 21c8 0 12-4 12-13 0-1 0-2-.3-3C13 5 6 8 6 15v6z" />
                <path d="M6 21c0-5 2-8 5-10" />
              </svg>
            </span>
            NutriTrack<span className="ai-tag">AI</span>
          </a>

          <nav className="links">
            <a href="#scanner">Scanner</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#recommendations">Recommendations</a>
            <a href="#how-it-works">How it works</a>
            <a href="#ask-ai">Ask AI</a>
          </nav>

          <div className="nav-right">
            {isAuthenticated ? (
              <>
                <span className="login-link" style={{ cursor: 'default' }}>
                  Hi, {user.name} 👋
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={logout}
                  title="Sign out"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="login-link"
                  id="loginLink"
                  onClick={() => openAuthModal('signin')}
                >
                  Log in
                </button>
                <button
                  className="btn btn-dark"
                  id="getStartedBtn"
                  onClick={() => openAuthModal('signup')}
                >
                  Get started →
                </button>
              </>
            )}

            <button
              className="hamburger"
              id="hamburgerBtn"
              aria-label="Menu"
              onClick={toggleMobileMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <a href="#scanner" onClick={closeMobileMenu}>Scanner</a>
            <a href="#dashboard" onClick={closeMobileMenu}>Dashboard</a>
            <a href="#recommendations" onClick={closeMobileMenu}>Recommendations</a>
            <a href="#how-it-works" onClick={closeMobileMenu}>How it works</a>
            <a href="#ask-ai" onClick={closeMobileMenu}>Ask AI</a>
            {!isAuthenticated && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    closeMobileMenu();
                    openAuthModal('signin');
                  }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Log in
                </button>
                <button
                  className="btn btn-green btn-sm"
                  onClick={() => {
                    closeMobileMenu();
                    openAuthModal('signup');
                  }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Get started
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

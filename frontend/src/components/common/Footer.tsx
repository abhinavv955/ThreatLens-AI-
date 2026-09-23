import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div>
            <div className="foot-brand">
              <span className="logo-circ">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 21c8 0 12-4 12-13 0-1 0-2-.3-3C13 5 6 8 6 15v6z" />
                  <path d="M6 21c0-5 2-8 5-10" />
                </svg>
              </span>
              NutriTrack AI
            </div>
            <p className="foot-desc">
              An AI-based nutrition &amp; health tracker combining food-image recognition, personalized
              recommendations, and goal monitoring.
            </p>
          </div>

          <div className="foot-col">
            <h5>PRODUCT</h5>
            <a href="#scanner">Scanner</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#recommendations">Recommendations</a>
            <a href="#ask-ai">Ask AI</a>
          </div>

          <div className="foot-col">
            <h5>COMPANY</h5>
            <a href="#home">About</a>
            <a href="#home">Careers</a>
            <a href="#home">Contact</a>
          </div>

          <div className="foot-col">
            <h5>LEGAL</h5>
            <a href="#home">Privacy</a>
            <a href="#home">Terms</a>
            <a href="#home">Security</a>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© 2026 NutriTrack AI. All rights reserved.</span>
          <span>Made with care for healthier habits.</span>
        </div>
      </div>
    </footer>
  );
};

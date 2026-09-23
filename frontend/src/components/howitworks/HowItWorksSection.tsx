import React from 'react';

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="how-section" id="how-it-works">
      <div className="wrap">
        <div className="eyebrow">
          <span className="dot"></span>HOW IT WORKS
        </div>
        <h2
          style={{
            fontSize: '38px',
            fontWeight: 800,
            marginTop: '8px',
            marginBottom: '48px',
            maxWidth: '640px',
          }}
        >
          From plate to progress in four clear steps.
        </h2>

        <div className="steps-grid">
          <div className="step">
            <div className="num">01</div>
            <h4>Upload or log</h4>
            <p>Add a meal manually or let a photo do the heavy lifting.</p>
          </div>
          <div className="step">
            <div className="num">02</div>
            <h4>AI identifies</h4>
            <p>NutriVision recognizes ingredients and portions in seconds.</p>
          </div>
          <div className="step">
            <div className="num">03</div>
            <h4>Understand</h4>
            <p>See calories, macros and the nutrients that matter to you.</p>
          </div>
          <div className="step">
            <div className="num">04</div>
            <h4>Get guidance</h4>
            <p>Receive next-best meals and movement ideas for your goals.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useRef } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { SAMPLE_MEALS } from '../../services/foodService';

export const ScannerSection: React.FC = () => {
  const {
    activeScanMealKey,
    setActiveScanMealKey,
    currentScanResult,
    isScanning,
    scanStatusText,
    scanTargetHidden,
    activeImageUrl,
    runScan,
    logCurrentMeal,
    saveToast,
  } = useNutrition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      runScan(file);
    }
  };

  return (
    <section id="scanner">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">
              <span className="dot"></span>01 · AI FOOD RECOGNITION
            </div>
            <h2>Give your plate a second opinion.</h2>
            <p className="section-lede" style={{ marginTop: '14px' }}>
              Snap, drop, or choose a sample meal. NutriTrack sees the ingredients,
              estimates portions, and turns the unknown into a next-best choice.
            </p>
          </div>
          <span className="pill-note">
            <span className="dot"></span>AI RECOGNITION · MULTIMODAL
          </span>
        </div>

        {saveToast && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 18px',
              background: 'var(--bg-alt)',
              border: '1.5px solid var(--green)',
              borderRadius: '12px',
              color: 'var(--green-deep)',
              fontWeight: 700,
              fontSize: '14px',
              animation: 'floaty 4s ease-in-out infinite',
            }}
          >
            {saveToast}
          </div>
        )}

        <div className="scanner-panel">
          <div className="scan-photo">
            <img
              id="scanImg"
              src={activeImageUrl}
              alt="Plate of food ready to be scanned"
            />
            <div className="overlay-grad"></div>
            <span className="live-badge">
              <span className="dot"></span>NUTRIVISION LIVE
            </span>

            <div
              className={`scan-target ${scanTargetHidden ? 'hide' : ''}`}
              id="scanTarget"
            >
              <div className="bracket">
                ⌐&nbsp;&nbsp;¬<br />
                L&nbsp;&nbsp;_|
              </div>
              <div className="t1" id="scanTargetTitle">
                {isScanning ? 'Reading your plate' : 'Ready to read your plate'}
              </div>
              <div className="t2" id="scanTargetSub">
                {isScanning
                  ? 'Identifying ingredients & portions...'
                  : 'Upload a photo or try our sample meal.'}
              </div>
            </div>

            <div className="scan-bottom">
              <div className="l1">START A SCAN</div>
              <div className="l2">What's on your plate?</div>
            </div>
          </div>

          <div className="scan-side">
            <div className="lbl">CHOOSE A STARTING POINT</div>
            <h3>Scan your meal</h3>

            <div className="meal-options" id="mealOptions">
              <button
                className={`meal-opt ${activeScanMealKey === 'paneer' ? 'active' : ''}`}
                data-meal="paneer"
                onClick={() => setActiveScanMealKey('paneer')}
              >
                <img
                  src={SAMPLE_MEALS.paneer.imageUrl}
                  alt="Paneer Tikka Bowl"
                />
                <div className="name">Paneer Tikka</div>
              </button>

              <button
                className={`meal-opt ${activeScanMealKey === 'salmon' ? 'active' : ''}`}
                data-meal="salmon"
                onClick={() => setActiveScanMealKey('salmon')}
              >
                <img
                  src={SAMPLE_MEALS.salmon.imageUrl}
                  alt="Salmon Power Plate"
                />
                <div className="name">Salmon Power Plate</div>
              </button>

              <button
                className={`meal-opt ${activeScanMealKey === 'berry' ? 'active' : ''}`}
                data-meal="berry"
                onClick={() => setActiveScanMealKey('berry')}
              >
                <img
                  src={SAMPLE_MEALS.berry.imageUrl}
                  alt="Berry Chia Bowl"
                />
                <div className="name">Berry Chia</div>
              </button>
            </div>

            <button
              className="upload-btn"
              id="uploadBtn"
              onClick={handleUploadClick}
            >
              ⇧ Upload a food photo
            </button>
            <input
              type="file"
              id="fileInput"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <button
              className="analyze-btn"
              id="analyzeBtn"
              disabled={isScanning}
              onClick={() => runScan()}
            >
              {isScanning ? 'Analyzing...' : 'Analyze sample meal →'}
            </button>

            <div className="result-box">
              <div className="lbl" id="resultStatus">
                {scanStatusText}
              </div>

              <div className="result-head">
                <div>
                  <h4 id="resultTitle">{currentScanResult.title}</h4>
                  <p id="resultDesc">{currentScanResult.description}</p>
                </div>
                <div className="score-badge" id="resultScore">
                  {currentScanResult.score}
                </div>
              </div>

              <div className="macro-chips">
                <div className="chip kcal">
                  <div className="ic">🔥</div>
                  <div className="num" id="kcalVal">
                    {currentScanResult.kcal}
                  </div>
                  <div className="lb">kcal</div>
                </div>

                <div className="chip protein">
                  <div className="ic">💪</div>
                  <div className="num" id="proteinVal">
                    {currentScanResult.protein}
                  </div>
                  <div className="lb">protein</div>
                </div>

                <div className="chip carbs">
                  <div className="ic">🌾</div>
                  <div className="num" id="carbsVal">
                    {currentScanResult.carbs}
                  </div>
                  <div className="lb">carbs</div>
                </div>

                <div className="chip fat">
                  <div className="ic">🥑</div>
                  <div className="num" id="fatVal">
                    {currentScanResult.fat}
                  </div>
                  <div className="lb">fat</div>
                </div>
              </div>

              <div className="tag-row" id="tagRow">
                {currentScanResult.tags.map((tag, idx) => (
                  <span key={idx}>{tag}</span>
                ))}
              </div>

              <button
                className="log-meal-btn"
                onClick={logCurrentMeal}
                title="Add this meal to your daily nutrition log"
              >
                + Log This Meal to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

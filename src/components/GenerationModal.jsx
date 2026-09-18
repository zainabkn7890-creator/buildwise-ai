import React, { useState, useEffect } from 'react';

const STEPS = [
  { label: 'Reading final floor plan', key: 'plan' },
  { label: 'Creating walls', key: 'walls' },
  { label: 'Adding doors & windows', key: 'openings' },
  { label: 'Placing staircase', key: 'stairs' },
  { label: 'Creating roof', key: 'roof' },
  { label: 'Applying materials', key: 'materials' },
  { label: 'Rendering interior', key: 'interior' },
  { label: 'Rendering exterior', key: 'exterior' },
];

export default function GenerationModal({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 2 + Math.random() * 4;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setCurrentStep(s => s + 1), 150);
          return 0;
        }
        return next;
      });
    }, 60 + Math.random() * 40);

    return () => clearInterval(interval);
  }, [currentStep, onComplete]);

  const globalProgress = Math.round((currentStep / STEPS.length) * 100);

  return (
    <div className="gen-modal-overlay">
      <div className="gen-modal-card">
        <div className="gen-modal-icon">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#04100b" stroke="#D4AF37" strokeWidth="2"/>
            <path d="M8 22L16 10L24 22H8Z" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 10V22" stroke="#34D399" strokeWidth="2" strokeDasharray="2 2"/>
            <circle cx="16" cy="10" r="2.5" fill="#F3D375"/>
          </svg>
        </div>

        <h2 className="gen-modal-title">BuildWise <span style={{ color: '#d4af37' }}>AI</span></h2>
        <p className="gen-modal-subtitle">Generating your 3D home&hellip;</p>

        <div className="gen-steps-list">
          {STEPS.map((step, i) => (
            <div
              key={step.key}
              className={`gen-step-item ${i < currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}`}
            >
              <span className="gen-step-indicator">
                {i < currentStep ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : i === currentStep ? (
                  <span className="gen-step-loader"></span>
                ) : (
                  <span className="gen-step-dot"></span>
                )}
              </span>
              <span className="gen-step-label">{step.label}</span>
            </div>
          ))}
        </div>

        <div className="gen-progress-bar-track">
          <div className="gen-progress-bar-fill" style={{ width: `${globalProgress}%` }}></div>
        </div>

        <p className="gen-progress-pct">{globalProgress}% complete</p>
      </div>
    </div>
  );
}

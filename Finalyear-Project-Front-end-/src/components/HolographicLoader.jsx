import React from 'react';
import { Activity } from 'lucide-react';
import '../styles/HolographicLoader.css';

const HolographicLoader = ({ progress }) => {
  return (
    <div className="holographic-loader-overlay">
      <div className="loader-content">
        <div className="loader-visual">
          <div className="pulsing-heart-container">
            <Activity size={80} className="pulsing-ruby-heart" />
            <div className="scanning-ring"></div>
            <div className="scanning-ring delay-1"></div>
            <div className="scanning-ring delay-2"></div>
          </div>
          
          <div className="loader-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                '--x': `${Math.random() * 200 - 100}px`,
                '--y': `${Math.random() * 200 - 100}px`,
                '--delay': `${Math.random() * 2}s`
              }}></div>
            ))}
          </div>
        </div>

        <div className="loader-text-container">
          <h2 className="loading-title">Initializing HemoVision AI</h2>
          <p className="loading-subtitle">Synchronizing neural pathways and validating biometric core...</p>
          
          <div className="loading-bar-wrapper">
            <div className="loading-bar-fill" style={{ width: `${progress}%` }}></div>
            <div className="loading-bar-glow"></div>
          </div>
          <div className="loading-percentage">{progress}%</div>
        </div>

        <div className="binary-stream">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="binary-column">
              {Math.random() > 0.5 ? '10110' : '01001'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HolographicLoader;

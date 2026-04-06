import React, { useState } from 'react';
import { Hand, Eye, ActivitySquare, Zap, ArrowLeftRight } from 'lucide-react';
import BackButton from './BackButton';
import '../styles/ComparisonEngine.css';

const scanDataPresets = {
  Palm: { hb: 14.2, spo2: 98, confidence: 99.4, icon: Hand },
  Conjunctiva: { hb: 13.8, spo2: 97, confidence: 98.7, icon: Eye },
  'Nail Bed': { hb: 14.5, spo2: 99, confidence: 99.1, icon: ActivitySquare }
};

const ComparisonEngine = ({ onBack }) => {
  const [leftScan, setLeftScan] = useState('Palm');
  const [rightScan, setRightScan] = useState('Conjunctiva');
  const [isFused, setIsFused] = useState(false);
  const [dividerPos, setDividerPos] = useState(50);

  const leftData = scanDataPresets[leftScan];
  const rightData = scanDataPresets[rightScan];
  const LeftIcon = leftData.icon;
  const RightIcon = rightData.icon;

  const fusedHb = ((leftData.hb + rightData.hb) / 2).toFixed(1);
  const fusedConf = ((leftData.confidence + rightData.confidence) / 2).toFixed(1);

  const handleDrag = (e) => {
    const container = e.currentTarget.parentElement;
    const rect = container.getBoundingClientRect();
    const onMouseMove = (ev) => {
      const pos = ((ev.clientX - rect.left) / rect.width) * 100;
      setDividerPos(Math.max(15, Math.min(85, pos)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="comparison-view">
      <BackButton onClick={onBack} />
      
      <div className="comparison-header slide-down-fade">
        <h2>Cross-Modal Comparison</h2>
        <p>Juxtapose CNN feature maps across different scanning regions</p>
      </div>

      <div className="scan-selectors">
        <div className="selector-group">
          <label>Left Scan</label>
          <select value={leftScan} onChange={e => { setLeftScan(e.target.value); setIsFused(false); }}>
            {Object.keys(scanDataPresets).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <ArrowLeftRight size={24} className="swap-icon"/>
        <div className="selector-group">
          <label>Right Scan</label>
          <select value={rightScan} onChange={e => { setRightScan(e.target.value); setIsFused(false); }}>
            {Object.keys(scanDataPresets).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div className="split-viewport">
        <div className="split-pane left-pane" style={{ width: `${dividerPos}%` }}>
          <div className="pane-content">
            <LeftIcon size={80} className="pane-icon ruby" />
            <div className="pane-heatmap ruby-heat"></div>
            <div className="pane-data">
              <h3>{leftScan} Scan</h3>
              <div className="pane-metric">
                <span className="pane-value">{leftData.hb}</span>
                <span className="pane-unit">g/dL</span>
              </div>
              <span className="pane-conf">Confidence: {leftData.confidence}%</span>
            </div>
          </div>
        </div>

        <div className="split-divider" style={{ left: `${dividerPos}%` }} onMouseDown={handleDrag}>
          <div className="divider-handle"></div>
        </div>

        <div className="split-pane right-pane" style={{ width: `${100 - dividerPos}%` }}>
          <div className="pane-content">
            <RightIcon size={80} className="pane-icon cyan" />
            <div className="pane-heatmap cyan-heat"></div>
            <div className="pane-data">
              <h3>{rightScan} Scan</h3>
              <div className="pane-metric">
                <span className="pane-value">{rightData.hb}</span>
                <span className="pane-unit">g/dL</span>
              </div>
              <span className="pane-conf">Confidence: {rightData.confidence}%</span>
            </div>
          </div>
        </div>

        {isFused && (
          <div className="fusion-overlay">
            <div className="fusion-particles">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="fusion-particle" style={{
                  '--px': `${Math.random() * 100}%`,
                  '--py': `${Math.random() * 100}%`,
                  '--delay': `${Math.random() * 1}s`
                }}></div>
              ))}
            </div>
            <div className="fusion-result glass-card">
              <Zap size={32} className="fusion-icon" />
              <h3>Fusion Analysis Complete</h3>
              <div className="fusion-metric">
                <span className="fusion-value">{fusedHb}</span>
                <span className="fusion-unit">g/dL</span>
              </div>
              <p>Multi-modal weighted average with {fusedConf}% CNN confidence</p>
            </div>
          </div>
        )}
      </div>

      <div className="delta-bar slide-up-fade" style={{ '--stagger-idx': 0 }}>
        <div className="delta-info">
          <span className="delta-label">Prediction Delta (Δ)</span>
          <span className="delta-value">{Math.abs(leftData.hb - rightData.hb).toFixed(1)} g/dL</span>
        </div>
        <button className={`fusion-btn ${isFused ? 'active' : ''}`} onClick={() => setIsFused(!isFused)}>
          <Zap size={18} /> {isFused ? 'Reset View' : 'Fusion Analysis'}
        </button>
      </div>
    </div>
  );
};

export default ComparisonEngine;

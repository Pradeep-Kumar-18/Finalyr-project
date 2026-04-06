import React, { useState, useEffect } from 'react';
import { Heart, Brain, Wind, Beef, Bean, Apple, X, Activity, Droplets, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from './BackButton';
import '../styles/AnatomicalBodyMap.css';

const organsData = [
  {
    id: 'brain',
    name: 'Brain',
    icon: Brain,
    position: { top: '6%', left: '50%' },
    oxygenDemand: 92,
    hbImpact: 'Critical oxygen consumer — receives 15% of cardiac output',
    status: 'optimal',
    color: '#818cf8',
    description: 'Adequate hemoglobin ensures sustained cognitive function. Current levels support optimal neural oxygenation with no risk of cerebral hypoxia.',
    metrics: { flow: '750 mL/min', extraction: '34%', saturation: '99%' }
  },
  {
    id: 'heart',
    name: 'Heart',
    icon: Heart,
    position: { top: '30%', left: '45%' },
    oxygenDemand: 95,
    hbImpact: 'Highest O₂ extraction rate of any organ',
    status: 'optimal',
    color: '#E11D48',
    description: 'Myocardial tissue extracts ~70-80% of delivered oxygen. Normal hemoglobin maintains adequate coronary perfusion without compensatory tachycardia.',
    metrics: { flow: '250 mL/min', extraction: '75%', saturation: '98%' }
  },
  {
    id: 'lungs',
    name: 'Lungs',
    icon: Wind,
    position: { top: '28%', left: '58%' },
    oxygenDemand: 88,
    hbImpact: 'Primary site of hemoglobin oxygen loading',
    status: 'optimal',
    color: '#06b6d4',
    description: 'Pulmonary capillaries facilitate O₂-Hb binding. Current SpO₂ readings confirm efficient gas exchange across alveolar membranes.',
    metrics: { flow: '5000 mL/min', extraction: '25%', saturation: '99%' }
  },
  {
    id: 'liver',
    name: 'Liver',
    icon: Beef,
    position: { top: '40%', left: '42%' },
    oxygenDemand: 78,
    hbImpact: 'Dual blood supply — portal vein + hepatic artery',
    status: 'optimal',
    color: '#f59e0b',
    description: 'Hepatic function relies on adequate Hb for bilirubin metabolism and iron recycling. Current levels support normal hepatocyte oxygenation.',
    metrics: { flow: '1500 mL/min', extraction: '45%', saturation: '96%' }
  },
  {
    id: 'kidneys',
    name: 'Kidneys',
    icon: Bean,
    position: { top: '46%', left: '58%' },
    oxygenDemand: 82,
    hbImpact: 'EPO-producing organs — regulate erythropoiesis',
    status: 'optimal',
    color: '#10b981',
    description: 'Renal cortex monitors oxygen tension via peritubular cells. Normal Hb suppresses excess EPO production, maintaining erythrocyte homeostasis.',
    metrics: { flow: '1200 mL/min', extraction: '18%', saturation: '97%' }
  },
  {
    id: 'stomach',
    name: 'Stomach',
    icon: Apple,
    position: { top: '43%', left: '50%' },
    oxygenDemand: 65,
    hbImpact: 'Iron absorption site — critical for Hb synthesis',
    status: 'optimal',
    color: '#a855f7',
    description: 'Gastric acid facilitates Fe²⁺ absorption in the duodenum. Adequate Hb indicates sufficient dietary iron intake and absorption capacity.',
    metrics: { flow: '400 mL/min', extraction: '30%', saturation: '95%' }
  }
];

const AnatomicalBodyMap = () => {
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [hoveredOrgan, setHoveredOrgan] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleOrganClick = (organ) => {
    setSelectedOrgan(prev => prev?.id === organ.id ? null : organ);
  };

  return (
    <div className="body-map-container">
      <BackButton onClick={onBack} />
      
      {/* Ambient Background Effects */}
      <div className="bodymap-ambient">
        <div className="ambient-glow glow-1"></div>
        <div className="ambient-glow glow-2"></div>
        <div className="grid-dots"></div>
      </div>

      {/* Header */}
      <motion.div 
        className="bodymap-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bodymap-title-row">
          <Activity size={22} className="title-icon" />
          <h2>Anatomical Perfusion Map</h2>
        </div>
        <p>Interactive hemoglobin impact visualization across organ systems</p>
      </motion.div>

      <div className="bodymap-content">
        {/* Body Silhouette Area */}
        <motion.div 
          className="silhouette-area"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Blood Flow Particles */}
          <div className="blood-flow-system">
            {[...Array(18)].map((_, i) => (
              <div 
                key={i} 
                className={`blood-particle bp-${i % 6}`}
                style={{ animationDelay: `${i * 0.4}s` }}
              ></div>
            ))}
          </div>

          {/* SVG Body Silhouette */}
          <div className={`body-silhouette ${isLoaded ? 'revealed' : ''}`}>
            <svg viewBox="0 0 200 500" className="silhouette-svg" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0.3)" />
                  <stop offset="50%" stopColor="rgba(225, 29, 72, 0.2)" />
                  <stop offset="100%" stopColor="rgba(6, 182, 212, 0.15)" />
                </linearGradient>
                <filter id="bodyGlow">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="veinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(225, 29, 72, 0.6)" />
                  <stop offset="100%" stopColor="rgba(225, 29, 72, 0.1)" />
                </linearGradient>
              </defs>
              
              {/* Body outline */}
              <path 
                className="body-outline"
                d="M100,20 
                   C115,20 125,30 125,45 
                   C125,60 115,70 100,70 
                   C85,70 75,60 75,45 
                   C75,30 85,20 100,20 Z"
                fill="url(#bodyGrad)" stroke="rgba(6,182,212,0.4)" strokeWidth="0.8" filter="url(#bodyGlow)"
              />
              {/* Neck */}
              <path d="M92,70 L92,85 L108,85 L108,70" fill="url(#bodyGrad)" stroke="rgba(6,182,212,0.3)" strokeWidth="0.6" />
              {/* Torso */}
              <path 
                className="body-outline"
                d="M92,85 L60,95 L45,140 L50,200 L55,250 L70,260 L85,260 L90,250 
                   L100,255 L110,250 L115,260 L130,260 L145,250 L150,200 L155,140 L140,95 L108,85"
                fill="url(#bodyGrad)" stroke="rgba(6,182,212,0.4)" strokeWidth="0.8" filter="url(#bodyGlow)"
              />
              {/* Left Arm */}
              <path d="M60,95 L35,120 L25,180 L30,240 L40,245 L45,235 L45,180 L55,130" 
                fill="url(#bodyGrad)" stroke="rgba(6,182,212,0.3)" strokeWidth="0.6" />
              {/* Right Arm */}
              <path d="M140,95 L165,120 L175,180 L170,240 L160,245 L155,235 L155,180 L145,130" 
                fill="url(#bodyGrad)" stroke="rgba(6,182,212,0.3)" strokeWidth="0.6" />
              {/* Left Leg */}
              <path d="M70,260 L65,320 L60,400 L55,460 L65,470 L75,465 L80,400 L85,320 L90,260" 
                fill="url(#bodyGrad)" stroke="rgba(6,182,212,0.3)" strokeWidth="0.6" />
              {/* Right Leg */}
              <path d="M110,260 L115,320 L120,400 L125,460 L135,470 L145,465 L140,400 L135,320 L130,260" 
                fill="url(#bodyGrad)" stroke="rgba(6,182,212,0.3)" strokeWidth="0.6" />
              
              {/* Vascular network lines */}
              <g className="vein-network">
                <path d="M100,70 L100,85 L100,150 L85,200 L80,250" stroke="url(#veinGrad)" strokeWidth="1" fill="none" opacity="0.5" />
                <path d="M100,150 L115,200 L120,250" stroke="url(#veinGrad)" strokeWidth="1" fill="none" opacity="0.5" />
                <path d="M100,85 L70,110 L50,160" stroke="url(#veinGrad)" strokeWidth="0.7" fill="none" opacity="0.4" />
                <path d="M100,85 L130,110 L150,160" stroke="url(#veinGrad)" strokeWidth="0.7" fill="none" opacity="0.4" />
                <path d="M85,200 L70,300 L60,420" stroke="url(#veinGrad)" strokeWidth="0.6" fill="none" opacity="0.3" />
                <path d="M115,200 L130,300 L135,420" stroke="url(#veinGrad)" strokeWidth="0.6" fill="none" opacity="0.3" />
              </g>
            </svg>

            {/* Organ Hotspots */}
            {organsData.map((organ, index) => {
              const Icon = organ.icon;
              const isActive = selectedOrgan?.id === organ.id;
              const isHovered = hoveredOrgan === organ.id;
              return (
                <motion.div
                  key={organ.id}
                  className={`organ-hotspot ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                  style={{ 
                    top: organ.position.top, 
                    left: organ.position.left,
                    '--organ-color': organ.color,
                    '--stagger': index
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.15, type: 'spring', stiffness: 200 }}
                  onClick={() => handleOrganClick(organ)}
                  onMouseEnter={() => setHoveredOrgan(organ.id)}
                  onMouseLeave={() => setHoveredOrgan(null)}
                >
                  <div className="hotspot-rings">
                    <div className="ring ring-1"></div>
                    <div className="ring ring-2"></div>
                    <div className="ring ring-3"></div>
                  </div>
                  <div className="hotspot-core">
                    <Icon size={18} />
                  </div>
                  <span className="hotspot-label">{organ.name}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Heartbeat Line */}
          <div className="heartbeat-line-container">
            <svg width="100%" height="60" viewBox="0 0 600 60" preserveAspectRatio="none">
              <path 
                className="heartbeat-path"
                d="M0,30 L100,30 L120,30 L130,10 L140,50 L150,5 L160,55 L170,25 L180,35 L200,30 L600,30" 
                fill="none" 
              />
            </svg>
          </div>
        </motion.div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedOrgan && (
            <motion.div
              className="organ-detail-panel"
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 150, damping: 20 }}
            >
              <button className="panel-close" onClick={() => setSelectedOrgan(null)}>
                <X size={18} />
              </button>

              {/* Organ Header */}
              <div className="panel-organ-header" style={{ '--organ-color': selectedOrgan.color }}>
                <div className="panel-icon-container">
                  <div className="panel-icon-glow"></div>
                  {React.createElement(selectedOrgan.icon, { size: 32 })}
                </div>
                <div>
                  <h3>{selectedOrgan.name}</h3>
                  <span className={`status-chip status-${selectedOrgan.status}`}>
                    <span className="status-dot-live"></span>
                    {selectedOrgan.status === 'optimal' ? 'Optimal Perfusion' : 
                     selectedOrgan.status === 'warning' ? 'Reduced Flow' : 'Critical'}
                  </span>
                </div>
              </div>

              <div className="panel-divider"></div>

              {/* Oxygen Demand Gauge */}
              <div className="oxygen-gauge-section">
                <h4><Droplets size={14} /> Oxygen Demand</h4>
                <div className="gauge-container">
                  <svg viewBox="0 0 120 120" className="gauge-svg">
                    <circle cx="60" cy="60" r="52" className="gauge-bg" />
                    <circle 
                      cx="60" cy="60" r="52" 
                      className="gauge-fill"
                      style={{ 
                        '--target-offset': `${326.7 - (326.7 * selectedOrgan.oxygenDemand / 100)}`,
                        stroke: selectedOrgan.color 
                      }}
                    />
                  </svg>
                  <div className="gauge-value">
                    <span className="gauge-number">{selectedOrgan.oxygenDemand}</span>
                    <span className="gauge-percent">%</span>
                  </div>
                </div>
              </div>

              {/* Hb Impact */}
              <div className="impact-section">
                <h4><Zap size={14} /> Hemoglobin Impact</h4>
                <p className="impact-text">{selectedOrgan.hbImpact}</p>
              </div>

              {/* Metrics Grid */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="mc-label">Blood Flow</span>
                  <span className="mc-value">{selectedOrgan.metrics.flow}</span>
                </div>
                <div className="metric-card">
                  <span className="mc-label">O₂ Extraction</span>
                  <span className="mc-value">{selectedOrgan.metrics.extraction}</span>
                </div>
                <div className="metric-card">
                  <span className="mc-label">SpO₂</span>
                  <span className="mc-value">{selectedOrgan.metrics.saturation}</span>
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="clinical-notes">
                <h4><Activity size={14} /> Clinical Assessment</h4>
                <p>{selectedOrgan.description}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnatomicalBodyMap;

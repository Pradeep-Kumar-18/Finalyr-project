import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Hero.css';
import Button from './Button';
import { Activity } from 'lucide-react';
import HolographicLoader from './HolographicLoader';

const Hero = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleStart = () => {
    setIsLoading(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          navigate('/login');
        }, 500);
      }
      setProgress(Math.floor(currentProgress));
    }, 300);
  };

  return (
    <section className="hero-section">
      {isLoading && <HolographicLoader progress={progress} />}
      {/* Background Fluid Simulations */}
      <div className="fluid-orb fluid-crimson"></div>
      <div className="fluid-orb fluid-cyan"></div>
      
      <div className="hero-center-container">
        
        {/* Central 3D Animatic Logo */}
        <div className="animatic-logo-container">
          <div className="animatic-logo">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
            <div className="core-nucleus"></div>
            <div className="floating-particles">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="particle p3"></div>
            </div>
          </div>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            <span className="text-gradient">AI-Powered</span><br />
            Diagnostics
          </h1>
          <p className="hero-subtitle">
            Next-generation haemoglobin level analysis through advanced volumetric scanning and fluid mechanics simulation.
          </p>
          <div className="hero-actions">
            <Button onClick={handleStart}>
              Start <Activity size={18} style={{marginLeft: '8px', display: 'inline'}}/>
            </Button>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default Hero;

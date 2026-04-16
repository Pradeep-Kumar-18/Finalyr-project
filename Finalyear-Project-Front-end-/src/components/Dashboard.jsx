import React, { useState, useRef } from 'react';
import { Activity, LayoutDashboard, FileText, Settings, LogOut, UploadCloud, Eye, Hand, ActivitySquare, ChevronRight, Microscope, GitCompare, ClipboardList, Bell, TrendingUp, UserCircle, Apple, HelpCircle, Heart, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Diagnostic from './Diagnostic';
import BloodCellViewer from './BloodCellViewer';
import ComparisonEngine from './ComparisonEngine';
import MedicalReport from './MedicalReport';
import ModelDiagnostics from './ModelDiagnostics';
import HealthProfile from './HealthProfile';
import HealthTracker from './HealthTracker';
import NotificationCenter from './NotificationCenter';
import NutritionAdvisor from './NutritionAdvisor';
import HelpCenter from './HelpCenter';
import AIAssistant from './AIAssistant';

import '../styles/Dashboard.css';

import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const userName = user.name || 'User';

  const [activeTab, setActiveTab] = useState('scan');

  // Combined Scan State
  const [eyeFile, setEyeFile] = useState(null);
  const [nailFile, setNailFile] = useState(null);
  const [palmFile, setPalmFile] = useState(null);
  const [eyePreview, setEyePreview] = useState(null);
  const [nailPreview, setNailPreview] = useState(null);
  const [palmPreview, setPalmPreview] = useState(null);

  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'results'
  const [showXAI, setShowXAI] = useState(false);
  
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // Dynamic Scan Results
  const [scanResult, setScanResult] = useState(null);

  // File refs for clearing after upload
  const palmRef = useRef(null);
  const eyeRef = useRef(null);
  const nailRef = useRef(null);

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    switch (type) {
      case 'eye':
        setEyeFile(file);
        setEyePreview(previewUrl);
        break;
      case 'nail':
        setNailFile(file);
        setNailPreview(previewUrl);
        break;
      case 'palm':
        setPalmFile(file);
        setPalmPreview(previewUrl);
        break;
    }
  };

  const allFilesSelected = eyeFile && nailFile && palmFile;

  const handleCombinedScan = async () => {
    if (!allFilesSelected) return;

    setScanStatus('scanning');
    setShowXAI(false);

    const formData = new FormData();
    formData.append('eye', eyeFile);
    formData.append('nail', nailFile);
    formData.append('palm', palmFile);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      
      const response = await axios.post(`${apiUrl}/scans/combined`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 120000 // 2 min timeout for AI inference
      });

      if (response.data.success) {
        const result = response.data.data;
        setScanResult(result);
        
        // Brief delay to allow "scanning" animation to show
        setTimeout(() => {
          setScanStatus('results');
        }, 1500);
      }
    } catch (err) {
      console.error('Scan Error:', err);
      const errorMessage = err.response?.data?.error || 'Error processing scan. Please ensure the backend and AI service are running.';
      alert(errorMessage);
      setScanStatus('idle');
    }
  };

  const closeScan = () => {
    setScanStatus('idle');
    setScanResult(null);
    setShowXAI(false);
    setEyeFile(null);
    setNailFile(null);
    setPalmFile(null);
    setEyePreview(null);
    setNailPreview(null);
    setPalmPreview(null);
    // Reset file inputs
    if (palmRef.current) palmRef.current.value = '';
    if (eyeRef.current) eyeRef.current.value = '';
    if (nailRef.current) nailRef.current.value = '';
  };

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowLogoutAlert(false);
    navigate('/login');
  };

  const getScoreColor = (score) => {
    if (score >= 0.5) return '#10b981';  // green - normal
    if (score >= 0.3) return '#f59e0b';  // amber - borderline
    return '#ef4444';  // red - anemia
  };

  const getScoreLabel = (score) => {
    if (score >= 0.5) return 'Normal';
    return 'Anemia';
  };

  const renderTabContent = () => {
    const commonProps = { onBack: () => setActiveTab('scan') };
    switch (activeTab) {
      case 'scan':
        return (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration: 0.4}}>
            <header className="dashboard-header slide-down-fade">
              <div className="welcome-badge">
                <span className="welcome-text">Welcome back,</span>
                <span className="user-name-glow">{userName}</span>
              </div>
              <h1>Hemoglobin Analysis</h1>
              <p>Non-invasive prediction via multi-modal AI scanning</p>
            </header>

            {/* Combined Upload Section */}
            <section className="combined-scan-section">
              <div className="scan-instruction-banner">
                <Activity size={20} className="ruby-icon" />
                <span>Upload all 3 images for AI-powered anemia detection</span>
              </div>

              <section className="hologram-grid">
                {/* Eye Upload */}
                <div className={`hologram-module ${eyeFile ? 'file-selected' : ''}`}>
                  <div className="rhythmic-pulse"></div>
                  <div className="module-content">
                    {eyePreview ? (
                      <div className="preview-container">
                        <img src={eyePreview} alt="Eye preview" className="image-preview" />
                        <CheckCircle size={24} className="check-icon" />
                      </div>
                    ) : (
                      <Eye size={48} className="ruby-icon" />
                    )}
                    <h3>Conjunctiva (Eye)</h3>
                    <p>{eyeFile ? eyeFile.name : 'Upload eye image'}</p>
                    <input ref={eyeRef} type="file" id="upload-eye" accept="image/*" style={{display: 'none'}} onChange={(e) => handleFileSelect(e, 'eye')} />
                    <label htmlFor="upload-eye" className={`upload-btn ${eyeFile ? 'uploaded' : ''}`}>
                      <UploadCloud size={20} /> {eyeFile ? 'Change' : 'Select File'}
                    </label>
                  </div>
                </div>

                {/* Palm Upload */}
                <div className={`hologram-module center-module ${palmFile ? 'file-selected' : ''}`}>
                  <div className="rhythmic-pulse active-pulse"></div>
                  <div className="module-content">
                    {palmPreview ? (
                      <div className="preview-container">
                        <img src={palmPreview} alt="Palm preview" className="image-preview" />
                        <CheckCircle size={24} className="check-icon" />
                      </div>
                    ) : (
                      <Hand size={56} className="ruby-icon" />
                    )}
                    <h3>Palm Scan</h3>
                    <p>{palmFile ? palmFile.name : 'Upload palm image'}</p>
                    <input ref={palmRef} type="file" id="upload-palm" accept="image/*" style={{display: 'none'}} onChange={(e) => handleFileSelect(e, 'palm')} />
                    <label htmlFor="upload-palm" className={`upload-btn primary-btn ${palmFile ? 'uploaded' : ''}`}>
                      <UploadCloud size={20} /> {palmFile ? 'Change' : 'Select File'}
                    </label>
                  </div>
                </div>

                {/* Nail Upload */}
                <div className={`hologram-module ${nailFile ? 'file-selected' : ''}`}>
                  <div className="rhythmic-pulse"></div>
                  <div className="module-content">
                    {nailPreview ? (
                      <div className="preview-container">
                        <img src={nailPreview} alt="Nail preview" className="image-preview" />
                        <CheckCircle size={24} className="check-icon" />
                      </div>
                    ) : (
                      <ActivitySquare size={48} className="ruby-icon" />
                    )}
                    <h3>Nail Bed Scan</h3>
                    <p>{nailFile ? nailFile.name : 'Upload nail image'}</p>
                    <input ref={nailRef} type="file" id="upload-nail" accept="image/*" style={{display: 'none'}} onChange={(e) => handleFileSelect(e, 'nail')} />
                    <label htmlFor="upload-nail" className={`upload-btn ${nailFile ? 'uploaded' : ''}`}>
                      <UploadCloud size={20} /> {nailFile ? 'Change' : 'Select File'}
                    </label>
                  </div>
                </div>
              </section>

              {/* Analyze Button */}
              <div className="analyze-button-container">
                <button 
                  className={`analyze-btn ${allFilesSelected ? 'ready' : 'disabled'}`}
                  onClick={handleCombinedScan}
                  disabled={!allFilesSelected || scanStatus === 'scanning'}
                >
                  {scanStatus === 'scanning' ? (
                    <>
                      <Loader2 size={22} className="spinning-loader" />
                      Analyzing with AI Models...
                    </>
                  ) : (
                    <>
                      <Activity size={22} />
                      {allFilesSelected ? 'Run Combined AI Analysis' : `Upload ${3 - [eyeFile, nailFile, palmFile].filter(Boolean).length} more image(s)`}
                    </>
                  )}
                </button>
                {allFilesSelected && scanStatus === 'idle' && (
                  <p className="analyze-hint">3 models will analyze your images simultaneously</p>
                )}
              </div>
            </section>

            <section className="data-visualization">
              <div className="viz-header">
                <h4>Live Biometric Stream</h4>
                <span className="live-indicator"></span>
              </div>
              <div className="cyan-waveform-container">
                <svg width="100%" height="80" viewBox="0 0 800 80" preserveAspectRatio="none">
                  <path 
                    className="cyan-line" 
                    d="M0,40 C100,40 150,10 200,40 C250,70 300,40 350,40 C400,40 450,10 500,40 C550,70 600,60 650,40 C700,20 750,40 800,40" 
                    fill="none" 
                  />
                </svg>
                <div className="viz-glow-overlay"></div>
              </div>
            </section>
          </motion.div>
        );
      case 'history': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><Diagnostic {...commonProps} /></motion.div>;
      case 'cells': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><BloodCellViewer {...commonProps} /></motion.div>;
      case 'compare': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><ComparisonEngine {...commonProps} /></motion.div>;
      case 'tracker': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><HealthTracker {...commonProps} /></motion.div>;
      case 'report': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><MedicalReport {...commonProps} userName={userName} /></motion.div>;
      case 'advisor': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><NutritionAdvisor {...commonProps} /></motion.div>;
      case 'help': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><HelpCenter {...commonProps} /></motion.div>;
      case 'notifications': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><NotificationCenter {...commonProps} /></motion.div>;

      case 'profile': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><HealthProfile {...commonProps} /></motion.div>;
      case 'diagnostics': return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}><ModelDiagnostics {...commonProps} /></motion.div>;
      default: return <motion.div initial={{opacity:0}} animate={{opacity:1}}><Diagnostic {...commonProps} /></motion.div>;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation — Compact Dock */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <Activity color="#E11D48" size={28} />
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab==='scan' ? 'active':''}`} onClick={() => setActiveTab('scan')}><LayoutDashboard size={20} /><span className="nav-tooltip">Dashboard</span></button>
          <button className={`nav-item ${activeTab==='history' ? 'active':''}`} onClick={() => setActiveTab('history')}><FileText size={20} /><span className="nav-tooltip">Predictions</span></button>
          <button className={`nav-item ${activeTab==='cells' ? 'active':''}`} onClick={() => setActiveTab('cells')}><Microscope size={20} /><span className="nav-tooltip">Morphology</span></button>
          <button className={`nav-item ${activeTab==='compare' ? 'active':''}`} onClick={() => setActiveTab('compare')}><GitCompare size={20} /><span className="nav-tooltip">Compare</span></button>
          <button className={`nav-item ${activeTab==='tracker' ? 'active':''}`} onClick={() => setActiveTab('tracker')}><TrendingUp size={20} /><span className="nav-tooltip">Timeline</span></button>
          <button className={`nav-item ${activeTab==='report' ? 'active':''}`} onClick={() => setActiveTab('report')}><ClipboardList size={20} /><span className="nav-tooltip">Report</span></button>
          <button className={`nav-item ${activeTab==='advisor' ? 'active':''}`} onClick={() => setActiveTab('advisor')}><Apple size={20} /><span className="nav-tooltip">Diet</span></button>
          <button className={`nav-item ${activeTab==='help' ? 'active':''}`} onClick={() => setActiveTab('help')}><HelpCircle size={20} /><span className="nav-tooltip">Help</span></button>
          <button className={`nav-item ${activeTab==='notifications' ? 'active':''}`} onClick={() => setActiveTab('notifications')}><Bell size={20} /><span className="nav-tooltip">Alerts</span></button>

          <button className={`nav-item ${activeTab==='profile' ? 'active':''}`} onClick={() => setActiveTab('profile')}><UserCircle size={20} /><span className="nav-tooltip">Profile</span></button>
          <button className={`nav-item ${activeTab==='diagnostics' ? 'active':''}`} onClick={() => setActiveTab('diagnostics')}><Settings size={20} /><span className="nav-tooltip">Settings</span></button>
        </nav>
        <button className="nav-item logout-btn" onClick={handleLogout}><LogOut size={20} /><span className="nav-tooltip">Logout</span></button>
      </aside>

      {/* Main Dashboard Area */}
      <main className="dashboard-main">
        {/* Global AI Assistant */}
        <AIAssistant />

        {/* Cinematic Background Elements */}
        <div className="diffused-crimson-glow"></div>
        
        {/* Vascular Network Particles */}
        <div className="vascular-network">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`rbc-particle rbc-${i % 5}`}></div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>

        {/* --- DYNAMIC SCAN RESULTS OVERLAY --- */}
        {scanStatus !== 'idle' && (
          <div className="scan-results-overlay slide-up-fade">
            <div className="overlay-background-blur"></div>
            
            <button className="close-scan-btn" onClick={closeScan}>×</button>
            
            {/* Center 3D Volumetric Hologram / CNN Visualizer */}
            <div className="volumetric-hologram-container">
              {scanStatus === 'scanning' ? (
                <div className="neural-xray-view">
                  <div className="source-node">
                    <Activity size={64} className="ruby-icon"/>
                    <div className="laser-scanner horizontal-sweep"></div>
                  </div>
                  <div className="synapse-network">
                    <div className="synapse-line to-top"></div>
                    <div className="synapse-line to-mid-top"></div>
                    <div className="synapse-line to-mid-bottom"></div>
                    <div className="synapse-line to-bottom"></div>
                  </div>
                  <div className="feature-maps">
                    <div className="f-map edge-map">Eye Model</div>
                    <div className="f-map texture-map">Palm Model</div>
                    <div className="f-map thermal-map">Nail Model</div>
                    <div className="f-map vascular-map">Averaging</div>
                  </div>
                  <div className="scanning-text pulse-text">Running 3 CNN models in parallel...</div>
                </div>
              ) : showXAI ? (
                <div className="xai-gradcam-view slide-up-fade">
                  <div className="binary-cascade-bg"></div>
                  <div className="xai-image-container">
                    <Activity size={140} className="base-image"/>
                    <div className="heatmap-overlay pulse-ruby-gradient"></div>
                    <div className="xai-radar-sweep"></div>
                  </div>
                  <div className="xai-metrics">
                    <div className="confidence-radial">
                       <svg viewBox="0 0 100 100" width="120" height="120">
                          <circle cx="50" cy="50" r="45" className="bg-ring"></circle>
                          <circle cx="50" cy="50" r="45" className="progress-ring"></circle>
                       </svg>
                       <span className="confidence-text">{scanResult?.confidence}%</span>
                    </div>
                    <p className="confidence-label">CNN Confidence Score</p>
                  </div>
                </div>
              ) : (
                <div className="hologram-model">
                  <div className="wireframe-sphere"></div>
                  <div className="wireframe-sphere inner"></div>
                  <div className="wireframe-sphere core"></div>
                </div>
              )}
            </div>

            {/* Slide-in Results Panels (Only show when results are ready) */}
            {scanStatus === 'results' && scanResult && (
              <div className="results-panels-container">
                
                {/* AI Focus Trigger Button */}
                <div className="results-action-trigger">
                  <button className={`xai-trigger-btn ${showXAI ? 'active' : ''}`} onClick={() => setShowXAI(!showXAI)}>
                    <Activity size={18}/> {showXAI ? 'Hide Grad-CAM' : 'Analyze AI Focus'}
                  </button>
                </div>
                
                {/* Left Panel: Combined Result */}
                <div className="glass-panel result-panel-left enter-left">
                  <h4 className="panel-title">AI Prediction Result</h4>
                  
                  <div className={`prediction-label-badge ${scanResult.label === 'Normal' ? 'normal-badge' : 'anemia-badge'}`}>
                    {scanResult.label === 'Normal' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    <span className="prediction-label-text">{scanResult.label}</span>
                  </div>

                  <div className="vital-metric">
                    <span className="metric-label">Combined Score</span>
                    <div className="metric-value-container">
                      <span className="metric-value count-up" style={{color: getScoreColor(scanResult.finalScore)}}>
                        {(scanResult.finalScore * 100).toFixed(1)}
                      </span>
                      <span className="metric-unit">%</span>
                    </div>
                  </div>

                  <div className="vital-metric">
                    <span className="metric-label">Confidence</span>
                    <div className="metric-value-container">
                      <span className="metric-value count-up-delay">{scanResult.confidence}</span>
                      <span className="metric-unit">%</span>
                    </div>
                  </div>

                  <div className={`diagnostic-badge ${scanResult.status.toLowerCase()}-status`}>
                    <div className="status-dot"></div>
                    {scanResult.status} Range
                  </div>
                </div>

                {/* Right Panel: Individual Model Breakdown */}
                <div className="glass-panel result-panel-right enter-right">
                  <h4 className="panel-title">Individual Model Scores</h4>
                  
                  <div className="model-score-item">
                    <div className="model-score-header">
                      <Eye size={18} className="ruby-icon small" />
                      <span>Eye (Conjunctiva)</span>
                    </div>
                    <div className="model-score-bar">
                      <div className="score-fill" style={{width: `${scanResult.eyeScore * 100}%`, background: getScoreColor(scanResult.eyeScore)}}></div>
                    </div>
                    <span className="model-score-value" style={{color: getScoreColor(scanResult.eyeScore)}}>
                      {(scanResult.eyeScore * 100).toFixed(1)}% — {getScoreLabel(scanResult.eyeScore)}
                    </span>
                  </div>

                  <div className="model-score-item">
                    <div className="model-score-header">
                      <ActivitySquare size={18} className="ruby-icon small" />
                      <span>Nail Bed</span>
                    </div>
                    <div className="model-score-bar">
                      <div className="score-fill" style={{width: `${scanResult.nailScore * 100}%`, background: getScoreColor(scanResult.nailScore)}}></div>
                    </div>
                    <span className="model-score-value" style={{color: getScoreColor(scanResult.nailScore)}}>
                      {(scanResult.nailScore * 100).toFixed(1)}% — {getScoreLabel(scanResult.nailScore)}
                    </span>
                  </div>

                  <div className="model-score-item">
                    <div className="model-score-header">
                      <Hand size={18} className="ruby-icon small" />
                      <span>Palm</span>
                    </div>
                    <div className="model-score-bar">
                      <div className="score-fill" style={{width: `${scanResult.palmScore * 100}%`, background: getScoreColor(scanResult.palmScore)}}></div>
                    </div>
                    <span className="model-score-value" style={{color: getScoreColor(scanResult.palmScore)}}>
                      {(scanResult.palmScore * 100).toFixed(1)}% — {getScoreLabel(scanResult.palmScore)}
                    </span>
                  </div>

                  <div className="ai-insight-box" style={{marginTop: '16px'}}>
                    <Activity size={14} />
                    <p>
                      {scanResult.label === 'Normal' 
                        ? 'AI models indicate healthy hemoglobin levels across all scanned regions.'
                        : 'AI models detect potential anemia indicators. Please consult a healthcare professional for confirmation.'}
                    </p>
                  </div>
                </div>
                
              </div>
            )}
            
          </div>
        )}
        
      </main>

      {/* Logout SweetAlert */}
      {showLogoutAlert && (
        <div className="swal-overlay">
          <div className="swal-box logout-swal">
            <div className="swal-icon-circle logout-icon-circle">
              <LogOut size={32} />
            </div>
            <h3 className="swal-title">Leaving so soon?</h3>
            <p className="swal-text">Are you sure you want to log out of HemoVision AI?</p>
            <div className="swal-actions">
              <button className="swal-cancel-btn" onClick={() => setShowLogoutAlert(false)}>Stay</button>
              <button className="swal-confirm-btn logout-confirm" onClick={confirmLogout}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

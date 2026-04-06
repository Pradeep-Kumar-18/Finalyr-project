import React, { useState, useRef } from 'react';
import { Activity, LayoutDashboard, FileText, Settings, LogOut, UploadCloud, Eye, Hand, ActivitySquare, ChevronRight, Microscope, GitCompare, ClipboardList, Bell, TrendingUp, UserCircle, Apple, HelpCircle, Heart } from 'lucide-react';
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

  // Scanning State
  const [activeScan, setActiveScan] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // 'scanning', 'results'
  const [showXAI, setShowXAI] = useState(false);
  
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // Dynamic Scan Results
  const [displayHb, setDisplayHb] = useState(14.2);
  const [displaySpo2, setDisplaySpo2] = useState(98);
  const [displayConfidence, setDisplayConfidence] = useState(99.4);
  const [displayStatus, setDisplayStatus] = useState('Normal');

  // File refs for clearing after upload
  const palmRef = useRef(null);
  const eyeRef = useRef(null);
  const nailRef = useRef(null);

  const handleScan = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setActiveScan(type);
    setScanStatus('scanning');
    setShowXAI(false);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      
      const response = await axios.post(`${apiUrl}/scans`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const result = response.data.data;
        setDisplayHb(result.hb);
        setDisplaySpo2(result.spo2);
        setDisplayConfidence(result.confidence);
        setDisplayStatus(result.status);
        
        // Brief delay to allow "scanning" animation to show
        setTimeout(() => {
          setScanStatus('results');
        }, 1500);
      }
    } catch (err) {
      console.error('Scan Error:', err);
      const errorMessage = err.response?.data?.error || 'Error processing scan. Please ensure the backend is running and you are logged in.';
      alert(errorMessage);
      setScanStatus('idle');
    }
  };

  const closeScan = () => {
    setScanStatus('idle');
    setActiveScan(null);
    setShowXAI(false);
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
              <p>Non-invasive prediction via multi-modal scanning</p>
            </header>

            <section className="hologram-grid">
              <div className="hologram-module">
                <div className="rhythmic-pulse"></div>
                <div className="module-content">
                  <Hand size={48} className="ruby-icon" />
                  <h3>Palm Scan</h3>
                  <p>Upload dermal imaging</p>
                  <input ref={palmRef} type="file" id="upload-palm" style={{display: 'none'}} onChange={(e) => handleScan(e, 'Palm')} />
                  <label htmlFor="upload-palm" className="upload-btn"><UploadCloud size={20} /> Select File</label>
                </div>
              </div>

              <div className="hologram-module center-module">
                <div className="rhythmic-pulse active-pulse"></div>
                <div className="module-content">
                  <Eye size={56} className="ruby-icon" />
                  <h3>Conjunctiva Scan</h3>
                  <p>Awaiting ocular upload</p>
                  <input ref={eyeRef} type="file" id="upload-eye" style={{display: 'none'}} onChange={(e) => handleScan(e, 'Conjunctiva')} />
                  <label htmlFor="upload-eye" className="upload-btn primary-btn"><UploadCloud size={20} /> Select File</label>
                </div>
              </div>

              <div className="hologram-module">
                <div className="rhythmic-pulse"></div>
                <div className="module-content">
                  <ActivitySquare size={48} className="ruby-icon" />
                  <h3>Nail Bed Scan</h3>
                  <p>Upload capillary imaging</p>
                  <input ref={nailRef} type="file" id="upload-nail" style={{display: 'none'}} onChange={(e) => handleScan(e, 'Nail Bed')} />
                  <label htmlFor="upload-nail" className="upload-btn"><UploadCloud size={20} /> Select File</label>
                </div>
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
                    {activeScan === 'Palm' && <Hand size={64} className="ruby-icon"/>}
                    {activeScan === 'Conjunctiva' && <Eye size={64} className="ruby-icon"/>}
                    {activeScan === 'Nail Bed' && <ActivitySquare size={64} className="ruby-icon"/>}
                    <div className="laser-scanner horizontal-sweep"></div>
                  </div>
                  <div className="synapse-network">
                    <div className="synapse-line to-top"></div>
                    <div className="synapse-line to-mid-top"></div>
                    <div className="synapse-line to-mid-bottom"></div>
                    <div className="synapse-line to-bottom"></div>
                  </div>
                  <div className="feature-maps">
                    <div className="f-map edge-map">Edges</div>
                    <div className="f-map texture-map">Textures</div>
                    <div className="f-map thermal-map">Thermal</div>
                    <div className="f-map vascular-map">Vascular</div>
                  </div>
                  <div className="scanning-text pulse-text">Extracting CNN feature maps for {activeScan}...</div>
                </div>
              ) : showXAI ? (
                <div className="xai-gradcam-view slide-up-fade">
                  <div className="binary-cascade-bg"></div>
                  <div className="xai-image-container">
                    {activeScan === 'Palm' && <Hand size={140} className="base-image"/>}
                    {activeScan === 'Conjunctiva' && <Eye size={140} className="base-image"/>}
                    {activeScan === 'Nail Bed' && <ActivitySquare size={140} className="base-image"/>}
                    <div className="heatmap-overlay pulse-ruby-gradient"></div>
                    <div className="xai-radar-sweep"></div>
                  </div>
                  <div className="xai-metrics">
                    <div className="confidence-radial">
                       <svg viewBox="0 0 100 100" width="120" height="120">
                          <circle cx="50" cy="50" r="45" className="bg-ring"></circle>
                          <circle cx="50" cy="50" r="45" className="progress-ring"></circle>
                       </svg>
                       <span className="confidence-text">{displayConfidence}%</span>
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
            {scanStatus === 'results' && (
              <div className="results-panels-container">
                
                {/* AI Focus Trigger Button */}
                <div className="results-action-trigger">
                  <button className={`xai-trigger-btn ${showXAI ? 'active' : ''}`} onClick={() => setShowXAI(!showXAI)}>
                    <Activity size={18}/> {showXAI ? 'Hide Grad-CAM' : 'Analyze AI Focus'}
                  </button>
                </div>
                
                {/* Left Panel: Vital Metrics */}
                <div className="glass-panel result-panel-left enter-left">
                  <h4 className="panel-title">Non-Invasive Prediction</h4>
                  <div className="vital-metric">
                    <span className="metric-label">Hemoglobin Concentration</span>
                    <div className="metric-value-container">
                      <span className="metric-value count-up">{displayHb}</span>
                      <span className="metric-unit">g/dL</span>
                    </div>
                  </div>
                  <div className="vital-metric">
                    <span className="metric-label">Oxygen Saturation (SpO2)</span>
                    <div className="metric-value-container">
                      <span className="metric-value count-up-delay">{displaySpo2}</span>
                      <span className="metric-unit">%</span>
                    </div>
                  </div>
                  <div className={`diagnostic-badge ${displayStatus.toLowerCase()}-status`}>
                    <div className="status-dot"></div>
                    {displayStatus} Range
                  </div>
                </div>

                {/* Right Panel: Topographical Analysis */}
                <div className="glass-panel result-panel-right enter-right">
                  <h4 className="panel-title">Topographical Analysis</h4>
                  <div className="spider-chart-placeholder">
                    <div className="radar-grid"></div>
                    <div className="radar-blob"></div>
                  </div>
                  <ul className="analysis-details">
                    <li><span>Corpuscle Density:</span> <span className="highlight-cyan">Optimal</span></li>
                    <li><span>Vascular Flow:</span> <span className="highlight-cyan">Steady</span></li>
                    <li><span>Confidence Score:</span> <span className="highlight-cyan">99.4%</span></li>
                  </ul>
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

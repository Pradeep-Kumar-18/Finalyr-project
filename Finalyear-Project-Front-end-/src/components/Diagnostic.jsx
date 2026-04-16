import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Hand, ActivitySquare, ChevronRight, Activity, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import BackButton from './BackButton';
import '../styles/Diagnostic.css';

const Diagnostic = ({ onBack }) => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/scans`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          // Format date strings from ISO to readable format
          const formatted = response.data.data.map(scan => ({
            ...scan,
            date: new Date(scan.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: '2-digit', year: 'numeric'
            }),
            trend: "+0%" // Using string to match the UI logic using startsWith
          }));
          setScanHistory(formatted);
        }
      } catch (err) {
        console.error('History Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="loading-state-container">
        <Loader2 className="spinning-loader" size={48} />
        <p>Retrieving Neural Diagnostic History...</p>
      </div>
    );
  }

  return (
    <section className="diagnostic-view">
      <BackButton onClick={onBack} />
      
      <div className="history-header slide-down-fade">
        <h2>Non-Invasive Prediction Log</h2>
        <p>Historical scan records and hemoglobin prediction analysis</p>
      </div>
      
      <div className="timeline-container">
        <div className="timeline-track"></div>
        {scanHistory.map((log, index) => (
          <div 
            key={log._id} 
            className={`timeline-card slide-up-stagger ${selectedLog?._id === log._id ? 'selected' : ''}`}
            style={{'--stagger-idx': index}}
            onClick={() => setSelectedLog(log)}
          >
            <div className="timeline-dot"></div>
            <div className="card-glass">
              <div className="card-top">
                <span className="log-date">{log.date}</span>
                <span className={`status-badge ${log.status.toLowerCase()}`}>{log.status}</span>
              </div>
              <div className="card-main">
                <div className="log-type">
                  {log.type === 'Combined' && <Activity size={20} className="ruby-icon small"/>}
                  {log.type.includes('Palm') && log.type !== 'Combined' && <Hand size={20} className="ruby-icon small"/>}
                  {log.type.includes('Conjunctiva') && <Eye size={20} className="ruby-icon small"/>}
                  {log.type.includes('Nail') && log.type !== 'Combined' && <ActivitySquare size={20} className="ruby-icon small"/>}
                  <h4>{log.type === 'Combined' ? 'Combined AI Analysis' : log.type}</h4>
                </div>
                <div className="log-metric">
                  {log.label ? (
                    <span className="hb-value" style={{color: log.label === 'Normal' ? '#10b981' : '#ef4444'}}>
                      {log.label} <small>({(log.finalScore * 100).toFixed(1)}%)</small>
                    </span>
                  ) : (
                    <span className="hb-value">{log.hb} <small>g/dL</small></span>
                  )}
                </div>
              </div>
              <div className="card-bottom">
                <span className="trend-indicator">Confidence: {log.confidence}%</span>
                <ChevronRight size={18} className="chevron-icon"/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sliding Drawer */}
      <div className={`history-drawer ${selectedLog ? 'open' : ''}`}>
        <button className="close-drawer-btn" onClick={() => setSelectedLog(null)}>×</button>
        {selectedLog && (
          <div className="drawer-content">
            <h3>Analysis Details</h3>
            <p className="drawer-subtitle">{selectedLog.date} - {selectedLog.type === 'Combined' ? 'Combined AI Analysis' : selectedLog.type}</p>
            
            {selectedLog.label ? (
              <>
                <div className="drawer-metric-highlight">
                  <h1 style={{color: selectedLog.label === 'Normal' ? '#10b981' : '#ef4444'}}>{selectedLog.label}</h1>
                  <span>{(selectedLog.finalScore * 100).toFixed(1)}%</span>
                </div>

                {selectedLog.eyeScore != null && (
                  <div style={{marginBottom: '20px'}}>
                    <p style={{color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px'}}>Individual Model Scores:</p>
                    <p style={{color: '#94a3b8', fontSize: '0.85rem'}}>👁 Eye: {(selectedLog.eyeScore * 100).toFixed(1)}%</p>
                    <p style={{color: '#94a3b8', fontSize: '0.85rem'}}>💅 Nail: {(selectedLog.nailScore * 100).toFixed(1)}%</p>
                    <p style={{color: '#94a3b8', fontSize: '0.85rem'}}>🤚 Palm: {(selectedLog.palmScore * 100).toFixed(1)}%</p>
                  </div>
                )}
              </>
            ) : (
              <div className="drawer-metric-highlight">
                <h1>{selectedLog.hb}</h1>
                <span>g/dL</span>
              </div>
            )}
            
            <div className="ai-insight-box">
              <Activity size={18} /> 
              <p>
                {selectedLog.label 
                  ? (selectedLog.label === 'Normal'
                    ? 'AI models indicate healthy hemoglobin levels. No immediate clinical action required.'
                    : 'AI models detect potential anemia indicators. Please consult a healthcare professional for confirmation.')
                  : `AI Engine detects ${selectedLog.status.toLowerCase()} corpuscle density variations across the scanned region.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Diagnostic;

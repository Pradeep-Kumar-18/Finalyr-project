import React, { useState, useEffect } from 'react';
import { FileText, Download, Send, Activity, CheckCircle, Clock, User, Microscope, Mail, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from './BackButton';
import '../styles/MedicalReport.css';

const reportSections = [
  { id: 'patient', delay: 0 },
  { id: 'summary', delay: 800 },
  { id: 'analysis', delay: 1600 },
  { id: 'recommendation', delay: 2400 }
];

const MedicalReport = ({ onBack, userName = 'User' }) => {
  const [visibleSections, setVisibleSections] = useState([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showShareAnim, setShowShareAnim] = useState(false);
  
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const reportNumber = `HV-2024-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

  const displayScans = [
    { type: 'Palm Scan', region: 'Dermal Vasculature', hb: 14.2, spo2: 98, status: 'Normal' },
    { type: 'Conjunctiva Scan', region: 'Ocular Membrane', hb: 13.8, spo2: 97, status: 'Normal' },
    { type: 'Nail Bed Scan', region: 'Capillary Network', hb: 14.5, spo2: 99, status: 'Normal' }
  ];

  const weightedHb = (displayScans.reduce((sum, s) => sum + s.hb, 0) / displayScans.length).toFixed(2);
  const avgConfidence = 99.4;

  useEffect(() => {
    reportSections.forEach((section) => {
      setTimeout(() => {
        setVisibleSections(prev => [...prev, section.id]);
      }, section.delay);
    });
  }, []);

  const handleShareClick = () => {
    setShowShareOptions(!showShareOptions);
  };

  const executeShare = (method) => {
    setShowShareOptions(false);
    setShowShareAnim(true);
    
    const shareText = `HemoVision AI Report Summary\nPatient: ${userName}\nAvg Hemoglobin: ${weightedHb} g/dL\nStatus: Normal\nDate: ${today}`;
    
    setTimeout(() => {
      if (method === 'mail') {
        window.location.href = `mailto:?subject=Medical Report - ${userName}&body=${encodeURIComponent(shareText)}`;
      } else if (method === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
      }
      setShowShareAnim(false);
    }, 2500);
  };

  return (
    <div className="medical-report-view">
      <BackButton onClick={onBack} />
      
      <div className="report-header slide-down-fade text-white mb-8">
        <h2 className="text-4xl font-light">AI Medical Report</h2>
        <p className="text-cyan-400">Validated biometric diagnostic summary</p>
      </div>

      <div className="report-document mb-8">
        <div className="report-letterhead">
          <div className="letterhead-logo">
            <Activity size={32} />
            <div>
              <h3>HemoVision AI Lab</h3>
              <span className="text-gray-500">Neural Diagnostic Division</span>
            </div>
          </div>
          <div className="letterhead-meta text-right">
            <span><Clock size={14}/> {today}</span>
            <span>Ref: {reportNumber}</span>
          </div>
        </div>

        <div className="report-divider my-6"></div>

        {visibleSections.includes('patient') && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="report-section">
            <h4 className="section-title"><User size={18} /> Patient Information</h4>
            <div className="info-grid grid grid-cols-2 gap-4">
              <div className="info-item"><span>Name</span><strong>{userName}</strong></div>
              <div className="info-item"><span>Status</span><strong>Verified Scan</strong></div>
            </div>
          </motion.div>
        )}

        {visibleSections.includes('summary') && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="report-section">
            <h4 className="section-title"><FileText size={18} /> Scan Diagnostics</h4>
            <table className="report-table w-full">
              <thead>
                <tr className="text-left border-b border-white/10"><th className="pb-2">Type</th><th className="pb-2">Hb</th><th className="pb-2">Status</th></tr>
              </thead>
              <tbody>
                {displayScans.map((scan, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3">{scan.type}</td>
                    <td>{scan.hb}</td>
                    <td><span className="text-green-400">{scan.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {visibleSections.includes('analysis') && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="report-section">
            <h4 className="section-title"><Microscope size={18} /> AI Analysis Verdict</h4>
            <div className="analysis-note border-l-2 border-cyan-500 pl-4 py-2 italic text-gray-400">
               CNN Model ResNet-50 confirms uniform corpuscle distribution across all scan modalities. Weighted average sits at {weightedHb} g/dL with 99.4% confidence.
            </div>
          </motion.div>
        )}
      </div>

      <div className="report-actions flex gap-4">
        <div className="share-menu-wrapper relative">
          <button className="report-btn share-btn" onClick={handleShareClick}>
            <Send size={18} /> {showShareOptions ? 'Cancel' : 'Share with Doctor'}
          </button>
          
          <AnimatePresence>
            {showShareOptions && (
              <motion.div 
                className="share-menu-container absolute bottom-full left-0 mb-4 w-64"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
              >
                <button className="share-option-btn mail-opt mb-2" onClick={() => executeShare('mail')}>
                  <div className="share-icon-circle"><Mail size={16} /></div>
                  Send via Email
                </button>
                <button className="share-option-btn whatsapp-opt" onClick={() => executeShare('whatsapp')}>
                  <div className="share-icon-circle"><MessageCircle size={16} /></div>
                  WhatsApp Report
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button className="report-btn download-btn" onClick={() => window.print()}>
          <Download size={18} /> Print Report
        </button>
      </div>

      <AnimatePresence>
        {showShareAnim && (
          <motion.div 
            className="share-animation-overlay h-full w-full fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-3xl z-[2000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="holographic-envelope relative w-64 h-64 flex items-center justify-center">
              <motion.div 
                className="envelope-body p-10 bg-slate-900/60 border-2 border-cyan-500 rounded-3xl text-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Send size={64} />
              </motion.div>
              <div className="encryption-rings absolute inset-0 flex items-center justify-center">
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="ring-1 border border-cyan-500/40 w-48 h-48 rounded-full absolute" />
                 <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="ring-2 border border-rose-500/30 w-60 h-60 rounded-full absolute" />
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} className="ring-3 border border-cyan-500/20 border-dashed w-72 h-72 rounded-full absolute" />
              </div>
            </div>
            <p className="send-status mt-8 text-cyan-500 font-mono tracking-widest uppercase text-sm">Transmitting Encrypted Health Packet...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicalReport;

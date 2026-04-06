import React, { useState } from 'react';
import { HelpCircle, ChevronDown, BookOpen, ShieldCheck, Microscope, Zap } from 'lucide-react';
import BackButton from './BackButton';
import '../styles/HelpCenter.css';

const faqs = [
  {
    question: "How does the non-invasive prediction work?",
    answer: "Our CNN model analyzes the color, texture, and vascular density of specific body areas (palm, eyes, nail beds) to estimate hemoglobin levels without a single needle prick.",
    icon: <Microscope size={18} />
  },
  {
    question: "Is the HemoVision AI accurate?",
    answer: "The underlying model is trained on over 12,000 clinically validated samples, achieving a 99.4% accuracy rate on established test datasets.",
    icon: <Zap size={18} />
  },
  {
    question: "Where is my data stored?",
    answer: "Privacy is our priority. All image analysis happens locally within your browser/app context. No biometric images are uploaded to any server.",
    icon: <ShieldCheck size={18} />
  },
  {
    question: "When should I see a doctor?",
    answer: "This app is a screening tool. If you receive a low hemoglobin reading (Anemic range) or feel symptoms like chronic fatigue, please consult a medical professional.",
    icon: <HelpCircle size={18} />
  }
];

const HelpCenter = ({ onBack }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="help-center-view">
      <BackButton onClick={onBack} />

      <div className="help-header slide-down-fade">
        <h2>Help Center</h2>
        <p>Frequently asked questions and technical documentation</p>
      </div>

      <div className="help-content-grid">
        <div className="faq-section">
          <h3 className="section-title-hc"><BookOpen size={20} /> Frequently Asked Questions</h3>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item glass-card-hc ${activeIndex === index ? 'active' : ''}`}>
                <button className="faq-question" onClick={() => setActiveIndex(activeIndex === index ? null : index)}>
                  <div className="faq-icon-q">
                    {faq.icon}
                  </div>
                  <span>{faq.question}</span>
                  <ChevronDown className={`chevron-icon ${activeIndex === index ? 'rotate' : ''}`} />
                </button>
                <div className="faq-answer-wrapper" style={{ maxHeight: activeIndex === index ? '200px' : '0' }}>
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-guide-section">
          <h3 className="section-title-hc"><Zap size={20} /> Quick Usage Guide</h3>
          <div className="guide-card glass-card-hc">
            <div className="guide-step-hc">
              <div className="step-num-hc">01</div>
              <div className="step-text-hc">
                <strong>Capture Scan</strong>
                <span>Ensure bright, natural lighting for best accuracy.</span>
              </div>
            </div>
            <div className="guide-step-hc">
              <div className="step-num-hc">02</div>
              <div className="step-text-hc">
                <strong>Run AI Analysis</strong>
                <span>Watch the Neural X-Ray extract biometric patterns.</span>
              </div>
            </div>
            <div className="guide-step-hc">
              <div className="step-num-hc">03</div>
              <div className="step-text-hc">
                <strong>Review Results</strong>
                <span>Check your timeline or generate a PDF report for your doctor.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;

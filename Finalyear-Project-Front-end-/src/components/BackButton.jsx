import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const BackButton = ({ onClick }) => {
  return (
    <div className="back-navigation-container">
      <motion.button 
        className="back-btn-creative"
        onClick={onClick}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="back-pulse-ring"></div>
        <div className="back-icon-wrap">
          <ArrowLeft size={18} />
        </div>
        <span className="back-btn-text">Back to Dashboard</span>
      </motion.button>
    </div>
  );
};

export default BackButton;

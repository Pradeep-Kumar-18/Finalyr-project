import React from 'react';
import '../styles/Button.css';

const Button = ({ children, onClick, className = '' }) => {
  return (
    <button className={`custom-3d-button ${className}`} onClick={onClick}>
      <span className="button-content">{children}</span>
    </button>
  );
};

export default Button;

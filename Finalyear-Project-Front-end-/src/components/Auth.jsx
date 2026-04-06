import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';
import Button from './Button';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL;
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { email: emailInput, password: passwordInput }
      : { name: nameInput, email: emailInput, password: passwordInput };

    try {
      const response = await axios.post(`${apiUrl}${endpoint}`, payload);
      
      if (response.data.success) {
        // Store JWT and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setAlertMessage(isLogin ? 'Welcome Back' : 'Registration Complete');
        setShowAlert(true);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      if (err.response?.status === 401) {
        setError(isLogin ? 'Invalid credentials. Please check your email/password OR Sign Up if you are new.' : 'Email already in use.');
      } else {
        setError(err.response?.data?.error || 'Authentication failed. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-visuals">
        <div className="ambient-glow"></div>
        <div className="frosted-overlay"></div>
        <div className="floating-cell cell-1"></div>
        <div className="floating-cell cell-2"></div>
        <div className="floating-cell cell-3"></div>
        <div className="vein-network"></div>
        <div className="visuals-text">
          <h2>Advanced Diagnostics</h2>
          <p>Next-generation haematology, at your fingertips.</p>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="glass-form">
          <div className="form-header slide-up-1">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Enter your credentials to access your dashboard.' : 'Sign up to start scanning.'}</p>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-group slide-up-2">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required 
                />
                <span className="floating-label">Full Name</span>
              </div>
            )}
            
            <div className={`input-group ${isLogin ? 'slide-up-2' : 'slide-up-3'}`}>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required 
              />
              <span className="floating-label">Email Address</span>
            </div>
            
            <div className={`input-group ${isLogin ? 'slide-up-3' : 'slide-up-4'}`}>
              <input 
                type="password" 
                placeholder="Password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required 
              />
              <span className="floating-label">Password</span>
            </div>

            {error && <div className="auth-error slide-up-3">{error}</div>}
            
            <div className={`form-actions ${isLogin ? 'slide-up-4' : 'slide-up-5'}`}>
              {isLogin && (
                <button type="button" className="forgot-password">
                  Forgot password?
                </button>
              )}
              <Button className="auth-submit-btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </Button>
            </div>
          </form>

          <div className="form-footer slide-up-6">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button className="toggle-btn" onClick={toggleMode} type="button">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
      
      {showAlert && (
        <div className="custom-swal-overlay">
          <div className="custom-swal-modal">
            <div className="swal-icon-success">
              <span className="swal-icon-line tip"></span>
              <span className="swal-icon-line long"></span>
              <div className="swal-icon-ring"></div>
            </div>
            <h2 className="swal-title">{alertMessage}</h2>
            <p className="swal-text">Initializing Neural Assessment Protocol...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;

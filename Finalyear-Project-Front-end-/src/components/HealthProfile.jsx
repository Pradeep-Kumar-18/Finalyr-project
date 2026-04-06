import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Heart, Droplets, Calendar, Shield, Moon, Sun, Bell, Save, Loader2 } from 'lucide-react';
import BackButton from './BackButton';
import '../styles/HealthProfile.css';

const HealthProfile = ({ onBack }) => {
  const [profile, setProfile] = useState({
    name: 'User',
    age: '',
    gender: 'Female',
    bloodGroup: 'B+',
    weight: '',
    height: '',
  });

  const [alertThreshold, setAlertThreshold] = useState(11);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Health Score (Simulated)
  const healthScore = 92;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const userData = response.data.data;
          setProfile({
            name: userData.name || 'User',
            age: userData.age || '',
            gender: userData.gender || 'Female',
            bloodGroup: userData.bloodGroup || 'B+',
            weight: userData.weight || '',
            height: userData.height || '',
          });
        }
      } catch (err) {
        console.error('Profile Fetch Error:', err);
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaved(false);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      
      const response = await axios.put(`${apiUrl}/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update local storage user info if name changed
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...localUser, ...response.data.data }));
        
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Profile Save Error:', err);
      alert('Failed to save profile. Please check your connection.');
    }
  };

  if (loading) {
    return (
      <div className="hp-loading">
        <Loader2 className="spinning-loader" size={48} />
        <p>Accessing Health Records...</p>
      </div>
    );
  }

  return (
    <div className="health-profile-view">
      <BackButton onClick={onBack} />
      
      <div className="profile-header slide-down-fade">
        <h2>Health Profile</h2>
        <p>Manage your personal health data and preferences</p>
      </div>

      <div className="profile-layout">
        {/* Left: Profile Card */}
        <div className="profile-card glass-card-hp">
          <div className="avatar-ring">
            <svg viewBox="0 0 100 100" width="140" height="140">
              <circle cx="50" cy="50" r="45" className="score-bg-ring"></circle>
              <circle cx="50" cy="50" r="45" className="score-fill-ring" style={{'--score': healthScore}}></circle>
            </svg>
            <div className="avatar-inner">
              <User size={48} />
            </div>
            <span className="score-badge">{healthScore}</span>
          </div>
          <h3 className="profile-name">{profile.name}</h3>
          <span className="profile-subtitle">Patient Profile</span>
          
          <div className="quick-stats">
            <div className="quick-stat">
              <Droplets size={16} className="stat-icon-red" />
              <span>{profile.bloodGroup}</span>
            </div>
            <div className="quick-stat">
              <Heart size={16} className="stat-icon-cyan" />
              <span>14.2 g/dL</span>
            </div>
            <div className="quick-stat">
              <Shield size={16} className="stat-icon-green" />
              <span>Normal</span>
            </div>
          </div>
        </div>

        {/* Right: Settings Form */}
        <div className="profile-form glass-card-hp">
          <h4 className="form-title">Personal Information</h4>
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
            </div>
            <div className="form-field">
              <label>Age</label>
              <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} />
            </div>
            <div className="form-field">
              <label>Gender</label>
              <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})}>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>Blood Group</label>
              <select value={profile.bloodGroup} onChange={e => setProfile({...profile, bloodGroup: e.target.value})}>
                <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
              </select>
            </div>
            <div className="form-field">
              <label>Weight (kg)</label>
              <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} />
            </div>
            <div className="form-field">
              <label>Height (cm)</label>
              <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} />
            </div>
          </div>

          <h4 className="form-title" style={{marginTop: '40px'}}>Preferences</h4>
          
          <div className="pref-row">
            <div className="pref-info">
              <Bell size={18} />
              <div>
                <strong>Scan Notifications</strong>
                <span>Alert when Hb drops below threshold</span>
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <Moon size={18} />
              <div>
                <strong>Dark Mode</strong>
                <span>Premium dark interface</span>
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="pref-row threshold-row">
            <div className="pref-info">
              <Droplets size={18} />
              <div>
                <strong>Alert Threshold</strong>
                <span>Notify if Hb falls below this level</span>
              </div>
            </div>
            <div className="threshold-control">
              <input type="range" min="8" max="14" step="0.5" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} />
              <span className="threshold-value">{alertThreshold} g/dL</span>
            </div>
          </div>

          <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            <Save size={18} /> {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthProfile;

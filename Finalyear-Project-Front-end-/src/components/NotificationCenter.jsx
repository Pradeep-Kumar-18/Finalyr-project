import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, AlertTriangle, CheckCircle, Info, Clock, X, Loader2 } from 'lucide-react';
import BackButton from './BackButton';
import '../styles/NotificationCenter.css';

const NotificationCenter = ({ onBack }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setNotifications(response.data.data.map(n => ({
          ...n,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' +
                new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
        })));
      }
    } catch (err) {
      console.error('Notification Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.put(`${apiUrl}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Mark Read Error:', err);
    }
  };

  const handleDismiss = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.delete(`${apiUrl}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error('Dismiss Notification Error:', err);
    }
  };

  const markAllRead = async () => {
    // Optimistic UI update
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    // Backend call would go here if bulk endpoint exists
  };

  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  if (loading) {
    return (
      <div className="notif-loading">
        <Loader2 className="spinning-loader" size={48} />
        <p>Syncing Neural Alerts...</p>
      </div>
    );
  }

  const getIcon = (type) => {
    switch(type) {
      case 'alert': return <AlertTriangle size={20} className="notif-icon alert" />;
      case 'success': return <CheckCircle size={20} className="notif-icon success" />;
      case 'reminder': return <Clock size={20} className="notif-icon reminder" />;
      case 'tip': return <Info size={20} className="notif-icon tip" />;
      default: return <Bell size={20} />;
    }
  };

  return (
    <div className="notification-center-view">
      <BackButton onClick={onBack} />
      
      <div className="notif-header slide-down-fade">
        <div className="notif-title-row">
          <h2>Notifications</h2>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </div>
        <p>Smart alerts, reminders, and health tips</p>
      </div>

      <div className="filter-bar">
        {['all', 'unread', 'alert', 'success', 'reminder', 'tip'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button className="mark-read-btn" onClick={markAllRead}>Mark all as read</button>
      </div>

      <div className="notif-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <p>No notifications to show</p>
          </div>
        ) : (
          filtered.map((notif, index) => (
            <div
              key={notif._id}
              className={`notif-card ${notif.read ? 'read' : 'unread'} slide-up-stagger`}
              style={{ '--stagger-idx': index }}
              onClick={() => !notif.read && handleMarkRead(notif._id)}
            >
              <div className="notif-icon-wrap">{getIcon(notif.type)}</div>
              <div className="notif-body">
                <div className="notif-top">
                  <strong>{notif.title}</strong>
                  <span className="notif-time">{notif.time}</span>
                </div>
                <p>{notif.message}</p>
              </div>
              <button className="dismiss-btn" onClick={(e) => { e.stopPropagation(); handleDismiss(notif._id); }}>
                <X size={16} />
              </button>
              {!notif.read && <div className="unread-dot"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

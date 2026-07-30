import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../services/api';
import { Bell, Sun, Moon, RefreshCw, X } from 'lucide-react';
import './Topbar.css';

export default function Topbar() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
      setUnreadCount(list.length);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  const triggerRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setTimeout(() => setRefreshing(false), 800);
  };

  const formatTime = (timeStr) => {
    try {
      const date = new Date(timeStr);
      const diffMs = new Date() - date;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  if (!user) return null;

  return (
    <div className="topbar">
      <div className="topbar-actions">
        {/* Theme Toggle Button */}
        <button 
          className="btn-theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications Trigger */}
        <div className="notification-wrapper">
          <button 
            className={`btn-notification ${showNotifications ? 'active' : ''}`} 
            onClick={toggleNotifications}
            aria-label="View notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <div className="notification-tray glass-panel animate-fade-in">
              <div className="tray-header">
                <h3>Notifications</h3>
                <div className="tray-actions">
                  <button className={`btn-refresh ${refreshing ? 'spinning' : ''}`} onClick={triggerRefresh}>
                    <RefreshCw size={14} />
                  </button>
                  <button onClick={() => setShowNotifications(false)}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <div className="tray-body">
                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <p>No recent notifications</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="notification-item">
                      <div className="notification-title">
                        <h4>{n.title}</h4>
                        <span className="notification-time">{formatTime(n.timestamp)}</span>
                      </div>
                      <p>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

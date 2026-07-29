import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';
import './Sidebar.css';
import { 
  LayoutDashboard, 
  Columns, 
  FolderGit2, 
  LogOut, 
  Bell, 
  ChevronDown, 
  ChevronUp, 
  User, 
  RefreshCw,
  X,
  Users,
  ArrowLeft,
  Bug
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, activeProject, projects, selectProject } = useAuth();
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

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

  const handleProjectSwitch = (proj) => {
    selectProject(proj);
    setShowProjectDropdown(false);
    navigate('/board');
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

  const isAdmin = user && user.role === 'ADMIN';

  return (
    <aside className="sidebar glass-panel">
      {/* Sidebar Header: Brand & Project Switcher */}
      <div className="sidebar-header">
        {activeProject ? (
          <div className="project-header-row animate-fade-in">
            <button 
              className="btn-back-global" 
              onClick={() => {
                selectProject(null);
                navigate(isAdmin ? '/' : '/projects');
              }}
              title="Back to Global Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            
            <div className="project-selector" style={{ flex: 1 }}>
              <button 
                className="project-trigger" 
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              >
                <div className="project-info">
                  <span className="project-key-badge">{activeProject.key}</span>
                  <span className="project-name-text">{activeProject.name}</span>
                </div>
                {showProjectDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showProjectDropdown && (
                <div className="project-dropdown glass-panel">
                  <div className="dropdown-label">Switch Project</div>
                  {projects.map(p => (
                    <button 
                      key={p.id}
                      className={`project-dropdown-item ${p.id === activeProject.id ? 'active' : ''}`}
                      onClick={() => handleProjectSwitch(p)}
                    >
                      <span className="project-key-badge">{p.key}</span>
                      <span className="project-name-text">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="brand">
            <div className="brand-logo">BF</div>
            <h2>BugFlow</h2>
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar-nav">
        {/* PROJECT CONTEXT LINKS */}
        {activeProject ? (
          <>
            <div className="nav-section-label">Active Workspace</div>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink 
              to="/board" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Columns size={18} />
              <span>Kanban Board</span>
            </NavLink>

            <NavLink 
              to="/board?report=true" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Bug size={18} />
              <span>Report Bug</span>
            </NavLink>
          </>
        ) : (
          /* GLOBAL CONTEXT LINKS */
          <>
            <div className="nav-section-label">Global Center</div>
            {isAdmin && (
              <>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink 
                  to="/users" 
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Users size={18} />
                  <span>User Management</span>
                </NavLink>
              </>
            )}

            <NavLink 
              to="/projects" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FolderGit2 size={18} />
              <span>Projects</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Sidebar Footer: User details and Notifications */}
      <div className="sidebar-footer">
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

        {/* User Card */}
        {user && (
          <div className="user-card">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-details">
              <h4>{user.username}</h4>
              <span className="user-role-tag">{user.role.replace('_', ' ')}</span>
            </div>
            <button className="btn-logout" onClick={logout} title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

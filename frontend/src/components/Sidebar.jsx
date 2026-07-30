import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import './Sidebar.css';
import { 
  LayoutDashboard, 
  Columns, 
  FolderGit2, 
  LogOut, 
  User, 
  Users,
  ArrowLeft,
  Bug
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, activeProject, projects, selectProject } = useAuth();
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleProjectSwitch = (proj) => {
    selectProject(proj);
    setShowProjectDropdown(false);
    navigate('/board');
  };

  const isAdmin = user && user.role === 'ADMIN';

  return (
    <aside className="sidebar glass-panel animate-fade-in">
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
            
            <div className="project-selector">
              <button 
                className="project-trigger" 
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                title={`Active Project: ${activeProject.name}`}
              >
                <span className="project-key-badge">{activeProject.key}</span>
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
            <img src="/favicon.png" className="brand-logo" alt="BugFlow" title="BugFlow" />
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar-nav">
        {activeProject ? (
          <>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title="Dashboard"
            >
              <LayoutDashboard size={20} />
            </NavLink>

            <NavLink 
              to="/board" 
              className={({ isActive }) => `nav-item ${isActive && !location.search.includes('report=true') ? 'active' : ''}`}
              title="Kanban Board"
            >
              <Columns size={20} />
            </NavLink>

            <NavLink 
              to="/board?report=true" 
              className={({ isActive }) => `nav-item ${isActive && location.search.includes('report=true') ? 'active' : ''}`}
              title="Report Bug"
            >
              <Bug size={20} />
            </NavLink>
          </>
        ) : (
          <>
            {isAdmin && (
              <>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  title="Dashboard"
                >
                  <LayoutDashboard size={20} />
                </NavLink>

                <NavLink 
                  to="/users" 
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  title="User Management"
                >
                  <Users size={20} />
                </NavLink>
              </>
            )}

            <NavLink 
              to="/projects" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title="Projects"
            >
              <FolderGit2 size={20} />
            </NavLink>
          </>
        )}
      </nav>

      {/* Sidebar Footer: User details */}
      <div className="sidebar-footer">
        {user && (
          <div className="user-card-collapsed">
            <div className="user-avatar" title={`${user.username} (${user.role.replace('_', ' ')})`}>
              <User size={18} />
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

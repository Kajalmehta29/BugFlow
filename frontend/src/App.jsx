import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import TopologyBackground from './components/TopologyBackground';
import Login from './pages/Login';
import GlobalDashboard from './pages/GlobalDashboard';
import UserManagement from './pages/UserManagement';
import ProjectsList from './pages/ProjectsList';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import './App.css';
import { api } from './services/api';

// Create Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Protected Route Guard Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  console.log(`[Security Auth Check] Path: ${location.pathname}, Session User:`, user);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// Main App Layout Wrapper
const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Show the sidebar on all pages except the login screen
  const showSidebar = location.pathname !== '/login';
  const defaultRedirect = user?.role === 'ADMIN' ? '/' : '/projects';

  return (
    <div className="app-container">
      <TopologyBackground />
      {showSidebar && <Sidebar />}
      <div className={showSidebar ? "main-content" : "main-content full-width"}>
        {showSidebar && <Topbar />}
        <Routes>
          <Route path="/" element={<ProtectedRoute><GlobalDashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/board" element={<ProtectedRoute><Kanban /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [activeProject, setActiveProject] = useState(() => {
    const saved = localStorage.getItem('activeProject');
    return saved ? JSON.parse(saved) : null;
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync token changes
  useEffect(() => {
    const handleAuthFailed = () => {
      logout();
    };
    window.addEventListener('auth-failed', handleAuthFailed);
    return () => window.removeEventListener('auth-failed', handleAuthFailed);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await api.login(username, password);
      localStorage.setItem('token', data.token);
      const userDetails = { id: data.id, username: data.username, email: data.email, role: data.role, available: data.available };
      localStorage.setItem('user', JSON.stringify(userDetails));

      setToken(data.token);
      setUser(userDetails);
      
      // Load user projects
      const userProjects = await api.getProjects();
      setProjects(userProjects);
      
      if (userProjects.length > 0) {
        selectProject(userProjects[0]);
      } else {
        localStorage.removeItem('activeProject');
        setActiveProject(null);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUserAvailability = (available) => {
    if (user) {
      const updated = { ...user, available };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeProject');
    setUser(null);
    setToken(null);
    setActiveProject(null);
    setProjects([]);
  };

  const selectProject = (project) => {
    localStorage.setItem('activeProject', JSON.stringify(project));
    setActiveProject(project);
  };

  const refreshProjects = async () => {
    if (!token) return;
    try {
      const list = await api.getProjects();
      setProjects(list);
      
      // Update selected project if it still exists
      if (activeProject) {
        const matching = list.find(p => p.id === activeProject.id);
        if (matching) {
          selectProject(matching);
        } else {
          localStorage.removeItem('activeProject');
          setActiveProject(null);
        }
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  useEffect(() => {
    if (user && token) {
      refreshProjects();
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      activeProject,
      projects,
      login,
      logout,
      selectProject,
      refreshProjects,
      updateUserAvailability,
      loading
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

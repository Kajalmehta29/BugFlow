import React, { useState } from 'react';
import { useAuth } from '../App';
import { api } from '../services/api';
import './Login.css';
import { Shield, Lock, User, Mail, PlusCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  
  // Feedbacks
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isRegister) {
      // Sign Up Flow
      try {
        const response = await api.register(username, email, password, role);
        setSuccess('Account created successfully! Please sign in.');
        setIsRegister(false);
        setPassword(''); // clear password field
      } catch (err) {
        setError(err.message || 'Registration failed. Please check your parameters.');
      } finally {
        setLoading(false);
      }
    } else {
      // Sign In Flow
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials');
        setLoading(false);
      }
      // Success auto-redirects via App.jsx Route state
    }
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccess('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="login-page">
      {/* Dynamic background glows */}
      <div className="glow-1"></div>
      <div className="glow-2"></div>

      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <div className="brand-badge">BF</div>
          <h2>{isRegister ? 'Create Account' : 'Welcome to BugFlow'}</h2>
          <p>{isRegister ? 'Register your developers and start tracking' : 'Enter your credentials to enter the dashboard'}</p>
        </div>

        {error && <div className="feedback-box error-box">{error}</div>}
        {success && <div className="feedback-box success-box">{success}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input 
                id="username"
                type="text" 
                placeholder="e.g. johndoe" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input 
                  id="email"
                  type="email" 
                  placeholder="e.g. john@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="role">Assign Role</label>
              <div className="input-with-icon">
                <Shield size={16} className="input-icon" />
                <select 
                  id="role"
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="DEVELOPER">Developer (Works on Assigned Bugs)</option>
                  <option value="TESTER">Tester (Reports and Verifies Bugs)</option>
                  <option value="PROJECT_MANAGER">Project Manager (Sprints and Allocation)</option>
                  <option value="ADMIN">Admin (Core Administration)</option>
                </select>
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-submit" type="submit" disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Register User' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <button className="btn-toggle-mode" onClick={handleToggleMode}>
            {isRegister ? 'Already have an account? Sign In' : 'Create new workspace account'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';
import './GlobalDashboard.css';
import { 
  FolderKanban, 
  Plus, 
  UserCheck, 
  Trash2, 
  Edit2, 
  ArrowRight, 
  X, 
  Folder, 
  Users, 
  Bug, 
  ShieldAlert,
  Loader2,
  Check
} from 'lucide-react';

const USER_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'TESTER'];

export default function GlobalDashboard() {
  const { user, projects, selectProject, refreshProjects } = useAuth();
  const navigate = useNavigate();

  // Dashboard Stats
  const [globalStats, setGlobalStats] = useState({ totalProjects: 0, totalUsers: 0, totalBugs: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Users Management
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Project Modals
  const [showCreateProjModal, setShowCreateProjModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projKey, setProjKey] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projError, setProjError] = useState('');

  // Project Members Modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberError, setMemberError] = useState('');

  // User Administration Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('DEVELOPER');
  const [createUserError, setCreateUserError] = useState('');

  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editUserError, setEditUserError] = useState('');

  const loadGlobalStats = async () => {
    try {
      const stats = await api.getGlobalStats();
      setGlobalStats(stats);
    } catch (err) {
      console.error("Failed to load global statistics", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const list = await api.getUsers();
      setAllUsers(list);
    } catch (err) {
      console.error("Failed to load users list", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/projects');
      return;
    }
    loadGlobalStats();
    loadAllUsers();
  }, [user, navigate]);

  const handleSelectProject = (proj) => {
    selectProject(proj);
    navigate('/dashboard');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setProjError('');
    try {
      await api.createProject(projName, projKey.toUpperCase(), projDesc);
      setProjName('');
      setProjKey('');
      setProjDesc('');
      setShowCreateProjModal(false);
      await refreshProjects();
      await loadGlobalStats();
    } catch (err) {
      setProjError(err.message || 'Failed to create project');
    }
  };

  const openMembersModal = (proj) => {
    setSelectedProject(proj);
    setMemberError('');
    setSelectedMemberId('');
    setShowMembersModal(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    setMemberError('');
    try {
      const updatedProj = await api.addProjectMember(selectedProject.id, selectedMemberId);
      setSelectedProject(updatedProj);
      setSelectedMemberId('');
      await refreshProjects();
    } catch (err) {
      setMemberError(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    setMemberError('');
    try {
      const updatedProj = await api.removeProjectMember(selectedProject.id, userId);
      setSelectedProject(updatedProj);
      await refreshProjects();
    } catch (err) {
      setMemberError(err.message || 'Failed to remove member');
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    try {
      await api.register(newUsername, newEmail, newPassword, newRole);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('DEVELOPER');
      setShowCreateUserModal(false);
      await loadAllUsers();
      await loadGlobalStats();
    } catch (err) {
      setCreateUserError(err.message || 'Failed to register employee');
    }
  };

  const openEditUserModal = (emp) => {
    setEditingUser(emp);
    setEditUsername(emp.username);
    setEditEmail(emp.email);
    setEditRole(emp.role);
    setEditUserError('');
    setShowEditUserModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditUserError('');
    try {
      await api.updateUser(editingUser.id, editUsername, editEmail, editRole);
      setShowEditUserModal(false);
      setEditingUser(null);
      await loadAllUsers();
    } catch (err) {
      setEditUserError(err.message || 'Failed to update employee details');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === user.id) {
      alert("Error: You cannot delete your own account!");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this employee?")) {
      return;
    }
    try {
      await api.deleteUser(userId);
      await loadAllUsers();
      await loadGlobalStats();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const isAdmin = user && user.role === 'ADMIN';
  const isPMorAdmin = user && (user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER');

  const checkProjectPM = (proj) => {
    if (!user) return false;
    return user.role === 'ADMIN' || proj.manager.id === user.id;
  };

  return (
    <div className="global-dashboard-page">
      <div className="page-header animate-fade-in">
        <div className="page-title">
          <h1>System Overview</h1>
          <p>Global project statuses and employee administration</p>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="global-stats-grid animate-fade-in">
        <div className="global-stat-card glass-panel border-glow-blue">
          <div className="stat-icon icon-blue">
            <Folder size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Projects</span>
            <h3>{loadingStats ? '...' : globalStats.totalProjects}</h3>
          </div>
        </div>

        <div className="global-stat-card glass-panel border-glow-purple">
          <div className="stat-icon icon-purple">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Employees Active</span>
            <h3>{loadingStats ? '...' : globalStats.totalUsers}</h3>
          </div>
        </div>

        <div className="global-stat-card glass-panel border-glow-red">
          <div className="stat-icon icon-red">
            <Bug size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Reported Bugs</span>
            <h3>{loadingStats ? '...' : globalStats.totalBugs}</h3>
          </div>
        </div>
      </div>

      {/* PROJECTS SECTION */}
      <div className="global-dashboard-section animate-fade-in">
        <div className="section-title-bar">
          <h2>Active Projects ({projects.length})</h2>
          {isPMorAdmin && (
            <button className="btn btn-primary btn-small" onClick={() => setShowCreateProjModal(true)}>
              <Plus size={16} />
              <span>New Project</span>
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="empty-section glass-panel">
            <FolderKanban size={36} className="empty-icon" />
            <p>No projects registered in the workspace yet.</p>
          </div>
        ) : (
          <div className="global-projects-grid">
            {projects.map((proj) => (
              <div key={proj.id} className="global-project-card glass-panel glass-panel-hover" onClick={() => handleSelectProject(proj)}>
                <div className="proj-card-top">
                  <span className="proj-key">{proj.key}</span>
                  {checkProjectPM(proj) && (
                    <button 
                      className="btn-members-trigger" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openMembersModal(proj);
                      }}
                      title="Manage Members"
                    >
                      <UserCheck size={16} />
                    </button>
                  )}
                </div>

                <div className="proj-card-main">
                  <h3>{proj.name}</h3>
                  <p className="proj-desc">{proj.description || 'No description provided.'}</p>
                </div>

                <div className="proj-card-bottom">
                  <div className="proj-metadata">
                    <span className="meta-lbl">PM:</span>
                    <span className="meta-val">{proj.manager.username}</span>
                  </div>
                  <div className="proj-metadata">
                    <span className="meta-lbl">Members:</span>
                    <span className="meta-val">{proj.members ? proj.members.length : 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showCreateProjModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="btn-close" onClick={() => setShowCreateProjModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            {projError && <div className="feedback-box error-box">{projError}</div>}
            
            <form onSubmit={handleCreateProject} className="modal-form">
              <div className="form-row">
                <div className="form-group flex-2">
                  <label htmlFor="proj-name">Project Name</label>
                  <input 
                    id="proj-name"
                    type="text" 
                    placeholder="e.g. Sales Portal" 
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="proj-key">Key</label>
                  <input 
                    id="proj-key"
                    type="text" 
                    placeholder="e.g. PORT" 
                    value={projKey}
                    onChange={(e) => setProjKey(e.target.value.toUpperCase())}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="proj-desc">Description</label>
                <textarea 
                  id="proj-desc"
                  placeholder="Describe the project goals and scope..." 
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateProjModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT MEMBERS MODAL */}
      {showMembersModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Members: {selectedProject.name}</h2>
              <button className="btn-close" onClick={() => setShowMembersModal(false)}>
                <X size={20} />
              </button>
            </div>

            {memberError && <div className="feedback-box error-box">{memberError}</div>}

            <form onSubmit={handleAddMember} className="member-add-form">
              <div className="form-group">
                <label htmlFor="select-member">Add Developer/Tester</label>
                <div className="form-row">
                  <select 
                    id="select-member"
                    value={selectedMemberId} 
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Employee --</option>
                    {allUsers
                      .filter(u => selectedProject.members ? !selectedProject.members.some(m => m.id === u.id) : true)
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.role.replace('_', ' ')})
                        </option>
                      ))
                    }
                  </select>
                  <button type="submit" className="btn btn-primary" disabled={!selectedMemberId}>
                    Add Member
                  </button>
                </div>
              </div>
            </form>

            <div className="members-list-wrapper">
              <label>Current Members ({selectedProject.members ? selectedProject.members.length : 0})</label>
              <div className="members-list">
                {selectedProject.members && selectedProject.members.map(m => {
                  const isManager = selectedProject.manager.id === m.id;
                  return (
                    <div key={m.id} className="member-list-item">
                      <div className="member-card-details">
                        <span className="member-name">{m.username}</span>
                        <span className="member-role">{m.role.replace('_', ' ')}</span>
                        {isManager && <span className="manager-tag">Manager</span>}
                      </div>
                      {!isManager && (
                        <button 
                          className="btn-remove-member"
                          onClick={() => handleRemoveMember(m.id)}
                          title="Remove Member"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowMembersModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER USER MODAL */}
      {showCreateUserModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Register New Employee</h2>
              <button className="btn-close" onClick={() => setShowCreateUserModal(false)}>
                <X size={20} />
              </button>
            </div>

            {createUserError && <div className="feedback-box error-box">{createUserError}</div>}

            <form onSubmit={handleRegisterUser} className="modal-form">
              <div className="form-group">
                <label htmlFor="reg-username">Username</label>
                <input 
                  id="reg-username"
                  type="text" 
                  placeholder="e.g. janesmith"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email Address</label>
                <input 
                  id="reg-email"
                  type="email" 
                  placeholder="e.g. jane@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-pass">Temporary Password</label>
                <input 
                  id="reg-pass"
                  type="password" 
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-role">Role</label>
                <select 
                  id="reg-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  required
                >
                  <option value="DEVELOPER">Developer (Works on Bugs)</option>
                  <option value="TESTER">Tester (Reports and Verifies Bugs)</option>
                  <option value="PROJECT_MANAGER">Project Manager (Sprints and Allocations)</option>
                  <option value="ADMIN">System Admin (Full Access)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  Register
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER DETAILS MODAL */}
      {showEditUserModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Modify Employee: {editingUser.username}</h2>
              <button className="btn-close" onClick={() => setShowEditUserModal(false)}>
                <X size={20} />
              </button>
            </div>

            {editUserError && <div className="feedback-box error-box">{editUserError}</div>}

            <form onSubmit={handleEditUser} className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-emp-username">Username</label>
                <input 
                  id="edit-emp-username"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-emp-email">Email Address</label>
                <input 
                  id="edit-emp-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-emp-role">Role</label>
                <select 
                  id="edit-emp-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  required
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="TESTER">Tester</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                  <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

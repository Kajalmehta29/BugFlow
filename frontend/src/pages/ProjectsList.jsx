import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';
import './ProjectsList.css';
import { FolderKanban, Plus, UserCheck, Trash2, X, ArrowRight } from 'lucide-react';

export default function ProjectsList() {
  const { user, projects, selectProject, refreshProjects } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Project creation fields
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState('');

  // Member management states
  const [selectedProject, setSelectedProject] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberError, setMemberError] = useState('');

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.createProject(name, key.toUpperCase(), description);
      setName('');
      setKey('');
      setDescription('');
      setShowCreateModal(false);
      await refreshProjects();
    } catch (err) {
      setCreateError(err.message || 'Failed to create project');
    }
  };

  const loadAllUsers = async () => {
    try {
      const usersList = await api.getUsers();
      setAllUsers(usersList);
    } catch (err) {
      console.error("Failed to load users list", err);
    }
  };

  const openMembersModal = (proj) => {
    setSelectedProject(proj);
    setMemberError('');
    setSelectedUserId('');
    setShowMembersModal(true);
    loadAllUsers();
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setMemberError('');
    try {
      const updatedProj = await api.addProjectMember(selectedProject.id, selectedUserId);
      setSelectedProject(updatedProj);
      setSelectedUserId('');
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

  const handleSelectProject = (proj) => {
    selectProject(proj);
    navigate('/dashboard');
  };

  const isPMorAdmin = (proj) => {
    if (!user) return false;
    return user.role === 'ADMIN' || proj.manager.id === user.id;
  };

  const canCreate = user && (user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER');

  return (
    <div className="projects-list-page animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Projects Directory</h1>
          <p>{user?.role === 'ADMIN' ? 'All system projects' : 'Projects assigned to you'}</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-projects glass-panel">
          <FolderKanban size={48} className="empty-icon" />
          <h3>No Projects Found</h3>
          <p>You aren't associated with any projects yet. {canCreate ? 'Click the button above to create one!' : 'Ask an Administrator to assign you to a project.'}</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((proj) => (
            <div key={proj.id} className="project-card glass-panel glass-panel-hover" onClick={() => handleSelectProject(proj)}>
              <div className="project-card-header">
                <span className="project-card-key">{proj.key}</span>
                {isPMorAdmin(proj) && (
                  <button 
                    className="btn-manage-members" 
                    onClick={(e) => {
                      e.stopPropagation();
                      openMembersModal(proj);
                    }}
                    title="Manage Project Members"
                  >
                    <UserCheck size={18} />
                  </button>
                )}
              </div>

              <div className="project-card-body">
                <h3>{proj.name}</h3>
                <p className="project-desc">{proj.description || 'No description provided.'}</p>
              </div>

              <div className="project-card-footer">
                <div className="manager-info">
                  <span className="info-label">PM:</span>
                  <span className="info-val">{proj.manager.username}</span>
                </div>
                <div className="members-info">
                  <span className="info-label">Members:</span>
                  <span className="info-val">{proj.members ? proj.members.length : 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            {createError && <div className="feedback-box error-box">{createError}</div>}
            
            <form onSubmit={handleCreateProject} className="modal-form">
              <div className="form-row">
                <div className="form-group flex-2">
                  <label htmlFor="proj-name">Project Name</label>
                  <input 
                    id="proj-name"
                    type="text" 
                    placeholder="e.g. Customer Portal" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="proj-key">Key</label>
                  <input 
                    id="proj-key"
                    type="text" 
                    placeholder="e.g. PORT" 
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="proj-desc">Description</label>
                <textarea 
                  id="proj-desc"
                  placeholder="Describe the project scope and goals..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}
      {showMembersModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Project Members: {selectedProject.name}</h2>
              <button className="btn-close" onClick={() => setShowMembersModal(false)}>
                <X size={20} />
              </button>
            </div>

            {memberError && <div className="feedback-box error-box">{memberError}</div>}

            <form onSubmit={handleAddMember} className="member-add-form">
              <div className="form-group">
                <label htmlFor="select-member">Add Developer or Tester</label>
                <div className="form-row">
                  <select 
                    id="select-member"
                    value={selectedUserId} 
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {allUsers
                      .filter(u => selectedProject.members ? !selectedProject.members.some(m => m.id === u.id) : true)
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.role.replace('_', ' ')})
                        </option>
                      ))
                    }
                  </select>
                  <button type="submit" className="btn btn-primary" disabled={!selectedUserId}>
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
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowMembersModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

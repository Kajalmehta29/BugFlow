import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';
import './UserManagement.css';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowRight, 
  X, 
  Loader2, 
  Check, 
  ShieldAlert 
} from 'lucide-react';

export default function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

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
    loadAllUsers();
  }, [user, navigate]);

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
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const isAdmin = user && user.role === 'ADMIN';

  return (
    <div className="user-management-page animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Employee Directory</h1>
          <p>Register, modify, and delete employee system privileges</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreateUserModal(true)}>
            <Plus size={18} />
            <span>Register Employee</span>
          </button>
        )}
      </div>

      {loadingUsers ? (
        <div className="table-loader-box">
          <Loader2 className="spinning" size={32} />
          <p>Syncing employee directory...</p>
        </div>
      ) : (
        <div className="table-wrapper glass-panel">
          <table className="employee-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email Address</th>
                <th>System Role</th>
                {isAdmin && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {allUsers.map((emp) => (
                <tr key={emp.id} className="employee-row">
                  <td><span className="emp-id">#{emp.id}</span></td>
                  <td className="emp-username">
                    {emp.username} {emp.id === user.id && <span className="current-user-tag">(You)</span>}
                  </td>
                  <td className="emp-email">{emp.email}</td>
                  <td>
                    <span className={`emp-role-tag role-${emp.role.toLowerCase()}`}>
                      {emp.role.replace('_', ' ')}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="text-right">
                      <div className="employee-actions">
                        <button 
                          className="btn-table-action action-edit" 
                          onClick={() => openEditUserModal(emp)}
                          title="Edit Employee"
                        >
                          <Edit2 size={14} />
                        </button>
                        {emp.id !== user.id && (
                          <button 
                            className="btn-table-action action-delete" 
                            onClick={() => handleDeleteUser(emp.id)}
                            title="Delete Employee"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
                  Register Employee
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

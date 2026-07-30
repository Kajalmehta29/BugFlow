import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../services/api';
import './Dashboard.css';
import { 
  TrendingUp, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  Calendar, 
  Play, 
  CheckSquare, 
  PlusCircle, 
  Loader2,
  ChevronRight,
  FolderKanban,
  ExternalLink,
  Link as LinkIcon,
  Trash2,
  X
} from 'lucide-react';

export default function Dashboard() {
  const { user, activeProject, refreshProjects } = useAuth();
  const [stats, setStats] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sprintError, setSprintError] = useState('');

  // Project Settings & Documentation states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsDomain, setSettingsDomain] = useState('');
  const [settingsLinks, setSettingsLinks] = useState([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleOpenSettingsModal = () => {
    setSettingsName(activeProject.name);
    setSettingsDesc(activeProject.description || '');
    setSettingsDomain(activeProject.domainUrl || '');
    
    let links = [];
    try {
      links = JSON.parse(activeProject.resourceLinks || '[]');
    } catch (e) {
      links = [];
    }
    setSettingsLinks(links);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setSettingsError('');
    setShowSettingsModal(true);
  };

  const handleAddLinkItem = () => {
    if (!newLinkTitle || !newLinkUrl) return;
    setSettingsLinks([...settingsLinks, { title: newLinkTitle, url: newLinkUrl }]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveLinkItem = (index) => {
    setSettingsLinks(settingsLinks.filter((_, i) => i !== index));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    try {
      await api.updateProject(activeProject.id, {
        name: settingsName,
        description: settingsDesc,
        domainUrl: settingsDomain,
        resourceLinks: JSON.stringify(settingsLinks)
      });
      await refreshProjects();
      setShowSettingsModal(false);
    } catch (err) {
      setSettingsError(err.message || 'Failed to update project settings');
    }
  };

  const loadDashboardData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const statsData = await api.getDashboardStats(activeProject.id);
      setStats(statsData);
      const sprintsData = await api.getSprints(activeProject.id);
      setSprints(sprintsData);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeProject]);

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    setSprintError('');
    try {
      await api.createSprint(activeProject.id, sprintName, startDate || null, endDate || null);
      setSprintName('');
      setStartDate('');
      setEndDate('');
      setShowCreateSprint(false);
      await loadDashboardData();
    } catch (err) {
      setSprintError(err.message || 'Failed to create sprint');
    }
  };

  const handleUpdateSprintStatus = async (sprintId, status) => {
    try {
      await api.updateSprintStatus(sprintId, status);
      await loadDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update sprint');
    }
  };

  if (!activeProject) {
    return (
      <div className="empty-dashboard glass-panel animate-fade-in">
        <h2>No Active Project</h2>
        <p>Please select a project from the project list to view statistics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="spinning" size={48} />
        <p>Calculating statistics...</p>
      </div>
    );
  }

  const activeSprint = sprints.find(s => s.status === 'ACTIVE');
  const plannedSprints = sprints.filter(s => s.status === 'PLANNED');
  const completedSprints = sprints.filter(s => s.status === 'COMPLETED');

  const openCount = stats ? (stats.bugsByStatus['OPEN'] || 0) + (stats.bugsByStatus['ASSIGNED'] || 0) + (stats.bugsByStatus['IN_PROGRESS'] || 0) + (stats.bugsByStatus['CODE_REVIEW'] || 0) + (stats.bugsByStatus['TESTING'] || 0) : 0;
  const resolvedCount = stats ? (stats.bugsByStatus['RESOLVED'] || 0) + (stats.bugsByStatus['CLOSED'] || 0) : 0;

  const isPMorAdmin = user && (user.role === 'ADMIN' || activeProject.manager.id === user.id);

  // SVG Priority Chart parameters
  const maxPriorityCount = stats ? Math.max(...Object.values(stats.bugsByPriority), 1) : 1;

  // SVG Workload parameters
  const maxWorkloadCount = stats && stats.devWorkload.length > 0 
    ? Math.max(...stats.devWorkload.map(w => w.bugCount), 1) 
    : 1;

  let linksList = [];
  try {
    linksList = JSON.parse(activeProject.resourceLinks || '[]');
  } catch (e) {
    linksList = [];
  }

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>{activeProject.name} Dashboard</h1>
            <span className={`project-status-tag status-${(activeProject.status || 'ACTIVE').toLowerCase()}`} style={{ verticalAlign: 'middle' }}>
              {activeProject.status || 'ACTIVE'}
            </span>
          </div>
          <p>Key progress statistics and resolution timelines</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isPMorAdmin && (
            <button 
              className="btn btn-secondary"
              onClick={async () => {
                const newStatus = activeProject.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
                const actionWord = newStatus === 'COMPLETED' ? 'complete and close' : 'reopen';
                if (window.confirm(`Are you sure you want to ${actionWord} this project?`)) {
                  try {
                    await api.updateProjectStatus(activeProject.id, newStatus);
                    await refreshProjects();
                  } catch (err) {
                    alert(err.message || 'Failed to update project status');
                  }
                }
              }}
            >
              {activeProject.status === 'COMPLETED' ? 'Reopen Project' : 'Complete Project'}
            </button>
          )}
        </div>
      </div>

      {/* METRICS CARDS GRID */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel metric-blue">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Reported Bugs</span>
            <h3>{stats ? stats.totalBugs : 0}</h3>
          </div>
        </div>

        <div className="metric-card glass-panel metric-purple">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Avg Resolution Time</span>
            <h3>{stats ? stats.averageResolutionTimeHours : 0} <span className="unit">hrs</span></h3>
          </div>
        </div>

        <div className="metric-card glass-panel metric-amber">
          <div className="metric-icon">
            <AlertOctagon size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Active Open Bugs</span>
            <h3>{openCount}</h3>
          </div>
        </div>

        <div className="metric-card glass-panel metric-green">
          <div className="metric-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Resolved / Closed</span>
            <h3>{resolvedCount}</h3>
          </div>
        </div>
      </div>

      {/* SPRINT MANAGEMENT & RESOURCES SECTION */}
      <div className="dashboard-double-section">
        {/* SPRINT MANAGEMENT CARD */}
        <div className="dashboard-section sprint-section glass-panel" style={{ marginBottom: 0 }}>
          <div className="section-header">
            <div className="section-header-title">
              <Calendar size={20} className="section-icon" />
              <h2>Sprint Management</h2>
            </div>
            {isPMorAdmin && !showCreateSprint && (
              <button className="btn btn-secondary" onClick={() => setShowCreateSprint(true)}>
                <PlusCircle size={16} />
                <span>Create Sprint</span>
              </button>
            )}
          </div>

          {showCreateSprint && (
            <form onSubmit={handleCreateSprint} className="sprint-create-form animate-fade-in">
              {sprintError && <div className="feedback-box error-box">{sprintError}</div>}
              <div className="form-row">
                <div className="form-group flex-2">
                  <label htmlFor="sprint-name">Sprint Name</label>
                  <input 
                    id="sprint-name"
                    type="text" 
                    placeholder="e.g. Sprint 1 - Core Auth" 
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="sprint-start">Start Date</label>
                  <input 
                    id="sprint-start"
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="sprint-end">End Date</label>
                  <input 
                    id="sprint-end"
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="sprint-form-actions">
                <button type="button" className="btn btn-text" onClick={() => setShowCreateSprint(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Sprint</button>
              </div>
            </form>
          )}

          {activeSprint ? (
            <div className="sprint-info-box active-sprint">
              <div className="sprint-details">
                <span className="sprint-status-badge active-badge">Active</span>
                <h3>{activeSprint.name}</h3>
                <p className="sprint-dates">
                  {activeSprint.startDate ? new Date(activeSprint.startDate).toLocaleDateString() : 'No start date'} - {activeSprint.endDate ? new Date(activeSprint.endDate).toLocaleDateString() : 'No end date'}
                </p>
              </div>
              {isPMorAdmin && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleUpdateSprintStatus(activeSprint.id, 'COMPLETED')}
                >
                  <CheckSquare size={16} />
                  <span>Complete Sprint</span>
                </button>
              )}
            </div>
          ) : (
            <div className="sprint-info-box empty-sprint">
              <p>No active sprint currently running.</p>
            </div>
          )}

          {/* Planned sprints list */}
          {plannedSprints.length > 0 && (
            <div className="planned-sprints-list">
              <h4>Planned Sprints ({plannedSprints.length})</h4>
              <div className="planned-grid">
                {plannedSprints.map(s => (
                  <div key={s.id} className="planned-item">
                    <div className="planned-details">
                      <h5>{s.name}</h5>
                      <span className="planned-dates">
                        {s.startDate ? new Date(s.startDate).toLocaleDateString() : 'No date'} - {s.endDate ? new Date(s.endDate).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                    {isPMorAdmin && !activeSprint && (
                      <button 
                        className="btn btn-text btn-start-sprint" 
                        onClick={() => handleUpdateSprintStatus(s.id, 'ACTIVE')}
                        title="Start Sprint"
                      >
                        <Play size={14} />
                        <span>Start</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed sprints list */}
          {completedSprints.length > 0 && (
            <div className="completed-sprints-list">
              <h4>Sprint History / Completed Sprints ({completedSprints.length})</h4>
              <div className="completed-grid">
                {completedSprints.map(s => (
                  <div key={s.id} className="completed-item">
                    <div className="completed-details">
                      <h5>{s.name}</h5>
                      <span className="completed-dates">
                        {s.startDate ? new Date(s.startDate).toLocaleDateString() : 'No date'} - {s.endDate ? new Date(s.endDate).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                    <span className="sprint-status-badge completed-badge">Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PROJECT INFO & RESOURCES CARD */}
        <div className="dashboard-section resources-section glass-panel">
          <div className="section-header">
            <div className="section-header-title">
              <FolderKanban size={20} className="section-icon" />
              <h2>Project Info & Resources</h2>
            </div>
            {isPMorAdmin && (
              <button 
                className="btn btn-secondary btn-small" 
                onClick={handleOpenSettingsModal}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Edit Settings
              </button>
            )}
          </div>

          <div className="resources-body">
            <div className="resource-block">
              <h4>About the Project</h4>
              <p className="project-detail-desc" style={{ display: 'block' }}>
                {activeProject.description && activeProject.description.length > 120 
                  ? `${activeProject.description.substring(0, 120)}... ` 
                  : (activeProject.description || 'No description provided.')}
                {activeProject.description && activeProject.description.length > 120 && (
                  <button 
                    type="button"
                    onClick={() => setShowInfoModal(true)} 
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '0', fontWeight: 600, fontSize: '13px', display: 'inline' }}
                  >
                    Read More
                  </button>
                )}
              </p>
            </div>

            <div className="resource-block">
              <h4>Live Domain</h4>
              {activeProject.domainUrl ? (
                <a 
                  href={activeProject.domainUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="live-domain-link"
                >
                  <ExternalLink size={14} />
                  <span>{activeProject.domainUrl}</span>
                </a>
              ) : (
                <span className="no-domain-text">No live domain linked.</span>
              )}
            </div>

            <div className="resource-block">
              <h4>Quick Links & Documentation</h4>
              {linksList.length === 0 ? (
                <span className="no-links-text">No resource links added yet.</span>
              ) : (
                <div className="quick-links-grid">
                  {linksList.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="quick-link-item"
                    >
                      <LinkIcon size={14} style={{ color: 'var(--color-primary)' }} />
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="charts-grid">
        {/* Status Distribution Custom SVG Chart */}
        <div className="chart-card glass-panel flex-column">
          <h3>Workflow Status Distribution</h3>
          <p className="chart-subtitle">Proportion of bug tickets by current lifecycle step</p>
          
          <div className="status-bars-list">
            {stats && Object.entries(stats.bugsByStatus).map(([status, count]) => {
              const percentage = stats.totalBugs > 0 ? (count / stats.totalBugs) * 100 : 0;
              let barColor = 'var(--text-muted)';
              if (status === 'OPEN') barColor = 'var(--text-primary)';
              if (status === 'ASSIGNED') barColor = 'var(--color-primary)';
              if (status === 'IN_PROGRESS') barColor = 'var(--color-secondary)';
              if (status === 'CODE_REVIEW') barColor = 'var(--color-info)';
              if (status === 'TESTING') barColor = 'var(--color-warning)';
              if (status === 'RESOLVED') barColor = 'var(--color-success)';
              if (status === 'CLOSED') barColor = '#10B981'; // solid green

              return (
                <div key={status} className="status-bar-item">
                  <div className="status-bar-info">
                    <span className="status-name">{status.replace('_', ' ')}</span>
                    <span className="status-count">{count}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${percentage}%`, backgroundColor: barColor }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Level Columns Chart */}
        <div className="chart-card glass-panel flex-column">
          <h3>Ticket Priorities</h3>
          <p className="chart-subtitle">Severity level distribution of reported issues</p>

          {stats && (
            <div className="priority-chart-wrapper">
              <div className="priority-bars-container">
                {Object.entries(stats.bugsByPriority).map(([priority, count]) => {
                  const percentage = (count / maxPriorityCount) * 85; // cap height at 85%
                  let barClass = 'bar-low';
                  if (priority === 'MEDIUM') barClass = 'bar-medium';
                  if (priority === 'HIGH') barClass = 'bar-high';
                  if (priority === 'CRITICAL') barClass = 'bar-critical';

                  return (
                    <div key={priority} className="priority-column-item">
                      <div className="column-count">{count}</div>
                      <div className="column-bar-bg">
                        <div 
                          className={`column-bar-fill ${barClass}`}
                          style={{ height: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="column-label">{priority}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Developer Workload Chart */}
        <div className="chart-card glass-panel flex-column dev-performance-card">
          <h3>Developer Active Workloads</h3>
          <p className="chart-subtitle">Number of active bugs currently allocated to developers</p>

          <div className="dev-workload-list">
            {stats && stats.devWorkload.length === 0 ? (
              <div className="empty-workload">
                <p>No active bugs currently assigned to developers</p>
              </div>
            ) : (
              stats && stats.devWorkload.map(dev => {
                const widthPercent = (dev.bugCount / maxWorkloadCount) * 100;
                return (
                  <div key={dev.username} className="dev-workload-item">
                    <div className="dev-workload-details">
                      <span className="dev-username">{dev.username}</span>
                      <span className="dev-bug-count">{dev.bugCount} bugs</span>
                    </div>
                    <div className="dev-bar-bg">
                      <div 
                        className="dev-bar-fill" 
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* EDIT PROJECT DETAILS MODAL */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in" style={{ width: '580px' }}>
            <div className="modal-header">
              <h2>Edit Project Settings</h2>
              <button className="btn-close" onClick={() => setShowSettingsModal(false)}>
                <X size={20} />
              </button>
            </div>

            {settingsError && <div className="feedback-box error-box">{settingsError}</div>}

            <form onSubmit={handleSaveSettings} className="modal-form">
              <div className="form-group">
                <label htmlFor="settings-name">Project Name</label>
                <input 
                  id="settings-name"
                  type="text" 
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-desc">Project Description</label>
                <textarea 
                  id="settings-desc"
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe the project..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-domain">Live Domain URL</label>
                <input 
                  id="settings-domain"
                  type="url" 
                  value={settingsDomain}
                  onChange={(e) => setSettingsDomain(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-group">
                <label>Documentation & Resource Links</label>
                
                {/* Link inputs row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Link Title (e.g. API Docs)" 
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleAddLinkItem}
                    style={{ padding: '0 12px' }}
                  >
                    Add
                  </button>
                </div>

                {/* Links list */}
                <div className="settings-links-list" style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {settingsLinks.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No links added yet.</span>
                  ) : (
                    settingsLinks.map((link, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>
                          {link.title} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({link.url})</span>
                        </span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveLinkItem(idx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT INFO & RESOURCES FULL MODAL */}
      {showInfoModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in" style={{ width: '600px' }}>
            <div className="modal-header">
              <h2>Project Info & Resources</h2>
              <button className="btn-close" onClick={() => setShowInfoModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
              <div className="resource-block">
                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em', marginTop: 0 }}>About the Project</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {activeProject.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="resource-block">
                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em', marginTop: 0 }}>Live Domain</h4>
                {activeProject.domainUrl ? (
                  <a href={activeProject.domainUrl} target="_blank" rel="noopener noreferrer" className="live-domain-link">
                    <ExternalLink size={14} />
                    <span>{activeProject.domainUrl}</span>
                  </a>
                ) : (
                  <span className="no-domain-text">No live domain linked.</span>
                )}
              </div>

              <div className="resource-block">
                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em', marginTop: 0 }}>Quick Links & Documentation</h4>
                {linksList.length === 0 ? (
                  <span className="no-links-text">No resource links added yet.</span>
                ) : (
                  <div className="quick-links-grid">
                    {linksList.map((link, idx) => (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="quick-link-item">
                        <LinkIcon size={14} style={{ color: 'var(--color-primary)' }} />
                        <span>{link.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

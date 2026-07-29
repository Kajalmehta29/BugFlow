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
  ChevronRight
} from 'lucide-react';

export default function Dashboard() {
  const { user, activeProject } = useAuth();
  const [stats, setStats] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sprintError, setSprintError] = useState('');

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

  const openCount = stats ? (stats.bugsByStatus['OPEN'] || 0) + (stats.bugsByStatus['ASSIGNED'] || 0) + (stats.bugsByStatus['IN_PROGRESS'] || 0) + (stats.bugsByStatus['CODE_REVIEW'] || 0) + (stats.bugsByStatus['TESTING'] || 0) : 0;
  const resolvedCount = stats ? (stats.bugsByStatus['RESOLVED'] || 0) + (stats.bugsByStatus['CLOSED'] || 0) : 0;

  const isPMorAdmin = user && (user.role === 'ADMIN' || activeProject.manager.id === user.id);

  // SVG Priority Chart parameters
  const maxPriorityCount = stats ? Math.max(...Object.values(stats.bugsByPriority), 1) : 1;

  // SVG Workload parameters
  const maxWorkloadCount = stats && stats.devWorkload.length > 0 
    ? Math.max(...stats.devWorkload.map(w => w.bugCount), 1) 
    : 1;

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>{activeProject.name} Dashboard</h1>
          <p>Key progress statistics and resolution timelines</p>
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

      {/* SPRINT MANAGEMENT SECTION */}
      <div className="dashboard-section sprint-section glass-panel">
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
    </div>
  );
}

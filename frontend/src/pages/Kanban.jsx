import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';
import BugDetailModal from '../components/BugDetailModal';
import AuthenticatedImage from '../components/AuthenticatedImage';
import AttachmentPreviewModal from '../components/AttachmentPreviewModal';
import './Kanban.css';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Users, 
  Loader2, 
  User, 
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

const WORKFLOW_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CODE_REVIEW', 'TESTING', 'RESOLVED', 'CLOSED'];

export default function Kanban() {
  const { user, activeProject } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState([]);
  const [sprints, setSprints] = useState([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sprintFilter, setSprintFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt,desc');
  const [semanticSearch, setSemanticSearch] = useState(false);

  // Modal control states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState(null);

  // New Bug fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [severity, setSeverity] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [createError, setCreateError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // AI draft analysis states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiError, setAiError] = useState('');

  const loadBoardData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      // Load filtered bugs
      const params = {
        status: statusFilter,
        priority: priorityFilter,
        assigneeId: assigneeFilter,
        sprintId: sprintFilter,
        search: search,
        sortBy: sortBy,
        semantic: semanticSearch
      };
      const bugsList = await api.getBugs(activeProject.id, params);
      setBugs(bugsList);

      // Load project details (to get member list)
      const projectDetails = await api.getProjectById(activeProject.id);
      setProjectMembers(projectDetails.members || []);

      // Load project sprints
      const sprintsList = await api.getSprints(activeProject.id);
      setSprints(sprintsList);
    } catch (err) {
      console.error("Failed to load Kanban board data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [activeProject, statusFilter, priorityFilter, assigneeFilter, sprintFilter, sortBy, semanticSearch]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (activeProject) {
        loadBoardData();
      }
    }, 400); // 400ms debounce limit
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Handle URL query trigger for Report Bug
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('report') === 'true') {
      setShowCreateModal(true);
    }
  }, [location]);

  // Drag and Drop Logic
  const handleDragStart = (e, bugId) => {
    e.dataTransfer.setData('text/plain', bugId.toString());
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const bugIdStr = e.dataTransfer.getData('text/plain');
    if (!bugIdStr) return;
    
    const bugId = Number(bugIdStr);
    const bug = bugs.find(b => b.id === bugId);
    
    if (!bug || bug.status === targetStatus) return;

    // Optimistic UI updates backup
    const originalBugs = [...bugs];

    // Transition state locally
    setBugs(prev => prev.map(b => 
      b.id === bugId ? { ...b, status: targetStatus, updatedAt: new Date().toISOString() } : b
    ));

    try {
      await api.transitionBugStatus(bugId, targetStatus);
    } catch (err) {
      // Revert if transition fails (role-based logic rejection)
      setBugs(originalBugs);
      alert(`Workflow Transition Error: ${err.message}`);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setSeverity('MEDIUM');
    setAssigneeId('');
    setSprintId('');
    setImageFile(null);
    setAiResults(null);
    setAiError('');
    const params = new URLSearchParams(location.search);
    if (params.get('report') === 'true') {
      navigate('/board', { replace: true });
    }
  };

  const handleAiAnalyze = async () => {
    if (!title.trim() || !description.trim()) {
      setAiError('Please enter a title and description first.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiResults(null);
    try {
      const data = await api.analyzeBugDraft(activeProject.id, title, description);
      setAiResults(data);
    } catch (err) {
      setAiError(err.message || 'AI analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiSuggestions = () => {
    if (!aiResults || !aiResults.classification) return;
    const { priority: sugPriority, severity: sugSeverity } = aiResults.classification;
    if (sugPriority) setPriority(sugPriority);
    if (sugSeverity) setSeverity(sugSeverity);
    setAiResults(null);
  };

  const handleCreateBug = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      const newBug = await api.createBug(
        activeProject.id,
        title,
        description,
        priority,
        severity,
        assigneeId || null,
        sprintId || null
      );

      if (imageFile) {
        await api.uploadAttachment(newBug.id, imageFile);
      }

      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setSeverity('MEDIUM');
      setAssigneeId('');
      setSprintId('');
      setImageFile(null);
      closeCreateModal();
      await loadBoardData();
    } catch (err) {
      setCreateError(err.message || 'Failed to report bug');
    }
  };

  const handleBugUpdated = () => {
    loadBoardData();
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      case 'LOW': return 'badge-low';
      default: return 'badge-low';
    }
  };

  if (!activeProject) {
    return (
      <div className="empty-dashboard glass-panel animate-fade-in">
        <h2>No Active Project</h2>
        <p>Please select a project from the project list to view the Kanban board.</p>
      </div>
    );
  }

  return (
    <div className="kanban-page">
      <div className="page-header animate-fade-in">
        <div className="page-title">
          <h1>Kanban Board</h1>
          <p>Drag and drop cards to transition bug statuses</p>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="filters-toolbar glass-panel animate-fade-in">
        <div className="search-box-wrapper" style={{ display: 'flex', alignItems: 'center', flex: 1, padding: 0, background: 'transparent', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1, border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-panel, rgba(0,0,0,0.03))', padding: '6px 12px' }}>
            <Search size={16} className="search-icon" style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder={semanticSearch ? "🔮 AI Semantic Search..." : "Search by title or description..."} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', paddingLeft: '24px', paddingRight: '28px', fontSize: '13px', color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={() => setSemanticSearch(!semanticSearch)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                color: semanticSearch ? 'var(--color-primary, #6366f1)' : 'var(--text-secondary, #94a3b8)',
                transition: 'all 0.2s ease',
              }}
              title={semanticSearch ? "Disable AI Semantic Search" : "Enable AI Semantic Search"}
            >
              <Sparkles size={16} style={{ 
                animation: semanticSearch ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                color: semanticSearch ? 'var(--color-primary)' : 'var(--text-secondary)'
              }} />
            </button>
          </div>
        </div>
        
        <div className="filters-group">
          <div className="filter-item">
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">Priority: All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className="filter-item">
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
              <option value="">Assignee: All</option>
              {projectMembers.map(m => (
                <option key={m.id} value={m.id}>{m.username}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value)}>
              <option value="">Sprint: All</option>
              {sprints.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.status === 'ACTIVE' ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt,desc">Newest Created</option>
              <option value="createdAt,asc">Oldest Created</option>
              <option value="updatedAt,desc">Recently Updated</option>
              <option value="priority,desc">Highest Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* BOARD COLUMNS CONTAINER */}
      {loading && bugs.length === 0 ? (
        <div className="board-loading">
          <Loader2 className="spinning" size={32} />
          <p>Syncing tickets...</p>
        </div>
      ) : (
        <div className="board-scroller">
          <div className="board-grid">
            {WORKFLOW_STATUSES.map(status => {
              const statusBugs = bugs.filter(b => b.status === status);
              return (
                <div 
                  key={status}
                  className={`board-column glass-panel column-${status.toLowerCase()}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="column-header">
                    <h4>{status.replace('_', ' ')}</h4>
                    <span className="column-count-badge">{statusBugs.length}</span>
                  </div>

                  <div className="column-cards-list">
                    {statusBugs.map(bug => {
                      const imageAttachment = bug.attachments?.find(att => att.fileType.startsWith('image/'));
                      return (
                        <div 
                          key={bug.id}
                          className={`bug-card glass-panel priority-${bug.priority.toLowerCase()}`}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, bug.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedBugId(bug.id)}
                        >
                          {imageAttachment && (
                            <div 
                              className="bug-card-cover"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewAttachment(imageAttachment);
                              }}
                              title="Click to preview screenshot"
                            >
                              <AuthenticatedImage 
                                attachmentId={imageAttachment.id} 
                                alt={bug.title} 
                                className="bug-card-cover-image" 
                              />
                            </div>
                          )}
                        <div className="bug-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span className={`badge ${getPriorityBadgeClass(bug.priority)}`}>
                              {bug.priority}
                            </span>
                            {bug.similarity !== undefined && bug.similarity !== null && (
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                background: 'rgba(16, 185, 129, 0.15)', 
                                color: '#10b981', 
                                fontSize: '10px', 
                                fontWeight: 'bold',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}>
                                {Math.round(bug.similarity * 100)}% Match
                              </span>
                            )}
                          </div>
                          <span className="bug-card-id">#{bug.id}</span>
                        </div>
                        <h4 className="bug-card-title">{bug.title}</h4>
                        
                        <div className="bug-card-bottom">
                          <div className="bug-card-assignee">
                            <div className="mini-avatar">
                              <User size={10} />
                            </div>
                            <span>{bug.assignee ? bug.assignee.username : 'Unassigned'}</span>
                          </div>
                          {bug.sprint && (
                            <span className="bug-card-sprint-badge">{bug.sprint.name}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REPORT BUG MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Report New Bug</h2>
              <button className="btn-close" onClick={closeCreateModal}>
                <X size={20} />
              </button>
            </div>

            {createError && <div className="feedback-box error-box">{createError}</div>}

            <form onSubmit={handleCreateBug} className="modal-form">
              <div className="form-group">
                <label htmlFor="bug-title">Bug Summary / Title</label>
                <input 
                  id="bug-title"
                  type="text" 
                  placeholder="e.g. Login fails with 500 error on expired token" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bug-desc">Detailed Description</label>
                <textarea 
                  id="bug-desc"
                  placeholder="Describe step by step how to reproduce the bug..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* AI Analysis Panel */}
              <div className="form-group ai-analysis-group" style={{ marginBottom: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-ai-action"
                  onClick={handleAiAnalyze}
                  disabled={aiLoading || !title.trim() || !description.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>Analyze with AI</span>
                </button>
                
                {aiError && <div className="ai-feedback error-text" style={{ marginTop: '8px', color: 'var(--color-danger)', fontSize: '13px' }}>{aiError}</div>}
                
                {aiResults && (
                  <div className="ai-suggestions-panel glass-panel animate-fade-in" style={{ marginTop: '12px', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-focus)', background: 'rgba(99, 102, 241, 0.05)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 12px 0', color: 'var(--color-primary)', fontSize: '14px', fontWeight: 'bold' }}>
                      <Sparkles size={16} />
                      <span>AI Suggestions</span>
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '13px' }}>
                      <div><strong>Suggested Category:</strong> {aiResults.classification?.category || 'General'}</div>
                      <div><strong>Suggested Component:</strong> {aiResults.classification?.component || 'Core'}</div>
                      <div><strong>Suggested Priority:</strong> {aiResults.classification?.priority}</div>
                      <div><strong>Suggested Severity:</strong> {aiResults.classification?.severity}</div>
                    </div>

                    {aiResults.duplicates && aiResults.duplicates.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Possible Duplicates Found:</strong>
                        <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '13px' }}>
                          {aiResults.duplicates.map(dup => (
                            <li key={dup.id} style={{ marginBottom: '4px' }}>
                              <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>#{dup.id}</span> - {dup.title} 
                              <span style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>
                                {Math.round(dup.similarity * 100)}% Match
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm" 
                        onClick={handleApplyAiSuggestions}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        Accept Suggestions
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-text btn-sm" 
                        onClick={() => setAiResults(null)}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="bug-priority">Priority</label>
                  <select id="bug-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="bug-severity">Severity</label>
                  <select id="bug-severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="LOW">Low Impact</option>
                    <option value="MEDIUM">Medium Impact</option>
                    <option value="HIGH">High Impact</option>
                    <option value="CRITICAL">Blocker / Showstopper</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="bug-assignee">Assignee</label>
                  <select id="bug-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                    <option value="">Unassigned</option>
                    {projectMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.username} ({m.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="bug-sprint">Sprint</label>
                  <select id="bug-sprint" value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
                    <option value="">No Sprint</option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.status === 'ACTIVE' ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bug-image">Attach Screenshot / PDF (Optional)</label>
                <input 
                  id="bug-image"
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  style={{ padding: '8px 0' }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Report Bug
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUG DETAILS MODAL DRAWER */}
      {selectedBugId && (
        <BugDetailModal 
          bugId={selectedBugId} 
          onClose={() => setSelectedBugId(null)} 
          onBugUpdated={handleBugUpdated}
          projectMembers={projectMembers}
          sprints={sprints}
        />
      )}

      {previewAttachment && (
        <AttachmentPreviewModal 
          attachment={previewAttachment} 
          onClose={() => setPreviewAttachment(null)} 
        />
      )}
    </div>
  );
}

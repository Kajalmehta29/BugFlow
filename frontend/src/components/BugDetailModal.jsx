import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../services/api';
import AttachmentPreviewModal from './AttachmentPreviewModal';
import './BugDetailModal.css';
import { 
  X, 
  Send, 
  Paperclip, 
  Download, 
  History, 
  MessageSquare, 
  User, 
  Calendar,
  AlertTriangle,
  Loader2,
  Trash2,
  FileText
} from 'lucide-react';

export default function BugDetailModal({ bugId, onClose, onBugUpdated, projectMembers, sprints }) {
  const { user, activeProject } = useAuth();
  
  // Data states
  const [bug, setBug] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interaction states
  const [activeTab, setActiveTab] = useState('comments'); // 'comments', 'timeline', 'attachments'
  const [newComment, setNewComment] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editSeverity, setEditSeverity] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editSprintId, setEditSprintId] = useState('');

  const loadBugData = async () => {
    try {
      const bugData = await api.getBugById(bugId);
      setBug(bugData);

      // Populate editing states
      setEditTitle(bugData.title);
      setEditDesc(bugData.description);
      setEditPriority(bugData.priority);
      setEditSeverity(bugData.severity);
      setEditAssigneeId(bugData.assignee ? bugData.assignee.id : '');
      setEditSprintId(bugData.sprint ? bugData.sprint.id : '');

      // Load comments, attachments, timeline
      const commentsData = await api.getComments(bugId);
      setComments(commentsData);

      const attachmentsData = await api.getAttachments(bugId);
      setAttachments(attachmentsData);

      const timelineData = await api.getTimeline(bugId);
      setTimeline(timelineData);
    } catch (err) {
      setError(err.message || 'Failed to load bug details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBugData();
  }, [bugId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.addComment(bugId, newComment);
      setNewComment('');
      await loadBugData();
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleUploadAttachment = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    setUploading(true);
    setError('');
    try {
      await api.uploadAttachment(bugId, fileToUpload);
      setFileToUpload(null);
      // Reset input element
      const fileInput = document.getElementById('bug-file-input');
      if (fileInput) fileInput.value = '';
      
      await loadBugData();
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (att) => {
    try {
      await api.downloadAttachment(att.id, att.filename);
    } catch (err) {
      alert(`Could not download file: ${err.message}`);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.updateBug(
        bugId,
        activeProject.id,
        editTitle,
        editDesc,
        bug.priority,
        bug.severity,
        bug.assignee ? bug.assignee.id : null,
        bug.sprint ? bug.sprint.id : null
      );
      setIsEditing(false);
      await loadBugData();
      onBugUpdated(); // Trigger board refresh
    } catch (err) {
      setError(err.message || 'Failed to update details');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    setError('');
    try {
      await api.updateBug(
        bugId,
        activeProject.id,
        bug.title,
        bug.description,
        newPriority,
        bug.severity,
        bug.assignee ? bug.assignee.id : null,
        bug.sprint ? bug.sprint.id : null
      );
      await loadBugData();
      onBugUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update priority');
    }
  };

  const handleSeverityChange = async (newSeverity) => {
    setError('');
    try {
      await api.updateBug(
        bugId,
        activeProject.id,
        bug.title,
        bug.description,
        bug.priority,
        newSeverity,
        bug.assignee ? bug.assignee.id : null,
        bug.sprint ? bug.sprint.id : null
      );
      await loadBugData();
      onBugUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update severity');
    }
  };

  const handleAssigneeChange = async (newAssigneeId) => {
    setError('');
    try {
      await api.updateBug(
        bugId,
        activeProject.id,
        bug.title,
        bug.description,
        bug.priority,
        bug.severity,
        newAssigneeId ? parseInt(newAssigneeId, 10) : null,
        bug.sprint ? bug.sprint.id : null
      );
      await loadBugData();
      onBugUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update assignee');
    }
  };

  const handleSprintChange = async (newSprintId) => {
    setError('');
    try {
      await api.updateBug(
        bugId,
        activeProject.id,
        bug.title,
        bug.description,
        bug.priority,
        bug.severity,
        bug.assignee ? bug.assignee.id : null,
        newSprintId ? parseInt(newSprintId, 10) : null
      );
      await loadBugData();
      onBugUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update sprint');
    }
  };

  const handleWorkflowTransition = async (targetStatus) => {
    setError('');
    try {
      await api.transitionBugStatus(bugId, targetStatus);
      await loadBugData();
      onBugUpdated(); // Trigger board refresh
    } catch (err) {
      setError(`Transition Failed: ${err.message}`);
    }
  };

  // Check if current user is PM, Admin or the reporter
  const canEdit = bug && (
    user.role === 'ADMIN' || 
    activeProject.manager.id === user.id ||
    bug.reporter.id === user.id
  );

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      case 'LOW': return 'badge-low';
      default: return 'badge-low';
    }
  };

  const formatActivityText = (log) => {
    const actor = log.user.username;
    switch (log.action) {
      case 'CREATED':
        return `${actor} created this bug. ${log.newValue}`;
      case 'TITLE_CHANGED':
        return `${actor} updated the title from "${log.oldValue}" to "${log.newValue}"`;
      case 'DESCRIPTION_CHANGED':
        return `${actor} modified the detailed description.`;
      case 'PRIORITY_CHANGED':
        return `${actor} changed priority from ${log.oldValue} to ${log.newValue}`;
      case 'SEVERITY_CHANGED':
        return `${actor} changed severity from ${log.oldValue} to ${log.newValue}`;
      case 'STATUS_CHANGED':
        return `${actor} advanced status from ${log.oldValue} to ${log.newValue}`;
      case 'ASSIGNEE_CHANGED':
        return `${actor} assigned this bug to ${log.newValue} (was ${log.oldValue})`;
      case 'SPRINT_CHANGED':
        return `${actor} moved bug to sprint "${log.newValue}" (was "${log.oldValue}")`;
      case 'COMMENT_ADDED':
        return `${actor} added a comment.`;
      case 'ATTACHMENT_ADDED':
        return `${actor} uploaded file "${log.newValue}"`;
      default:
        return `${actor} performed action ${log.action}`;
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content glass-panel bug-detail-modal-loading">
          <Loader2 className="spinning" size={32} />
          <p>Syncing ticket details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel bug-detail-modal animate-fade-in">
        
        {/* MODAL HEADER */}
        <div className="detail-modal-header">
          <div className="bug-modal-meta">
            <span className="bug-modal-id">#{bug.id}</span>
            <span className="bug-modal-proj-key">{activeProject.key}</span>
            <span className="bug-modal-status-indicator">{bug.status.replace('_', ' ')}</span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="feedback-box error-box">{error}</div>}

        <div className="detail-modal-body">
          {/* LEFT SECTION: DESCRIPTION & COLLABORATION TABS */}
          <div className="detail-left-pane">
            {isEditing ? (
              <form onSubmit={handleSaveDetails} className="edit-bug-form">
                <div className="form-group">
                  <label htmlFor="edit-title">Title / Summary</label>
                  <input 
                    id="edit-title"
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-desc">Description</label>
                  <textarea 
                    id="edit-desc"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={6}
                    required
                  />
                </div>
                <div className="edit-form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            ) : (
              <div className="bug-description-display">
                <h2>{bug.title}</h2>
                <div className="description-text">
                  <h4>Description</h4>
                  <p>{bug.description}</p>
                </div>
                {canEdit && (
                  <button className="btn btn-secondary btn-edit-trigger" onClick={() => setIsEditing(true)}>
                    Edit Summary & Description
                  </button>
                )}
              </div>
            )}

            {/* TAB CONTAINER */}
            <div className="tabs-container">
              <div className="tabs-header">
                <button 
                  className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  <MessageSquare size={16} />
                  <span>Comments ({comments.length})</span>
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                  onClick={() => setActiveTab('timeline')}
                >
                  <History size={16} />
                  <span>Timeline History</span>
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'attachments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attachments')}
                >
                  <Paperclip size={16} />
                  <span>Attachments ({attachments.length})</span>
                </button>
              </div>

              <div className="tab-body">
                {/* TAB 1: COMMENTS */}
                {activeTab === 'comments' && (
                  <div className="tab-comments animate-fade-in">
                    <form onSubmit={handlePostComment} className="comment-post-form">
                      <input 
                        type="text" 
                        placeholder="Add a collaborative comment..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn-send-comment">
                        <Send size={16} />
                      </button>
                    </form>

                    <div className="comments-list">
                      {comments.length === 0 ? (
                        <div className="empty-tab-state">No comments yet. Start the conversation!</div>
                      ) : (
                        comments.map(c => (
                          <div key={c.id} className="comment-item">
                            <div className="comment-author-avatar">
                              <User size={12} />
                            </div>
                            <div className="comment-bubble">
                              <div className="comment-meta">
                                <span className="comment-author-name">{c.author.username}</span>
                                <span className="comment-time">
                                  {new Date(c.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              <p className="comment-content">{c.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: TIMELINE HISTORY */}
                {activeTab === 'timeline' && (
                  <div className="tab-timeline animate-fade-in">
                    {timeline.length === 0 ? (
                      <div className="empty-tab-state">No activity logged.</div>
                    ) : (
                      <div className="timeline-trail">
                        {timeline.map(log => (
                          <div key={log.id} className="timeline-node">
                            <div className="timeline-icon-dot"></div>
                            <div className="timeline-node-content">
                              <p className="timeline-text">{formatActivityText(log)}</p>
                              <span className="timeline-node-time">
                                {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: ATTACHMENTS */}
                {activeTab === 'attachments' && (
                  <div className="tab-attachments animate-fade-in">
                    <form onSubmit={handleUploadAttachment} className="attachment-upload-form">
                      <div className="upload-input-wrapper">
                        <input 
                          id="bug-file-input"
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          required
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={!fileToUpload || uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </form>

                    <div className="attachments-list">
                      {attachments.length === 0 ? (
                        <div className="empty-tab-state">No file attachments. Upload screenshots or logs above.</div>
                      ) : (
                        attachments.map(att => (
                          <div key={att.id} className="attachment-item">
                            <div className="attachment-details" onClick={() => setPreviewAttachment(att)} style={{ cursor: 'pointer' }}>
                              <FileText size={16} className="attachment-type-icon" />
                              <span className="attachment-filename">{att.filename}</span>
                              <span className="attachment-type-label">{att.fileType}</span>
                            </div>
                            <button 
                              className="btn-download-file" 
                              onClick={() => handleDownloadFile(att)}
                              title="Download Attachment"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: METADATA & WORKFLOW STATE DRIVERS */}
          <div className="detail-right-pane">
            {/* WORKFLOW OPERATIONS */}
            <div className="meta-section workflow-actions-section">
              <h4>Workflow Transitions</h4>
              <div className="workflow-status-flow">
                <span className="current-status-label">Current Status: {bug.status.replace('_', ' ')}</span>
                
                <div className="transitions-button-list">
                  {/* Dynamic buttons based on workflow limits */}
                  {bug.status === 'OPEN' && (
                    <button className="btn btn-workflow" onClick={() => handleWorkflowTransition('ASSIGNED')}>
                      Assign Bug
                    </button>
                  )}
                  {bug.status === 'ASSIGNED' && (
                    <button className="btn btn-workflow" onClick={() => handleWorkflowTransition('IN_PROGRESS')}>
                      Start Work
                    </button>
                  )}
                  {bug.status === 'IN_PROGRESS' && (
                    <button className="btn btn-workflow animate-pulse" onClick={() => handleWorkflowTransition('CODE_REVIEW')}>
                      Submit for PR
                    </button>
                  )}
                  {bug.status === 'CODE_REVIEW' && (
                    <button className="btn btn-workflow" onClick={() => handleWorkflowTransition('TESTING')}>
                      Send to QA
                    </button>
                  )}
                  {bug.status === 'TESTING' && (
                    <div className="testing-actions">
                      <button className="btn btn-workflow btn-success" onClick={() => handleWorkflowTransition('RESOLVED')}>
                        Resolve Fix
                      </button>
                      <button className="btn btn-workflow btn-danger" onClick={() => handleWorkflowTransition('ASSIGNED')}>
                        Fail & Reassign
                      </button>
                      <button className="btn btn-workflow btn-danger" onClick={() => handleWorkflowTransition('OPEN')}>
                        Fail & Reopen
                      </button>
                    </div>
                  )}
                  {bug.status === 'RESOLVED' && (
                    <div className="resolved-actions">
                      <button className="btn btn-workflow" onClick={() => handleWorkflowTransition('CLOSED')}>
                        Close Bug
                      </button>
                      <button className="btn btn-workflow btn-danger" onClick={() => handleWorkflowTransition('ASSIGNED')}>
                        Reopen to Dev
                      </button>
                    </div>
                  )}
                  {bug.status === 'CLOSED' && (
                    <button className="btn btn-workflow btn-secondary" onClick={() => handleWorkflowTransition('OPEN')}>
                      Reopen Ticket
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* METADATA DETAILS EDIT SYSTEM */}
            <div className="meta-section details-list-section">
              <h4>Ticket Details</h4>
              <div className="metadata-form">
                
                <div className="meta-detail-row">
                  <span className="meta-label">Priority:</span>
                  <div className="meta-value">
                    {canEdit ? (
                      <select value={bug.priority} onChange={(e) => handlePriorityChange(e.target.value)}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    ) : (
                      <span className={`badge ${getPriorityBadgeClass(bug.priority)}`}>{bug.priority}</span>
                    )}
                  </div>
                </div>

                <div className="meta-detail-row">
                  <span className="meta-label">Severity:</span>
                  <div className="meta-value">
                    {canEdit ? (
                      <select value={bug.severity} onChange={(e) => handleSeverityChange(e.target.value)}>
                        <option value="LOW">Low Impact</option>
                        <option value="MEDIUM">Medium Impact</option>
                        <option value="HIGH">High Impact</option>
                        <option value="CRITICAL">Blocker</option>
                      </select>
                    ) : (
                      <span className={`badge ${getPriorityBadgeClass(bug.severity)}`}>{bug.severity}</span>
                    )}
                  </div>
                </div>

                <div className="meta-detail-row">
                  <span className="meta-label">Assignee:</span>
                  <div className="meta-value" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {canEdit ? (
                      <>
                        <select value={bug.assignee ? bug.assignee.id : ''} onChange={(e) => handleAssigneeChange(e.target.value)}>
                          <option value="">Unassigned</option>
                          {projectMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.username}</option>
                          ))}
                        </select>
                        {bug.assignee && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Initially assigned by {bug.reporter.username}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="meta-user">
                        {bug.assignee ? (
                          `${bug.assignee.username} (Assigned by ${bug.reporter.username})`
                        ) : (
                          'Unassigned'
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="meta-detail-row">
                  <span className="meta-label">Sprint:</span>
                  <div className="meta-value">
                    {canEdit ? (
                      <select value={bug.sprint ? bug.sprint.id : ''} onChange={(e) => handleSprintChange(e.target.value)}>
                        <option value="">None</option>
                        {sprints.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="meta-sprint">{bug.sprint ? bug.sprint.name : 'None'}</span>
                    )}
                  </div>
                </div>

                <div className="meta-detail-row">
                  <span className="meta-label">Reporter:</span>
                  <div className="meta-value">
                    <span className="meta-user">{bug.reporter.username}</span>
                  </div>
                </div>

                <div className="meta-detail-row">
                  <span className="meta-label">Created:</span>
                  <div className="meta-value">
                    <span className="meta-date">
                      {new Date(bug.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                </div>

                <div className="meta-detail-row">
                  <span className="meta-label">Updated:</span>
                  <div className="meta-value">
                    <span className="meta-date">
                      {new Date(bug.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {previewAttachment && (
        <AttachmentPreviewModal 
          attachment={previewAttachment} 
          onClose={() => setPreviewAttachment(null)} 
        />
      )}
    </div>
  );
}

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
  FileText,
  Sparkles,
  Code2,
  Copy,
  Check,
  Wrench,
  CheckSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function BugDetailModal({ bugId, onClose, onBugUpdated, projectMembers, sprints }) {
  const { user, activeProject } = useAuth();
  
  // Data states
  const [bug, setBug] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI states
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [similarBugs, setSimilarBugs] = useState([]);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixError, setFixError] = useState('');
  const [copied, setCopied] = useState(false);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [assigneeError, setAssigneeError] = useState('');
  const [commentsSummaryLoading, setCommentsSummaryLoading] = useState(false);
  const [commentsSummaryError, setCommentsSummaryError] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState('');

  // Collapse/Expand state hooks for AI Insights panels
  const [classCollapsed, setClassCollapsed] = useState(false);
  const [assigneeCollapsed, setAssigneeCollapsed] = useState(false);
  const [duplicatesCollapsed, setDuplicatesCollapsed] = useState(false);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [fixCollapsed, setFixCollapsed] = useState(false);
  const [testCasesCollapsed, setTestCasesCollapsed] = useState(false);

  // Interaction states
  const [activeTab, setActiveTab] = useState('comments'); // 'comments', 'timeline', 'attachments', 'ai'
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

  const loadAiAnalysis = async () => {
    if (!bug) return;
    setAiLoading(true);
    setAiError('');
    try {
      const data = await api.getBugAiAnalysis(bugId);
      setAiAnalysis(data);
      const dups = await api.getBugDuplicates(bugId, bug.projectId, bug.title, bug.description);
      setSimilarBugs(dups);
    } catch (err) {
      setAiError(err.message || 'Failed to load AI Insights');
    } finally {
      setAiLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!bug) return;
    setAiLoading(true);
    setAiError('');
    try {
      const data = await api.analyzeBug(bugId);
      setAiAnalysis(data);
      const dups = await api.getBugDuplicates(bugId, bug.projectId, bug.title, bug.description);
      setSimilarBugs(dups);
    } catch (err) {
      setAiError(err.message || 'Re-analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateFix = async () => {
    if (!bug) return;
    setFixLoading(true);
    setFixError('');
    try {
      const data = await api.generateCodeFix(bugId);
      setAiAnalysis(data);
    } catch (err) {
      setFixError(err.message || 'Failed to generate code fix suggestion');
    } finally {
      setFixLoading(false);
    }
  };

  const handleCopyCode = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuggestAssignee = async () => {
    if (!bug) return;
    setAssigneeLoading(true);
    setAssigneeError('');
    try {
      const data = await api.suggestAssignee(bugId);
      setAiAnalysis(data);
    } catch (err) {
      setAssigneeError(err.message || 'Failed to suggest assignee');
    } finally {
      setAssigneeLoading(false);
    }
  };

  const handleApplyAssignee = async () => {
    if (!aiAnalysis || !aiAnalysis.suggestedAssignee || !bug) return;
    const recommendedUser = projectMembers.find(
      m => m.username.toLowerCase() === aiAnalysis.suggestedAssignee.toLowerCase()
    );
    if (!recommendedUser) {
      setError(`Cannot assign: Member with username "${aiAnalysis.suggestedAssignee}" was not found in the project.`);
      return;
    }
    setError('');
    try {
      await api.updateBug(
        bugId,
        activeProject.id,
        bug.title,
        bug.description,
        bug.priority,
        bug.severity,
        recommendedUser.id,
        bug.sprint ? bug.sprint.id : null
      );
      await loadBugData();
      onBugUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update assignee');
    }
  };

  const handleSummarizeComments = async () => {
    if (!bug) return;
    setCommentsSummaryLoading(true);
    setCommentsSummaryError('');
    try {
      const data = await api.summarizeComments(bugId);
      setAiAnalysis(data);
    } catch (err) {
      setCommentsSummaryError(err.message || 'Failed to summarize comment thread');
    } finally {
      setCommentsSummaryLoading(false);
    }
  };

  const handleGenerateTestCases = async () => {
    if (!bug) return;
    setQaLoading(true);
    setQaError('');
    try {
      const data = await api.generateTestCases(bugId);
      setAiAnalysis(data);
    } catch (err) {
      setQaError(err.message || 'Failed to generate QA test cases');
    } finally {
      setQaLoading(false);
    }
  };

  const handleApplyAiSummary = async () => {
    if (!aiAnalysis || !bug) return;
    if (!window.confirm("Are you sure you want to update the main description and title with the AI-generated structured summary? This will modify the ticket.")) {
      return;
    }
    try {
      const formattedSummary = `[AI SUMMARY]\n${aiAnalysis.problemSummary}\n\n[STEPS TO REPRODUCE]\n${aiAnalysis.stepsToReproduce}\n\n[EXPECTED BEHAVIOR]\n${aiAnalysis.expectedBehavior}\n\n[ACTUAL BEHAVIOR]\n${aiAnalysis.actualBehavior}\n\n[TECHNICAL DETAILS]\n${aiAnalysis.technicalDetails}`;
      
      const updated = await api.updateBug(
        bugId,
        bug.projectId,
        aiAnalysis.summaryTitle || bug.title,
        formattedSummary,
        bug.priority,
        bug.severity,
        bug.assignee ? bug.assignee.id : null,
        bug.sprint ? bug.sprint.id : null
      );
      
      onBugUpdated();
      setBug(updated);
      setEditTitle(updated.title);
      setEditDesc(updated.description);
      alert('AI Summary applied successfully to the main description!');
    } catch (err) {
      alert(`Failed to apply summary: ${err.message}`);
    }
  };

  useEffect(() => {
    loadBugData();
  }, [bugId]);

  useEffect(() => {
    if (activeTab === 'ai' && bug) {
      loadAiAnalysis();
    }
  }, [bugId, activeTab, bug == null]);

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
                <button 
                  className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ai')}
                >
                  <Sparkles size={16} />
                  <span>AI Insights</span>
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

                    {/* AI Comments Thread Summarizer */}
                    {comments.length >= 3 && (
                      <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px', background: 'var(--bg-hover)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={14} />
                            <span>AI Conversation Summary</span>
                          </span>
                          {aiAnalysis?.commentSummary && !commentsSummaryLoading && (
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm" 
                              onClick={handleSummarizeComments}
                              style={{ padding: '2px 8px', fontSize: '10px' }}
                            >
                              Re-Summarize
                            </button>
                          )}
                        </div>

                        {commentsSummaryLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                            <Loader2 className="animate-spin" size={16} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Condensing the discussion...</span>
                          </div>
                        ) : commentsSummaryError ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#ef4444' }}>
                            <span>{commentsSummaryError}</span>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={handleSummarizeComments} style={{ padding: '1px 6px', fontSize: '9px' }}>
                              Retry
                            </button>
                          </div>
                        ) : aiAnalysis?.commentSummary ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                            {aiAnalysis.commentSummary}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>This ticket has a long conversation. Let AI summarize it for you.</span>
                            <button 
                              type="button" 
                              className="btn btn-primary btn-sm" 
                              onClick={handleSummarizeComments}
                              style={{ padding: '2px 10px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Sparkles size={10} />
                              <span>Summarize Thread</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

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

                {/* TAB 4: AI INSIGHTS */}
                {activeTab === 'ai' && (
                  <div className="tab-ai-insights animate-fade-in" style={{ padding: '16px 0' }}>
                    {aiLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
                        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Analyzing ticket intelligence...</span>
                      </div>
                    ) : aiError ? (
                      <div className="feedback-box error-box">
                        <div>{aiError}</div>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={loadAiAnalysis} style={{ marginTop: '8px' }}>
                          Retry
                        </button>
                      </div>
                    ) : aiAnalysis ? (
                      <div>
                        {/* Header Action Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                            <Sparkles size={18} />
                            <span>AI Issue Intelligence</span>
                          </h3>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={handleReanalyze}>
                            Re-Analyze
                          </button>
                        </div>

                        {/* Classification Info */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px', background: 'var(--bg-hover)' }}>
                          <h4 
                            style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setClassCollapsed(!classCollapsed)}
                          >
                            <span>Suggested Classification</span>
                            {classCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </h4>
                          {!classCollapsed && (
                            <>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '13px', marginTop: '12px' }}>
                                <div><strong>Category:</strong> {aiAnalysis.category || 'General'}</div>
                                <div><strong>Component:</strong> {aiAnalysis.component || 'General / Core'}</div>
                                <div><strong>Suggested Severity:</strong> {aiAnalysis.suggestedSeverity}</div>
                                <div><strong>Suggested Priority:</strong> {aiAnalysis.suggestedPriority}</div>
                              </div>
                              {aiAnalysis.keywords && (
                                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                  <strong style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '6px' }}>Keywords:</strong>
                                  {aiAnalysis.keywords.split(',').map((kw, idx) => (
                                    <span key={idx} style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--border-color)', border: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-primary)' }}>
                                      {kw.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* AI Assignee Recommendation */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px', background: 'var(--bg-hover)' }}>
                          <h4 
                            style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setAssigneeCollapsed(!assigneeCollapsed)}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <User size={16} />
                              <span>AI Assignee Recommendation</span>
                            </span>
                            {assigneeCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </h4>

                          {!assigneeCollapsed && (
                            <div style={{ marginTop: '12px' }}>
                              {assigneeLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 0' }}>
                                  <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Analyzing developer workloads and project expertise...</span>
                                </div>
                              ) : assigneeError ? (
                                <div className="feedback-box error-box" style={{ fontSize: '12px', padding: '8px 12px' }}>
                                  <div>{assigneeError}</div>
                                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleSuggestAssignee} style={{ marginTop: '6px', padding: '2px 8px', fontSize: '11px' }}>
                                    Retry
                                  </button>
                                </div>
                              ) : aiAnalysis.suggestedAssignee ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', lineHeight: '1.5' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <strong>Recommended Developer:</strong>{' '}
                                      <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        background: 'var(--color-primary-light, rgba(79, 70, 229, 0.1))', 
                                        color: 'var(--color-primary)', 
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                      }}>
                                        @{aiAnalysis.suggestedAssignee}
                                      </span>
                                    </div>
                                    {canEdit && bug.assignee?.username?.toLowerCase() !== aiAnalysis.suggestedAssignee.toLowerCase() && aiAnalysis.suggestedAssignee.toLowerCase() !== 'unassigned' && (
                                      <button 
                                        type="button" 
                                        className="btn btn-primary btn-sm" 
                                        onClick={handleApplyAssignee}
                                        style={{ padding: '3px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        Assign Ticket to @{aiAnalysis.suggestedAssignee}
                                      </button>
                                    )}
                                  </div>
                                  <div style={{ background: 'var(--bg-panel, rgba(0,0,0,0.08))', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                                    <strong>Rationale:</strong> {aiAnalysis.assigneeRationale}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Unsure who should take this ticket?</span>
                                  <button 
                                    type="button" 
                                    className="btn btn-primary btn-sm" 
                                    onClick={handleSuggestAssignee} 
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    <Sparkles size={14} />
                                    <span>Get Assignee Recommendation</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Duplicates Section */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px', background: 'var(--bg-hover)' }}>
                          <h4 
                            style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setDuplicatesCollapsed(!duplicatesCollapsed)}
                          >
                            <span>Possible Duplicate Issues</span>
                            {duplicatesCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </h4>
                          {!duplicatesCollapsed && (
                            <div style={{ marginTop: '12px' }}>
                              {similarBugs && similarBugs.length > 0 ? (
                                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '13px' }}>
                                  {similarBugs.map(dup => (
                                    <li key={dup.id} style={{ marginBottom: '8px' }}>
                                      <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>#{dup.id}</span> - {dup.title}
                                      <span style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>
                                        {Math.round(dup.similarity * 100)}% Similarity
                                      </span>
                                      <span style={{ marginLeft: '8px', padding: '1px 6px', borderRadius: '4px', background: 'var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        {dup.status}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No potential duplicates found above 80% similarity.</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Structured Summary Section */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', marginTop: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                            <h4 
                              style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, userSelect: 'none' }}
                              onClick={() => setSummaryCollapsed(!summaryCollapsed)}
                            >
                              <span>AI-Generated Structured Summary</span>
                              {summaryCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </h4>
                            {!summaryCollapsed && (
                              <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyAiSummary} style={{ fontSize: '11px', padding: '4px 10px' }}>
                                Apply Summary to Ticket
                              </button>
                            )}
                          </div>
                          
                          {!summaryCollapsed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.5' }}>
                              <div>
                                <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '12px', marginBottom: '2px' }}>Summary Title</strong>
                                <div>{aiAnalysis.summaryTitle || 'N/A'}</div>
                              </div>
                              <div>
                                <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '12px', marginBottom: '2px' }}>Problem Summary</strong>
                                <div>{aiAnalysis.problemSummary || 'N/A'}</div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                  <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '12px', marginBottom: '2px' }}>Expected Behavior</strong>
                                  <div>{aiAnalysis.expectedBehavior || 'N/A'}</div>
                                </div>
                                <div>
                                  <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '12px', marginBottom: '2px' }}>Actual Behavior</strong>
                                  <div>{aiAnalysis.actualBehavior || 'N/A'}</div>
                                </div>
                              </div>
                              <div>
                                <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '12px', marginBottom: '2px' }}>Steps to Reproduce</strong>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{aiAnalysis.stepsToReproduce || 'N/A'}</div>
                              </div>
                              <div>
                                <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '12px', marginBottom: '2px' }}>Technical Details</strong>
                                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-panel, rgba(0,0,0,0.15))', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                  {aiAnalysis.technicalDetails || 'N/A'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* AI Root-Cause & Code Fix Section */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', marginTop: '20px' }}>
                          <h4 
                            style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setFixCollapsed(!fixCollapsed)}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Code2 size={16} />
                              <span>AI Root-Cause & Code Fix Suggestion</span>
                            </span>
                            {fixCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </h4>

                          {!fixCollapsed && (
                            <div style={{ marginTop: '12px' }}>
                              {fixLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 0' }}>
                                  <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Analyzing logs and patterns for code fix...</span>
                                </div>
                              ) : fixError ? (
                                <div className="feedback-box error-box" style={{ fontSize: '12px', padding: '8px 12px' }}>
                                  <div>{fixError}</div>
                                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleGenerateFix} style={{ marginTop: '6px', padding: '2px 8px', fontSize: '11px' }}>
                                    Retry
                                  </button>
                                </div>
                              ) : aiAnalysis.codeFixSuggestion ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.5' }}>
                                  <div>
                                    <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '12px', marginBottom: '4px' }}>Estimated Root Cause</strong>
                                    <div style={{ background: 'var(--bg-panel, rgba(0,0,0,0.08))', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                      {aiAnalysis.rootCause}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <strong style={{ color: 'var(--color-primary)', fontSize: '12px' }}>Suggested Code Fix</strong>
                                      <button 
                                        type="button" 
                                        className="btn btn-secondary btn-sm" 
                                        onClick={() => handleCopyCode(aiAnalysis.codeFixSuggestion)}
                                        style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        {copied ? <Check size={12} /> : <Copy size={12} />}
                                        <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                                      </button>
                                    </div>
                                    <pre style={{ 
                                      margin: 0, 
                                      padding: '12px', 
                                      borderRadius: '6px', 
                                      background: '#1e1e1e', 
                                      color: '#d4d4d4', 
                                      border: '1px solid var(--border-color)', 
                                      overflowX: 'auto', 
                                      fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                                      fontSize: '12px' 
                                    }}>
                                      <code>{aiAnalysis.codeFixSuggestion}</code>
                                    </pre>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Need a starting point to debug this issue?</span>
                                  <button 
                                    type="button" 
                                    className="btn btn-primary btn-sm" 
                                    onClick={handleGenerateFix} 
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    <Wrench size={14} />
                                    <span>Suggest Code Fix & RCA</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* AI-Generated QA Test Cases Section */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', marginTop: '20px' }}>
                          <h4 
                            style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setTestCasesCollapsed(!testCasesCollapsed)}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckSquare size={16} />
                              <span>AI-Generated QA Verification Test Cases</span>
                            </span>
                            {testCasesCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </h4>

                          {!testCasesCollapsed && (
                            <div style={{ marginTop: '12px' }}>
                              {qaLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 0' }}>
                                  <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Generating verification steps and expected conditions...</span>
                                </div>
                              ) : qaError ? (
                                <div className="feedback-box error-box" style={{ fontSize: '12px', padding: '8px 12px' }}>
                                  <div>{qaError}</div>
                                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleGenerateTestCases} style={{ marginTop: '6px', padding: '2px 8px', fontSize: '11px' }}>
                                    Retry
                                  </button>
                                </div>
                              ) : aiAnalysis.qaTestCases ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', lineHeight: '1.5' }}>
                                  <div style={{ background: 'var(--bg-panel, rgba(0,0,0,0.08))', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12.5px', whiteSpace: 'pre-wrap' }}>
                                    {aiAnalysis.qaTestCases}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Want step-by-step QA test instructions to verify this fix?</span>
                                  <button 
                                    type="button" 
                                    className="btn btn-primary btn-sm" 
                                    onClick={handleGenerateTestCases} 
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    <CheckSquare size={14} />
                                    <span>Generate QA Test Cases</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
                        <Sparkles size={24} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>No intelligence generated yet. Click analyze to start.</span>
                        <button type="button" className="btn btn-primary btn-sm" onClick={handleReanalyze}>
                          Run Analysis
                        </button>
                      </div>
                    )}
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

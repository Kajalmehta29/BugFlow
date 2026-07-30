const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Helper to get auth header
const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Generic request wrapper
const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    // If rate limited or unauthorized
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-failed'));
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `HTTP error! Status: ${response.status}`);
  }

  // Handle file download response
  if (options.responseType === 'blob') {
    return response.blob();
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

export const api = {
  // Auth
  login: (username, password) => 
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }),
    
  register: (username, email, password, role) =>
    request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role })
    }),

  getUsers: () =>
    request('/users', {
      method: 'GET',
      headers: getHeaders()
    }),

  updateUser: (userId, username, email, role) =>
    request(`/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ username, email, role })
    }),

  deleteUser: (userId) =>
    request(`/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    }),

  // Projects
  getProjects: () =>
    request('/projects', {
      method: 'GET',
      headers: getHeaders()
    }),

  getProjectById: (id) =>
    request(`/projects/${id}`, {
      method: 'GET',
      headers: getHeaders()
    }),

  createProject: (name, key, description, managerId) =>
    request('/projects', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, key, description, managerId })
    }),

  addProjectMember: (projectId, userId) =>
    request(`/projects/${projectId}/members?userId=${userId}`, {
      method: 'POST',
      headers: getHeaders()
    }),

  removeProjectMember: (projectId, userId) =>
    request(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    }),

  updateProjectStatus: (projectId, status) =>
    request(`/projects/${projectId}/status?status=${status}`, {
      method: 'PUT',
      headers: getHeaders()
    }),

  updateProject: (projectId, data) =>
    request(`/projects/${projectId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }),

  // Sprints
  getSprints: (projectId) =>
    request(`/projects/${projectId}/sprints`, {
      method: 'GET',
      headers: getHeaders()
    }),

  createSprint: (projectId, name, startDate, endDate) =>
    request(`/projects/${projectId}/sprints`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, startDate, endDate })
    }),

  updateSprintStatus: (sprintId, status) =>
    request(`/sprints/${sprintId}/status?status=${status}`, {
      method: 'PUT',
      headers: getHeaders()
    }),

  // Bugs
  getBugs: (projectId, params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.assigneeId) query.append('assigneeId', params.assigneeId);
    if (params.sprintId) query.append('sprintId', params.sprintId);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    return request(`/projects/${projectId}/bugs?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders()
    });
  },

  getBugById: (bugId) =>
    request(`/bugs/${bugId}`, {
      method: 'GET',
      headers: getHeaders()
    }),

  createBug: (projectId, title, description, priority, severity, assigneeId, sprintId) =>
    request('/bugs', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ projectId, title, description, priority, severity, assigneeId, sprintId })
    }),

  updateBug: (bugId, projectId, title, description, priority, severity, assigneeId, sprintId) =>
    request(`/bugs/${bugId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ projectId, title, description, priority, severity, assigneeId, sprintId })
    }),

  transitionBugStatus: (bugId, status) =>
    request(`/bugs/${bugId}/status?status=${status}`, {
      method: 'PATCH',
      headers: getHeaders()
    }),

  // Comments
  getComments: (bugId) =>
    request(`/bugs/${bugId}/comments`, {
      method: 'GET',
      headers: getHeaders()
    }),

  addComment: (bugId, content) =>
    request(`/bugs/${bugId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    }),

  // Attachments
  getAttachments: (bugId) =>
    request(`/bugs/${bugId}/attachments`, {
      method: 'GET',
      headers: getHeaders()
    }),

  uploadAttachment: (bugId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/bugs/${bugId}/attachments`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
  },

  downloadAttachment: async (attachmentId, filename) => {
    const blob = await request(`/attachments/${attachmentId}/download`, {
      method: 'GET',
      headers: getHeaders(),
      responseType: 'blob'
    });
    
    // Create a temporary link to download the file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  },

  // Timeline (Activity logs)
  getTimeline: (bugId) =>
    request(`/bugs/${bugId}/timeline`, {
      method: 'GET',
      headers: getHeaders()
    }),

  getDashboardStats: (projectId) =>
    request(`/dashboard/stats?projectId=${projectId}`, {
      method: 'GET',
      headers: getHeaders()
    }),

  getGlobalStats: () =>
    request('/dashboard/global-stats', {
      method: 'GET',
      headers: getHeaders()
    }),

  // Notifications
  getNotifications: () =>
    request('/notifications', {
      method: 'GET',
      headers: getHeaders()
    })
};

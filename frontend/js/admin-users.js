/**
 * Admin Users Management - US3
 * Recipe Management System
 */

const API_BASE = '/api/admin/users';

// State
const state = {
  users: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  filters: { search: '', role: 'all', status: 'all' },
  selectedUsers: [],
  currentUserId: null
};

// Utilities
function getToken() {
  return localStorage.getItem('token');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    ...options
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error?.message || 'Request failed');
  }
  return data;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showLoading(show = true) {
  document.getElementById('loadingOverlay').classList.toggle('active', show);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getInitials(firstName, lastName) {
  return `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Modals
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Load Stats
async function loadStats() {
  try {
    const response = await apiRequest('/stats');
    const stats = response.data;
    document.getElementById('totalUsers').textContent = stats.total || 0;
    document.getElementById('activeUsers').textContent = stats.active || 0;
    document.getElementById('suspendedUsers').textContent = stats.suspended || 0;
    document.getElementById('adminCount').textContent = stats.admins || 0;
  } catch (err) {
    console.error('Load stats error:', err);
  }
}

// Load Users (US3-T.1)
async function loadUsers() {
  try {
    showLoading(true);
    const { page, limit } = state.pagination;
    const { search, role, status } = state.filters;

    const queryParams = new URLSearchParams({ page, limit, search, role, status });
    const response = await apiRequest(`?${queryParams}`);
    
    state.users = response.data;
    state.pagination = response.pagination;

    renderUsersTable();
    renderPagination();
  } catch (err) {
    console.error('Load users error:', err);
    showToast('Failed to load users', 'error');
    renderEmptyState('No users found');
  } finally {
    showLoading(false);
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  const users = state.users;

  if (users.length === 0) {
    renderEmptyState('No users found');
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr data-id="${user._id}">
      <td><input type="checkbox" class="user-checkbox" value="${user._id}" ${user.role === 'admin' ? 'disabled' : ''} /></td>
      <td>
        <div class="user-cell">
          <div class="avatar">${getInitials(user.f_name, user.l_name)}</div>
          <div class="cell-info"><span class="name">${user.f_name} ${user.l_name}</span></div>
        </div>
      </td>
      <td>${user.email}</td>
      <td><span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">${user.role}</span></td>
      <td><span class="badge ${getStatusBadgeClass(user.status, user.isDeleted)}">${user.isDeleted ? 'Deleted' : user.status}</span></td>
      <td>${formatDate(user.created_date || user.createdAt)}</td>
      <td><div class="action-buttons">${renderUserActions(user)}</div></td>
    </tr>
  `).join('');

  state.selectedUsers = [];
  updateBulkActions();
}

function getStatusBadgeClass(status, isDeleted) {
  if (isDeleted) return 'badge-deleted';
  switch (status) {
    case 'active': return 'badge-active';
    case 'suspended': return 'badge-suspended';
    default: return 'badge-inactive';
  }
}

function renderUserActions(user) {
  if (user.isDeleted) {
    return `<button class="action-btn restore" onclick="restoreUser('${user._id}')" title="Restore"><i class="fas fa-undo"></i></button>`;
  }
  if (user.role === 'admin') {
    return '<span class="protected-text">Protected</span>';
  }

  let actions = '';
  if (user.status === 'suspended') {
    actions += `<button class="action-btn reactivate" onclick="reactivateUser('${user._id}')" title="Reactivate"><i class="fas fa-check"></i></button>`;
  } else {
    actions += `<button class="action-btn deactivate" onclick="confirmDeactivate('${user._id}')" title="Deactivate"><i class="fas fa-ban"></i></button>`;
  }
  actions += `<button class="action-btn delete" onclick="confirmDelete('${user._id}')" title="Delete"><i class="fas fa-trash"></i></button>`;
  return actions;
}

function renderEmptyState(message) {
  document.getElementById('usersTableBody').innerHTML = `
    <tr><td colspan="7"><div class="empty-state"><i class="fas fa-users"></i><p>${message}</p></div></td></tr>
  `;
}

// Pagination
function renderPagination() {
  const container = document.getElementById('pagination');
  const { page, pages } = state.pagination;

  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = `<button ${page <= 1 ? 'disabled' : ''} onclick="changePage(${page - 1})"><i class="fas fa-chevron-left"></i></button>`;
  
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(pages, page + 2);

  if (startPage > 1) html += `<button onclick="changePage(1)">1</button>`;
  if (startPage > 2) html += '<span>...</span>';

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="${i === page ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }

  if (endPage < pages - 1) html += '<span>...</span>';
  if (endPage < pages) html += `<button onclick="changePage(${pages})">${pages}</button>`;

  html += `<button ${page >= pages ? 'disabled' : ''} onclick="changePage(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function changePage(page) {
  state.pagination.page = page;
  loadUsers();
}

// Deactivate User (US3-T.2)
function confirmDeactivate(userId) {
  state.currentUserId = userId;
  const user = state.users.find(u => u._id === userId);
  document.getElementById('deactivateMessage').textContent = `Are you sure you want to deactivate ${user?.f_name || 'this user'}?`;
  document.getElementById('deactivateReason').value = '';
  openModal('deactivateModal');
}

async function deactivateUser() {
  try {
    showLoading(true);
    const reason = document.getElementById('deactivateReason').value.trim();
    await apiRequest(`/${state.currentUserId}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    showToast('User deactivated successfully', 'success');
    closeModal('deactivateModal');
    loadUsers();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to deactivate user', 'error');
  } finally {
    showLoading(false);
  }
}

async function reactivateUser(userId) {
  try {
    showLoading(true);
    await apiRequest(`/${userId}/reactivate`, { method: 'POST' });
    showToast('User reactivated successfully', 'success');
    loadUsers();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to reactivate user', 'error');
  } finally {
    showLoading(false);
  }
}

// Delete User (US3-T.3)
function confirmDelete(userId) {
  state.currentUserId = userId;
  const user = state.users.find(u => u._id === userId);
  document.getElementById('deleteMessage').textContent = `Are you sure you want to delete ${user?.f_name || 'this user'}?`;
  document.getElementById('forceDelete').checked = false;
  openModal('deleteModal');
}

async function deleteUser() {
  try {
    showLoading(true);
    const force = document.getElementById('forceDelete').checked;
    await apiRequest(`/${state.currentUserId}?force=${force}`, { method: 'DELETE' });
    showToast(force ? 'User permanently deleted' : 'User deleted successfully', 'success');
    closeModal('deleteModal');
    loadUsers();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to delete user', 'error');
  } finally {
    showLoading(false);
  }
}

async function restoreUser(userId) {
  try {
    showLoading(true);
    await apiRequest(`/${userId}/restore`, { method: 'POST' });
    showToast('User restored successfully', 'success');
    loadUsers();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to restore user', 'error');
  } finally {
    showLoading(false);
  }
}

// Bulk Actions
function updateBulkActions() {
  const bulkContainer = document.getElementById('bulkActions');
  const countSpan = document.getElementById('selectedCount');
  if (state.selectedUsers.length > 0) {
    bulkContainer.style.display = 'flex';
    countSpan.textContent = `${state.selectedUsers.length} selected`;
  } else {
    bulkContainer.style.display = 'none';
  }
}

async function bulkAction(action) {
  if (state.selectedUsers.length === 0) return;
  try {
    showLoading(true);
    await apiRequest('/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids: state.selectedUsers, action })
    });
    showToast(`${state.selectedUsers.length} users ${action}d`, 'success');
    state.selectedUsers = [];
    document.getElementById('selectAll').checked = false;
    loadUsers();
    loadStats();
  } catch (err) {
    showToast(err.message || `Failed to ${action} users`, 'error');
  } finally {
    showLoading(false);
  }
}

// Auth Check
async function checkAuth() {
  const token = getToken();
  if (!token) { window.location.href = '../login.html'; return false; }

  try {
    const response = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error('Not authenticated');
    
    const user = await response.json();
    if (user.role !== 'admin') {
      showToast('Access denied. Admin privileges required.', 'error');
      setTimeout(() => { window.location.href = '../dashboard.html'; }, 2000);
      return false;
    }
    document.getElementById('adminName').textContent = `${user.f_name} ${user.l_name}`;
    return true;
  } catch (err) {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
    return false;
  }
}

// Event Listeners
function initEventListeners() {
  // Search
  document.getElementById('userSearch').addEventListener('input', debounce((e) => {
    state.filters.search = e.target.value;
    state.pagination.page = 1;
    loadUsers();
  }, 300));

  // Filters
  document.getElementById('roleFilter').addEventListener('change', (e) => {
    state.filters.role = e.target.value;
    state.pagination.page = 1;
    loadUsers();
  });

  document.getElementById('statusFilter').addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    state.pagination.page = 1;
    loadUsers();
  });

  // Select All
  document.getElementById('selectAll').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.user-checkbox:not(:disabled)');
    checkboxes.forEach(cb => {
      cb.checked = e.target.checked;
      const id = cb.value;
      if (e.target.checked && !state.selectedUsers.includes(id)) {
        state.selectedUsers.push(id);
      } else if (!e.target.checked) {
        state.selectedUsers = state.selectedUsers.filter(u => u !== id);
      }
    });
    updateBulkActions();
  });

  // Individual checkboxes
  document.getElementById('usersTableBody').addEventListener('change', (e) => {
    if (e.target.classList.contains('user-checkbox')) {
      const id = e.target.value;
      if (e.target.checked) {
        if (!state.selectedUsers.includes(id)) state.selectedUsers.push(id);
      } else {
        state.selectedUsers = state.selectedUsers.filter(u => u !== id);
      }
      updateBulkActions();
    }
  });

  // Bulk actions
  document.getElementById('bulkDeactivateBtn').addEventListener('click', () => bulkAction('deactivate'));
  document.getElementById('bulkReactivateBtn').addEventListener('click', () => bulkAction('reactivate'));
  document.getElementById('bulkDeleteBtn').addEventListener('click', () => bulkAction('delete'));

  // Modal close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Close modal on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal.id); });
  });

  // Confirm buttons
  document.getElementById('confirmDeactivateBtn').addEventListener('click', deactivateUser);
  document.getElementById('confirmDeleteBtn').addEventListener('click', deleteUser);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
  });

  // Mobile menu
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });
}

// Initialize
async function init() {
  document.getElementById('dateDisplay').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const isAuth = await checkAuth();
  if (!isAuth) return;

  initEventListeners();
  loadStats();
  loadUsers();
}

document.addEventListener('DOMContentLoaded', init);

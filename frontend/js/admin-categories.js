/**
 * Admin Categories Management - Recipe Management System (US1)
 */

const API_BASE = '/api/admin/categories';

// State
const state = {
  categories: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  filters: { search: '', status: 'all' },
  editingCategoryId: null
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
    throw new Error(data.error?.message || data.message || 'Request failed');
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

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Modal Functions
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
    document.getElementById('totalCategories').textContent = stats.total || 0;
    document.getElementById('activeCategories').textContent = stats.active || 0;
    document.getElementById('inactiveCategories').textContent = stats.inactive || 0;
  } catch (err) {
    console.error('Load stats error:', err);
  }
}

// Load Categories
async function loadCategories() {
  try {
    showLoading(true);
    const { page, limit } = state.pagination;
    const { search, status } = state.filters;
    const queryParams = new URLSearchParams({ page, limit, search, status });
    const response = await apiRequest(`?${queryParams}`);
    
    state.categories = response.data;
    state.pagination = response.pagination;
    renderCategoriesGrid();
    renderPagination();
  } catch (err) {
    console.error('Load categories error:', err);
    showToast('Failed to load categories', 'error');
    renderEmptyState('No categories found');
  } finally {
    showLoading(false);
  }
}

function renderCategoriesGrid() {
  const grid = document.getElementById('categoriesGrid');
  const categories = state.categories;

  if (categories.length === 0) {
    renderEmptyState('No categories found');
    return;
  }

  grid.innerHTML = categories.map(category => `
    <div class="category-card ${category.isActive ? '' : 'inactive'}" data-id="${category._id}">
      <div class="category-header">
        <div class="category-icon" style="background: ${category.color}">
          <i class="fas ${category.icon}"></i>
        </div>
        <div class="category-title">
          <h3>${escapeHtml(category.name)}</h3>
          <span class="badge ${category.isActive ? 'badge-active' : 'badge-inactive'}">
            ${category.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div class="category-body">
        <p class="category-description">${escapeHtml(category.description) || 'No description'}</p>
        <div class="category-meta">
          <span><i class="fas fa-book"></i> ${category.recipeCount || 0} recipes</span>
        </div>
      </div>
      <div class="category-footer">
        <button class="btn btn-sm btn-outline" onclick="editCategory('${category._id}')" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline" onclick="toggleCategory('${category._id}')" title="${category.isActive ? 'Deactivate' : 'Activate'}">
          <i class="fas ${category.isActive ? 'fa-pause' : 'fa-play'}"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="confirmDelete('${category._id}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderEmptyState(message) {
  document.getElementById('categoriesGrid').innerHTML = `
    <div class="empty-state">
      <i class="fas fa-folder-open"></i>
      <p>${message}</p>
    </div>
  `;
}

// Pagination
function renderPagination() {
  const container = document.getElementById('pagination');
  const { page, pages } = state.pagination;
  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = `<button ${page <= 1 ? 'disabled' : ''} onclick="changePage(${page - 1})"><i class="fas fa-chevron-left"></i></button>`;
  
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      html += `<button class="${i === page ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += '<span>...</span>';
    }
  }

  html += `<button ${page >= pages ? 'disabled' : ''} onclick="changePage(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function changePage(page) {
  state.pagination.page = page;
  loadCategories();
}

// Add/Edit Category
function openAddModal() {
  state.editingCategoryId = null;
  document.getElementById('modalTitle').textContent = 'Add Category';
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryColor').value = '#4CAF50';
  document.getElementById('categoryActive').checked = true;
  openModal('categoryModal');
}

async function editCategory(categoryId) {
  try {
    showLoading(true);
    const response = await apiRequest(`/${categoryId}`);
    const category = response.data;
    
    state.editingCategoryId = categoryId;
    document.getElementById('modalTitle').textContent = 'Edit Category';
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryIcon').value = category.icon || 'fa-utensils';
    document.getElementById('categoryColor').value = category.color || '#4CAF50';
    document.getElementById('categoryActive').checked = category.isActive;
    
    openModal('categoryModal');
  } catch (err) {
    showToast(err.message || 'Failed to load category', 'error');
  } finally {
    showLoading(false);
  }
}

async function saveCategory() {
  try {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    const icon = document.getElementById('categoryIcon').value;
    const color = document.getElementById('categoryColor').value;
    const isActive = document.getElementById('categoryActive').checked;

    if (!name) {
      showToast('Category name is required', 'warning');
      return;
    }

    showLoading(true);

    const payload = { name, description, icon, color, isActive };
    
    if (state.editingCategoryId) {
      // Update existing category
      await apiRequest(`/${state.editingCategoryId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Category updated successfully', 'success');
    } else {
      // Create new category
      await apiRequest('', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Category created successfully', 'success');
    }

    closeModal('categoryModal');
    loadCategories();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to save category', 'error');
  } finally {
    showLoading(false);
  }
}

// Toggle Category Status
async function toggleCategory(categoryId) {
  try {
    showLoading(true);
    await apiRequest(`/${categoryId}/toggle`, { method: 'PATCH' });
    showToast('Category status updated', 'success');
    loadCategories();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to update category', 'error');
  } finally {
    showLoading(false);
  }
}

// Delete Category
function confirmDelete(categoryId) {
  state.editingCategoryId = categoryId;
  const category = state.categories.find(c => c._id === categoryId);
  document.getElementById('deleteMessage').textContent = 
    `Are you sure you want to delete "${category?.name || 'this category'}"?`;
  openModal('deleteModal');
}

async function deleteCategory() {
  try {
    showLoading(true);
    await apiRequest(`/${state.editingCategoryId}`, { method: 'DELETE' });
    showToast('Category deleted successfully', 'success');
    closeModal('deleteModal');
    loadCategories();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to delete category', 'error');
  } finally {
    showLoading(false);
  }
}

// Auth Check
async function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = '../login.html';
    return false;
  }

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
  document.getElementById('categorySearch').addEventListener('input', debounce((e) => {
    state.filters.search = e.target.value;
    state.pagination.page = 1;
    loadCategories();
  }, 300));

  // Status filter
  document.getElementById('statusFilter').addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    state.pagination.page = 1;
    loadCategories();
  });

  // Add category button
  document.getElementById('addCategoryBtn').addEventListener('click', openAddModal);

  // Save category button
  document.getElementById('saveCategoryBtn').addEventListener('click', saveCategory);

  // Confirm delete button
  document.getElementById('confirmDeleteBtn').addEventListener('click', deleteCategory);

  // Modal close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Close modal on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal.id); });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
  });

  // Mobile menu
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });

  // Form submit on Enter
  document.getElementById('categoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveCategory();
  });
}

// Initialize
async function init() {
  const isAuth = await checkAuth();
  if (!isAuth) return;

  initEventListeners();
  loadStats();
  loadCategories();
}

document.addEventListener('DOMContentLoaded', init);

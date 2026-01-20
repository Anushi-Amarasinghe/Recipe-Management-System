/**
 * Admin Recipes Management - Recipe Management System (US2)
 */

const API_BASE = '/api/admin/recipes';

// State
const state = {
  recipes: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  filters: { search: '', difficulty: 'all' },
  selectedRecipes: [],
  currentRecipeId: null
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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
    document.getElementById('totalRecipes').textContent = stats.total || 0;
    document.getElementById('easyRecipes').textContent = stats.byDifficulty?.easy || 0;
    document.getElementById('mediumRecipes').textContent = stats.byDifficulty?.medium || 0;
    document.getElementById('hardRecipes').textContent = stats.byDifficulty?.hard || 0;
  } catch (err) {
    console.error('Load stats error:', err);
  }
}

// Load Recipes
async function loadRecipes() {
  try {
    showLoading(true);
    const { page, limit } = state.pagination;
    const { search, difficulty } = state.filters;
    const queryParams = new URLSearchParams({ page, limit, search, difficulty });
    const response = await apiRequest(`?${queryParams}`);
    
    state.recipes = response.data;
    state.pagination = response.pagination;
    renderRecipesTable();
    renderPagination();
  } catch (err) {
    console.error('Load recipes error:', err);
    showToast('Failed to load recipes', 'error');
    renderEmptyState('No recipes found');
  } finally {
    showLoading(false);
  }
}

function renderRecipesTable() {
  const tbody = document.getElementById('recipesTableBody');
  const recipes = state.recipes;

  if (recipes.length === 0) {
    renderEmptyState('No recipes found');
    return;
  }

  tbody.innerHTML = recipes.map(recipe => `
    <tr data-id="${recipe._id}">
      <td><input type="checkbox" class="recipe-checkbox" value="${recipe._id}" /></td>
      <td>
        <div class="recipe-cell">
          <div class="recipe-thumb">
            <i class="fas fa-utensils"></i>
          </div>
          <div class="cell-info">
            <span class="title">${escapeHtml(recipe.title)}</span>
            <span class="sub">${recipe.ingredients?.length || 0} ingredients</span>
          </div>
        </div>
      </td>
      <td>
        <div class="author-cell">
          <div class="author-avatar">${recipe.user ? getInitials(recipe.user.f_name, recipe.user.l_name) : '??'}</div>
          <span>${recipe.user ? `${recipe.user.f_name} ${recipe.user.l_name}` : 'Unknown'}</span>
        </div>
      </td>
      <td><span class="badge badge-${recipe.difficulty || 'easy'}">${recipe.difficulty || 'easy'}</span></td>
      <td>${recipe.cookingTime ? recipe.cookingTime + ' min' : '-'}</td>
      <td>${formatDate(recipe.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn view" onclick="viewRecipe('${recipe._id}')" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn delete" onclick="confirmDelete('${recipe._id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  state.selectedRecipes = [];
  updateBulkActions();
}

function renderEmptyState(message) {
  document.getElementById('recipesTableBody').innerHTML = `
    <tr><td colspan="7"><div class="empty-state"><i class="fas fa-book-open"></i><p>${message}</p></div></td></tr>
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

  if (startPage > 1) {
    html += `<button onclick="changePage(1)">1</button>`;
    if (startPage > 2) html += '<span>...</span>';
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="${i === page ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }

  if (endPage < pages) {
    if (endPage < pages - 1) html += '<span>...</span>';
    html += `<button onclick="changePage(${pages})">${pages}</button>`;
  }

  html += `<button ${page >= pages ? 'disabled' : ''} onclick="changePage(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function changePage(page) {
  state.pagination.page = page;
  loadRecipes();
}

// View Recipe
async function viewRecipe(recipeId) {
  try {
    showLoading(true);
    state.currentRecipeId = recipeId;
    const response = await apiRequest(`/${recipeId}`);
    const recipe = response.data;
    
    document.getElementById('viewRecipeTitle').textContent = recipe.title;
    document.getElementById('recipeDetails').innerHTML = `
      <div class="recipe-meta">
        <div class="meta-item">
          <i class="fas fa-user"></i>
          <span>${recipe.user ? `${recipe.user.f_name} ${recipe.user.l_name}` : 'Unknown'}</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-clock"></i>
          <span>${recipe.cookingTime ? recipe.cookingTime + ' min' : 'Not specified'}</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-signal"></i>
          <span>${recipe.difficulty || 'Easy'}</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-calendar"></i>
          <span>${formatDate(recipe.createdAt)}</span>
        </div>
      </div>
      
      <div class="detail-section">
        <h4><i class="fas fa-carrot"></i> Ingredients</h4>
        <ul>
          ${(recipe.ingredients || []).map(ing => `<li>${escapeHtml(ing)}</li>`).join('')}
        </ul>
      </div>
      
      <div class="detail-section">
        <h4><i class="fas fa-list-ol"></i> Instructions</h4>
        <p>${escapeHtml(recipe.instructions)}</p>
      </div>
    `;
    
    openModal('viewModal');
  } catch (err) {
    showToast(err.message || 'Failed to load recipe', 'error');
  } finally {
    showLoading(false);
  }
}

// Delete Recipe
function confirmDelete(recipeId) {
  state.currentRecipeId = recipeId;
  const recipe = state.recipes.find(r => r._id === recipeId);
  document.getElementById('deleteMessage').textContent = 
    `Are you sure you want to delete "${recipe?.title || 'this recipe'}"?`;
  openModal('deleteModal');
}

async function deleteRecipe() {
  try {
    showLoading(true);
    await apiRequest(`/${state.currentRecipeId}`, { method: 'DELETE' });
    showToast('Recipe deleted successfully', 'success');
    closeModal('deleteModal');
    closeModal('viewModal');
    loadRecipes();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to delete recipe', 'error');
  } finally {
    showLoading(false);
  }
}

// Bulk Actions
function updateBulkActions() {
  const bulkContainer = document.getElementById('bulkActions');
  const countSpan = document.getElementById('selectedCount');
  if (state.selectedRecipes.length > 0) {
    bulkContainer.style.display = 'flex';
    countSpan.textContent = `${state.selectedRecipes.length} selected`;
  } else {
    bulkContainer.style.display = 'none';
  }
}

async function bulkDelete() {
  if (state.selectedRecipes.length === 0) return;
  
  if (!confirm(`Are you sure you want to delete ${state.selectedRecipes.length} recipes?`)) {
    return;
  }
  
  try {
    showLoading(true);
    await apiRequest('/bulk-delete', { 
      method: 'POST', 
      body: JSON.stringify({ ids: state.selectedRecipes }) 
    });
    showToast(`${state.selectedRecipes.length} recipes deleted`, 'success');
    state.selectedRecipes = [];
    document.getElementById('selectAll').checked = false;
    loadRecipes();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to delete recipes', 'error');
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
  document.getElementById('recipeSearch').addEventListener('input', debounce((e) => {
    state.filters.search = e.target.value;
    state.pagination.page = 1;
    loadRecipes();
  }, 300));

  // Difficulty filter
  document.getElementById('difficultyFilter').addEventListener('change', (e) => {
    state.filters.difficulty = e.target.value;
    state.pagination.page = 1;
    loadRecipes();
  });

  // Select All
  document.getElementById('selectAll').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.recipe-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = e.target.checked;
      const id = cb.value;
      if (e.target.checked && !state.selectedRecipes.includes(id)) {
        state.selectedRecipes.push(id);
      } else if (!e.target.checked) {
        state.selectedRecipes = state.selectedRecipes.filter(r => r !== id);
      }
    });
    updateBulkActions();
  });

  // Individual checkbox
  document.getElementById('recipesTableBody').addEventListener('change', (e) => {
    if (e.target.classList.contains('recipe-checkbox')) {
      const id = e.target.value;
      if (e.target.checked) {
        if (!state.selectedRecipes.includes(id)) state.selectedRecipes.push(id);
      } else {
        state.selectedRecipes = state.selectedRecipes.filter(r => r !== id);
      }
      updateBulkActions();
    }
  });

  // Bulk delete button
  document.getElementById('bulkDeleteBtn').addEventListener('click', bulkDelete);

  // Confirm delete button
  document.getElementById('confirmDeleteBtn').addEventListener('click', deleteRecipe);

  // View modal delete button
  document.getElementById('viewDeleteBtn').addEventListener('click', () => {
    closeModal('viewModal');
    confirmDelete(state.currentRecipeId);
  });

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
  loadRecipes();
}

document.addEventListener('DOMContentLoaded', init);

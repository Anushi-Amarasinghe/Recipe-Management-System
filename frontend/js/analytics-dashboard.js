/**
 * HD Feature: Analytics Dashboard JavaScript
 * 
 * Features:
 * - Real-time data fetching
 * - Chart.js visualizations
 * - Smart insights generation
 * - Activity feed
 * - Auto-refresh capability
 */

const API_BASE = '/api/admin/analytics';

// Chart instances (for updating)
let recipesTrendChart = null;
let usersTrendChart = null;
let difficultyChart = null;
let cookingTimeChart = null;

// Chart color schemes
const colors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  purple: '#9c27b0',
  orange: '#ff9800',
  danger: '#f44336',
  easy: '#43e97b',
  medium: '#ffd700',
  hard: '#f44336',
  gradient: {
    green: ['rgba(67, 233, 123, 0.8)', 'rgba(56, 249, 215, 0.8)'],
    blue: ['rgba(79, 172, 254, 0.8)', 'rgba(0, 242, 254, 0.8)'],
    purple: ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)'],
    orange: ['rgba(250, 112, 154, 0.8)', 'rgba(254, 225, 64, 0.8)']
  }
};

// Utilities
function getToken() {
  return localStorage.getItem('token');
}

async function apiRequest(endpoint) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  return response.json();
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showLoading(show = true) {
  document.getElementById('loadingOverlay').classList.toggle('active', show);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// Load Overview Stats
async function loadOverviewStats() {
  try {
    const response = await apiRequest('/overview');
    const data = response.data;
    
    // Update totals
    animateNumber('totalUsers', data.totals.users);
    animateNumber('totalRecipes', data.totals.recipes);
    animateNumber('totalCategories', data.totals.categories);
    animateNumber('activeUsers', data.totals.activeUsers);
    
    // Update today stats
    document.getElementById('newUsersToday').textContent = data.today.newUsers;
    document.getElementById('newRecipesToday').textContent = data.today.newRecipes;
    
    // Update growth badges
    updateGrowthBadge('userGrowth', data.growth.usersWeekly);
    updateGrowthBadge('recipeGrowth', data.growth.recipesWeekly);
    
  } catch (err) {
    console.error('Load overview error:', err);
  }
}

function animateNumber(elementId, target) {
  const element = document.getElementById(elementId);
  const start = parseInt(element.textContent) || 0;
  const duration = 1000;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeOut);
    element.textContent = current.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

function updateGrowthBadge(elementId, growth) {
  const badge = document.getElementById(elementId);
  const isNegative = growth < 0;
  
  badge.innerHTML = `
    <i class="fas fa-arrow-${isNegative ? 'down' : 'up'}"></i> ${Math.abs(growth)}%
  `;
  badge.classList.toggle('negative', isNegative);
}

// Load and Render Recipe Trends Chart
async function loadRecipesTrend(days = 30) {
  try {
    const response = await apiRequest(`/recipes-over-time?days=${days}`);
    const data = response.data.trend;
    
    const ctx = document.getElementById('recipesTrendChart').getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(76, 175, 80, 0.3)');
    gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
    
    const chartData = {
      labels: data.map(d => formatDate(d.date)),
      datasets: [
        {
          label: 'Total Recipes',
          data: data.map(d => d.count),
          borderColor: colors.primary,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'Easy',
          data: data.map(d => d.easy),
          borderColor: colors.easy,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Medium',
          data: data.map(d => d.medium),
          borderColor: colors.medium,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Hard',
          data: data.map(d => d.hard),
          borderColor: colors.hard,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0
        }
      ]
    };
    
    if (recipesTrendChart) {
      recipesTrendChart.data = chartData;
      recipesTrendChart.update();
    } else {
      recipesTrendChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { usePointStyle: true, padding: 20 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            },
            x: {
              grid: { display: false }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }
  } catch (err) {
    console.error('Load recipes trend error:', err);
  }
}

// Load and Render Users Trend Chart
async function loadUsersTrend() {
  try {
    const response = await apiRequest('/users-over-time?days=30');
    const data = response.data.trend;
    
    const ctx = document.getElementById('usersTrendChart').getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(33, 150, 243, 0.3)');
    gradient.addColorStop(1, 'rgba(33, 150, 243, 0)');
    
    const chartData = {
      labels: data.map(d => formatDate(d.date)),
      datasets: [{
        label: 'New Users',
        data: data.map(d => d.count),
        borderColor: colors.secondary,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    };
    
    if (usersTrendChart) {
      usersTrendChart.data = chartData;
      usersTrendChart.update();
    } else {
      usersTrendChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  } catch (err) {
    console.error('Load users trend error:', err);
  }
}

// Load and Render Difficulty Distribution Chart
async function loadDifficultyDistribution() {
  try {
    const response = await apiRequest('/difficulty-distribution');
    const data = response.data.distribution;
    
    const ctx = document.getElementById('difficultyChart').getContext('2d');
    
    const chartData = {
      labels: data.map(d => d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1)),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: [colors.easy, colors.medium, colors.hard],
        borderWidth: 0,
        hoverOffset: 10
      }]
    };
    
    if (difficultyChart) {
      difficultyChart.data = chartData;
      difficultyChart.update();
    } else {
      difficultyChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          cutout: '65%'
        }
      });
    }
    
    // Update custom legend
    const legendContainer = document.getElementById('difficultyLegend');
    legendContainer.innerHTML = data.map(d => `
      <div class="legend-item">
        <span class="legend-dot" style="background: ${d.difficulty === 'easy' ? colors.easy : d.difficulty === 'medium' ? colors.medium : colors.hard}"></span>
        <span>${d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1)}: ${d.count} (${d.percentage}%)</span>
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Load difficulty distribution error:', err);
  }
}

// Load and Render Cooking Time Chart
async function loadCookingTimeAnalysis() {
  try {
    const response = await apiRequest('/cooking-time-analysis');
    const data = response.data.distribution;
    
    const ctx = document.getElementById('cookingTimeChart').getContext('2d');
    
    const chartData = {
      labels: data.map(d => d.range),
      datasets: [{
        label: 'Recipes',
        data: data.map(d => d.count),
        backgroundColor: [
          'rgba(67, 233, 123, 0.7)',
          'rgba(79, 172, 254, 0.7)',
          'rgba(255, 215, 0, 0.7)',
          'rgba(255, 152, 0, 0.7)',
          'rgba(244, 67, 54, 0.7)'
        ],
        borderRadius: 8,
        borderSkipped: false
      }]
    };
    
    if (cookingTimeChart) {
      cookingTimeChart.data = chartData;
      cookingTimeChart.update();
    } else {
      cookingTimeChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  } catch (err) {
    console.error('Load cooking time analysis error:', err);
  }
}

// Load Smart Insights
async function loadInsights() {
  try {
    const response = await apiRequest('/insights');
    const insights = response.data.insights;
    
    const container = document.getElementById('insightsList');
    
    if (insights.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-lightbulb"></i><p>No insights available</p></div>';
      return;
    }
    
    container.innerHTML = insights.map(insight => `
      <div class="insight-item ${insight.type}">
        <div class="insight-icon">
          <i class="fas ${insight.icon}"></i>
        </div>
        <div class="insight-content">
          <h4>${insight.title}</h4>
          <p>${insight.message}</p>
        </div>
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Load insights error:', err);
  }
}

// Load Top Contributors
async function loadTopContributors() {
  try {
    const response = await apiRequest('/top-contributors?limit=5');
    const contributors = response.data.contributors;
    
    const container = document.getElementById('contributorsList');
    
    if (contributors.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>No contributors yet</p></div>';
      return;
    }
    
    container.innerHTML = contributors.map((contributor, index) => {
      const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default';
      return `
        <div class="contributor-item">
          <div class="contributor-rank ${rankClass}">${contributor.rank}</div>
          <div class="contributor-avatar">${getInitials(contributor.user.name)}</div>
          <div class="contributor-info">
            <h4>${contributor.user.name}</h4>
            <p>Avg ${contributor.avgCookingTime || 0} min cooking time</p>
          </div>
          <div class="contributor-stats">
            <div class="count">${contributor.recipeCount}</div>
            <div class="label">recipes</div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (err) {
    console.error('Load top contributors error:', err);
  }
}

// Load Recent Activity
async function loadRecentActivity() {
  try {
    const response = await apiRequest('/recent-activity?limit=15');
    const activities = response.data.activities;
    
    const container = document.getElementById('activityFeed');
    
    if (activities.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>No recent activity</p></div>';
      return;
    }
    
    container.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon" style="background: ${activity.color}20; color: ${activity.color}">
          <i class="fas ${activity.icon}"></i>
        </div>
        <div class="activity-content">
          <p>${activity.message}</p>
          ${activity.details ? `<div class="details">${activity.details}</div>` : ''}
        </div>
        <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Load recent activity error:', err);
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
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
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

// Load All Dashboard Data
async function loadDashboard() {
  showLoading(true);
  
  try {
    await Promise.all([
      loadOverviewStats(),
      loadRecipesTrend(),
      loadUsersTrend(),
      loadDifficultyDistribution(),
      loadCookingTimeAnalysis(),
      loadInsights(),
      loadTopContributors(),
      loadRecentActivity()
    ]);
    
    document.getElementById('lastUpdated').textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('Failed to load some data', 'error');
  } finally {
    showLoading(false);
  }
}

// Event Listeners
function initEventListeners() {
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadDashboard();
    showToast('Dashboard refreshed!', 'success');
  });
  
  // Trend period selector
  document.getElementById('trendPeriod').addEventListener('change', (e) => {
    loadRecipesTrend(e.target.value);
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
  });
  
  // Mobile menu toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });
}

// Initialize Dashboard
async function init() {
  const isAuth = await checkAuth();
  if (!isAuth) return;
  
  initEventListeners();
  loadDashboard();
  
  // Auto-refresh every 5 minutes
  setInterval(loadDashboard, 5 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', init);

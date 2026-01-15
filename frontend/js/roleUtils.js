// roleUtils.js - Role-based access control utilities for frontend

/**
 * Decode JWT token to get user role
 * @returns {string|null} User role or null if token invalid/missing
 */
function getUserRole() {
  try {
    // Get token using centralized utility
    let token = null;
    if (window.tokenStorage && window.tokenStorage.getToken) {
      token = window.tokenStorage.getToken();
    } else {
      token = localStorage.getItem("token");
    }
    if (!token) return null;

    // JWT token has 3 parts separated by dots: header.payload.signature
    const payload = token.split(".")[1];
    if (!payload) return null;

    // Decode base64 payload
    const decoded = JSON.parse(atob(payload));
    return decoded.role || null;
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
}

/**
 * Get user ID from token
 * @returns {string|null} User ID or null if token invalid/missing
 */
function getUserId() {
  try {
    // Get token using centralized utility
    let token = null;
    if (window.tokenStorage && window.tokenStorage.getToken) {
      token = window.tokenStorage.getToken();
    } else {
      token = localStorage.getItem("token");
    }
    if (!token) return null;

    const payload = token.split(".")[1];
    if (!payload) return null;

    const decoded = JSON.parse(atob(payload));
    return decoded.id || null;
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
}

/**
 * Check if current user is admin
 * @returns {boolean} True if user is admin
 */
function isAdmin() {
  return getUserRole() === "admin";
}

/**
 * Check if current user is regular user
 * @returns {boolean} True if user is regular user
 */
function isUser() {
  return getUserRole() === "user";
}

/**
 * Check if user has specific role
 * @param {string} role - Role to check ('admin' or 'user')
 * @returns {boolean} True if user has the role
 */
function hasRole(role) {
  return getUserRole() === role;
}

/**
 * Show/hide elements based on user role
 * @param {string} role - Required role ('admin' or 'user')
 * @param {string} selector - CSS selector for elements to show/hide
 * @param {boolean} showIfHasRole - If true, show when role matches; if false, hide when role matches
 */
function toggleElementsByRole(role, selector, showIfHasRole = true) {
  const elements = document.querySelectorAll(selector);
  const hasRequiredRole = hasRole(role);

  elements.forEach(element => {
    if (showIfHasRole) {
      element.style.display = hasRequiredRole ? "" : "none";
    } else {
      element.style.display = hasRequiredRole ? "none" : "";
    }
  });
}

/**
 * Add admin badge to element if user is admin
 * @param {HTMLElement} element - Element to add badge to
 */
function addAdminBadge(element) {
  if (isAdmin() && element) {
    const badge = document.createElement("span");
    badge.className = "admin-badge";
    badge.textContent = "Admin";
    badge.style.cssText = `
      background: #ff6b6b;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      margin-left: 8px;
      text-transform: uppercase;
    `;
    element.appendChild(badge);
  }
}

// Make functions globally available
window.getUserRole = getUserRole;
window.getUserId = getUserId;
window.isAdmin = isAdmin;
window.isUser = isUser;
window.hasRole = hasRole;
window.toggleElementsByRole = toggleElementsByRole;
window.addAdminBadge = addAdminBadge;


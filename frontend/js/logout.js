// logout.js - Centralized logout utility

/**
 * Comprehensive logout function
 * Clears all user data and redirects to login
 * @param {boolean} showConfirmation - Whether to show confirmation dialog
 * @returns {Promise<void>}
 */
async function logout(showConfirmation = false) {
  // Optional confirmation dialog
  if (showConfirmation) {
    const confirmed = confirm("Are you sure you want to logout?");
    if (!confirmed) {
      return;
    }
  }

  // Get token using centralized utility
  let token = null;
  if (window.tokenStorage && window.tokenStorage.getToken) {
    token = window.tokenStorage.getToken();
  } else {
    token = localStorage.getItem("token");
  }

  // Call backend logout endpoint if token exists
  if (token) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      // Even if backend call fails, continue with logout
      console.error("Logout API call failed:", err);
    }
  }

  // Clear all user-related data from localStorage
  if (window.tokenStorage && window.tokenStorage.removeToken) {
    window.tokenStorage.removeToken();
  } else {
    localStorage.removeItem("token");
  }
  localStorage.removeItem("rememberedEmail");
  // Add any other user-specific data keys here if needed
  // localStorage.removeItem("userPreferences");
  // localStorage.removeItem("userSettings");

  // Clear sessionStorage as well (if any)
  sessionStorage.clear();

  // Redirect to login page
  window.location.href = "login.html";
}

// Make logout function globally available
window.logout = logout;


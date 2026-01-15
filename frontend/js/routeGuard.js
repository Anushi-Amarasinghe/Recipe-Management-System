// routeGuard.js - Frontend route protection/auth guard

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
function isAuthenticated() {
  try {
    if (window.tokenStorage && window.tokenStorage.hasValidToken) {
      return window.tokenStorage.hasValidToken();
    }
    
    // Fallback check
    const token = localStorage.getItem("token");
    return token !== null && token.length > 0;
  } catch (err) {
    console.error("Error checking authentication:", err);
    return false;
  }
}

/**
 * Protect a route - redirects to login if not authenticated
 * @param {Function} callback - Function to execute if authenticated
 * @param {string} redirectTo - Redirect path if not authenticated (default: login.html)
 */
function protectRoute(callback, redirectTo = "login.html") {
  if (!isAuthenticated()) {
    // Clear any invalid token
    if (window.tokenStorage && window.tokenStorage.removeToken) {
      window.tokenStorage.removeToken();
    } else {
      localStorage.removeItem("token");
    }
    
    // Redirect to login
    window.location.href = redirectTo;
    return;
  }

  // User is authenticated, execute callback
  if (typeof callback === "function") {
    callback();
  }
}

/**
 * Guard function for recipe pages
 * Ensures user is authenticated before loading recipe content
 */
function guardRecipeRoutes() {
  protectRoute(() => {
    // User is authenticated, allow page to load
    console.log("Recipe route protected - user authenticated");
  });
}

/**
 * Make API request with authentication
 * Automatically adds Authorization header with token
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function authenticatedFetch(url, options = {}) {
  // Get token
  let token = null;
  if (window.tokenStorage && window.tokenStorage.getToken) {
    token = window.tokenStorage.getToken();
  } else {
    token = localStorage.getItem("token");
  }

  if (!token) {
    throw new Error("No authentication token available");
  }

  // Add Authorization header
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // If unauthorized, redirect to login
  if (response.status === 401) {
    if (window.tokenStorage && window.tokenStorage.removeToken) {
      window.tokenStorage.removeToken();
    } else {
      localStorage.removeItem("token");
    }
    window.location.href = "login.html";
    throw new Error("Unauthorized - redirecting to login");
  }

  return response;
}

// Make functions globally available
window.routeGuard = {
  isAuthenticated,
  protectRoute,
  guardRecipeRoutes,
  authenticatedFetch
};

// Auto-protect recipe pages if loaded on recipe-related pages
if (typeof window !== "undefined") {
  // Check if we're on a recipe page
  const currentPath = window.location.pathname;
  const recipePages = ["recipes.html", "my-recipes.html", "favourites.html"];
  const isRecipePage = recipePages.some(page => currentPath.includes(page));
  
  // Also check if we're in dashboard (which loads recipe pages dynamically)
  const isDashboard = currentPath.includes("dashboard.html");
  
  // If on recipe page or dashboard, ensure authentication
  if (isRecipePage || isDashboard) {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (!isAuthenticated()) {
          guardRecipeRoutes();
        }
      });
    } else {
      if (!isAuthenticated()) {
        guardRecipeRoutes();
      }
    }
  }
}


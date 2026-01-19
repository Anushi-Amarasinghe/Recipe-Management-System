// adminAuthCheck.js - Route guard for admin-only pages

function redirectToAdminLogin() {
  window.location.href = "admin-login.html";
}

function redirectToUserLogin() {
  window.location.href = "login.html";
}

// Get token from localStorage
const token = localStorage.getItem("token");

// If no token, redirect to admin login
if (!token) {
  redirectToAdminLogin();
  throw new Error("No token found");
}

/**
 * Check if current user is admin and has access
 * Redirects to appropriate login page if not authorized
 */
async function checkAdminAccess() {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // Try to read the error message
      let msg = `Request failed with status ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.error?.message) {
          msg = errBody.error.message;
        } else if (errBody?.message) {
          msg = errBody.message;
        }
      } catch (_) {
        // ignore if not JSON
      }

      console.error("Admin auth check failed:", res.status, msg);

      // Clear token on auth failures
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        redirectToAdminLogin();
        return null;
      }

      // For 500 etc, don't destroy token—surface the issue
      throw new Error(msg);
    }

    const user = await res.json();

    // Verify user is admin
    if (user.role !== "admin") {
      console.warn("Non-admin user attempted to access admin page:", user.email);
      localStorage.removeItem("token");
      alert("Access denied. Admin privileges required.");
      redirectToUserLogin();
      return null;
    }

    // User is admin, allow access
    // Update greeting if element exists
    const greetingEl = document.getElementById("greeting");
    if (greetingEl) {
      greetingEl.textContent = `Hello, ${user.f_name}!`;
    }

    const usernameDisplay = document.getElementById("usernameDisplay");
    if (usernameDisplay) {
      usernameDisplay.textContent = `${user.f_name} ${user.l_name}`;
    }

    return user;
  } catch (err) {
    console.error("checkAdminAccess error:", err);

    // Network errors - don't force logout, but log the issue
    // You might want to show a message to the user
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      console.error("Network error - server may be down");
      // Optionally show a message to user
      // You could show a toast/alert here
    } else {
      // Other errors - clear token and redirect
      localStorage.removeItem("token");
      redirectToAdminLogin();
    }
    return null;
  }
}

// Logout function - calls backend and clears local storage
async function logout() {
  const token = localStorage.getItem("token");
  
  // Call backend logout endpoint if token exists
  if (token) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      // Even if backend call fails, proceed with client-side logout
      console.error("Logout API call failed:", err);
    }
  }
  
  // Clear token and admin remembered email from localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("adminRememberedEmail");
  redirectToAdminLogin();
}

// Logout button handling (if present)
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

// Run immediately on page load
checkAdminAccess();


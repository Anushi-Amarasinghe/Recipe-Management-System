// authCheck.js

function redirectToLogin() {
  window.location.href = "login.html";
}

// Get token from localStorage
const token = localStorage.getItem("token");

// If no token, redirect and stop
if (!token) {
  redirectToLogin();
  throw new Error("No token found");
}

async function loadUser() {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // Try to read the error message (if server sends JSON)
      let msg = `Request failed with status ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.message) msg = errBody.message;
      } catch (_) {
        // ignore if not JSON
      }

      console.error("Auth check failed:", res.status, msg);

      // Only clear token on auth failures
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        redirectToLogin();
        return;
      }

      // For 500 etc, don't destroy token—surface the issue
      throw new Error(msg);
    }

    const data = await res.json();

    const greetingEl = document.getElementById("greeting");
    if (greetingEl) greetingEl.textContent = `Hello, ${data.f_name}!`;

    return data;
  } catch (err) {
    console.error("loadUser error:", err);

    // If this is a network error (server down), you might not want to logout.
    // If you DO want to force logout on any error, uncomment next two lines:
    // localStorage.removeItem("token");
    // redirectToLogin();
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
  
  // Clear token from localStorage
  localStorage.removeItem("token");
  redirectToLogin();
}

// Logout button handling (if present)
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

// Run immediately
loadUser();

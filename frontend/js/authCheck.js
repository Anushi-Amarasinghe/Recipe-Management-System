// frontend/js/authCheck.js

function redirectToLogin() {
  window.location.href = "login.html";
}

// Get token from localStorage
const token = localStorage.getItem("token");

// If no token, redirect immediately
if (!token) {
  redirectToLogin();
  throw new Error("No token found");
}

// Load current logged-in user
async function loadUser() {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      let msg = `Request failed with status ${res.status}`;

      try {
        const errBody = await res.json();
        if (errBody?.message) msg = errBody.message;
      } catch (_) {
        // ignore non-JSON response
      }

      console.error("Auth check failed:", res.status, msg);

      // Only force logout on auth errors
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        redirectToLogin();
        return;
      }

      throw new Error(msg);
    }

    const data = await res.json();

    // Optional greeting
    const greetingEl = document.getElementById("greeting");
    if (greetingEl && data?.f_name) {
      greetingEl.textContent = `Hello, ${data.f_name}!`;
    }

    return data;
  } catch (err) {
    console.error("loadUser error:", err);
    // Do not auto-logout on network/server errors
  }
}

// Logout function
async function logout() {
  const token = localStorage.getItem("token");

  if (token) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
  }

  localStorage.removeItem("token");
  redirectToLogin();
}

// Attach logout button if present
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

// Run on load
loadUser();

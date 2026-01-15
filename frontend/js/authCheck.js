// authCheck.js

// Get token using centralized token storage utility
let token = null;
if (window.tokenStorage && window.tokenStorage.getToken) {
  token = window.tokenStorage.getToken();
} else {
  // Fallback to direct localStorage if utility not loaded
  token = localStorage.getItem("token");
}

if (!token) {
  // Not logged in, redirect to login page
  window.location.href = "login.html";
}

// Store current user data globally
window.currentUser = null;

async function loadUser() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) throw new Error("Not authorized");

    const data = await res.json();
    
    // Store user data globally for role checking
    window.currentUser = data;

    // If there's a greeting element, show username
    const greetingEl = document.getElementById("greeting");
    if (greetingEl) greetingEl.textContent = `Hello, ${data.f_name}!`;

    return data; // return user data if needed
  } catch (err) {
    console.error(err);
    // Use centralized logout function if available, otherwise fallback
    if (typeof window.logout === "function") {
      await window.logout(false); // No confirmation on auth failure
    } else {
      // Remove token using centralized utility
      if (window.tokenStorage && window.tokenStorage.removeToken) {
        window.tokenStorage.removeToken();
      } else {
        localStorage.removeItem("token");
      }
      window.location.href = "login.html";
    }
  }
}

// Logout button handling (if present)
// Uses centralized logout function if available
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (typeof window.logout === "function") {
      await window.logout(false); // No confirmation by default
    } else {
      // Fallback if logout.js not loaded
      if (window.tokenStorage && window.tokenStorage.removeToken) {
        window.tokenStorage.removeToken();
      } else {
        localStorage.removeItem("token");
      }
      localStorage.removeItem("rememberedEmail");
      window.location.href = "login.html";
    }
  });
}

// Run immediately
loadUser();

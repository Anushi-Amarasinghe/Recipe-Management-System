// =========================
// Helpers
// =========================
function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
}

function showError(err, fallback) {
  console.error(err);
  alert(err?.message || fallback);
}

function getEl(id) {
  return document.getElementById(id);
}

// =========================
// Load Settings (fetch data only)
// =========================
async function fetchSettings() {
  const token = getToken();
  if (!token) {
    alert("Please login first");
    return;
  }

  try {
    const res = await fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.message || "Failed to load settings");

    // Profile
    getEl("firstName").value = data.f_name || "";
    getEl("lastName").value = data.l_name || "";
    getEl("email").value = data.email || "";

    // Preferences
    const darkModeEl = getEl("darkModeToggle");
    const emailNotifEl = getEl("emailNotifications");

    if (darkModeEl) {
      darkModeEl.checked = data.mode || false;
      document.body.classList.toggle("dark-mode", darkModeEl.checked);
    }

    if (emailNotifEl) emailNotifEl.checked = !!data.preferences?.emailNotifications;

  } catch (err) {
    showError(err, "Unable to load settings");
  }
}

// =========================
// Update Profile
// =========================
async function updateProfile() {
  const f_name = getEl("firstName").value.trim();
  const l_name = getEl("lastName").value.trim();
  const email = getEl("email").value.trim();

  if (!f_name || !l_name || !email) {
    return showError({ message: "All profile fields are required" });
  }

  try {
    const res = await fetch("/api/users/profile", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ f_name, l_name, email })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Failed with status ${res.status}`);

    alert("Profile updated successfully");
  } catch (err) {
    showError(err, "Failed to update profile");
  }
}

// =========================
// Password Validation
// =========================
const passwordRules = {
  length: /(?=.{8,})/,
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /\d/,
  special: /[^A-Za-z0-9]/
};

function validatePassword(password) {
  const results = {
    length: passwordRules.length.test(password),
    upper: passwordRules.upper.test(password),
    lower: passwordRules.lower.test(password),
    number: passwordRules.number.test(password),
    special: passwordRules.special.test(password)
  };

  Object.keys(results).forEach(key => {
    const el = getEl(`req-${key}`);
    if (el) el.style.color = results[key] ? "green" : "red";
  });

  return Object.values(results).every(Boolean);
}



// =========================
// Change Password
// =========================
async function changePassword() {
  const currentPassword = getEl("currentPassword").value;
  const newPassword = getEl("newPassword").value;
  const confirmPassword = getEl("confirmPassword").value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return alert("Please fill all password fields");
  }

  if (!validatePassword(newPassword)) {
    return alert("New password does not meet all requirements");
  }

  if (newPassword !== confirmPassword) {
    return alert("New passwords do not match");
  }

  try {
    const res = await fetch("/api/users/password", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to change password");

    alert("Password changed successfully");

    // Reset fields
    getEl("currentPassword").value = "";
    getEl("newPassword").value = "";
    getEl("confirmPassword").value = "";
    getEl("passwordRules").style.display = "none";
  } catch (err) {
    showError(err, "Failed to change password");
  }
}

// =========================
// Save Preferences
// =========================
async function savePreferences() {
  const darkMode = getEl("darkModeToggle").checked;
  const emailNotifications = getEl("emailNotifications").checked;

  try {
    const res = await fetch("/api/users/preferences", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ darkMode, emailNotifications })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to save preferences");

    alert("Preferences saved successfully");
  } catch (err) {
    showError(err, "Failed to save preferences");
  }
}

// =========================
// Setup Settings Page
// =========================
function setupSettingsPage() {
  fetchSettings();

  getEl("updateProfileBtn")?.addEventListener("click", updateProfile);
  getEl("changePasswordBtn")?.addEventListener("click", changePassword);
  getEl("savePreferencesBtn")?.addEventListener("click", savePreferences);

  // Toggle dark mode visually
  getEl("darkModeToggle")?.addEventListener("change", (e) => {
    document.body.classList.toggle("dark-mode", e.target.checked);
  });

  // Show/hide password toggles
  document.querySelectorAll(".toggle-password").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.getAttribute("data-target");
      const input = getEl(targetId);
      if (input.type === "password") {
        input.type = "text";
        toggle.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      } else {
        input.type = "password";
        toggle.innerHTML = '<i class="fa-solid fa-eye"></i>';
      }
    });
  });
}

window.loadSettings = setupSettingsPage;

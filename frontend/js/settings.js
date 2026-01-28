async function loadSettings() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first");
    console.warn("No token found in localStorage");
    return;
  }

  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    // parse JSON once
    const data = await res.json().catch(() => ({}));

    console.log("API response:", res.status, data);

    if (!res.ok) {
      throw new Error(data.message || `Failed to load settings (status ${res.status})`);
    }

    // Populate fields only if elements exist
    const firstNameEl = document.getElementById("firstName");
    const lastNameEl = document.getElementById("lastName");
    const emailEl = document.getElementById("email");
    const darkModeEl = document.getElementById("darkModeToggle");
    const emailNotifEl = document.getElementById("emailNotifications");

    if (firstNameEl) firstNameEl.value = data.f_name || "";
    if (lastNameEl) lastNameEl.value = data.l_name || "";
    if (emailEl) emailEl.value = data.email || "";

    if (darkModeEl) darkModeEl.checked = !!data.preferences?.darkMode;
    if (emailNotifEl) emailNotifEl.checked = !!data.preferences?.emailNotifications;

  } catch (err) {
    alert(err.message || "Failed to load settings");
    console.error("loadSettings error:", err);
  }
}

// Call after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
});

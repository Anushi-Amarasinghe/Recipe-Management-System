document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorDiv = document.getElementById("error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      errorDiv.textContent = "Email and password required";
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        errorDiv.textContent = data.message || "Invalid login";
        return;
      }

      // ✅ Save token
      localStorage.setItem("token", data.token);

      // ✅ Go to dashboard
      window.location.href = "dashboard.html";

    } catch (err) {
      console.error(err);
      errorDiv.textContent = "Server error";
    }
  });
});

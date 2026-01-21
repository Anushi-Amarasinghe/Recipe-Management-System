
const token = localStorage.getItem("token");

if (!token) {
  
  window.location.href = "login.html";
}

async function loadUser() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) throw new Error("Not authorized");

    const data = await res.json();

    
    const greetingEl = document.getElementById("greeting");
    if (greetingEl) greetingEl.textContent = `Hello, ${data.f_name}!`;

    return data; 
  } catch (err) {
    console.error(err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
}


const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
}

loadUser();

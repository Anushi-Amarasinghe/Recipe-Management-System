// dashboard.js

const token = localStorage.getItem("token");
const mainContent = document.getElementById("mainContent");
const usernameDisplay = document.getElementById("usernameDisplay");

/* =========================
   Load Logged-in User
========================= */
async function loadUserInfo() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Unauthorized");

    const user = await res.json();
    usernameDisplay.textContent = `${user.f_name} ${user.l_name}`;
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   Page Content Loaders
========================= */
function loadRecipes() {
  mainContent.innerHTML = `
    <h2>All Recipes</h2>
    <p>Browse all available recipes.</p>
  `;
}

function loadMyRecipes() {
  mainContent.innerHTML = `
    <h2>My Recipes</h2>
    <p>Here are the recipes you created.</p>
  `;
}

function loadFavourites() {
  mainContent.innerHTML = `
    <h2>Favourites</h2>
    <p>Your favourite recipes will appear here.</p>
  `;
}

function loadMealPlanner() {
  mainContent.innerHTML = `
    <h2>Meal Planner</h2>
    <p>Plan your meals for the week.</p>
  `;
}

function loadSettings() {
  mainContent.innerHTML = `
    <h2>Settings</h2>
    <p>Manage your account settings.</p>
  `;
}

/* =========================
   Sidebar Navigation
========================= */
document.getElementById("recipesBtn").addEventListener("click", loadRecipes);
document.getElementById("myRecipesBtn").addEventListener("click", loadMyRecipes);
document.getElementById("favouritesBtn").addEventListener("click", loadFavourites);
document.getElementById("mealPlannerBtn").addEventListener("click", loadMealPlanner);
document.getElementById("settingsBtn").addEventListener("click", loadSettings);

/* =========================
   Sidebar Active Button
========================= */
const sidebarButtons = document.querySelectorAll(".sidebar button:not(.logout)");

sidebarButtons.forEach(button => {
  button.addEventListener("click", () => {
    sidebarButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
  });
});

/* =========================
   Search (UI only for now)
========================= */
document.getElementById("searchInput").addEventListener("input", (e) => {
  console.log("Searching for:", e.target.value);
});

/* =========================
   Init
========================= */
loadUserInfo();
loadRecipes(); // default view

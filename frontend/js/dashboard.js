// frontend/js/dashboard.js

console.log("dashboard.js loaded");

/* ===========================
   Main content reference
=========================== */
const mainContent = document.getElementById("mainContent");

/* ===========================
   Utility helpers
=========================== */
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★★★★★".slice(0, r) + "☆☆☆☆☆".slice(0, 5 - r);
}

/* ===========================
   Page loader
=========================== */
async function loadPage(page, activeBtnId) {
  try {
    const res = await fetch(`pages/${page}`);
    if (!res.ok) throw new Error(`Failed to load ${page}`);

    const html = await res.text();
    mainContent.innerHTML = html;

    // Sidebar active state
    document
      .querySelectorAll(".sidebar button")
      .forEach(btn => btn.classList.remove("active"));

    if (activeBtnId) {
      const activeBtn = document.getElementById(activeBtnId);
      if (activeBtn) activeBtn.classList.add("active");
    }

    // Page-specific initialisers
    if (page === "recipes.html" && window.loadAllRecipes) {
      await window.loadAllRecipes();
      if (window.initRecipeFilters) window.initRecipeFilters();
    }

    if (page === "my-recipes.html" && window.loadMyRecipes) {
      await window.loadMyRecipes();
    }

    if (page === "settings.html" && window.loadSettings) {
      window.loadSettings();
    }

    if (page === "recipedetails.html" && window.loadRecipeDetails) {
      await window.loadRecipeDetails();
    }

  } catch (err) {
    console.error(err);
    mainContent.innerHTML = "<p>Error loading page.</p>";
  }
}

/* ===========================
   Sidebar navigation
=========================== */
const sidebarMap = {
  RecipesBtn: "recipes.html",
  myRecipesBtn: "my-recipes.html",
  favouritesBtn: "favourites.html",
  mealPlannerBtn: "meal-planner.html",
  settingsBtn: "settings.html"
};

for (const [btnId, page] of Object.entries(sidebarMap)) {
  const btn = document.getElementById(btnId);
  if (!btn) continue;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    loadPage(page, btnId);
  });
}

/* ===========================
   Delegated actions
=========================== */
mainContent.addEventListener("click", async (e) => {

  // OPEN recipe
  const openBtn = e.target.closest(".open-btn");
  if (openBtn) {
    const recipeId = openBtn.dataset.id;
    if (!recipeId) return;

    sessionStorage.setItem("viewRecipeId", recipeId);
    loadPage("recipedetails.html");
    return;
  }

  // EDIT recipe
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    const recipeId = editBtn.dataset.id;
    if (!recipeId) return;

    window.location.href =
      `/pages/view-edit-recipe.html?id=${encodeURIComponent(recipeId)}`;
    return;
  }

  // DELETE recipe
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn && window.deleteRecipeById && window.loadMyRecipes) {
    const recipeId = deleteBtn.dataset.id;
    if (!recipeId) return;

    if (!confirm("Delete this recipe?")) return;

    try {
      await window.deleteRecipeById(recipeId);
      await window.loadMyRecipes();
    } catch (err) {
      alert(err.message || "Failed to delete recipe");
    }
  }
});

/* ===========================
   Show logged-in username
=========================== */
async function showUsername() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!res.ok) throw new Error("Unauthorized");

    const user = await res.json();
    const el = document.getElementById("usernameDisplay");
    if (el) el.textContent = `${user.f_name} ${user.l_name}`;
  } catch (err) {
    console.error("Failed to load username:", err);
  }
}

/* ===========================
   Initial load
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  showUsername();
  loadPage("recipes.html", "RecipesBtn");
});

/* ===========================
   Expose helpers (used by other scripts)
=========================== */
window.escapeHtml = escapeHtml;
window.renderStars = renderStars;

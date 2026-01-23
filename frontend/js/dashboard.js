// dashboard.js

/* ===========================
   Main content reference
=========================== */
const mainContent = document.getElementById("mainContent");

// Handle dynamic buttons inside loaded pages
mainContent.addEventListener("click", async (e) => {

  // OPEN button
  const openBtn = e.target.closest(".open-btn");
  if (openBtn) {
    const recipeId = openBtn.dataset.id;
    if (!recipeId) return;

    // Store recipe ID in sessionStorage so view-recipe.js can fetch it
    sessionStorage.setItem("viewRecipeId", recipeId);

    // Load view page
    loadPage("recipedetails.html"); // or your proper path
    return;
  }

});


/* ===========================
   Utility functions
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
async function loadPage(page, btnId) {
  try {
    const res = await fetch(`pages/${page}`);
    if (!res.ok) throw new Error(`Failed to load pages/${page}`);

    const html = await res.text();
    mainContent.innerHTML = html;

    // Page-specific initializers
    if (page === "my-recipes.html" && window.loadMyRecipes) {
      await window.loadMyRecipes();
    }
    if (page === "recipes.html") {
      if (window.loadAllRecipes) await window.loadAllRecipes();
      if (window.initRecipeFilters) window.initRecipeFilters(); // <-- attach filters here
    }
    if (page === "settings.html" && window.loadSettings) {
      window.loadSettings(); // initialize settings page
    }

    // Set active sidebar button
    if (btnId) {
      document.querySelectorAll(".sidebar button").forEach(b => b.classList.remove("active"));
      const activeBtn = document.getElementById(btnId);
      if (activeBtn) activeBtn.classList.add("active");
    }

  } catch (err) {
    console.error(err);
    mainContent.innerHTML = "<p>Error loading page</p>";
  }
}


/* ===========================
   Sidebar buttons
=========================== */
const sidebarMap = {
  RecipesBtn: "recipes.html",
  myRecipesBtn: "my-recipes.html",
  favouritesBtn: "favourites.html",
  mealPlannerBtn: "meal-planner.html",
  settingsBtn: "settings.html"
};

for (const [btnId, page] of Object.entries(sidebarMap)) {
  document.getElementById(btnId)?.addEventListener("click", () => loadPage(page, btnId));
}


/* ===========================
   Dynamic buttons inside loaded pages
=========================== */
mainContent.addEventListener("click", async (e) => {

  // EDIT button
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    const recipeId = editBtn.dataset.id;
    if (!recipeId) return;
    window.location.href = `/pages/view-edit-recipe.html?id=${encodeURIComponent(recipeId)}`;
    return;
  }

  // DELETE button (for My Recipes)
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn && window.deleteRecipeById && window.loadMyRecipes) {
    const recipeId = deleteBtn.dataset.id;
    if (!recipeId) return;
    if (!confirm("Delete this recipe?")) return;

    try {
      await window.deleteRecipeById(recipeId);
      await window.loadMyRecipes(); // Refresh My Recipes list
    } catch (err) {
      alert(err.message || "Failed to delete recipe");
    }
  }

});


/* ===========================
   Default page load
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  loadPage("recipes.html", "RecipesBtn");
});


/* ===========================
   My Recipes Page
=========================== */
async function loadMyRecipes() {
  const grid = document.getElementById("recipesGrid");
  if (!grid) return;

  grid.innerHTML = "<p>Loading recipes...</p>";

  const token = localStorage.getItem("token");
  if (!token) {
    grid.innerHTML = "<p>Please log in to view your recipes.</p>";
    return;
  }

  try {
    const res = await fetch("/api/recipes/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to fetch recipes");

    const recipes = Array.isArray(data.recipes) ? data.recipes : [];
    if (recipes.length === 0) {
      grid.innerHTML = "<p>No recipes saved yet.</p>";
      return;
    }

    grid.innerHTML = recipes
      .map(r => `
        <div class="recipe-card">
          <div class="image-placeholder">
            ${r.imageUrl ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title)}" />` : "[IMAGE]"}
          </div>
          <div class="content">
            <div class="title">${escapeHtml(r.title)}</div>
            <div class="rating">Rating: ${renderStars(r.rating || 0)}</div>
            <div class="actions">
              <button class="edit-btn" data-id="${r._id}">Edit</button>
              <button class="delete-btn" data-id="${r._id}">Delete</button>
            </div>
          </div>
        </div>
      `).join("");

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }
}


/* ===========================
   All Recipes Page
   (recipes.html)
=========================== */
// Example placeholder: you can move your all-recipes.js logic here
async function loadAllRecipes() {
  const grid = document.getElementById("recipesGridA");
  if (!grid) return;

  grid.innerHTML = "<p>Loading recipes...</p>";

  const token = localStorage.getItem("token");
  if (!token) {
    grid.innerHTML = "<p>Please log in to view your recipes.</p>";
    return;
  }

  try {
    const res = await fetch("/api/recipes/", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to fetch recipes");

    const recipes = Array.isArray(data.recipes) ? data.recipes : [];
    if (recipes.length === 0) {
      grid.innerHTML = "<p>No recipes saved yet.</p>";
      return;
    }

    grid.innerHTML = recipes
      .map(r => `
        <div class="recipe-card">
          <div class="image-placeholder">
            ${r.imageUrl ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title)}" />` : "[IMAGE]"}
          </div>
          <div class="content">
            <div class="title">${escapeHtml(r.title)}</div>
            <div class="rating">Rating: ${renderStars(r.rating || 0)}</div>
            <div class="actions">
              <button class="open-btn" data-id="${r._id}">Open</button>
              <button class="share-btn" data-id="${r._id}">Share</button>
            </div>
          </div>
        </div>
      `).join("");

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }
}


/* ===========================
   Expose globally
=========================== */
window.loadMyRecipes = loadMyRecipes;
window.renderStars = renderStars;
window.escapeHtml = escapeHtml;
window.loadAllRecipes = loadAllRecipes;

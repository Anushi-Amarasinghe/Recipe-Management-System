// dashboard.js

/* ===========================
   Main content reference
=========================== */
const mainContent = document.getElementById("mainContent");

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

    // Inject HTML first
    mainContent.innerHTML = html;

    // Extract and execute script tags from the loaded HTML
    const scriptTags = mainContent.querySelectorAll("script");
    for (const script of scriptTags) {
      if (script.src) {
        // External script - load it
        await new Promise((resolve, reject) => {
          const newScript = document.createElement("script");
          newScript.src = script.src;
          newScript.onload = resolve;
          newScript.onerror = reject;
          document.head.appendChild(newScript);
        });
      } else {
        // Inline script - execute it
        const newScript = document.createElement("script");
        newScript.textContent = script.textContent;
        document.head.appendChild(newScript);
        document.head.removeChild(newScript);
      }
      // Remove the original script tag from mainContent
      script.remove();
    }

    // ⚡ Call page-specific initializers AFTER HTML is injected and scripts are loaded
    if (page === "my-recipes.html") {
      // Wait a bit for scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 50));
      // Try both function names for compatibility
      if (window.renderMyRecipes) {
        await window.renderMyRecipes();
      } else if (window.loadMyRecipes) {
        await window.loadMyRecipes();
      }
    }

    if (page === "recipes.html") {
      if (window.loadAllRecipes) await window.loadAllRecipes();
      if (window.initRecipeFilters) window.initRecipeFilters();
    }

    if (page === "settings.html" && window.loadSettings) {
      window.loadSettings();
    }

    if (page === "recipedetails.html" && window.loadRecipeDetails) {
      await window.loadRecipeDetails();
    }

    if (page === "trash.html") {
      await new Promise(resolve => setTimeout(resolve, 50));
      if (window.loadTrash) await window.loadTrash();
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
  settingsBtn: "settings.html",
  trashBtn: "trash.html"
};

for (const [btnId, page] of Object.entries(sidebarMap)) {
  document.getElementById(btnId)?.addEventListener("click", () => loadPage(page, btnId));
}

/* ===========================
   Dynamic buttons inside loaded pages
=========================== */
mainContent.addEventListener("click", async (e) => {

  // OPEN button -> Load recipe details
  const openBtn = e.target.closest(".open-btn");
  if (openBtn) {
    const recipeId = openBtn.dataset.id;
    if (!recipeId) return;

    // Store recipe ID in sessionStorage
    sessionStorage.setItem("viewRecipeId", recipeId);

    // Load recipe details page
    loadPage("recipedetails.html");
    return;
  }

  // EDIT button
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    const recipeId = editBtn.dataset.id;
    if (!recipeId) return;
    // Go directly to add-recipe page in edit mode
    window.location.href = `/pages/add-recipe.html?id=${encodeURIComponent(recipeId)}`;
    return;
  }

  // DELETE button -> Move to trash (soft delete)
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    const recipeId = deleteBtn.dataset.id;
    if (!recipeId) return;
    if (!confirm("Move this recipe to trash? You can restore it from Trash.")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to delete recipes.");
      return;
    }

    try {
      const res = await fetch("/api/recipes/bulk-delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids: [recipeId] })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to move to trash");

      if (window.loadMyRecipes) await window.loadMyRecipes();
      else if (window.renderMyRecipes) await window.renderMyRecipes();
    } catch (err) {
      alert(err.message || "Failed to move to trash");
    }
  }

  // Open Trash (from My Recipes top bar)
  if (e.target.closest("#openTrash")) {
    e.preventDefault();
    loadPage("trash.html", "trashBtn");
    return;
  }

  // Back to My Recipes (from Trash page)
  if (e.target.closest("#backToMyRecipes")) {
    e.preventDefault();
    loadPage("my-recipes.html", "myRecipesBtn");
    return;
  }

  // Trash: Restore selected (bulk)
  if (e.target.closest("#trashRestoreSelected")) {
    const grid = document.getElementById("trashGrid");
    if (!grid) return;
    const ids = Array.from(grid.querySelectorAll(".trash-item-cb:checked")).map((cb) => cb.dataset.id).filter(Boolean);
    if (!ids.length) return;

    const token = localStorage.getItem("token");
    if (!token) { alert("Please log in."); return; }
    try {
      await window.restoreRecipeIds(ids);
      if (window.loadTrash) await window.loadTrash();
    } catch (err) {
      alert(err.message || "Failed to restore");
    }
    return;
  }

  // Trash: Restore single
  const restoreBtn = e.target.closest(".restore-btn.single");
  if (restoreBtn) {
    const id = restoreBtn.dataset.id;
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) { alert("Please log in."); return; }
    try {
      await window.restoreRecipeIds([id]);
      if (window.loadTrash) await window.loadTrash();
    } catch (err) {
      alert(err.message || "Failed to restore");
    }
    return;
  }

  // My Recipes: Move selected to trash (bulk)
  const moveTrashBtn = e.target.closest(".move-trash-btn");
  if (moveTrashBtn) {
    const grid = document.getElementById("recipesGrid");
    if (!grid) return;
    const ids = Array.from(grid.querySelectorAll(".recipe-card-cb:checked")).map((cb) => cb.dataset.id).filter(Boolean);
    if (!ids.length) {
      alert("Select at least one recipe.");
      return;
    }
    if (!confirm(`Move ${ids.length} recipe(s) to trash?`)) return;

    const token = localStorage.getItem("token");
    if (!token) { alert("Please log in."); return; }
    try {
      const res = await fetch("/api/recipes/bulk-delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to move to trash");
      if (window.loadMyRecipes) await window.loadMyRecipes();
      else if (window.renderMyRecipes) await window.renderMyRecipes();
    } catch (err) {
      alert(err.message || "Failed to move to trash");
    }
    return;
  }
});

/* ===========================
   Default page load
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  // Check for URL parameter to determine which page to load
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view");
  
  if (view === "my-recipes") {
    loadPage("my-recipes.html", "myRecipesBtn");
  } else {
    loadPage("recipes.html", "RecipesBtn");
  }
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
      const toolbar = document.getElementById("myRecipesToolbar");
      if (toolbar) toolbar.style.display = "none";
      return;
    }

    const toolbar = document.getElementById("myRecipesToolbar");
    if (toolbar) toolbar.style.display = "flex";

    grid.innerHTML = recipes
      .map(r => `
        <div class="recipe-card recipe-card-my" style="position: relative;" 
          data-likes="${r.likes || 0}" 
          data-dislikes="${r.dislikes || 0}" 
          data-category="${r.category}" 
          data-region="${r.region}" 
          data-date="${r.createdAt}">
          <label class="recipe-card-checkbox">
            <input type="checkbox" class="recipe-card-cb" data-id="${r._id}" />
            <span class="check-label">Select</span>
          </label>
          <div class="image-placeholder">
            ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${escapeHtml(r.title)}" />` : "[IMAGE]"}
          </div>

          <div class="content">
            <div class="title-wrapper">
              <div class="title">${escapeHtml(r.title)}</div>
            </div>

            <div class="likes-wrapper">
              <i class="fa-regular fa-thumbs-up"></i>
              <i class="fa-regular fa-thumbs-down"></i>
            </div>

            <div class="actions">
              <button class="open-btn" data-id="${r._id}">Open</button>
              <button class="edit-btn" data-id="${r._id}">Edit</button>
              <button class="delete-btn" data-id="${r._id}">Move to trash</button>
            </div>
          </div>
        </div>
      `).join("");

    const selectAll = document.getElementById("myRecipesSelectAll");
    const moveBtn = document.getElementById("myRecipesMoveToTrash");
    const checkboxes = grid.querySelectorAll(".recipe-card-cb");
    if (selectAll) {
      selectAll.checked = false;
      selectAll.onchange = () => {
        checkboxes.forEach((cb) => (cb.checked = selectAll.checked));
        if (moveBtn) moveBtn.disabled = !grid.querySelectorAll(".recipe-card-cb:checked").length;
      };
    }
    checkboxes.forEach((cb) => {
      cb.addEventListener("change", () => {
        if (moveBtn) moveBtn.disabled = !grid.querySelectorAll(".recipe-card-cb:checked").length;
      });
    });
    if (moveBtn) moveBtn.disabled = true;
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }
}

/* ===========================
   All Recipes Page
=========================== */
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
        <div class="recipe-card" 
          data-likes="${r.likes || 0}" 
          data-dislikes="${r.dislikes || 0}" 
          data-category="${r.category}" 
          data-region="${r.region}" 
          data-date="${r.createdAt}">

          <div class="image-placeholder">
            ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}" />` : "[IMAGE]"}
          </div>

          <div class="content">
            <div class="title-wrapper">
              <div class="title">${r.title}</div>
            </div>

            <div class="likes-wrapper">
              <div class="like-display">
                <i class="fa-regular fa-thumbs-up"></i>
                <span>${r.is_like || 0}</span>
              </div>
              <div class="dislike-display">
                <i class="fa-regular fa-thumbs-down"></i>
                <span>${r.is_dislike || 0}</span>
              </div>
            </div>

            <div class="actions">
              <button class="open-btn" data-id="${r._id}">Open</button>
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
window.loadAllRecipes = loadAllRecipes;
window.escapeHtml = escapeHtml;
window.renderStars = renderStars;

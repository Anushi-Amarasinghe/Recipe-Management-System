/**
 * search.js
 * US4 – Search (Frontend)
 * - Backend search (primary)
 * - Local filtering (fallback)
 * - Debounce
 * - Grid-safe rendering
 */

let allRecipes = [];
let debounceTimer = null;
const DEBOUNCE_DELAY = 400;

/* =========================
   Set recipes globally
========================= */
function setRecipes(recipes) {
  allRecipes = Array.isArray(recipes) ? recipes : [];
}

/* =========================
   Render recipes in grid
========================= */
function renderRecipeGrid(recipes, gridId = "recipesGridA") {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  if (!recipes || !recipes.length) {
    grid.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  grid.innerHTML = recipes
    .map(r => `
      <div class="recipe-card"
        data-id="${r._id}"
        data-likes="${r.is_like || 0}"
        data-dislikes="${r.is_dislike || 0}"
        data-category="${r.category || ""}"
        data-region="${r.region || ""}"
        data-date="${r.createdAt || ""}">

        <div class="image-placeholder">
          ${
            r.imageUrl
              ? `<img src="${r.imageUrl}" alt="${r.title}" />`
              : "[IMAGE]"
          }
        </div>

        <div class="content">
          <div class="title-wrapper">
            <div class="title">${r.title}</div>
          </div>

          <div class="likes-wrapper">
            <div class="like-display">
              <i class="fa-regular fa-thumbs-up"></i>
              <span class="like-count">${r.is_like || 0}</span>
            </div>
            <div class="dislike-display">
              <i class="fa-regular fa-thumbs-down"></i>
              <span class="dislike-count">${r.is_dislike || 0}</span>
            </div>
          </div>

          <div class="actions">
            <button class="open-btn">Open</button>
          </div>
        </div>
      </div>
    `)
    .join("");
}

/* =========================
   Grid event delegation
========================= */
function attachGridEvents(gridId = "recipesGridA") {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.addEventListener("click", e => {
    const card = e.target.closest(".recipe-card");
    if (!card) return;

    const recipeId = card.dataset.id;

    if (e.target.closest(".open-btn")) {
      sessionStorage.setItem("viewRecipeId", recipeId);
      window.location.href = "/recipedetails.html";
    }

    if (e.target.closest(".like-display")) {
      const span = card.querySelector(".like-count");
      span.textContent = Number(span.textContent || 0) + 1;
      // TODO: API like
    }

    if (e.target.closest(".dislike-display")) {
      const span = card.querySelector(".dislike-count");
      span.textContent = Number(span.textContent || 0) + 1;
      // TODO: API dislike
    }
  });
}

/* =========================
   Backend search (API)
========================= */
async function backendSearch(query) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `/api/recipes/search?q=${encodeURIComponent(query)}`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {}
      }
    );

    if (!res.ok) throw new Error("Search failed");

    const data = await res.json();
    return data.recipes || [];
  } catch (err) {
    console.warn("Backend search failed, fallback to local filter", err);
    return null;
  }
}

/* =========================
   Local fallback search
========================= */
function localSearch(query) {
  const q = query.toLowerCase();
  return allRecipes.filter(r =>
    r.title?.toLowerCase().includes(q) ||
    r.ingredients?.some(i => i.toLowerCase().includes(q))
  );
}

/* =========================
   Attach search input
========================= */
function attachSearch(inputId = "recipeSearch", gridId = "recipesGridA") {
  const searchInput = document.getElementById(inputId);
  if (!searchInput) return;

  searchInput.addEventListener("input", e => {
    const query = e.target.value.trim();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (!query) {
        renderRecipeGrid(allRecipes, gridId);
        return;
      }

      // 1️⃣ Try backend search
      const apiResults = await backendSearch(query);

      if (Array.isArray(apiResults)) {
        renderRecipeGrid(apiResults, gridId);
        return;
      }

      // 2️⃣ Fallback to local search
      const filtered = localSearch(query);
      renderRecipeGrid(filtered, gridId);
    }, DEBOUNCE_DELAY);
  });
}

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();

    setRecipes(data.recipes || []);
    renderRecipeGrid(allRecipes);
    attachSearch();
    attachGridEvents();
  } catch (err) {
    console.error("Failed to load recipes", err);
    const grid = document.getElementById("recipesGridA");
    if (grid) grid.innerHTML = "<p>Failed to load recipes.</p>";
  }
});

/* =========================
   Expose (optional)
========================= */
window.searchModule = {
  setRecipes,
  renderRecipeGrid,
  attachSearch
};

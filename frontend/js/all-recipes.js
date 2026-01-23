// all-recipes.js

let allRecipes = []; // store fetched recipes

/* ===========================
   Utility function: render stars
=========================== */
function stars(rating = 0) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★★★★★".slice(0, r) + "☆☆☆☆☆".slice(0, 5 - r);
}

/* ===========================
   Render recipes to grid
=========================== */
function renderRecipes(recipes) {
  const grid = document.getElementById("recipesGridA");
  if (!grid) return;

  if (!recipes.length) {
    grid.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  grid.innerHTML = recipes
    .map(r => `
      <div class="recipe-card" data-rating="${r.rating}" data-category="${r.category}" data-region="${r.region}" data-date="${r.createdAt}">
        <div class="image-placeholder">
          ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}" />` : "[IMAGE]"}
        </div>
        <div class="content">
          <div class="title-wrapper">
            <div class="title">${r.title}</div>
            <button class="favourites"><i class="fa-regular fa-heart"></i></button>
          </div>
          <div class="rating">${stars(r.rating)}</div>
          <div class="actions">
            <button class="open-btn" data-id="${r._id}">Open</button>
            <button class="share-btn">Share</button>
          </div>
        </div>
      </div>
    `)
    .join("");
}

/* ===========================
   Filter & Sort Functions
=========================== */
function applyFilters() {
  const rating = document.getElementById("filterRating").value;
  const category = document.getElementById("filterCategory").value;
  const region = document.getElementById("filterRegion").value;
  const sort = document.getElementById("filterSort").value;

  let filtered = [...allRecipes];

  if (rating) filtered = filtered.filter(r => Number(r.rating) >= Number(rating));
  if (category) filtered = filtered.filter(r => r.category.toLowerCase() === category.toLowerCase());
  if (region) filtered = filtered.filter(r => r.region.toLowerCase() === region.toLowerCase());

  if (sort === "latest") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sort === "oldest") filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  renderRecipes(filtered);
}

/* ===========================
   Clear filters
=========================== */
function clearFilters() {
  const filterRating = document.getElementById("filterRating");
  const filterCategory = document.getElementById("filterCategory");
  const filterRegion = document.getElementById("filterRegion");
  const filterSort = document.getElementById("filterSort");

  if (!filterRating || !filterCategory || !filterRegion || !filterSort) return;

  filterRating.value = "";
  filterCategory.value = "";
  filterRegion.value = "";
  filterSort.value = "";

  applyFilters();
}

/* ===========================
   Load all recipes from API
=========================== */
async function loadAllRecipes() {
  const grid = document.getElementById("recipesGridA");
  if (!grid) return;

  grid.innerHTML = "<p>Loading…</p>";

  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();

    if (!res.ok) {
      grid.innerHTML = `<p>${data.message || "Failed to load recipes"}</p>`;
      return;
    }

    allRecipes = Array.isArray(data.recipes) ? data.recipes : [];
    applyFilters();
  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p>Error loading recipes.</p>";
  }
}

/* ===========================
   Initialize page filters & load recipes
=========================== */
function initRecipeFilters() {
  const filterRating = document.getElementById("filterRating");
  const filterCategory = document.getElementById("filterCategory");
  const filterRegion = document.getElementById("filterRegion");
  const filterSort = document.getElementById("filterSort");
  const clearBtn = document.getElementById("clearFilters");

  if (!filterRating || !filterCategory || !filterRegion || !filterSort || !clearBtn) return;

  filterRating.addEventListener("change", applyFilters);
  filterCategory.addEventListener("change", applyFilters);
  filterRegion.addEventListener("change", applyFilters);
  filterSort.addEventListener("change", applyFilters);
  clearBtn.addEventListener("click", clearFilters);

  loadAllRecipes();
}

/* ===========================
   Expose functions globally
=========================== */
window.initRecipeFilters = initRecipeFilters;
window.renderRecipes = renderRecipes;
window.stars = stars;


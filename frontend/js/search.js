// search.js
let allRecipes = [];

// ------------------------
// Set recipes globally
// ------------------------
function setRecipes(recipes) {
  allRecipes = recipes;
}

// ------------------------
// Render recipes in grid
// ------------------------
function renderRecipeGrid(recipes, gridId = "recipesGridA") {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  if (!recipes.length) {
    grid.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  grid.innerHTML = recipes
    .map(r => `
      <div class="recipe-card" 
          data-id="${r._id}"
          data-likes="${r.is_like || 0}" 
          data-dislikes="${r.is_dislike || 0}" 
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

// ------------------------
// Event delegation for grid
// ------------------------
function attachGridEvents(gridId = "recipesGridA") {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".recipe-card");
    if (!card) return;

    const recipeId = card.dataset.id;

    // Open button
    if (e.target.closest(".open-btn")) {
      sessionStorage.setItem("viewRecipeId", recipeId);
      window.location.href = "/recipedetails.html";
    }

    // Like button
    if (e.target.closest(".like-display")) {
      const span = card.querySelector(".like-count");
      let count = parseInt(span.textContent || 0);
      span.textContent = ++count;
      // TODO: call API to update like
    }

    // Dislike button
    if (e.target.closest(".dislike-display")) {
      const span = card.querySelector(".dislike-count");
      let count = parseInt(span.textContent || 0);
      span.textContent = ++count;
      // TODO: call API to update dislike
    }
  });
}

// ------------------------
// Search input
// ------------------------
function attachSearch(inputId = "recipeSearch", gridId = "recipesGridA") {
  const searchInput = document.getElementById(inputId);
  if (!searchInput) return;

  searchInput.addEventListener("input", e => {
    const query = e.target.value.trim().toLowerCase();
    const filtered = allRecipes.filter(r => r.title.toLowerCase().includes(query));
    renderRecipeGrid(filtered, gridId);
  });
}

// ------------------------
// Initialization
// ------------------------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    setRecipes(data.recipes);
    renderRecipeGrid(data.recipes);
    attachSearch();
    attachGridEvents();
  } catch (err) {
    console.error("Failed to load recipes", err);
  }
});

// Expose globally
window.searchModule = {
  setRecipes,
  renderRecipeGrid,
  attachSearch
};

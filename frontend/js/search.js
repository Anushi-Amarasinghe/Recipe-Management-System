// search.js

// Store all recipes globally for filtering
let allRecipes = [];

// Call this function after loading recipes
function setRecipes(recipes) {
  allRecipes = recipes;
}

// Render recipes in the grid
function renderRecipeGrid(recipes, gridId = "recipesGridA") {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  if (!recipes.length) {
    grid.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  grid.innerHTML = recipes
    .map(r => `
      <div class="recipe-card">
        <div class="image-placeholder">
          ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}">` : "[IMAGE]"}
        </div>
        <div class="content">
          <div class="title-wrapper">
            <div class="title">${r.title}</div>
            <button class="favourites"><i class="fa-regular fa-heart"></i></button>
          </div>
          <div class="rating">${window.renderStars(r.rating)}</div>
          <div class="actions">
            <button class="open-btn" data-id="${r._id}">Open</button>
            <button class="share-btn">Share</button>
          </div>
        </div>
      </div>
    `)
    .join("");
}

// Attach search input listener
function attachSearch(inputId = "recipeSearch", gridId = "recipesGridA") {
  const searchInput = document.getElementById(inputId);
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allRecipes.filter(r => r.title.toLowerCase().includes(query));
    renderRecipeGrid(filtered, gridId);
  });
}

// Expose globally
window.searchModule = {
  setRecipes,
  renderRecipeGrid,
  attachSearch
};


let selectedDifficulty = "";
let selectedDiet = "";


function stars(rating = 0) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return "★★★★★☆☆☆☆☆".slice(5 - r, 10 - r);
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function renderMyRecipes() {
  
  const grid = document.getElementById("recipesGrid");
  if (!grid) return;

  grid.innerHTML = "<p>Loading…</p>";

  // Get token for authenticated request
  const token = localStorage.getItem("token");
  if (!token) {
    grid.innerHTML = "<p>Please log in to view your recipes.</p>";
    return;
  }

  try {
    const res = await fetch("/api/recipes/mine", {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      grid.innerHTML = `<p>${escapeHtml(data.message || "Failed to load recipes")}</p>`;
      return;
    }

    const recipes = data.recipes || [];
    let filteredRecipes = recipes;

    // Difficulty filter
    if (selectedDifficulty) {
      filteredRecipes = filteredRecipes.filter(
        r => (r.difficulty || "").toLowerCase() === selectedDifficulty
      );
    }

    // Dietary filter
    if (selectedDiet) {
      filteredRecipes = filteredRecipes.filter(
        r => Array.isArray(r.dietary) &&
            r.dietary.map(d => d.toLowerCase()).includes(selectedDiet)
      );
    }

    if (!filteredRecipes.length) {
      grid.innerHTML = "<p>No recipes match the selected filters.</p>";
      return;
    }


    if (!recipes.length) {
      grid.innerHTML = "<p>No recipes yet. Click \"Add New Recipe\".</p>";
      return;
    }

    grid.innerHTML = filteredRecipes
      .map(
        (r) => `
        <div class="recipe-card">
          <div class="image-placeholder">
            ${
              r.imageUrl
                ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(
                    r.title
                  )}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`
                : "[IMAGE]"
            }
          </div>

          <div class="content">
            <div class="title">${escapeHtml(r.title)}</div>
            <div class="rating">Rating: ${stars(r.rating)}</div>

            <div class="actions">
              <button class="edit-btn" data-id="${escapeHtml(r._id)}">Edit</button>
              <button class="delete-btn" data-id="${escapeHtml(r._id)}">Delete</button>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p>Error loading recipes.</p>";
  }


}

async function deleteRecipeById(id) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please log in to delete recipes.");
  }
  
  const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to delete recipe");
  return data;
}


document.addEventListener("click", (e) => {

  // Difficulty buttons
  const diffBtn = e.target.closest("#difficultyFilter button");
  if (diffBtn) {
    document
      .querySelectorAll("#difficultyFilter button")
      .forEach(b => b.classList.remove("active"));

    diffBtn.classList.add("active");
    selectedDifficulty = diffBtn.dataset.value;
    renderMyRecipes();
  }

  // Dietary buttons
  const dietBtn = e.target.closest("#dietFilter button");
  if (dietBtn) {
    document
      .querySelectorAll("#dietFilter button")
      .forEach(b => b.classList.remove("active"));

    dietBtn.classList.add("active");
    selectedDiet = dietBtn.dataset.value;
    renderMyRecipes();
  }

});


window.renderMyRecipes = renderMyRecipes;
window.loadMyRecipes = renderMyRecipes; // Alias for compatibility with dashboard.js
window.deleteRecipeById = deleteRecipeById;

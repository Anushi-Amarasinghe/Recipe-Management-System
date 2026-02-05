
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

    if (!recipes.length) {
      grid.innerHTML = "<p>No recipes yet. Click \"Add New Recipe\".</p>";
      return;
    }

    const toolbar = document.getElementById("myRecipesToolbar");
    if (toolbar) toolbar.style.display = "flex";

    grid.innerHTML = recipes
      .map(
        (r) => `
        <div class="recipe-card recipe-card-my" style="position: relative;">
          <label class="recipe-card-checkbox">
            <input type="checkbox" class="recipe-card-cb" data-id="${escapeHtml(r._id)}" />
            <span class="check-label">Select</span>
          </label>
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
              <button class="delete-btn" data-id="${escapeHtml(r._id)}">Move to trash</button>
            </div>
          </div>
        </div>
      `
      )
      .join("");

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

window.renderMyRecipes = renderMyRecipes;
window.loadMyRecipes = renderMyRecipes; // Alias for compatibility with dashboard.js
window.deleteRecipeById = deleteRecipeById;

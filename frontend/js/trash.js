/**
 * Trash page: list soft-deleted recipes, restore single or bulk.
 */

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadTrash() {
  const grid = document.getElementById("trashGrid");
  const toolbar = document.getElementById("trashToolbar");
  const bulkActions = document.getElementById("trashBulkActions");
  if (!grid) return;

  grid.innerHTML = "<p>Loading…</p>";
  if (toolbar) toolbar.style.display = "none";
  if (bulkActions) bulkActions.style.display = "none";

  const token = localStorage.getItem("token");
  if (!token) {
    grid.innerHTML = "<p>Please log in to view trash.</p>";
    return;
  }

  try {
    const res = await fetch("/api/recipes/trash", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      grid.innerHTML = `<p>${escapeHtml(data.message || "Failed to load trash")}</p>`;
      return;
    }

    const recipes = data.recipes || [];
    if (recipes.length === 0) {
      grid.innerHTML = "<p>Trash is empty. Recipes you move to trash will appear here.</p>";
      return;
    }

    if (toolbar) toolbar.style.display = "flex";
    grid.innerHTML = recipes
      .map(
        (r) => `
        <div class="recipe-card recipe-card-trash">
          <label class="recipe-card-checkbox">
            <input type="checkbox" class="trash-item-cb" data-id="${escapeHtml(r._id)}" />
            <span class="check-label">Select</span>
          </label>
          <div class="image-placeholder">
            ${
              r.imageUrl
                ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`
                : "[IMAGE]"
            }
          </div>
          <div class="content">
            <div class="title">${escapeHtml(r.title)}</div>
            <div class="actions">
              <button type="button" class="restore-btn single" data-id="${escapeHtml(r._id)}">Restore</button>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    // Select all
    const selectAll = document.getElementById("trashSelectAll");
    const checkboxes = grid.querySelectorAll(".trash-item-cb");
    if (selectAll) {
      selectAll.checked = false;
      selectAll.onchange = () => {
        checkboxes.forEach((cb) => (cb.checked = selectAll.checked));
        updateTrashBulkVisibility();
      };
    }
    checkboxes.forEach((cb) => {
      cb.addEventListener("change", updateTrashBulkVisibility);
    });
    updateTrashBulkVisibility();
  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p>Error loading trash.</p>";
  }
}

function updateTrashBulkVisibility() {
  const grid = document.getElementById("trashGrid");
  const bulkActions = document.getElementById("trashBulkActions");
  if (!grid || !bulkActions) return;
  const checked = grid.querySelectorAll(".trash-item-cb:checked");
  bulkActions.style.display = checked.length > 0 ? "inline-block" : "none";
}

async function restoreRecipeIds(ids) {
  if (!ids.length) return;
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please log in to restore recipes.");

  const res = await fetch("/api/recipes/bulk-restore", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to restore");
  return data;
}

window.loadTrash = loadTrash;
window.restoreRecipeIds = restoreRecipeIds;
window.escapeHtml = escapeHtml;

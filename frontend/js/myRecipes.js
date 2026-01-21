// frontend/js/myRecipes.js
console.log("myRecipes.js loaded");

(async function initMyRecipesPage() {
  const container = document.getElementById("myRecipesContainer");
  const errorEl = document.getElementById("myRecipesError");
  const addBtn = document.getElementById("addRecipeBtn");
  const formWrap = document.getElementById("recipeFormWrap");
  const form = document.getElementById("recipeForm");
  const cancelBtn = document.getElementById("cancelRecipeBtn");
  const saveBtn = document.getElementById("saveRecipeBtn");
  const recipeIdInput = document.getElementById("recipeId");
  const titleInput = document.getElementById("title");
  const ingredientsInput = document.getElementById("ingredients");
  const instructionsInput = document.getElementById("instructions");

  const token = localStorage.getItem("token");
  if (!token) {
    errorEl.style.display = "block";
    errorEl.textContent = "You must be logged in to view your recipes.";
    return;
  }

  function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cardHtml(recipe) {
    const ing = (recipe.ingredients || []).map(i => `<li>${escapeHtml(i)}</li>`).join("");
    const instr = (recipe.instructions || []).map(s => `<li>${escapeHtml(s.text ?? s)}</li>`).join("");
    return `
      <article class="recipe-card" data-id="${recipe._id}">
        <h3>${escapeHtml(recipe.title)}</h3>
        <div><strong>Ingredients</strong><ul>${ing}</ul></div>
        <div><strong>Instructions</strong><ol>${instr}</ol></div>
        <div class="actions" style="margin-top:8px;">
          <button class="edit-btn" data-id="${recipe._id}">Edit</button>
          <button class="delete-btn" data-id="${recipe._id}">Delete</button>
        </div>
      </article>
    `;
  }

  async function fetchMyRecipes() {
    try {
      const res = await fetch("/api/recipes", {
        headers: { Authorization: "Bearer " + token }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      container.innerHTML = data.length ? data.map(cardHtml).join("") : "<p>No recipes yet.</p>";
    } catch (err) {
      console.error(err);
      errorEl.style.display = "block";
      errorEl.textContent = "Error loading your recipes.";
    }
  }

  function openForm(editRecipe = null) {
    formWrap.style.display = "block";
    if (!editRecipe) {
      recipeIdInput.value = "";
      titleInput.value = "";
      ingredientsInput.value = "";
      instructionsInput.value = "";
    } else {
      recipeIdInput.value = editRecipe._id;
      titleInput.value = editRecipe.title;
      ingredientsInput.value = (editRecipe.ingredients || []).join(", ");
    
      const instr = (editRecipe.instructions || []).map(s => s.text ?? s).join("\n");
      instructionsInput.value = instr;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    formWrap.style.display = "none";
  }

  addBtn.addEventListener("click", () => openForm(null));
  cancelBtn.addEventListener("click", closeForm);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    errorEl.style.display = "none";

    const id = recipeIdInput.value;
    const payload = {
      title: titleInput.value.trim(),
      ingredients: ingredientsInput.value.split(",").map(s => s.trim()).filter(Boolean),
      
      instructions: instructionsInput.value
        .split(/\r?\n/)
        .map((text, idx) => ({ stepNumber: idx + 1, text: text.trim() }))
        .filter(s => s.text)
    };

    try {
      const url = id ? `/api/recipes/${id}` : `/api/recipes`;
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to save recipe");
      }

      await fetchMyRecipes();
      closeForm();
    } catch (err) {
      console.error(err);
      errorEl.style.display = "block";
      errorEl.textContent = err.message || "Error saving recipe";
    } finally {
      saveBtn.disabled = false;
    }
  });

  //  edit,delete
  container.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    if (editBtn) {
      const id = editBtn.dataset.id;
      try {
        const res = await fetch(`/api/recipes/${id}`, {
          headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Cannot fetch recipe");
        const recipe = await res.json();
        openForm(recipe);
      } catch (err) {
        console.error(err);
        errorEl.style.display = "block";
        errorEl.textContent = "Failed to load recipe for editing.";
      }
    } else if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!confirm("Delete this recipe?")) return;
      try {
        const res = await fetch(`/api/recipes/${id}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to delete");
        }
        await fetchMyRecipes();
      } catch (err) {
        console.error(err);
        errorEl.style.display = "block";
        errorEl.textContent = err.message || "Error deleting recipe";
      }
    }
  });

  
  await fetchMyRecipes();
})();

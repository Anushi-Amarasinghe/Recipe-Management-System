const mainContent = document.getElementById("mainContent");

// Load page function
async function loadPage(page, btnId) {
  try {
    const res = await fetch(`pages/${page}`);
    if (!res.ok) throw new Error(`Failed to load pages/${page}`);

    const html = await res.text();
    mainContent.innerHTML = html;

    // Active button styling (only if btnId provided)
    if (btnId) {
      document.querySelectorAll(".sidebar button").forEach(b =>
        b.classList.remove("active")
      );

      const activeBtn = document.getElementById(btnId);
      if (activeBtn) activeBtn.classList.add("active");
    }

  } catch (err) {
    console.error(err);
    mainContent.innerHTML = "<p>Error loading page</p>";
  }
}

// Sidebar button listeners
document.getElementById("RecipesBtn")
  .addEventListener("click", () => loadPage("recipes.html", "RecipesBtn"));

document.getElementById("myRecipesBtn")
  .addEventListener("click", () => loadPage("my-recipes.html", "myRecipesBtn"));

document.getElementById("favouritesBtn")
  .addEventListener("click", () => loadPage("favourites.html", "favouritesBtn"));

document.getElementById("mealPlannerBtn")
  .addEventListener("click", () => loadPage("meal-planner.html", "mealPlannerBtn"));

document.getElementById("settingsBtn")
  .addEventListener("click", () => loadPage("settings.html", "settingsBtn"));

// Handle clicks inside dynamically loaded pages (Edit button)
mainContent.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".edit-btn");
  if (!editBtn) return;

  // Optional: store the recipe id for the edit page to use
  const recipeId = editBtn.dataset.id;
  if (recipeId) localStorage.setItem("editingRecipeId", recipeId);

  // Load the edit page into mainContent
  loadPage("editrecipedetails.html", "myRecipesBtn");
});

// Load default page
loadPage("recipes.html", "RecipesBtn");

(function () {

  const plannerRoot = document.querySelector(".meal-planner-container");
  if (!plannerRoot) return; // SPA guard

  const modal = document.getElementById("mealModal");
  const recipeSelect = document.getElementById("recipeSelect");
  const modalTitle = document.getElementById("modalTitle");

  let activeSlot = null;

  // ---------- GLOBAL CLICK HANDLER (SPA-SAFE) ----------
  document.addEventListener("click", async (e) => {

    /* ========= OPEN MODAL ========= */
    const addBtn = e.target.closest(".add-meal-btn");
    if (addBtn) {
      activeSlot = addBtn.closest(".meal-slot");

      const day = addBtn.closest(".meal-day").dataset.day;
      const meal = activeSlot.dataset.meal;

      modalTitle.textContent = `Add meal for ${day} (${meal})`;

      await loadRecipes();
      modal.style.display = "flex";
      return;
    }

    /* ========= CANCEL MODAL ========= */
    if (e.target.id === "cancelMeal") {
      modal.style.display = "none";
      recipeSelect.value = "";
      activeSlot = null;
      return;
    }

    /* ========= SAVE MEAL (DB + UI) ========= */
    if (e.target.id === "saveMeal") {
      if (!activeSlot || !recipeSelect.value) return;

      const day = activeSlot.closest(".meal-day").dataset.day;
      const meal = activeSlot.dataset.meal;
      const recipeId = recipeSelect.value;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/meal-planner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ day, meal, recipeId })
        });

        if (!res.ok) throw new Error("Save failed");

        const recipeName =
          recipeSelect.options[recipeSelect.selectedIndex].text;

        activeSlot.innerHTML = `
          <span>${recipeName}</span>
          <button class="remove-meal-btn">✕</button>
        `;

        modal.style.display = "none";
        recipeSelect.value = "";
        activeSlot = null;

      } catch (err) {
        alert("Failed to save meal");
      }
      return;
    }

    /* ========= REMOVE MEAL ========= */
    const removeBtn = e.target.closest(".remove-meal-btn");
    if (removeBtn) {
      const slot = removeBtn.closest(".meal-slot");
      const meal = slot.dataset.meal;
      const day = slot.closest(".meal-day").dataset.day;

      try {
        const token = localStorage.getItem("token");
        await fetch("/api/meal-planner", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ day, meal })
        });
      } catch {
        console.warn("Failed to remove from DB");
      }

      slot.innerHTML = `
        <span>${meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
        <button class="add-meal-btn">+ Add</button>
      `;
    }

  });

  // ---------- LOAD RECIPES FOR MODAL ----------
  async function loadRecipes() {
    recipeSelect.innerHTML = `<option value="">Loading...</option>`;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/recipes", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      recipeSelect.innerHTML = `<option value="">Select recipe</option>`;
      data.recipes.forEach(r => {
        const option = document.createElement("option");
        option.value = r._id;
        option.textContent = r.title;
        recipeSelect.appendChild(option);
      });

    } catch {
      recipeSelect.innerHTML = `<option>Error loading recipes</option>`;
    }
  }

})();


async function loadMealPlan() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/meal-planner", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!data.plan) return;

    Object.entries(data.plan.week || {}).forEach(([day, meals]) => {
      Object.entries(meals || {}).forEach(([meal, slot]) => {
        if (!slot?.recipe) return;

        const el = document.querySelector(
          `.meal-day[data-day="${day}"] .meal-slot[data-meal="${meal}"]`
        );

        if (el) {
          el.innerHTML = `
            <span>${slot.recipe.title}</span>
            <button class="remove-meal-btn">✕</button>
          `;
        }
      });
    });

  } catch (err) {
    console.error("Failed to load meal plan");
  }
}

loadMealPlan();

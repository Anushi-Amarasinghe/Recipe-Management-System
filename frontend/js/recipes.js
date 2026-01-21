// frontend/js/recipes.js
console.log("recipes.js (ALL RECIPES) loaded");

const container = document.getElementById("recipesContainer");

if (container) {
  loadAllRecipes();
}

async function loadAllRecipes() {
  try {
    const res = await fetch("/api/recipes/all");

    if (!res.ok) {
      throw new Error("Failed to load recipes");
    }

    const recipes = await res.json();
    container.innerHTML = "";

    if (!recipes.length) {
      container.innerHTML = "<p>No recipes available.</p>";
      return;
    }

    recipes.forEach(r => {
      const ingredients = (r.ingredients || [])
        .map(i => `<li>${i}</li>`)
        .join("");

      const instructions = (r.instructions || [])
        .map(s => `<li>${s.text ?? s}</li>`)
        .join("");

      const author = r.user
        ? `${r.user.f_name ?? ""} ${r.user.l_name ?? ""}`.trim()
        : "Unknown";

      const card = document.createElement("div");
      card.className = "recipe-card";

      card.innerHTML = `
        <h3>${r.title}</h3>
        <p><strong>By:</strong> ${author}</p>

        <strong>Ingredients</strong>
        <ul>${ingredients}</ul>

        <strong>Instructions</strong>
        <ol>${instructions}</ol>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("All recipes error:", err);
    container.innerHTML = "<p>Error loading recipes.</p>";
  }
}

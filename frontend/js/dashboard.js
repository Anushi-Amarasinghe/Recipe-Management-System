// frontend/js/dashboard.js

console.log("dashboard.js loaded");

const mainContent = document.getElementById("mainContent");


async function loadPage(page, activeBtnId) {
  try {
    const res = await fetch(`pages/${page}`);
    if (!res.ok) throw new Error("Page not found");

    mainContent.innerHTML = await res.text();

    
    document
      .querySelectorAll(".sidebar button:not(.logout)")
      .forEach(btn => btn.classList.remove("active"));

    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) activeBtn.classList.add("active");

    
    if (page === "recipes.html") {
      import("./recipes.js");
    }

    if (page === "my-recipes.html") {
      import("./myRecipes.js");
    }

  } catch (err) {
    console.error(err);
    mainContent.innerHTML = "<p>Error loading page.</p>";
  }
}


document.getElementById("RecipesBtn").addEventListener("click", (e) => {
  e.preventDefault();            
  loadPage("recipes.html", "RecipesBtn");
});

document.getElementById("myRecipesBtn").addEventListener("click", (e) => {
  e.preventDefault();
  loadPage("my-recipes.html", "myRecipesBtn");
});

document.getElementById("favouritesBtn").addEventListener("click", (e) => {
  e.preventDefault();
  mainContent.innerHTML = "<h2>Favourites (Coming Soon)</h2>";
});

document.getElementById("mealPlannerBtn").addEventListener("click", (e) => {
  e.preventDefault();
  mainContent.innerHTML = "<h2>Meal Planner (Coming Soon)</h2>";
});

document.getElementById("settingsBtn").addEventListener("click", (e) => {
  e.preventDefault();
  mainContent.innerHTML = "<h2>Settings (Coming Soon)</h2>";
});


async function showUsername() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });

    if (!res.ok) throw new Error("Unauthorized");

    const user = await res.json();
    document.getElementById("usernameDisplay").textContent =
      user.f_name + " " + user.l_name;
  } catch (err) {
    console.error(err);
  }
}


showUsername();
loadPage("recipes.html", "RecipesBtn");

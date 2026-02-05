// ==================================
// Recipe Details
// ==================================

// -----------------
// Load comments
// -----------------
async function loadComments(recipeId) {
  const commentsList = document.getElementById("commentsList");
  if (!commentsList) return;

  commentsList.innerHTML = "<p>Loading comments...</p>";

  try {
    const res = await fetch(`/api/comments/${recipeId}`);
    const data = await res.json();

    if (!data.comments || data.comments.length === 0) {
      commentsList.innerHTML = "<p>No comments yet.</p>";
      return;
    }

    // Fetch user info for each comment
    const commentsWithUser = await Promise.all(
      data.comments.map(async c => {
        let userName = c.user_id; // fallback
        try {
          const resUser = await fetch(`/api/users/public/${c.user_id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          if (resUser.ok) {
            const { user } = await resUser.json();
            userName = user?.name || c.user_id;
          }
        } catch (err) {
          console.error("Failed to fetch user for comment:", err);
        }
        return { ...c, userName };
      })
    );

    // Render comments
    commentsList.innerHTML = commentsWithUser
      .map(c => `
        <div class="comment-card">
          <img src="images/user-avatar.png" alt="User Avatar" />
          <div>
            <p><strong>@${c.userName}</strong> <span style="font-size: 12px; color: #6b7280;">${new Date(c.created_date).toLocaleString()}</span></p>
            <p>${c.comment}</p>
          </div>
        </div>
      `)
      .join("");

  } catch (err) {
    console.error(err);
    commentsList.innerHTML = "<p>Failed to load comments.</p>";
  }
}

// -----------------
// Render stars helper
// -----------------
function renderStars(rating, recipeId) {
  const starsContainer = document.getElementById("ratingStars");
  if (!starsContainer) return;

  starsContainer.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("i");

    if (rating >= i) star.className = "fa-solid fa-star"; // full
    else if (rating >= i - 0.5) star.className = "fa-solid fa-star-half-stroke"; // half
    else star.className = "fa-regular fa-star"; // empty

    star.dataset.value = i;
    star.style.cursor = "pointer";

    // Click to submit rating
    star.addEventListener("click", async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/api/recipes/rate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ recipe_id: recipeId, rating: i })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to submit rating");

        // Re-render stars with updated rating
        renderStars(data.newRating || i, recipeId);
        alert("Rating submitted!");
      } catch (err) {
        alert(err.message);
      }
    });

    starsContainer.appendChild(star);
  }
}

// -----------------
// Load recipe details
// -----------------
async function loadRecipeDetails() {
  const recipeId = sessionStorage.getItem("viewRecipeId");
  const token = localStorage.getItem("token");

  if (!recipeId || !token) {
    console.error("Missing recipe ID or token");
    return;
  }

  loadComments(recipeId);

  try {
    const res = await fetch(`/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to fetch recipe");

    const { recipe } = await res.json();
    if (!recipe) return;

    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (["SPAN", "DIV", "P"].includes(el.tagName)) el.textContent = value;
      else el.value = value;
    };

    // -----------------
    // Main recipe info
    // -----------------
    setValue("title", recipe.title || "");
    setValue("category", recipe.category || "");
    setValue("likeCount", recipe.is_like || 0);
    setValue("dislikeCount", recipe.is_dislike || 0);
    setValue("wishText", recipe.desc || "");

    // Ingredients
    const ingredientsList = document.getElementById("ingredientsList");
    if (ingredientsList) {
      ingredientsList.innerHTML = "";
      (recipe.ingredients || []).forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ingredientsList.appendChild(li);
      });
    }

    renderStars(recipe.rating || 0, recipeId);

    // Difficulty
    const difficultyEl = document.getElementById("difficultyPill");
    if (difficultyEl) {
      difficultyEl.textContent = recipe.difficulty || "";
      difficultyEl.className = `badge difficulty-badge ${recipe.difficulty?.toLowerCase() || ""}`;
    }

    // Image
    const previewImg = document.getElementById("previewImg");
    if (previewImg) {
      previewImg.src = recipe.imageUrl || "images/placeholder.png";
    }

    // Meta
    setValue("prepTime", recipe.prepTime ? recipe.prepTime + "m" : "-");
    setValue("cookTime", recipe.cookingTime ? recipe.cookingTime + "m" : "-");
    setValue("servesCount", recipe.servings || "-");

    // Author
    if (recipe.userId) {
      const resUser = await fetch(`/api/users/public/${recipe.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resUser.ok) {
        const { user } = await resUser.json();
        setValue("authorName", user?.name || "N/A");
        const avatar = document.getElementById("authorAvatar");
        if (avatar) avatar.src = user?.avatar || "images/chef.png";
      }
    }

    // -----------------
    // Favourite toggle
    // -----------------
    const favouriteHeart = document.getElementById("favouriteHeart");

    if (favouriteHeart) {
      // Backend should send boolean: recipe.favourite
      let isFavourite = recipe.favourite === true;

      const updateHeartUI = () => {
        favouriteHeart.className = isFavourite
          ? "fa-solid fa-heart"
          : "fa-regular fa-heart";
        favouriteHeart.style.color = isFavourite ? "red" : "#ccc";
      };

      updateHeartUI();

      favouriteHeart.onclick = async () => {
        const prevState = isFavourite;
        isFavourite = !isFavourite;
        updateHeartUI();

        favouriteHeart.style.transform = "scale(1.3)";
        setTimeout(() => {
          favouriteHeart.style.transform = "scale(1)";
        }, 150);

        try {
          const favRes = await fetch("/api/users/favourite", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ recipeId, favourite: isFavourite })
          });

          if (!favRes.ok) throw new Error("Favourite update failed");

        } catch (err) {
          console.error(err);
          isFavourite = prevState; // rollback
          updateHeartUI();
        }
      };
    }

  } catch (err) {
    console.error("Load recipe failed:", err);
  }

  // -----------------
  // Likes / Dislikes
  // -----------------
  document.getElementById("likeBtn")?.addEventListener("click", () => {
    const el = document.getElementById("likeCount");
    el.textContent = parseInt(el.textContent || 0) + 1;
  });

  document.getElementById("dislikeBtn")?.addEventListener("click", () => {
    const el = document.getElementById("dislikeCount");
    el.textContent = parseInt(el.textContent || 0) + 1;
  });

  // -----------------
  // Comment form
  // -----------------
  const commentForm = document.getElementById("commentForm");
  const commentInput = document.getElementById("commentInput");

  commentForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const text = commentInput.value.trim();
    if (!text) return;

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipe_id: recipeId, comment: text })
      });

      if (!res.ok) throw new Error("Failed to add comment");

      commentInput.value = "";
      loadComments(recipeId);
    } catch (err) {
      alert(err.message);
    }
  });
}



// Expose functions globally
window.loadRecipeDetails = loadRecipeDetails;
window.loadComments = loadComments;

// Auto-load on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  loadRecipeDetails();
});

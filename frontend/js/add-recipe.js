document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addRecipeForm");
  if (!form) return;

  const fileInput = document.getElementById("recipeImage");
  const chooseBtn = document.getElementById("chooseFileBtn");
  const previewWrap = document.getElementById("imagePreviewWrap");
  const previewImg = document.getElementById("imagePreview");

  if (chooseBtn && fileInput) {
    chooseBtn.addEventListener("click", () => fileInput.click());
  }

  if (fileInput && previewWrap && previewImg) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) {
        previewWrap.style.display = "none";
        previewImg.src = "";
        return;
      }
      previewWrap.style.display = "block";
      previewImg.src = URL.createObjectURL(file);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in again.");
      window.location.href = "/login.html";
      return;
    }

    const title = document.getElementById("title")?.value?.trim() || "";
    const description = document.getElementById("desc")?.value?.trim() || "";

    if (!title) return alert("Recipe Title is required.");
    if (!description) return alert("Description is required.");

    // Build FormData (required for file upload)
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);

    const categoryEl = document.getElementById("category");
    if (categoryEl) fd.append("category", categoryEl.value.trim());

    const ratingEl = document.getElementById("rating");
    if (ratingEl) fd.append("rating", ratingEl.value);

    // Image file (name must be "image" to match upload.single("image"))
    const file = fileInput?.files?.[0];
    if (file) fd.append("image", file);

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type when using FormData
        },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Save failed:", res.status, data);
        alert(data.message || "Failed to save recipe");
        return;
      }

      alert("Recipe saved!");
      window.location.href = "/dashboard.html?view=my-recipes";
    } catch (err) {
      console.error(err);
      alert("Network error saving recipe.");
    }
  });
});

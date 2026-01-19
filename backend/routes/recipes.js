const express = require("express");
const path = require("path");
const multer = require("multer");

const Recipe = require("../models/Recipe");
const auth = require("../middleware/authMiddleware");
const { userOrAdmin, adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

// Multer (file upload) config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  },
});

// POST /api/recipes (create) - protected + role-based access + optional image upload
router.post("/", auth, userOrAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, category, description, rating } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Recipe title is required." });
    }

    // Schema requires `desc`
    const desc = description ? String(description).trim() : "";
    if (!desc) {
      return res.status(400).json({ message: "Recipe description is required." });
    }

    // If a file was uploaded, use it; otherwise allow an imageUrl string from body
    const finalImageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : (req.body.imageUrl || "").trim();

    const doc = await Recipe.create({
      userId: req.userId,
      title: String(title).trim(),
      desc,
      category: category ? String(category).trim() : "Uncategorised",
      rating: Number.isFinite(Number(rating)) ? Number(rating) : 0,
      imageUrl: finalImageUrl,
    });

    return res.status(201).json({ message: "Recipe saved", recipe: doc });
  } catch (err) {
    console.error("Save recipe error:", err);
    return res.status(500).json({
      message: "Server error saving recipe",
      error: err?.message,
      name: err?.name,
    });
  }
});

// GET /api/recipes (public list)
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    return res.json({ recipes });
  } catch (err) {
    console.error("List recipes error:", err);
    return res.status(500).json({
      message: "Server error fetching recipes",
      error: err?.message,
      name: err?.name,
    });
  }
});

// GET /api/recipes/mine (current user's recipes) - protected + role-based access
router.get("/mine", auth, userOrAdmin, async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json({ recipes });
  } catch (err) {
    console.error("Mine recipes error:", err);
    return res.status(500).json({
      message: "Failed to load recipes",
      error: err?.message,
      name: err?.name,
    });
  }
});

// DELETE /api/recipes/:id - protected + role-based access + ownership check
router.delete("/:id", auth, userOrAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (String(recipe.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Recipe.deleteOne({ _id: req.params.id });
    return res.json({ message: "Recipe deleted" });
  } catch (err) {
    console.error("Delete recipe error:", err);
    return res.status(500).json({
      message: "Server error deleting recipe",
      error: err?.message,
      name: err?.name,
    });
  }
});

/**
 * @route   GET /api/recipes/admin/all
 * @desc    Get all recipes (admin only) - for admin management
 * @access  Private - Admin only (US4-T.9: Admin route protection middleware)
 */
router.get("/admin/all", auth, adminOnly, async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    return res.json({ recipes, count: recipes.length });
  } catch (err) {
    console.error("Admin get all recipes error:", err);
    return res.status(500).json({
      message: "Server error fetching recipes",
      error: err?.message,
      name: err?.name,
    });
  }
});

/**
 * @route   DELETE /api/recipes/admin/:id
 * @desc    Delete any recipe (admin only) - bypasses ownership check
 * @access  Private - Admin only (US4-T.9: Admin route protection middleware)
 */
router.delete("/admin/:id", auth, adminOnly, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    await Recipe.deleteOne({ _id: req.params.id });
    return res.json({ message: "Recipe deleted by admin" });
  } catch (err) {
    console.error("Admin delete recipe error:", err);
    return res.status(500).json({
      message: "Server error deleting recipe",
      error: err?.message,
      name: err?.name,
    });
  }
});

module.exports = router;

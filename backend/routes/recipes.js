const express = require("express");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const Recipe = require("../models/Recipe");
const Activity = require("../models/Activity");
const User = require("../models/User");

const auth = require("../middleware/authMiddleware");
const { userOrAdmin, adminOnly } = require("../middleware/roleMiddleware");
const { emitActivity } = require("../src/socket");

const router = express.Router();

/* ===========================
   Helpers
=========================== */

const safeTrim = (val, fallback = "") =>
  val != null ? String(val).trim() : fallback;

const parseNumber = (val, fallback = 0) =>
  Number.isFinite(Number(val)) ? Number(val) : fallback;

const filterStringArray = (arr, toLower = false) =>
  Array.isArray(arr)
    ? arr
        .filter(v => v != null)
        .map(v => {
          const s = String(v).trim();
          return toLower ? s.toLowerCase() : s;
        })
        .filter(v => v.length > 0)
    : [];

const toObjectId = id =>
  mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;

async function logActivity({ userId, action, recipe }) {
  try {
    const user = await User.findById(toObjectId(userId));
    if (!user) return;

    const userName = `${user.f_name} ${user.l_name}`.trim();

    const activity = await Activity.create({
      userId: toObjectId(userId),
      userName,
      action,
      recipeId: recipe._id,
      recipeTitle: recipe.title,
    });

    emitActivity({
      _id: activity._id,
      userName,
      action,
      recipeTitle: recipe.title,
      createdAt: activity.createdAt,
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
}

/* ===========================
   Multer config
=========================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.mimetype
    );
    cb(ok ? null : new Error("Only image files allowed"), ok);
  },
});

/* ======================================================
   🔍 SEARCH ROUTES (US4 – IMPORTANT)
====================================================== */

/** Public search (title + ingredients + tags) */
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ recipes: [] });

    const recipes = await Recipe.find({
      deletedAt: null,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { ingredients: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("title imageUrl difficulty category createdAt");

    return res.json({ recipes });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ message: "Search failed" });
  }
});

/** Search current user's recipes */
router.get("/search/mine", auth, userOrAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ recipes: [] });

    const recipes = await Recipe.find({
      userId: req.userId,
      deletedAt: null,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { ingredients: { $regex: q, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    return res.json({ recipes });
  } catch (err) {
    console.error("My search error:", err);
    return res.status(500).json({ message: "Search failed" });
  }
});

/* ======================================================
   CRUD ROUTES
====================================================== */

/** Create recipe */
router.post("/", auth, userOrAdmin, upload.single("image"), async (req, res) => {
  try {
    const title = safeTrim(req.body.title);
    const desc = safeTrim(req.body.description);

    if (!title || !desc) {
      return res.status(400).json({ message: "Title and description required" });
    }

    const recipe = await Recipe.create({
      userId: req.userId,
      title,
      desc,
      category: safeTrim(req.body.category, "Uncategorised"),
      imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
      ingredients: filterStringArray(req.body.ingredients),
      instructions: filterStringArray(req.body.instructions),
      dietary: filterStringArray(req.body.dietary),
      tags: filterStringArray(req.body.tags, true),
      difficulty: ["Easy", "Medium", "Hard"].includes(req.body.difficulty)
        ? req.body.difficulty
        : "Medium",
      cookingTime: parseNumber(req.body.cookingTime),
      prepTime: parseNumber(req.body.prepTime),
      servings: parseNumber(req.body.servings),
    });

    await logActivity({ userId: req.userId, action: "created", recipe });
    return res.status(201).json({ message: "Recipe created", recipe });
  } catch (err) {
    console.error("Create recipe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/** List all public recipes */
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find({ deletedAt: null }).sort({
      createdAt: -1,
    });
    return res.json({ recipes });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

/** List my recipes */
router.get("/mine", auth, userOrAdmin, async (req, res) => {
  try {
    const recipes = await Recipe.find({
      userId: req.userId,
      deletedAt: null,
    }).sort({ createdAt: -1 });

    return res.json({ recipes });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

/** Get single recipe */
router.get("/:id", auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe || recipe.deletedAt)
      return res.status(404).json({ message: "Recipe not found" });

    if (
      String(recipe.userId) !== String(req.userId) &&
      req.userRole !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    return res.json({ recipe });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

/** Update recipe */
router.put("/:id", auth, userOrAdmin, upload.single("image"), async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe || recipe.deletedAt)
      return res.status(404).json({ message: "Recipe not found" });

    if (String(recipe.userId) !== String(req.userId))
      return res.status(403).json({ message: "Not allowed" });

    Object.assign(recipe, {
      title: safeTrim(req.body.title, recipe.title),
      desc: safeTrim(req.body.description, recipe.desc),
      category: safeTrim(req.body.category, recipe.category),
      imageUrl: req.file
        ? `/uploads/${req.file.filename}`
        : recipe.imageUrl,
      ingredients: filterStringArray(req.body.ingredients) || recipe.ingredients,
      instructions:
        filterStringArray(req.body.instructions) || recipe.instructions,
      dietary: filterStringArray(req.body.dietary) || recipe.dietary,
      tags: filterStringArray(req.body.tags, true) || recipe.tags,
      difficulty: ["Easy", "Medium", "Hard"].includes(req.body.difficulty)
        ? req.body.difficulty
        : recipe.difficulty,
      cookingTime: parseNumber(req.body.cookingTime, recipe.cookingTime),
      prepTime: parseNumber(req.body.prepTime, recipe.prepTime),
      servings: parseNumber(req.body.servings, recipe.servings),
    });

    await recipe.save();
    await logActivity({ userId: req.userId, action: "updated", recipe });

    return res.json({ message: "Recipe updated", recipe });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

/** Delete recipe (soft delete) */
router.delete("/:id", auth, userOrAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe)
      return res.status(404).json({ message: "Recipe not found" });

    if (String(recipe.userId) !== String(req.userId))
      return res.status(403).json({ message: "Not allowed" });

    recipe.deletedAt = new Date();
    await recipe.save();

    await logActivity({ userId: req.userId, action: "deleted", recipe });
    return res.json({ message: "Recipe deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

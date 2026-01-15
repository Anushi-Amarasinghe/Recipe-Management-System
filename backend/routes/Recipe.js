const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * SEARCH RECIPES (AUTH REQUIRED)
 * GET /recipes/search?q=keyword
 * - Searches by title and ingredients
 * - Empty search returns all recipes
 */
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    let recipes;

    // Empty search → return all recipes
    if (!q || q.trim() === "") {
      recipes = await Recipe.find()
        .sort({ createdAt: -1 });
    } else {
      recipes = await Recipe.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } });
    }

    return res.json({
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    console.error("Search recipes error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * CREATE RECIPE
 * POST /recipes
 * Requires authentication
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      ingredients,
      instructions,
      cookingTime,
      difficulty,
    } = req.body;

    const recipe = new Recipe({
      title,
      ingredients,
      instructions,
      cookingTime,
      difficulty,
      user: req.userId, // from authMiddleware
    });

    const savedRecipe = await recipe.save();
    return res.status(201).json(savedRecipe);

  } catch (error) {
    // Validation errors
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((field) => {
        errors[field] = error.errors[field].message;
      });
      return res.status(400).json({ errors });
    }

    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

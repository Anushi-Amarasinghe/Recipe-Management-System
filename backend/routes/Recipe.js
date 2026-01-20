const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const authMiddleware = require("../middleware/authMiddleware");

/*
  CREATE RECIPE
  POST /recipes
  - Auth required
  - Recipe linked to logged-in user
*/
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, ingredients, instructions } = req.body;

    const recipe = new Recipe({
      title,
      ingredients,
      instructions,
      user: req.user
    });

    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/*
  GET ALL RECIPES FOR LOGGED-IN USER
  GET /recipes
  - Auth required
  - Only returns user's own recipes
*/
router.get("/", authMiddleware, async (req, res) => {
  try {
    const recipes = await Recipe.find({ user: req.user }).sort({
      createdAt: -1
    });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
  GET SINGLE RECIPE
  GET /recipes/:id
  - Auth required
  - Only owner can access
*/
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (recipe.user.toString() !== req.user) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
  UPDATE RECIPE
  PUT /recipes/:id
  - Auth required
  - Only owner can update
  - Overwrites previous values
*/
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (recipe.user.toString() !== req.user) {
      return res.status(403).json({ message: "Not authorized" });
    }

    recipe.title = req.body.title ?? recipe.title;
    recipe.ingredients = req.body.ingredients ?? recipe.ingredients;
    recipe.instructions = req.body.instructions ?? recipe.instructions;

    await recipe.save();
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/*
  DELETE RECIPE
  DELETE /recipes/:id
  - Auth required
  - Only owner can delete
*/
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (recipe.user.toString() !== req.user) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await recipe.deleteOne();
    res.json({ message: "Recipe deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

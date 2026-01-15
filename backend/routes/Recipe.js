const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const authMiddleware = require("../middleware/authMiddleware");
const checkRecipeOwnership = require("../middleware/recipeOwnership");
const { sendError, ErrorCodes } = require("../utils/errorHandler");

/**
 * @route   GET /api/recipes
 * @desc    Get all recipes (user's own recipes + public recipes if any)
 * @access  Private
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Get user's own recipes
    const userRecipes = await Recipe.find({ user: req.userId })
      .populate("user", "f_name l_name email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: userRecipes.length,
      recipes: userRecipes
    });
  } catch (err) {
    console.error("Get recipes error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to fetch recipes",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
});

/**
 * @route   GET /api/recipes/:id
 * @desc    Get single recipe by ID
 * @access  Private (must own recipe or be admin)
 */
router.get("/:id", authMiddleware, checkRecipeOwnership, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("user", "f_name l_name email");

    return res.json({
      success: true,
      recipe: recipe
    });
  } catch (err) {
    console.error("Get recipe error:", err);
    if (err.name === "CastError") {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Invalid recipe ID");
    }
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to fetch recipe",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
});

/**
 * @route   POST /api/recipes
 * @desc    Create new recipe
 * @access  Private
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

    // Validate required fields
    if (!title || !ingredients || !instructions) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR,
        "Title, ingredients, and instructions are required");
    }

    const recipe = new Recipe({
      title,
      ingredients,
      instructions,
      cookingTime,
      difficulty,
      user: req.userId, // ✅ Fixed: use req.userId from authMiddleware
    });

    const savedRecipe = await recipe.save();
    
    // Populate user info
    await savedRecipe.populate("user", "f_name l_name email");

    return res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      recipe: savedRecipe
    });
  } catch (error) {
    console.error("Create recipe error:", error);
    
    // Field-specific validation errors
    if (error.name === "ValidationError") {
      const errors = [];
      Object.keys(error.errors).forEach((field) => {
        errors.push(`${field}: ${error.errors[field].message}`);
      });

      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR,
        "Recipe validation failed",
        errors);
    }

    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to create recipe",
      process.env.NODE_ENV === "development" ? error.message : undefined);
  }
});

/**
 * @route   PUT /api/recipes/:id
 * @desc    Update recipe
 * @access  Private (must own recipe or be admin)
 */
router.put("/:id", authMiddleware, checkRecipeOwnership, async (req, res) => {
  try {
    const {
      title,
      ingredients,
      instructions,
      cookingTime,
      difficulty,
    } = req.body;

    // Update recipe (req.recipe is attached by checkRecipeOwnership)
    const recipe = req.recipe;

    if (title) recipe.title = title;
    if (ingredients) recipe.ingredients = ingredients;
    if (instructions) recipe.instructions = instructions;
    if (cookingTime !== undefined) recipe.cookingTime = cookingTime;
    if (difficulty) recipe.difficulty = difficulty;

    const updatedRecipe = await recipe.save();
    await updatedRecipe.populate("user", "f_name l_name email");

    return res.json({
      success: true,
      message: "Recipe updated successfully",
      recipe: updatedRecipe
    });
  } catch (error) {
    console.error("Update recipe error:", error);
    
    if (error.name === "ValidationError") {
      const errors = [];
      Object.keys(error.errors).forEach((field) => {
        errors.push(`${field}: ${error.errors[field].message}`);
      });

      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR,
        "Recipe validation failed",
        errors);
    }

    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to update recipe",
      process.env.NODE_ENV === "development" ? error.message : undefined);
  }
});

/**
 * @route   DELETE /api/recipes/:id
 * @desc    Delete recipe
 * @access  Private (must own recipe or be admin)
 */
router.delete("/:id", authMiddleware, checkRecipeOwnership, async (req, res) => {
  try {
    // Recipe is attached to req by checkRecipeOwnership
    await Recipe.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Recipe deleted successfully"
    });
  } catch (err) {
    console.error("Delete recipe error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to delete recipe",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
});

module.exports = router;

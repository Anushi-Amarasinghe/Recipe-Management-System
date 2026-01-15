const Recipe = require("../models/Recipe");
const { sendError, ErrorCodes } = require("../utils/errorHandler");

/**
 * Middleware to check if user owns the recipe
 * Must be used after authMiddleware
 * Attaches recipe to req.recipe if found and owned by user
 */
const checkRecipeOwnership = async (req, res, next) => {
  try {
    const recipeId = req.params.id;
    
    if (!recipeId) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Recipe ID is required");
    }

    const recipe = await Recipe.findById(recipeId);
    
    if (!recipe) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "Recipe not found");
    }

    // Check ownership - user must own the recipe OR be admin
    if (recipe.user.toString() !== req.userId && req.userRole !== "admin") {
      return sendError(res, 403, ErrorCodes.FORBIDDEN, 
        "You do not have permission to access this recipe");
    }

    // Attach recipe to request for use in route handlers
    req.recipe = recipe;
    next();
  } catch (err) {
    console.error("Recipe ownership check error:", err);
    if (err.name === "CastError") {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Invalid recipe ID");
    }
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Error checking recipe ownership",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
};

module.exports = checkRecipeOwnership;


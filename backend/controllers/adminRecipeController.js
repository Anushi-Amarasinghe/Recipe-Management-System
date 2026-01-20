const Recipe = require("../models/recipe");
const { sendError, sendSuccess, ErrorCodes } = require("../utils/errorHandler");

/**
 * US2-T.1: GET /api/admin/recipes
 * Get all recipes with pagination and filtering
 */
async function getAllRecipes(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "",
      difficulty = "all",
      category = "all",
      sortBy = "createdAt", 
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { instructions: { $regex: search, $options: "i" } }
      ];
    }

    // Difficulty filter
    if (difficulty !== "all") {
      query.difficulty = difficulty;
    }

    // Category filter
    if (category !== "all") {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .populate("user", "f_name l_name email")
        .populate("category", "name")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Recipe.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: recipes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Get recipes error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch recipes");
  }
}

/**
 * GET /api/admin/recipes/:id
 * Get single recipe
 */
async function getRecipeById(req, res) {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("user", "f_name l_name email")
      .populate("category", "name");

    if (!recipe) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "Recipe not found");
    }

    return res.json({ success: true, data: recipe });
  } catch (err) {
    console.error("Get recipe error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch recipe");
  }
}

/**
 * US2-T.2: DELETE /api/admin/recipes/:id
 * Delete any recipe (admin only)
 */
async function deleteRecipe(req, res) {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "Recipe not found");
    }

    await Recipe.findByIdAndDelete(req.params.id);

    // Update category recipe count if category exists
    if (recipe.category) {
      const Category = require("../models/Category");
      await Category.findByIdAndUpdate(recipe.category, {
        $inc: { recipeCount: -1 }
      });
    }

    return sendSuccess(res, 200, "Recipe deleted successfully");
  } catch (err) {
    console.error("Delete recipe error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to delete recipe");
  }
}

/**
 * POST /api/admin/recipes/bulk-delete
 * Delete multiple recipes
 */
async function bulkDeleteRecipes(req, res) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Recipe IDs are required");
    }

    const result = await Recipe.deleteMany({ _id: { $in: ids } });

    return sendSuccess(res, 200, `${result.deletedCount} recipes deleted successfully`, {
      count: result.deletedCount
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to delete recipes");
  }
}

/**
 * GET /api/admin/recipes/stats
 * Get recipe statistics
 */
async function getRecipeStats(req, res) {
  try {
    const [total, easy, medium, hard] = await Promise.all([
      Recipe.countDocuments(),
      Recipe.countDocuments({ difficulty: "easy" }),
      Recipe.countDocuments({ difficulty: "medium" }),
      Recipe.countDocuments({ difficulty: "hard" })
    ]);

    // Recent recipes (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentRecipes = await Recipe.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    // Top contributors
    const topContributors = await Recipe.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          name: { $concat: ["$user.f_name", " ", "$user.l_name"] },
          count: 1
        }
      }
    ]);

    return res.json({
      success: true,
      data: {
        total,
        byDifficulty: { easy, medium, hard },
        recentRecipes,
        topContributors
      }
    });
  } catch (err) {
    console.error("Get recipe stats error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch statistics");
  }
}

module.exports = {
  getAllRecipes,
  getRecipeById,
  deleteRecipe,
  bulkDeleteRecipes,
  getRecipeStats
};

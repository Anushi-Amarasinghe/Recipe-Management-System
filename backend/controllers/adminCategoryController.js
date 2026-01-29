const Category = require("../models/Category");
const { sendError, sendSuccess, ErrorCodes } = require("../utils/errorHandler");

/**
 * US1-T.1: GET /api/admin/categories
 * Get all categories
 */
async function getAllCategories(req, res) {
  try {
       // Extract query parameters with defaults
      const { 
      page = 1,           // Default: first page
      limit = 20,         // Default: 20 items per page
      search = "",        // Default: no search filter
      status = "all",     // Default: all statuses
      sortBy = "name",    // Default: sort by name
      sortOrder = "asc"   // Default: ascending order
    } = req.query;

    // Build MongoDB query object

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Execute both queries in parallel for performance
    const [categories, total] = await Promise.all([
      Category.find(query)
        .populate("createdBy", "f_name l_name")
        .populate("updatedBy", "f_name l_name")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Category.countDocuments(query)  // Total count
    ]);

    return res.json({
      success: true,
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Get categories error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch categories");
  }
}

/**
 * GET /api/admin/categories/:id
 * Get single category
 */
async function getCategoryById(req, res) {
  try {
    const category = await Category.findById(req.params.id)
      .populate("createdBy", "f_name l_name")
      .populate("updatedBy", "f_name l_name");

    if (!category) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "Category not found");
    }

    return res.json({ success: true, data: category });
  } catch (err) {
    console.error("Get category error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch category");
  }
}

/**
 * US1-T.2: POST /api/admin/categories
 * Create new category
 */
async function createCategory(req, res) {
  try {
    const { name, description, icon, color } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Category name is required");
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: "i" } 
    });
    
    if (existingCategory) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Category already exists");
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim() || "",
      icon: icon || "fa-utensils",
      color: color || "#4CAF50",
      createdBy: req.userId
    });

    await category.save();

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category
    });
  } catch (err) {
    console.error("Create category error:", err);
    if (err.code === 11000) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Category already exists");
    }
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to create category");
  }
}

/**
 * US1-T.2: PUT /api/admin/categories/:id
 * Update category
 */
async function updateCategory(req, res) {
  try {
    const { name, description, icon, color, isActive } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "Category not found");
    }

    // Check if new name already exists (excluding current category)
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Category name already exists");
      }
    }

    // Update fields
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (typeof isActive === "boolean") category.isActive = isActive;
    category.updatedBy = req.userId;

    await category.save();

    return res.json({
      success: true,
      message: "Category updated successfully",
      data: category
    });
  } catch (err) {
    console.error("Update category error:", err);
    if (err.code === 11000) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Category name already exists");
    }
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to update category");
  }
}

/**
 * US1-T.2: DELETE /api/admin/categories/:id
 * Delete category
 */
async function deleteCategory(req, res) {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "Category not found");
    }

    // Check if category has recipes
    if (category.recipeCount > 0) {
      return sendError(res, 400, "CATEGORY_HAS_RECIPES", 
        `Cannot delete category with ${category.recipeCount} recipes. Please reassign or delete the recipes first.`);
    }

    await Category.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 200, "Category deleted successfully");
  } catch (err) {
    console.error("Delete category error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to delete category");
  }
}

/**
 * PATCH /api/admin/categories/:id/toggle
 * Toggle category active status
 */
async function toggleCategoryStatus(req, res) {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "Category not found");
    }

    category.isActive = !category.isActive;
    category.updatedBy = req.userId;
    await category.save();

    return res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: category.isActive }
    });
  } catch (err) {
    console.error("Toggle category error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to toggle category status");
  }
}

/**
 * GET /api/admin/categories/stats
 * Get category statistics
 */
async function getCategoryStats(req, res) {
  try {
    const [total, active, inactive] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: false })
    ]);

    // Get categories with most recipes
    const topCategories = await Category.find({ isActive: true })
      .sort({ recipeCount: -1 })
      .limit(5)
      .select("name recipeCount");

    return res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        topCategories
      }
    });
  } catch (err) {
    console.error("Get category stats error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch statistics");
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryStats
};

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const {
  getAllRecipes,
  getRecipeById,
  deleteRecipe,
  bulkDeleteRecipes,
  getRecipeStats
} = require("../controllers/adminRecipeController");

// All routes require authentication + admin role
router.use(authMiddleware);
router.use(adminOnly);

// Stats (must be before /:id)
router.get("/stats", getRecipeStats);

// Bulk operations (must be before /:id)
router.post("/bulk-delete", bulkDeleteRecipes);

// CRUD operations
router.get("/", getAllRecipes);
router.get("/:id", getRecipeById);
router.delete("/:id", deleteRecipe);

module.exports = router;

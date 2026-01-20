const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryStats
} = require("../controllers/adminCategoryController");

// All routes require authentication + admin role
router.use(authMiddleware);
router.use(adminOnly);

// Stats (must be before /:id)
router.get("/stats", getCategoryStats);

// CRUD operations
router.get("/", getAllCategories);
router.post("/", createCategory);
router.get("/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);
router.patch("/:id/toggle", toggleCategoryStatus);

module.exports = router;

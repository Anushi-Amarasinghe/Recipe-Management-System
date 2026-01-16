const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const {
  getAllUsers,
  getUserById,
  deactivateUser,
  reactivateUser,
  deleteUser,
  restoreUser,
  bulkUserAction,
  getUserStats,
  changeUserRole
} = require("../controllers/adminUserController");

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// GET /api/admin/users/stats - Get user statistics (must be before /:id)
router.get("/stats", getUserStats);

// POST /api/admin/users/bulk - Bulk user actions (must be before /:id)
router.post("/bulk", bulkUserAction);

// GET /api/admin/users - Get all users (US3-T.1)
router.get("/", getAllUsers);

// GET /api/admin/users/:id - Get single user
router.get("/:id", getUserById);

// POST /api/admin/users/:id/deactivate - Deactivate user (US3-T.2)
router.post("/:id/deactivate", deactivateUser);

// POST /api/admin/users/:id/reactivate - Reactivate user
router.post("/:id/reactivate", reactivateUser);

// DELETE /api/admin/users/:id - Delete user (US3-T.3)
router.delete("/:id", deleteUser);

// POST /api/admin/users/:id/restore - Restore soft-deleted user
router.post("/:id/restore", restoreUser);

// PATCH /api/admin/users/:id/role - Change user role
router.patch("/:id/role", changeUserRole);

module.exports = router;
